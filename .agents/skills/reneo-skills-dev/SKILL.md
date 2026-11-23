---
name: reneo-skills-dev
description: >-
  Panduan pengembangan, arsitektur, dan pemeliharaan layanan Reneo Skills (skills-services):
  galeri publik skill agent, distribusi paket ZIP, panel admin CRUD, SQLite bawaan Node 24,
  dan aturan antislop untuk antarmuka registry.
---

# Reneo Skills Dev Guide

Gunakan skill ini saat mengembangkan, menambah fitur, atau memelihara repositori `skills-services`.

## 1. Arsitektur Layanan

- **Backend (`backend/src/`)**: Fastify 5 + TypeScript + SQLite bawaan Node 24 (`node:sqlite` `DatabaseSync`) + `jszip`.
  - `db.ts`: skema tabel `users`, `categories`, `skills`, `skill_files` dan seed awal.
  - `auth.ts`: hashing `scrypt` dan sesi cookie `HttpOnly` bertanda tangan HMAC (`reneo_skills_session`).
  - `routes/skills.ts`: endpoint publik (`GET /api/skills`, `GET /api/skills/:slug`, `GET /api/skills/:slug/raw`, `GET /api/skills/:slug/download`) dan endpoint admin (`/api/admin/skills/*`, `/api/admin/skills/:id/files/*`).
  - `routes/categories.ts`: daftar kategori publik dan CRUD kategori admin.
  - `server.ts`: melayani API dan file statis `frontend/dist` dalam satu proses Node di port `5055`.
- **Frontend (`frontend/src/`)**: React 18 + Vite + TypeScript + Tailwind + CSS variables (`:root` terang dan `[data-theme="dark"]` gelap).
  - Halaman: `GalleryPage` (`/`), `SkillDetailPage` (`/skills/:slug`), `AdminLoginPage` & `AdminDashboardPage` (`/admin`).
- **Docker**: multi-stage `node:24-alpine` tanpa dependensi C++ native, volume data persisten di `/app/data`.

## 2. Aturan Wajib (`antislop`)

1. Jalankan bersama skill `antislop`, `antislop-ui`, dan `antislop-copywriting`.
2. Dilarang memakai em dash (`—`), angka statistik fiktif, testimoni karangan, atau ikon dekoratif seperti `Sparkles` / `WandSparkles`.
3. Semua warna wajib berasal dari CSS variables di `frontend/src/index.css` untuk kedua tema (terang dan gelap) dengan kontras minimum WCAG AA.
4. Setiap kontrol interaktif wajib memakai elemen semantik native (`<button>`, `<a href>`, `<label htmlFor>`), mendukung keyboard (`Tab`, `Enter`, `Escape` untuk modal), dan menyertakan state loading, empty, serta error.
5. Gunakan logo resmi `frontend/public/logo.svg` sesuai `docs/FILOSOFI-LOGO.md`.

## 3. Verifikasi Sebelum Selesai

Jalankan perintah berikut sebelum commit atau rilis:
```powershell
cd backend; npm run build; npm test
cd ..\frontend; npm run build
```
