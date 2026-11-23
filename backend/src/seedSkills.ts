export interface SeedSkillEntry {
  slug: string;
  name: string;
  summary: string;
  categorySlug: string;
  version: string;
  author: string;
  tags: string[];
  agents: string[];
  featured: number;
  markdown: string;
}

export const BUILTIN_SKILLS: SeedSkillEntry[] = [
  {
    slug: "reneo-penawaran",
    name: "Reneo Penawaran",
    summary:
      "Alur kerja penyusunan penawaran layanan PDF A4 3 halaman, batasan kerja anti scope-creep, catatan arsitektur SaaS pendamping, dan pesan WhatsApp pengantar untuk calon klien Reneo.",
    categorySlug: "bisnis-penawaran",
    version: "1.1.0",
    author: "Renaldi, Reneo",
    tags: ["penawaran", "pdf", "invoice", "bisnis", "whatsapp"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cursor"],
    featured: 1,
    markdown: `---
name: reneo-penawaran
description: >-
  Panduan dan alur kerja pembuatan dokumen penawaran layanan (PDF A4), draft invoice,
  catatan arsitektur SaaS pendamping, dan pesan WhatsApp pengantar untuk calon klien Reneo.
  Wajib dijalankan bersama skill antislop dan antislop-copywriting.
---

# Reneo Penawaran

Skill ini membakukan cara menyusun penawaran layanan digital **Reneo** (website, aplikasi bisnis, integrasi CRM, atau layanan SaaS) dari percakapan klien hingga menghasilkan PDF A4 siap kirim, tanpa AI slop dan tanpa membuka browser Chrome.

## 1. Integrasi Wajib dengan \`antislop\`

1. Jalankan bersama \`antislop\` dan \`antislop-copywriting\`.
2. Nol karakter em dash dan hindari buzzword marketing AI (*seamless*, *revolutionary*, *cutting-edge*, *all-in-one*).
3. Nol statistik fiktif, testimoni karangan, atau klaim sertifikasi palsu.
4. Hindari istilah teknis internal (\`PostgreSQL\`, \`Redis\`, \`Docker\`, \`SSE\`, \`RBAC\`, \`HttpOnly\`, \`MCP\`) di PDF penawaran klien; gunakan bahasa manfaat bisnis yang konkret.
5. Seluruh kontras teks wajib memenuhi standar WCAG AA.

## 2. Identitas Brand & Aturan Domain

- **Palet PDF:** Navy \`#0B2A57\` (header, judul seksi, header tabel), Ink \`#111827\`, Body \`#374151\`, Muted \`#4B5563\`, Surface \`#F7F8FA\`, Border \`#D8DEE6\`, satu aksen biru \`#1D4ED8\`.
- **Header, footer, dan blok kontak:** selalu gunakan domain utama \`reneo.my.id\` dengan kontak **Renaldi, Reneo**.
- **Baris add-on produk:** gunakan subdomain produk (\`crm.reneo.my.id\`, \`sidesa.reneo.my.id\`, \`resto.reneo.my.id\`).

## 3. Struktur Standar PDF Penawaran (3 Halaman A4)

- **Halaman 1:** Ringkasan dan seksi \`01 Cakupan Halaman dan Fungsi\` (tabel 2 kolom bahasa operasional).
- **Halaman 2:** Seksi \`02 Pilihan Paket dan Estimasi Biaya\` (2 paket relevan: Starter & Profesional + Admin), \`03 Layanan Tambahan dan Biaya Tahun Berikutnya\`, serta \`04 Alur Pengerjaan dan Pembayaran\` (4 tahap: DP 50%, materi, pratinjau/revisi, pelunasan 50%).
- **Halaman 3:** Seksi \`05 Ketentuan dan Batasan Pengerjaan\` (6 aspek: mulai kerja & materi, batasan revisi, di luar cakupan paket, garansi, domain & hak akses, pembatalan & masa berlaku 14 hari) serta blok kontak.

## 4. Teknis Render & Verifikasi

- Render PDF menggunakan Python \`reportlab\` tanpa membuka Chrome.
- Setelah render, verifikasi otomatis jumlah em dash = 0, konsistensi domain, lalu tinjau visual seluruh halaman sebelum dikirim bersama 1 pesan WhatsApp pengantar yang ringkas dan personal.
`,
  },
  {
    slug: "anti-slop-reneo",
    name: "Anti-Slop Reneo",
    summary:
      "Filter desain, copywriting, dan kode untuk antarmuka Reneo agar bebas elemen macOS, bebas dekorasi AI generik, menjaga kontras WCAG AA, dan memakai token warna konsisten.",
    categorySlug: "desain-ui",
    version: "1.2.0",
    author: "Tim Reneo",
    tags: ["ui", "anti-slop", "design-system", "aksesibilitas"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cline", "Cursor"],
    featured: 1,
    markdown: `---
name: anti-slop-reneo
description: >-
  Gunakan setiap kali membuat atau mengubah UI, copy, komentar, atau mockup Reneo.
  Melarang elemen macOS, dekorasi AI generik, dan kode berisik; memandu review dengan checklist terukur.
---

# Anti-Slop Reneo

Setiap piksel dan baris kode harus punya alasan yang jelas.

## 1. Identitas Platform

- Dilarang tiga bulatan merah/kuning/hijau gaya macOS di window, dialog, landing, atau mockup.
- Window controls memakai ikon garis Lucide \`strokeWidth 1.75\` (\`Minus\`, \`Square\`/\`Copy\`, \`Maximize\`, \`X\`).

## 2. Visual Slop yang Dilarang

1. Kartu melayang yang menumpuk di atas hero tanpa fungsi.
2. Ilustrasi generik AI (orb, mesh abstrak, 3D blob).
3. Lencana kepercayaan palsu ("Enterprise-grade", sertifikasi fiktif).
4. Gradient dekoratif multi-warna pada teks, tombol, atau latar kartu.
5. Ikon \`Sparkles\`, \`Sparkle\`, \`WandSparkles\`, dan emoji sebagai ikon UI.
6. Kartu bersarang (card di dalam card) dan grid 3 kartu KPI identik tanpa hirarki.
7. Angka statistik fiktif tanpa sumber nyata.

## 3. Copy & Kode

- Dilarang kata kosong (*seamless*, *powerful*, *cutting-edge*, *all-in-one*).
- Tombol memakai kata kerja konkret ("Restart container", "Buat tunnel").
- Semua warna wajib dari token CSS (\`:root\` dan \`[data-theme="dark"]\`).
- Komentar satu baris ringkas \`// Judul\`, tanpa banner \`===\`/\`---\`, tanpa \`!important\`, tanpa \`console.log\`.
- Pastikan state lengkap: hover, focus-visible, disabled, loading, empty, dan error.
`,
  },
  {
    slug: "design-ui-audit",
    name: "Design UI Audit",
    summary:
      "Kerangka audit antarmuka 6 sumbu (Hierarchy, Spacing, Typography, Color, Consistency, Accessibility) dengan nilai A-F, bukti elemen spesifik, dan urutan perbaikan berbasis dampak.",
    categorySlug: "desain-ui",
    version: "1.0.0",
    author: "Tim Reneo",
    tags: ["audit", "ui", "ux", "review", "design"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cursor", "Gemini CLI"],
    featured: 1,
    markdown: `---
name: design-ui-audit
description: >-
  UI design review yang menilai hierarchy, spacing, typography, color, consistency,
  dan accessibility pada halaman atau komponen, lalu mengurutkan perbaikan berdasarkan dampak.
---

# UI Design Audit

Audit bukan redesign total: nilai apa yang ada, sebutkan bukti elemen spesifik, lalu urutkan perbaikan berdasarkan dampak.

## 6 Sumbu Penilaian (Nilai A sampai F)

1. **Hierarchy:** Tes 1 detik, apa yang terbaca pertama, kedua, ketiga? Jika semua elemen ditonjolkan, tidak ada yang menonjol.
2. **Spacing:** Apakah mengikuti grid konsisten (4/8pt)? Jarak antar seksi harus lebih besar daripada jarak dalam seksi.
3. **Typography:** Maksimal 2 keluarga huruf, skala ukuran yang konsisten, panjang baris nyaman (< 80 karakter).
4. **Color:** Satu skala netral + 1 sampai 2 warna aksen + warna status semantik. Jangan buang aksen untuk dekorasi.
5. **Consistency:** Aksi yang sama harus tampil sama. Tinggi kontrol sebaris, radius sudut, dan elevasi bayangan seragam.
6. **Accessibility:** Kontras teks minimum 4.5:1 (3:1 teks besar), focus ring terlihat jelas, target sentuh memadai, dan hormati \`prefers-reduced-motion\`.

## Pola Kegagalan yang Wajib Dicek

- Paket kartu SaaS yang meratakan hirarki (terlalu banyak card bersarang).
- Scrollbar bawaan OS yang merusak tema gelap/terang.
- Lebih dari satu gaya CTA utama dalam satu area tampilan.
- Elemen placeholder atau angka statistik kosong yang dibungkus kartu besar.

## Formula Prioritas

\`Prioritas = dampak pada tujuan utama halaman x (1 / tingkat kesulitan)\`. Kerjakan blocker terlebih dahulu, lalu high-impact, baru quick wins.
`,
  },
  {
    slug: "antislop-copywriting",
    name: "Anti-Slop Copywriting",
    summary:
      "Panduan penulisan copy produk, headline, CTA, dan teks antarmuka yang jujur, konkret, bebas em dash, bebas buzzword AI, serta memiliki suara manusia yang jelas.",
    categorySlug: "desain-ui",
    version: "1.0.0",
    author: "Tim Reneo",
    tags: ["copywriting", "teks", "cta", "editorial"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cursor"],
    featured: 0,
    markdown: `---
name: antislop-copywriting
description: >-
  Skill copywriting anti-slop untuk menulis atau menyunting headline, CTA, teks produk,
  dan prosa agar bebas pola tulisan AI generik.
---

# Anti-Slop Copywriting

## Aturan Inti

1. **Jangan pernah mengarang fakta:** dilarang menambahkan angka, nama klien, testimoni, atau tanggal yang tidak ada di sumber.
2. **Hapus kosakata AI kosong:** buang *unlock, elevate, empower, seamless, robust, game-changer, cutting-edge, revolutionary, all-in-one*.
3. **Nol em dash:** ganti em dash dengan titik, koma, titik dua, atau tanda kurung sesuai ritme kalimat.
4. **Hapus kalimat pembuka klise:** hindari *"Di era digital yang serba cepat saat ini..."* atau *"Mari kita selami..."*; langsung mulai pada subjek utama.
5. **CTA konkret:** sebutkan tindakan nyata (*Unduh Paket ZIP*, *Reset Semua Filter*, *Buka Detail*) bukan ajakan abstrak.
6. **Sentence case pada daftar:** hindari kapitalisasi setiap kata pada butir daftar agar mudah dibaca.

## Alur Review Sebelum Kirim

1. **Draft:** tulis ulang dengan kalimat aktif dan subjek yang jelas.
2. **Audit:** cek apakah ada fakta karangan, buzzword, atau pola ritme AI (rule of three dipaksakan, parallelism klise).
3. **Final:** pastikan 0 em dash dan baca nyaring untuk memastikan terdengar alami.
`,
  },
  {
    slug: "antislop-human",
    name: "Anti-Slop Human & A11y",
    summary:
      "Standar aksesibilitas WCAG AA untuk antarmuka nyata: rumus cek kontras warna, navigasi keyboard, indikator fokus, elemen semantik native, dan kelengkapan state UI.",
    categorySlug: "desain-ui",
    version: "1.0.0",
    author: "Tim Reneo",
    tags: ["a11y", "wcag", "kontras", "keyboard", "ux"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cursor"],
    featured: 0,
    markdown: `---
name: antislop-human
description: >-
  Standar aksesibilitas manusia untuk UI: kontras WCAG AA, navigasi keyboard,
  fokus terlihat, affordance interaksi, dan kelengkapan state loading/empty/error.
---

# Anti-Slop Human & Accessibility

## 1. Warna & Kontras (WCAG AA)

- Teks normal wajib memiliki rasio kontras minimum **4.5:1**; teks besar (18px+) dan batas komponen interaktif minimum **3:1**.
- Jangan menebak kontras abu-abu di atas gelap atau terang dengan mata; hitung rasio luminansi atau pakai skrip pemeriksa kontras.
- Jangan mengandalkan warna saja untuk status; pasangkan dengan teks atau ikon.

## 2. Keyboard & Fokus

- Dilarang menghapus \`outline: none\` tanpa pengganti \`:focus-visible\` yang kontras.
- Semua tombol, tautan, tab, dan modal harus bisa dioperasikan penuh dengan \`Tab\`, \`Enter\`, \`Space\`, dan \`Escape\`.
- Urutan DOM mengikuti urutan visual.

## 3. Elemen Semantik & State

- Gunakan \`<button type="button">\` untuk aksi dan \`<a href>\` untuk navigasi, bukan \`<div onClick>\`.
- Tombol hanya-ikon wajib memiliki \`aria-label\` yang jelas dan ikon bertanda \`aria-hidden="true"\`.
- Setiap tampilan data wajib menyediakan state **loading**, **empty** (dengan langkah lanjut), dan **error** (dengan objek gagal dan tombol coba lagi).
- Hormati \`@media (prefers-reduced-motion: reduce)\`.
`,
  },
  {
    slug: "reneo-workflow",
    name: "Reneo Panel Workflow",
    summary:
      "SOP pengembangan, refactoring 100% fidelity, arsitektur React 19 + Go agent, validasi UI, dan prosedur rilis resmi Reneo Panel melalui bun run release:patch.",
    categorySlug: "engineering",
    version: "1.1.0",
    author: "Tim Reneo",
    tags: ["reneo", "react", "golang", "release", "workflow"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cursor"],
    featured: 1,
    markdown: `---
name: reneo-workflow
description: >-
  Standard operating procedure dan alur kerja engineering untuk mengembangkan,
  merapikan, dan merilis Reneo desktop Linux server control panel.
---

# Reneo Panel Workflow

## 1. Arsitektur Layering

- \`src/pages/\`: tampilan rute penuh (\`LoginPage\`, \`LandingPage\`, \`DesktopPage\`).
- \`src/components/windows/\`: aplikasi window desktop mengambang (Terminal, Docker, Database, Settings, Katalog Aplikasi).
- \`src/store/\`: state UI dengan Zustand (\`themeStore\`, \`windowStore\`, \`authStore\`).
- \`src/assets/scss/\`: token warna di \`_variables.scss\` dan modul per fitur di \`modules/\`.
- \`internal/\`: backend Go binary agent (HTTP server, Docker runner, database manager, Cloudflare, PTY terminal).

## 2. Prinsip Refactoring (100% Fidelity)

1. Perubahan visual tidak boleh mengubah kontrak API atau merusak state lama.
2. Seluruh teks UI wajib melalui \`t()\` dengan kunci lengkap di \`id.ts\` dan \`en.ts\`.
3. Gunakan komponen di \`src/components/ui/\` dan hindari hex/rgba lepas di JSX.

## 3. Validasi & Rilis Resmi

Sebelum merilis perubahan pada branch \`main-runtime-dev\`:

\`\`\`powershell
bun run check:ui
bun run build
bun run lint
go test ./...
\`\`\`

Untuk publikasi versi baru, selalu jalankan skrip rilis resmi agar \`CHANGELOG.md\`, \`package.json\`, commit, dan tag sinkron dengan GitHub Actions:

\`\`\`powershell
bun run release:patch
\`\`\`
`,
  },
  {
    slug: "reneo-skills-dev",
    name: "Reneo Skills Dev Guide",
    summary:
      "Panduan arsitektur dan pemeliharaan layanan Reneo Skills (Fastify 5, SQLite bawaan Node 24, JSZip, React/Vite/Tailwind) serta alur publish image GHCR.",
    categorySlug: "engineering",
    version: "1.0.0",
    author: "Tim Reneo",
    tags: ["skills-services", "fastify", "sqlite", "docker", "ghcr"],
    agents: ["Antigravity", "Claude Code", "Codex"],
    featured: 0,
    markdown: `---
name: reneo-skills-dev
description: >-
  Panduan pengembangan, arsitektur, dan pemeliharaan layanan Reneo Skills (skills-services):
  galeri publik skill agent, distribusi paket ZIP, panel admin CRUD, dan SQLite Node 24.
---

# Reneo Skills Dev Guide

## 1. Arsitektur Layanan

- **Backend (\`backend/src/\`):** Fastify 5 + TypeScript + SQLite bawaan Node 24 (\`node:sqlite\`) + \`jszip\`.
  - \`db.ts\`: skema tabel \`users\`, \`categories\`, \`skills\`, \`skill_files\` dan seed idempoten.
  - \`auth.ts\`: hash \`scrypt\` dan sesi cookie \`HttpOnly\` bertanda tangan HMAC.
  - \`routes/skills.ts\`: API galeri publik, raw \`SKILL.md\`, unduhan ZIP, dan CRUD admin.
- **Frontend (\`frontend/src/\`):** React 18 + Vite + TypeScript + Tailwind + CSS variables (\`:root\` dan \`[data-theme="dark"]\`).
  - Mendukung subpath proxy \`/app/<slug>\` melalui helper \`basePath.ts\`.
- **Docker:** multi-stage \`node:24-alpine\` tanpa dependensi C++ native, volume data persisten di \`/app/data\`.

## 2. Verifikasi Sebelum Rilis

\`\`\`powershell
cd backend; npm run build; npm test
cd ..\\frontend; npm run build
\`\`\`

Rilis image container melalui tag semver (\`git tag v1.x.y && git push origin v1.x.y\`) yang memicu workflow \`docker-publish.yml\` ke GHCR.
`,
  },
  {
    slug: "project-memory",
    name: "Project Memory Architecture",
    summary:
      "Pola memori jangka panjang (persistent knowledge base) berbasis folder references/ dan skrip verifikasi agar agent langsung memahami peta frontend dan backend tanpa memindai ulang repo.",
    categorySlug: "otomasi",
    version: "1.0.0",
    author: "Tim Reneo",
    tags: ["memory", "arsitektur", "workflow", "agent", "dokumentasi"],
    agents: ["Antigravity", "Claude Code", "Codex", "Cursor", "Gemini CLI"],
    featured: 0,
    markdown: `---
name: project-memory
description: >-
  Persistent codebase memory dan knowledge base arsitektur untuk membaca peta frontend,
  backend, route, store, dan tooling secara instan lintas sesi.
---

# Project Memory Architecture

Skill ini membakukan penyimpanan memori arsitektur proyek secara modular agar agent hemat konteks (*progressive disclosure*) dan selalu sinkron dengan kondisi repository.

## 1. Struktur Folder Memori

Simpan catatan peta codebase dalam folder \`references/\`:

- \`references/architecture-overview.md\`: gambaran sistem tingkat atas, build, skrip tooling, dan deployment.
- \`references/frontend-map.md\`: peta halaman, komponen UI, store state, custom hooks, dan modul API client.
- \`references/backend-map.md\`: peta entrypoint, package layanan, skema database, migrasi, dan daftar endpoint.
- \`references/session-notes.md\`: log keputusan teknis penting, temuan bug, dan riwayat perubahan arsitektur.

## 2. Alur Penggunaan Lintas Sesi

1. **Read selektif:** di awal tugas, baca hanya file referensi yang relevan dengan domain pekerjaan (UI, backend, atau build).
2. **Write setelah perubahan struktural:** setiap kali menambah halaman, modul API, tabel database, atau keputusan arsitektur baru, perbarui file referensi terkait.
3. **Verifikasi berkala:** jalankan skrip pembanding direktori (\`memory.mjs verify\`) untuk mendeteksi file baru yang belum tercatat.
`,
  },
];
