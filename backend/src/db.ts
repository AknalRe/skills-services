import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config";
import { hashPassword } from "./auth";
import { BUILTIN_SKILLS } from "./seedSkills";

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

  const getCatId = db.prepare("SELECT id FROM categories WHERE slug = ?");
  const insertSkill = db.prepare(`
    INSERT OR IGNORE INTO skills (
      slug, name, summary, category_id, version, author,
      tags, compatible_agents, skill_markdown, status, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `);

  for (const s of BUILTIN_SKILLS) {
    const cat = getCatId.get(s.categorySlug) as { id: number } | undefined;
    insertSkill.run(
      s.slug,
      s.name,
      s.summary,
      cat?.id ?? null,
      s.version,
      s.author,
      JSON.stringify(s.tags),
      JSON.stringify(s.agents),
      s.markdown,
      s.featured
    );
  }
}
