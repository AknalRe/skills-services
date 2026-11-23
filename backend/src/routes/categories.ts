import type { FastifyInstance } from "fastify";
import type { DatabaseSync } from "node:sqlite";
import { requireAdmin } from "../auth";

interface CategoryBody {
  slug?: string;
  name?: string;
  description?: string;
  sort_order?: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function registerCategoryRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.get("/api/categories", async () => {
    const rows = db
      .prepare(`
        SELECT c.id, c.slug, c.name, c.description, c.sort_order,
          (SELECT COUNT(*) FROM skills s WHERE s.category_id = c.id AND s.status = 'published') AS published_count,
          (SELECT COUNT(*) FROM skills s WHERE s.category_id = c.id) AS total_count
        FROM categories c
        ORDER BY c.sort_order ASC, c.name ASC
      `)
      .all();
    return { categories: rows };
  });

  app.post<{ Body: CategoryBody }>("/api/admin/categories", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const name = (request.body?.name || "").trim();
    const slug = slugify(request.body?.slug || name);
    const description = (request.body?.description || "").trim();
    const sortOrder = Number(request.body?.sort_order ?? 0);

    if (!name || !slug) {
      return reply.code(400).send({ error: "Nama kategori wajib diisi." });
    }

    try {
      const result = db
        .prepare("INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)")
        .run(slug, name, description, sortOrder);
      const created = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
      return reply.code(201).send({ category: created });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNIQUE")) {
        return reply.code(409).send({ error: `Kategori dengan slug "${slug}" sudah ada.` });
      }
      throw err;
    }
  });

  app.patch<{ Params: { id: string }; Body: CategoryBody }>("/api/admin/categories/:id", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const id = Number(request.params.id);
    const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as
      | { id: number; slug: string; name: string; description: string; sort_order: number }
      | undefined;

    if (!existing) {
      return reply.code(404).send({ error: "Kategori tidak ditemukan." });
    }

    const name = request.body?.name !== undefined ? request.body.name.trim() : existing.name;
    const slug = request.body?.slug !== undefined ? slugify(request.body.slug) : existing.slug;
    const description = request.body?.description !== undefined ? request.body.description.trim() : existing.description;
    const sortOrder = request.body?.sort_order !== undefined ? Number(request.body.sort_order) : existing.sort_order;

    if (!name || !slug) {
      return reply.code(400).send({ error: "Nama dan slug kategori tidak boleh kosong." });
    }

    try {
      db.prepare("UPDATE categories SET slug = ?, name = ?, description = ?, sort_order = ? WHERE id = ?").run(
        slug,
        name,
        description,
        sortOrder,
        id
      );
      const updated = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
      return { category: updated };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNIQUE")) {
        return reply.code(409).send({ error: `Slug kategori "${slug}" sudah digunakan.` });
      }
      throw err;
    }
  });

  app.delete<{ Params: { id: string } }>("/api/admin/categories/:id", async (request, reply) => {
    if (!(await requireAdmin(request, reply))) return;

    const id = Number(request.params.id);
    const info = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    if (info.changes === 0) {
      return reply.code(404).send({ error: "Kategori tidak ditemukan." });
    }
    return { ok: true };
  });
}
