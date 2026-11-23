import type { FastifyInstance } from "fastify";
import type { DatabaseSync } from "node:sqlite";
import JSZip from "jszip";
import { requireAdmin } from "../auth";

interface SkillRow {
  id: number;
  slug: string;
  name: string;
  summary: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  version: string;
  author: string;
  tags: string;
  compatible_agents: string;
  skill_markdown: string;
  status: "published" | "draft";
  featured: number;
  download_count: number;
  file_count?: number;
  created_at: string;
  updated_at: string;
}

interface SkillBody {
  slug?: string;
  name?: string;
  summary?: string;
  category_id?: number | null;
  version?: string;
  author?: string;
  tags?: string[];
  compatible_agents?: string[];
  skill_markdown?: string;
  status?: "published" | "draft";
  featured?: boolean;
}

interface SkillFileBody {
  relative_path?: string;
  mime_type?: string;
  is_binary?: boolean;
  content?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function safeParseArray(jsonText: string): string[] {
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function sanitizeRelativePath(raw: string): string | null {
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized || normalized.includes("..") || normalized.toLowerCase() === "skill.md") {
    return null;
  }
  if (!/^[a-zA-Z0-9._\-/]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function formatSkill(row: SkillRow, includeMarkdown = false) {
  const base = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    version: row.version,
    author: row.author,
    tags: safeParseArray(row.tags),
    compatible_agents: safeParseArray(row.compatible_agents),
    status: row.status,
    featured: Boolean(row.featured),
    download_count: row.download_count,
    file_count: row.file_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (includeMarkdown) {
    return { ...base, skill_markdown: row.skill_markdown };
  }
  return base;
}

export function registerSkillRoutes(app: FastifyInstance, db: DatabaseSync): void {
  // Public: list published skills with search, category, agent filter, and sort
  app.get<{
    Querystring: { q?: string; category?: string; agent?: string; sort?: string };
  }>("/api/skills", async (request) => {
    const q = (request.query.q || "").trim().toLowerCase();
    const category = (request.query.category || "").trim().toLowerCase();
    const agent = (request.query.agent || "").trim().toLowerCase();
    const sort = request.query.sort || "featured";

    let orderClause = "s.featured DESC, s.updated_at DESC";
    if (sort === "downloads") orderClause = "s.download_count DESC, s.name ASC";
    if (sort === "newest") orderClause = "s.created_at DESC";
    if (sort === "name") orderClause = "s.name ASC";

    const rows = db
      .prepare(`
        SELECT s.*, c.name AS category_name, c.slug AS category_slug,
          (SELECT COUNT(*) FROM skill_files f WHERE f.skill_id = s.id) AS file_count
        FROM skills s
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE s.status = 'published'
        ORDER BY ${orderClause}
      `)
      .all() as unknown as SkillRow[];

    const filtered = rows.filter((row) => {
      if (category && (row.category_slug || "").toLowerCase() !== category) {
        return false;
      }
      if (agent) {
        const agents = safeParseArray(row.compatible_agents).map((a) => a.toLowerCase());
        if (!agents.includes(agent)) return false;
      }
      if (q) {
        const haystack = `${row.name} ${row.slug} ${row.summary} ${row.tags} ${row.author}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const stats = db
      .prepare(`
        SELECT
          COUNT(*) AS total_published,
          COALESCE(SUM(download_count), 0) AS total_downloads
        FROM skills
        WHERE status = 'published'
      `)
      .get() as { total_published: number; total_downloads: number };

    return {
      skills: filtered.map((r) => formatSkill(r, false)),
      stats,
    };
  });

  // Public: single published skill detail with markdown and supporting files metadata
  app.get<{ Params: { slug: string } }>("/api/skills/:slug", async (request, reply) => {
    const row = db
      .prepare(`
        SELECT s.*, c.name AS category_name, c.slug AS category_slug,
          (SELECT COUNT(*) FROM skill_files f WHERE f.skill_id = s.id) AS file_count
        FROM skills s
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE s.slug = ? AND s.status = 'published'
      `)
      .get(request.params.slug) as unknown as SkillRow | undefined;

    if (!row) {
      return reply.code(404).send({ error: "Skill tidak ditemukan atau belum dipublikasikan." });
    }

    const files = db
      .prepare(
        "SELECT id, relative_path, mime_type, is_binary, size_bytes, CASE WHEN is_binary = 0 THEN content ELSE '' END AS content FROM skill_files WHERE skill_id = ? ORDER BY relative_path ASC"
      )
      .all(row.id);

    return {
      skill: formatSkill(row, true),
      files,
    };
  });

  // Public: raw SKILL.md download for curl / agent scripts
  app.get<{ Params: { slug: string } }>("/api/skills/:slug/raw", async (request, reply) => {
    const row = db
      .prepare("SELECT slug, skill_markdown FROM skills WHERE slug = ? AND status = 'published'")
      .get(request.params.slug) as { slug: string; skill_markdown: string } | undefined;

    if (!row) {
      return reply.code(404).send({ error: "Skill tidak ditemukan." });
    }

    reply.header("Content-Type", "text/markdown; charset=utf-8");
    reply.header("Content-Disposition", `inline; filename="SKILL.md"`);
    return row.skill_markdown;
  });

  // Public: ZIP package download (SKILL.md + all supporting files)
  app.get<{ Params: { slug: string } }>("/api/skills/:slug/download", async (request, reply) => {
    const row = db
      .prepare("SELECT id, slug, skill_markdown FROM skills WHERE slug = ? AND status = 'published'")
      .get(request.params.slug) as { id: number; slug: string; skill_markdown: string } | undefined;

    if (!row) {
      return reply.code(404).send({ error: "Skill tidak ditemukan." });
    }

    const files = db
      .prepare("SELECT relative_path, is_binary, content FROM skill_files WHERE skill_id = ?")
      .all(row.id) as Array<{ relative_path: string; is_binary: number; content: string }>;

    const zip = new JSZip();
    const folder = zip.folder(row.slug);
    if (folder) {
      folder.file("SKILL.md", row.skill_markdown);
      for (const f of files) {
        if (f.is_binary) {
          folder.file(f.relative_path, f.content, { base64: true });
        } else {
          folder.file(f.relative_path, f.content);
        }
      }
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    db.prepare("UPDATE skills SET download_count = download_count + 1 WHERE id = ?").run(row.id);

    reply.header("Content-Type", "application/zip");
    reply.header("Content-Disposition", `attachment; filename="${row.slug}.zip"`);
    return reply.send(buffer);
  });

  // Admin: list all skills (published + draft)
  app.get<{ Querystring: { q?: string; status?: string } }>("/api/admin/skills", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const q = (request.query.q || "").trim().toLowerCase();
    const status = (request.query.status || "").trim().toLowerCase();

    const rows = db
      .prepare(`
        SELECT s.*, c.name AS category_name, c.slug AS category_slug,
          (SELECT COUNT(*) FROM skill_files f WHERE f.skill_id = s.id) AS file_count
        FROM skills s
        LEFT JOIN categories c ON c.id = s.category_id
        ORDER BY s.updated_at DESC
      `)
      .all() as unknown as SkillRow[];

    const filtered = rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (q) {
        const hay = `${row.name} ${row.slug} ${row.summary} ${row.tags}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const summary = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
          COALESCE(SUM(download_count), 0) AS downloads
        FROM skills
      `)
      .get();

    return {
      skills: filtered.map((r) => formatSkill(r, true)),
      summary,
    };
  });

  // Admin: get single skill + supporting files
  app.get<{ Params: { id: string } }>("/api/admin/skills/:id", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const id = Number(request.params.id);
    const row = db
      .prepare(`
        SELECT s.*, c.name AS category_name, c.slug AS category_slug,
          (SELECT COUNT(*) FROM skill_files f WHERE f.skill_id = s.id) AS file_count
        FROM skills s
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE s.id = ?
      `)
      .get(id) as unknown as SkillRow | undefined;

    if (!row) {
      return reply.code(404).send({ error: "Skill tidak ditemukan." });
    }

    const files = db
      .prepare("SELECT id, relative_path, mime_type, is_binary, size_bytes, content, created_at FROM skill_files WHERE skill_id = ? ORDER BY relative_path ASC")
      .all(id);

    return {
      skill: formatSkill(row, true),
      files,
    };
  });

  // Admin: create skill
  app.post<{ Body: SkillBody }>("/api/admin/skills", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const name = (request.body?.name || "").trim();
    const slug = slugify(request.body?.slug || name);
    const summary = (request.body?.summary || "").trim();
    const markdown = (request.body?.skill_markdown || "").trim();

    if (!name || !slug) {
      return reply.code(400).send({ error: "Nama dan slug skill wajib diisi." });
    }
    if (!summary) {
      return reply.code(400).send({ error: "Ringkasan skill wajib diisi." });
    }
    if (!markdown) {
      return reply.code(400).send({ error: "Konten SKILL.md wajib diisi." });
    }

    const categoryId = request.body?.category_id ? Number(request.body.category_id) : null;
    const version = (request.body?.version || "1.0.0").trim() || "1.0.0";
    const author = (request.body?.author || "Reneo").trim() || "Reneo";
    const tags = Array.isArray(request.body?.tags) ? request.body.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    const agents = Array.isArray(request.body?.compatible_agents)
      ? request.body.compatible_agents.map((a) => String(a).trim()).filter(Boolean)
      : ["Antigravity"];
    const status = request.body?.status === "draft" ? "draft" : "published";
    const featured = request.body?.featured ? 1 : 0;

    try {
      const info = db
        .prepare(`
          INSERT INTO skills (
            slug, name, summary, category_id, version, author,
            tags, compatible_agents, skill_markdown, status, featured
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          slug,
          name,
          summary,
          categoryId,
          version,
          author,
          JSON.stringify(tags),
          JSON.stringify(agents),
          markdown,
          status,
          featured
        );

      const created = db
        .prepare(`
          SELECT s.*, c.name AS category_name, c.slug AS category_slug, 0 AS file_count
          FROM skills s
          LEFT JOIN categories c ON c.id = s.category_id
          WHERE s.id = ?
        `)
        .get(info.lastInsertRowid) as unknown as SkillRow;

      return reply.code(201).send({ skill: formatSkill(created, true) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNIQUE")) {
        return reply.code(409).send({ error: `Skill dengan slug "${slug}" sudah terdaftar.` });
      }
      throw err;
    }
  });

  // Admin: update skill
  app.patch<{ Params: { id: string }; Body: SkillBody }>("/api/admin/skills/:id", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const id = Number(request.params.id);
    const existing = db.prepare("SELECT * FROM skills WHERE id = ?").get(id) as unknown as SkillRow | undefined;
    if (!existing) {
      return reply.code(404).send({ error: "Skill tidak ditemukan." });
    }

    const name = request.body?.name !== undefined ? request.body.name.trim() : existing.name;
    const slug = request.body?.slug !== undefined ? slugify(request.body.slug) : existing.slug;
    const summary = request.body?.summary !== undefined ? request.body.summary.trim() : existing.summary;
    const categoryId =
      request.body?.category_id !== undefined
        ? request.body.category_id === null
          ? null
          : Number(request.body.category_id)
        : existing.category_id;
    const version = request.body?.version !== undefined ? request.body.version.trim() : existing.version;
    const author = request.body?.author !== undefined ? request.body.author.trim() : existing.author;
    const tags =
      request.body?.tags !== undefined
        ? JSON.stringify(request.body.tags.map((t) => String(t).trim()).filter(Boolean))
        : existing.tags;
    const agents =
      request.body?.compatible_agents !== undefined
        ? JSON.stringify(request.body.compatible_agents.map((a) => String(a).trim()).filter(Boolean))
        : existing.compatible_agents;
    const markdown =
      request.body?.skill_markdown !== undefined ? request.body.skill_markdown.trim() : existing.skill_markdown;
    const status =
      request.body?.status !== undefined ? (request.body.status === "draft" ? "draft" : "published") : existing.status;
    const featured = request.body?.featured !== undefined ? (request.body.featured ? 1 : 0) : existing.featured;

    if (!name || !slug || !summary || !markdown) {
      return reply.code(400).send({ error: "Nama, slug, ringkasan, dan konten SKILL.md wajib diisi." });
    }

    try {
      db.prepare(`
        UPDATE skills SET
          slug = ?, name = ?, summary = ?, category_id = ?, version = ?, author = ?,
          tags = ?, compatible_agents = ?, skill_markdown = ?, status = ?, featured = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(slug, name, summary, categoryId, version, author, tags, agents, markdown, status, featured, id);

      const updated = db
        .prepare(`
          SELECT s.*, c.name AS category_name, c.slug AS category_slug,
            (SELECT COUNT(*) FROM skill_files f WHERE f.skill_id = s.id) AS file_count
          FROM skills s
          LEFT JOIN categories c ON c.id = s.category_id
          WHERE s.id = ?
        `)
        .get(id) as unknown as SkillRow;

      return { skill: formatSkill(updated, true) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNIQUE")) {
        return reply.code(409).send({ error: `Slug "${slug}" sudah dipakai skill lain.` });
      }
      throw err;
    }
  });

  // Admin: delete skill
  app.delete<{ Params: { id: string } }>("/api/admin/skills/:id", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const id = Number(request.params.id);
    const info = db.prepare("DELETE FROM skills WHERE id = ?").run(id);
    if (info.changes === 0) {
      return reply.code(404).send({ error: "Skill tidak ditemukan." });
    }
    return { ok: true };
  });

  // Admin: upsert supporting file (scripts/, references/, assets/)
  app.post<{ Params: { id: string }; Body: SkillFileBody }>("/api/admin/skills/:id/files", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const skillId = Number(request.params.id);
    const skill = db.prepare("SELECT id FROM skills WHERE id = ?").get(skillId);
    if (!skill) {
      return reply.code(404).send({ error: "Skill tidak ditemukan." });
    }

    const relPath = sanitizeRelativePath(request.body?.relative_path || "");
    if (!relPath) {
      return reply
        .code(400)
        .send({ error: "Path file tidak valid. Gunakan format seperti scripts/helper.py atau references/guide.md." });
    }

    const isBinary = request.body?.is_binary ? 1 : 0;
    const content = request.body?.content ?? "";
    const mimeType = (request.body?.mime_type || "text/plain").trim();
    const sizeBytes = isBinary ? Buffer.from(content, "base64").length : Buffer.byteLength(content, "utf8");

    if (sizeBytes > 2 * 1024 * 1024) {
      return reply.code(413).send({ error: "Ukuran file pendukung maksimal 2 MB." });
    }

    db.prepare(`
      INSERT INTO skill_files (skill_id, relative_path, mime_type, is_binary, content, size_bytes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(skill_id, relative_path) DO UPDATE SET
        mime_type = excluded.mime_type,
        is_binary = excluded.is_binary,
        content = excluded.content,
        size_bytes = excluded.size_bytes
    `).run(skillId, relPath, mimeType, isBinary, content, sizeBytes);

    db.prepare("UPDATE skills SET updated_at = datetime('now') WHERE id = ?").run(skillId);

    const files = db
      .prepare("SELECT id, relative_path, mime_type, is_binary, size_bytes, content, created_at FROM skill_files WHERE skill_id = ? ORDER BY relative_path ASC")
      .all(skillId);

    return reply.code(201).send({ files });
  });

  // Admin: delete supporting file
  app.delete<{ Params: { id: string; fileId: string } }>(
    "/api/admin/skills/:id/files/:fileId",
    async (request, reply) => {
      if (!(await requireAdmin(request, reply))) return;

      const skillId = Number(request.params.id);
      const fileId = Number(request.params.fileId);
      const info = db.prepare("DELETE FROM skill_files WHERE id = ? AND skill_id = ?").run(fileId, skillId);
      if (info.changes === 0) {
        return reply.code(404).send({ error: "File pendukung tidak ditemukan." });
      }
      db.prepare("UPDATE skills SET updated_at = datetime('now') WHERE id = ?").run(skillId);
      return { ok: true };
    }
  );
}
