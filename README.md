# Reneo Skills (`skills-services`)

Layanan galeri dan manajemen skill untuk agent coding (Antigravity, Claude Code, Codex, Cursor, Cline, Gemini CLI). Berjalan dalam 1 container dengan SQLite bawaan Node 24 (`node:sqlite`) tanpa database eksternal.

## Fitur Utama

- **Galeri Publik (`/`)**: pencarian skill, filter kategori dan kompatibilitas agent, urutan katalog, serta statistik nyata jumlah skill dan unduhan.
- **Detail & Distribusi (`/skills/:slug`)**: pratinjau `SKILL.md` terformat, tampilan markdown mentah, penjelajah file pendukung (`scripts/`, `references/`, `assets/`), tombol unduh paket `.zip` lengkap, serta perintah salin untuk PowerShell dan Bash.
- **Panel Admin (`/admin`)**: autentikasi cookie `HttpOnly`, CRUD skill lengkap dengan impor file `SKILL.md` lokal, editor markdown + pratinjau langsung, manajemen file pendukung (teks maupun biner), toggle status Terbit/Draf, dan manajemen kategori.

## Menjalankan Secara Lokal

1. Salin `.env.example` menjadi `.env` dan sesuaikan `ADMIN_EMAIL`, `ADMIN_PASSWORD`, serta `SESSION_SECRET`.
2. Jalankan backend:
   ```bash
   cd backend && npm install && npm run dev
   ```
3. Jalankan frontend di terminal terpisah:
   ```bash
   cd frontend && npm install && npm run dev
   ```
4. Buka `http://localhost:5178` untuk galeri dan `http://localhost:5178/admin` untuk panel admin.

## Menjalankan via Docker

```bash
docker compose up -d --build
```

Aplikasi aktif di port `5055` dengan data SQLite persisten di volume `skills_data`.
