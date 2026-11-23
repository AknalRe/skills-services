import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config";
import { hashPassword } from "./auth";

let dbInstance: DatabaseSync | null = null;

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) return dbInstance;

  const dbPath = customPath || path.join(config.dataDir, "skills.sqlite");
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      version TEXT NOT NULL DEFAULT '1.0.0',
      author TEXT NOT NULL DEFAULT 'Reneo',
      tags TEXT NOT NULL DEFAULT '[]',
      compatible_agents TEXT NOT NULL DEFAULT '["Antigravity","Claude Code","Codex"]',
      skill_markdown TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published', 'draft')),
      featured INTEGER NOT NULL DEFAULT 0,
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      relative_path TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'text/plain',
      is_binary INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(skill_id, relative_path)
    );

    CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);
    CREATE INDEX IF NOT EXISTS idx_skill_files_skill ON skill_files(skill_id);
  `);

  seedInitialData(db);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

function seedInitialData(db: DatabaseSync): void {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c === 0) {
    db.prepare(
      "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run(config.adminEmail.toLowerCase(), "Admin Reneo", hashPassword(config.adminPassword), "admin");
  }

  const catCount = db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number };
  if (catCount.c === 0) {
    const defaultCategories = [
      { slug: "desain-ui", name: "Desain & UI", description: "Standar visual, aksesibilitas, dan anti-slop untuk antarmuka.", sort: 1 },
      { slug: "bisnis-penawaran", name: "Bisnis & Penawaran", description: "Template proposal, penawaran PDF, dan komunikasi klien.", sort: 2 },
      { slug: "engineering", name: "Engineering & DevOps", description: "Alur kerja kode, debugging, dan pemeliharaan sistem.", sort: 3 },
      { slug: "otomasi", name: "Otomasi & Workflow", description: "Orkestrasi agent, integrasi layanan, dan rutinitas terjadwal.", sort: 4 },
    ];
    const insertCat = db.prepare(
      "INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)"
    );
    for (const c of defaultCategories) {
      insertCat.run(c.slug, c.name, c.description, c.sort);
    }
  }

  const skillCount = db.prepare("SELECT COUNT(*) as c FROM skills").get() as { c: number };
  if (skillCount.c === 0) {
    const bizCat = db.prepare("SELECT id FROM categories WHERE slug = ?").get("bisnis-penawaran") as { id: number } | undefined;
    const uiCat = db.prepare("SELECT id FROM categories WHERE slug = ?").get("desain-ui") as { id: number } | undefined;

    const starterSkills = [
      {
        slug: "reneo-penawaran",
        name: "Reneo Penawaran",
        summary: "Alur kerja penyusunan penawaran layanan PDF A4, batasan kerja, arsitektur SaaS pendamping, dan pesan WhatsApp pengantar untuk calon klien Reneo.",
        categoryId: bizCat?.id ?? null,
        version: "1.0.0",
        author: "Renaldi, Reneo",
        tags: JSON.stringify(["penawaran", "pdf", "invoice", "bisnis", "whatsapp"]),
        agents: JSON.stringify(["Antigravity", "Claude Code", "Codex", "Cursor"]),
        featured: 1,
        markdown: `---
name: reneo-penawaran
description: Panduan dan alur kerja pembuatan dokumen penawaran layanan PDF A4, draft invoice, catatan arsitektur SaaS pendamping, dan pesan WhatsApp pengantar untuk calon klien Reneo.
---

# Reneo Penawaran

Skill ini membakukan cara menyusun penawaran layanan digital Reneo dari percakapan klien hingga menghasilkan PDF A4 siap kirim.

## Aturan Utama

1. Jalankan bersama skill \`antislop\` dan \`antislop-copywriting\`.
2. Gunakan domain utama \`reneo.my.id\` pada header, footer, dan blok kontak, serta subdomain produk (\`crm.reneo.my.id\`, \`sidesa.reneo.my.id\`) pada baris layanan tambahan.
3. Susun dalam 3 halaman A4: cakupan fungsi, pilihan paket dan alur pembayaran, serta ketentuan dan batasan pengerjaan (revisi, materi, di luar cakupan, garansi, dan DP).
4. Render PDF menggunakan Python \`reportlab\` tanpa membuka Chrome, lalu periksa visual setiap halaman sebelum dikirim.
`,
      },
      {
        slug: "anti-slop-reneo",
        name: "Anti-Slop Reneo",
        summary: "Filter desain, copywriting, dan kode untuk antarmuka Reneo agar bebas dekorasi AI generik, menjaga kontras WCAG AA, dan memakai token warna konsisten.",
        categoryId: uiCat?.id ?? null,
        version: "1.2.0",
        author: "Tim Reneo",
        tags: JSON.stringify(["ui", "copywriting", "aksesibilitas", "design-system"]),
        agents: JSON.stringify(["Antigravity", "Claude Code", "Codex", "Cline", "Cursor"]),
        featured: 1,
        markdown: `---
name: anti-slop-reneo
description: Filter UI, copy, dan kode untuk mencegah pola AI slop pada produk Reneo.
---

# Anti-Slop Reneo

Setiap keputusan visual dan teks wajib memiliki alasan yang jelas.

## Prinsip Inti

- Bebas bulatan traffic light ala macOS pada window maupun mockup.
- Bebas em dash dan buzzword marketing kosong pada copy antarmuka.
- Setiap kontrol interaktif wajib memakai elemen semantik native dengan status hover, fokus keyboard, loading, empty, dan error.
- Seluruh warna bersumber dari token CSS untuk mode terang dan gelap dengan kontras minimum WCAG AA.
`,
      },
    ];

    const insertSkill = db.prepare(`
      INSERT INTO skills (
        slug, name, summary, category_id, version, author,
        tags, compatible_agents, skill_markdown, status, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `);

    for (const s of starterSkills) {
      insertSkill.run(
        s.slug,
        s.name,
        s.summary,
        s.categoryId,
        s.version,
        s.author,
        s.tags,
        s.agents,
        s.markdown,
        s.featured
      );
    }
  }
}
