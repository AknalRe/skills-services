import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileCode2, FolderPlus, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { api } from "../lib/api";
import { renderMarkdownToHtml } from "../lib/markdown";
import type { AdminSummary, Category, Skill, SkillFile } from "../types";
import { Modal } from "../components/Modal";

const DEFAULT_AGENTS = ["Antigravity", "Claude Code", "Codex", "Cursor", "Cline", "Gemini CLI"];

interface SkillFormState {
  id?: number;
  name: string;
  slug: string;
  summary: string;
  category_id: string;
  version: string;
  author: string;
  tagsText: string;
  compatible_agents: string[];
  skill_markdown: string;
  status: "published" | "draft";
  featured: boolean;
  is_official: boolean;
}

const EMPTY_FORM: SkillFormState = {
  name: "",
  slug: "",
  summary: "",
  category_id: "",
  version: "1.0.0",
  author: "Renaldi, Reneo",
  tagsText: "",
  compatible_agents: ["Antigravity", "Claude Code", "Codex"],
  skill_markdown:
    "---\nname: nama-skill\ndescription: Jelaskan kapan skill ini dipakai.\n---\n\n# Judul Skill\n\nTuliskan instruksi langkah kerja di sini.\n",
  status: "published",
  featured: false,
  is_official: false,
};

function parseFrontmatter(md: string): { name?: string; description?: string } {
  const normalized = md.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return {};
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return {};
  const block = normalized.slice(4, end);
  const nameMatch = /^name:\s*(.+)$/m.exec(block);
  const descMatch = /^description:\s*(.+)$/m.exec(block);
  return {
    name: nameMatch ? nameMatch[1].replace(/^["']|["']$/g, "").trim() : undefined,
    description: descMatch ? descMatch[1].replace(/^["']|["']$/g, "").trim() : undefined,
  };
}

export function AdminDashboardPage() {
  const [section, setSection] = useState<"skills" | "categories">("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<SkillFormState>(EMPTY_FORM);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [savingSkill, setSavingSkill] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filesSkill, setFilesSkill] = useState<Skill | null>(null);
  const [skillFiles, setSkillFiles] = useState<SkillFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [newFileMime, setNewFileMime] = useState("text/plain");
  const [newFileBinary, setNewFileBinary] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savingFile, setSavingFile] = useState(false);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catError, setCatError] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [skillsRes, catRes] = await Promise.all([
        api.listAdminSkills({
          q: query.trim() || undefined,
          status: statusFilter || undefined,
        }),
        api.listCategories(),
      ]);
      setSkills(skillsRes.skills);
      setSummary(skillsRes.summary);
      setCategories(catRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data panel admin.");
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setEditorTab("write");
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditModal = (skill: Skill) => {
    setForm({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      summary: skill.summary,
      category_id: skill.category_id ? String(skill.category_id) : "",
      version: skill.version,
      author: skill.author,
      tagsText: skill.tags.join(", "),
      compatible_agents: skill.compatible_agents,
      skill_markdown: skill.skill_markdown || "",
      status: skill.status,
      featured: skill.featured,
      is_official: skill.is_official,
    });
    setEditorTab("write");
    setFormError(null);
    setEditorOpen(true);
  };

  const handleImportMarkdownFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const meta = parseFrontmatter(text);
      setForm((prev) => ({
        ...prev,
        slug: prev.slug || meta.name || "",
        name: prev.name || (meta.name ? meta.name.replace(/-/g, " ") : ""),
        summary: prev.summary || meta.description || "",
        skill_markdown: text,
      }));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const toggleAgent = (agent: string) => {
    setForm((prev) => {
      const exists = prev.compatible_agents.includes(agent);
      return {
        ...prev,
        compatible_agents: exists
          ? prev.compatible_agents.filter((a) => a !== agent)
          : [...prev.compatible_agents, agent],
      };
    });
  };

  const handleSaveSkill = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSkill(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      summary: form.summary.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      version: form.version.trim() || "1.0.0",
      author: form.author.trim() || "Reneo",
      tags: form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      compatible_agents: form.compatible_agents,
      skill_markdown: form.skill_markdown,
      status: form.status,
      featured: form.featured,
      is_official: form.is_official,
    };

    try {
      if (form.id) {
        await api.updateSkill(form.id, payload);
      } else {
        await api.createSkill(payload);
      }
      setEditorOpen(false);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan skill.");
    } finally {
      setSavingSkill(false);
    }
  };

  const handleToggleStatus = async (skill: Skill) => {
    const nextStatus = skill.status === "published" ? "draft" : "published";
    try {
      await api.updateSkill(skill.id, { status: nextStatus });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status publikasi.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteSkill(deleteTarget.id);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus skill.");
    } finally {
      setDeleting(false);
    }
  };

  const openFilesModal = async (skill: Skill) => {
    setFilesSkill(skill);
    setFilesLoading(true);
    setFileError(null);
    setNewFilePath("");
    setNewFileContent("");
    setNewFileMime("text/plain");
    setNewFileBinary(false);
    try {
      const res = await api.getAdminSkill(skill.id);
      setSkillFiles(res.files);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Gagal memuat daftar file pendukung.");
    } finally {
      setFilesLoading(false);
    }
  };

  const handleUploadLocalSupportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isText =
      file.type.startsWith("text/") || /\.(md|py|sh|ts|tsx|js|json|yaml|yml|css|scss|txt)$/i.test(file.name);
    const defaultFolder = file.type.startsWith("image/") ? "assets" : "scripts";
    setNewFilePath(`${defaultFolder}/${file.name}`);
    setNewFileMime(file.type || (isText ? "text/plain" : "application/octet-stream"));

    const reader = new FileReader();
    reader.onload = () => {
      if (isText) {
        setNewFileBinary(false);
        setNewFileContent(String(reader.result || ""));
      } else {
        setNewFileBinary(true);
        const dataUrl = String(reader.result || "");
        const commaIdx = dataUrl.indexOf(",");
        setNewFileContent(commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : "");
      }
    };
    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSaveSupportFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!filesSkill) return;
    setSavingFile(true);
    setFileError(null);
    try {
      const res = await api.upsertSkillFile(filesSkill.id, {
        relative_path: newFilePath.trim(),
        mime_type: newFileMime.trim() || "text/plain",
        is_binary: newFileBinary,
        content: newFileContent,
      });
      setSkillFiles(res.files);
      setNewFilePath("");
      setNewFileContent("");
      setNewFileBinary(false);
      await loadAll();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Gagal menyimpan file pendukung.");
    } finally {
      setSavingFile(false);
    }
  };

  const handleDeleteSupportFile = async (fileId: number) => {
    if (!filesSkill) return;
    setFileError(null);
    try {
      await api.deleteSkillFile(filesSkill.id, fileId);
      setSkillFiles((prev) => prev.filter((f) => f.id !== fileId));
      await loadAll();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Gagal menghapus file pendukung.");
    }
  };

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError("Nama kategori wajib diisi.");
      return;
    }
    setSavingCat(true);
    setCatError(null);
    try {
      await api.createCategory({ name: catName.trim(), description: catDesc.trim() });
      setCatName("");
      setCatDesc("");
      await loadAll();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Gagal menambahkan kategori.");
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setCatError(null);
    try {
      await api.deleteCategory(id);
      await loadAll();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    }
  };

  const editorPreviewHtml = useMemo(() => renderMarkdownToHtml(form.skill_markdown), [form.skill_markdown]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            Manajemen Skill
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            Tambah, perbarui konten SKILL.md, lampirkan skrip pendukung, dan atur status publikasi galeri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-[12px] border p-1"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setSection("skills")}
              className="min-h-[34px] rounded-[9px] px-3 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: section === "skills" ? "var(--surface-elevated)" : "transparent",
                color: section === "skills" ? "var(--accent-text)" : "var(--ink-body)",
                boxShadow: section === "skills" ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
              }}
            >
              Daftar Skill ({summary?.total ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setSection("categories")}
              className="min-h-[34px] rounded-[9px] px-3 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: section === "categories" ? "var(--surface-elevated)" : "transparent",
                color: section === "categories" ? "var(--accent-text)" : "var(--ink-body)",
                boxShadow: section === "categories" ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
              }}
            >
              Kategori ({categories.length})
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="reneo-btn-primary inline-flex min-h-[40px] items-center gap-1.5 px-4 text-xs"
          >
            <Plus size={15} strokeWidth={2} aria-hidden="true" />
            Tambah Skill Baru
          </button>
        </div>
      </div>

      {summary && section === "skills" && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="reneo-card px-4 py-3">
            <div className="text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>
              Total skill
            </div>
            <div className="mt-1 font-mono text-xl font-bold" style={{ color: "var(--ink)" }}>
              {summary.total}
            </div>
          </div>
          <div className="reneo-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>
              <span className="status-dot" style={{ backgroundColor: "var(--emerald)" }} aria-hidden="true" />
              Terbit
            </div>
            <div className="mt-1 font-mono text-xl font-bold" style={{ color: "var(--emerald-text)" }}>
              {summary.published}
            </div>
          </div>
          <div className="reneo-card px-4 py-3">
            <div className="text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>
              Draf
            </div>
            <div className="mt-1 font-mono text-xl font-bold" style={{ color: "var(--warning-text)" }}>
              {summary.draft}
            </div>
          </div>
          <div className="reneo-card px-4 py-3">
            <div className="text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>
              Total unduhan
            </div>
            <div className="mt-1 font-mono text-xl font-bold" style={{ color: "var(--ink)" }}>
              {summary.downloads}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-[12px] border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--danger-bg)",
            borderColor: "var(--danger)",
            color: "var(--danger-text)",
          }}
        >
          {error}
        </div>
      )}

      {section === "skills" && (
        <section className="mt-5 space-y-4">
          <div className="reneo-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <label htmlFor="admin-skill-search" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                Cari di katalog admin
              </label>
              <div className="relative">
                <Search
                  size={15}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ink-muted)" }}
                />
                <input
                  id="admin-skill-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama, slug, atau tag..."
                  className="reneo-field min-h-[40px] w-full pl-9 pr-3 text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="admin-status-filter" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                Status publikasi
              </label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="reneo-field min-h-[40px] w-full px-3 text-sm"
              >
                <option value="">Semua status</option>
                <option value="published">Terbit</option>
                <option value="draft">Draf</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div role="status" className="reneo-card p-8 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
              Memuat data skill...
            </div>
          ) : skills.length === 0 ? (
            <div className="reneo-card p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                Belum ada skill pada filter ini.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="reneo-btn-primary mt-3 inline-flex min-h-[40px] items-center gap-1.5 px-4 text-sm"
              >
                <Plus size={15} strokeWidth={2} aria-hidden="true" />
                Buat Skill Pertama
              </button>
            </div>
          ) : (
            <div className="reneo-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                      <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                        Skill &amp; Slug
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                        Kategori
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                        File / Unduhan
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="font-semibold" style={{ color: "var(--ink)" }}>
                            {skill.name}{" "}
                            <span className="font-mono text-xs font-normal" style={{ color: "var(--ink-muted)" }}>
                              v{skill.version}
                            </span>
                          </div>
                          <div className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
                            {skill.slug}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-xs" style={{ color: "var(--ink-body)" }}>
                          {skill.category_name || "Umum"}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(skill)}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: skill.status === "published" ? "var(--emerald-bg)" : "var(--warning-bg)",
                              color: skill.status === "published" ? "var(--emerald-text)" : "var(--warning-text)",
                            }}
                          >
                            <span
                              className="status-dot"
                              style={{ backgroundColor: skill.status === "published" ? "var(--emerald)" : "var(--warning-text)" }}
                              aria-hidden="true"
                            />
                            {skill.status === "published" ? "Terbit" : "Draf"}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 align-middle font-mono text-xs" style={{ color: "var(--ink-body)" }}>
                          {skill.file_count} file / {skill.download_count} unduhan
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {skill.status === "published" && (
                              <Link
                                to={`/skills/${skill.slug}`}
                                className="reneo-btn-ghost inline-flex min-h-[32px] items-center gap-1 px-2.5 text-xs no-underline"
                              >
                                <ExternalLink size={12} strokeWidth={1.75} aria-hidden="true" />
                                Lihat
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => void openFilesModal(skill)}
                              className="reneo-btn-ghost inline-flex min-h-[32px] items-center gap-1 px-2.5 text-xs"
                            >
                              <FileCode2 size={12} strokeWidth={1.75} aria-hidden="true" />
                              File ({skill.file_count})
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(skill)}
                              className="inline-flex min-h-[32px] items-center gap-1 rounded-[9px] px-2.5 text-xs font-semibold"
                              style={{ backgroundColor: "var(--accent-tint)", color: "var(--accent-text)" }}
                            >
                              <Pencil size={12} strokeWidth={1.75} aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(skill)}
                              aria-label={`Hapus ${skill.name}`}
                              className="inline-flex min-h-[32px] items-center gap-1 rounded-[9px] px-2.5 text-xs font-semibold"
                              style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" }}
                            >
                              <Trash2 size={12} strokeWidth={1.75} aria-hidden="true" />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {section === "categories" && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="reneo-card p-5 lg:col-span-5">
            <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: "var(--ink)" }}>
              <FolderPlus size={16} strokeWidth={1.75} aria-hidden="true" />
              Tambah Kategori
            </h2>
            {catError && (
              <div
                role="alert"
                className="mt-3 rounded-[10px] border px-3 py-2 text-xs"
                style={{
                  backgroundColor: "var(--danger-bg)",
                  borderColor: "var(--danger)",
                  color: "var(--danger-text)",
                }}
              >
                {catError}
              </div>
            )}
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
              <div>
                <label htmlFor="cat-name" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                  Nama Kategori
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Integrasi API"
                  className="reneo-field min-h-[40px] w-full px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="cat-desc" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                  Deskripsi singkat
                </label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Jelaskan jenis skill dalam kategori ini"
                  className="reneo-field w-full p-3 text-sm"
                />
              </div>
              <button type="submit" disabled={savingCat} className="reneo-btn-primary min-h-[40px] px-4 text-sm">
                {savingCat ? "Menyimpan..." : "Simpan Kategori"}
              </button>
            </form>
          </div>

          <div className="space-y-2.5 lg:col-span-7">
            {categories.map((cat) => (
              <div key={cat.id} className="reneo-card flex items-start justify-between gap-4 p-4">
                <div>
                  <div className="font-semibold" style={{ color: "var(--ink)" }}>
                    {cat.name}{" "}
                    <span className="font-mono text-xs font-normal" style={{ color: "var(--ink-muted)" }}>
                      ({cat.slug})
                    </span>
                  </div>
                  {cat.description && (
                    <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-1.5 font-mono text-xs" style={{ color: "var(--ink-body)" }}>
                    {cat.total_count ?? 0} skill terdaftar
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteCategory(cat.id)}
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-[9px] px-3 text-xs font-semibold"
                  style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" }}
                >
                  <Trash2 size={12} strokeWidth={1.75} aria-hidden="true" />
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skill Create / Edit Modal */}
      <Modal
        open={editorOpen}
        title={form.id ? `Edit Skill: ${form.name}` : "Tambah Skill Baru"}
        onClose={() => setEditorOpen(false)}
        maxWidthClass="max-w-4xl"
      >
        <form onSubmit={handleSaveSkill} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-[10px] border px-3.5 py-2.5 text-sm"
              style={{
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger)",
                color: "var(--danger-text)",
              }}
            >
              {formError}
            </div>
          )}

          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border px-3.5 py-2.5"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--ink-body)" }}>
              Sudah punya file SKILL.md di komputer? Impor langsung untuk mengisi otomatis.
            </span>
            <label
              htmlFor="import-skill-md"
              className="reneo-btn-ghost inline-flex min-h-[34px] items-center gap-1.5 px-3 text-xs font-semibold"
              style={{ color: "var(--accent-text)" }}
            >
              <Upload size={13} strokeWidth={1.75} aria-hidden="true" />
              Pilih file SKILL.md
              <input
                id="import-skill-md"
                type="file"
                accept=".md,text/markdown,text/plain"
                onChange={handleImportMarkdownFile}
                className="sr-only"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="f-name" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Nama Skill
              </label>
              <input
                id="f-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Reneo Penawaran"
                className="reneo-field min-h-[40px] w-full px-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="f-slug" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Slug (nama folder skill)
              </label>
              <input
                id="f-slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="reneo-penawaran (otomatis jika kosong)"
                className="reneo-field min-h-[40px] w-full px-3 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="f-summary" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
              Ringkasan Singkat (tampil di kartu galeri)
            </label>
            <textarea
              id="f-summary"
              required
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Jelaskan kegunaan utama skill dalam 1 sampai 2 kalimat."
              className="reneo-field w-full p-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="f-cat" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Kategori
              </label>
              <select
                id="f-cat"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="reneo-field min-h-[40px] w-full px-2.5 text-sm"
              >
                <option value="">Umum</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-ver" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Versi
              </label>
              <input
                id="f-ver"
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="reneo-field min-h-[40px] w-full px-3 font-mono text-sm"
              />
            </div>

            <div>
              <label htmlFor="f-author" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Pembuat
              </label>
              <input
                id="f-author"
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="reneo-field min-h-[40px] w-full px-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="f-status" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Status
              </label>
              <select
                id="f-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "published" | "draft" })}
                className="reneo-field min-h-[40px] w-full px-2.5 text-sm"
              >
                <option value="published">Terbit (Publik)</option>
                <option value="draft">Draf (Privat)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="f-tags" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Tag (pisahkan dengan koma)
              </label>
              <input
                id="f-tags"
                type="text"
                value={form.tagsText}
                onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                placeholder="penawaran, pdf, bisnis"
                className="reneo-field min-h-[40px] w-full px-3 font-mono text-xs"
              />
            </div>

            <div className="flex flex-col justify-end gap-1.5 pb-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                <input
                  type="checkbox"
                  checked={form.is_official}
                  onChange={(e) => setForm({ ...form, is_official: e.target.checked })}
                />
                Tandai sebagai Official Reneo
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Tandai sebagai skill unggulan di galeri
              </label>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
              Kompatibilitas Agent
            </span>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AGENTS.map((agent) => {
                const checked = form.compatible_agents.includes(agent);
                return (
                  <label
                    key={agent}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: checked ? "var(--accent-tint)" : "var(--surface)",
                      borderColor: checked ? "var(--accent-border)" : "var(--border)",
                      color: checked ? "var(--accent-text)" : "var(--ink-body)",
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleAgent(agent)} />
                    {agent}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="f-md" className="text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                Konten SKILL.md
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: editorTab === "write" ? "var(--accent-tint)" : "transparent",
                    borderColor: editorTab === "write" ? "var(--accent-border)" : "var(--border)",
                    color: editorTab === "write" ? "var(--accent-text)" : "var(--ink-muted)",
                  }}
                >
                  Tulis
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: editorTab === "preview" ? "var(--accent-tint)" : "transparent",
                    borderColor: editorTab === "preview" ? "var(--accent-border)" : "var(--border)",
                    color: editorTab === "preview" ? "var(--accent-text)" : "var(--ink-muted)",
                  }}
                >
                  Pratinjau
                </button>
              </div>
            </div>

            {editorTab === "write" ? (
              <textarea
                id="f-md"
                required
                rows={12}
                value={form.skill_markdown}
                onChange={(e) => setForm({ ...form, skill_markdown: e.target.value })}
                className="w-full rounded-[12px] border p-3.5 font-mono text-xs leading-relaxed text-slate-200"
                style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--code-border)" }}
              />
            ) : (
              <div
                className="md-prose max-h-[300px] overflow-y-auto rounded-[12px] border p-4"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                dangerouslySetInnerHTML={{ __html: editorPreviewHtml }}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={() => setEditorOpen(false)} className="reneo-btn-ghost min-h-[40px] px-4 text-sm">
              Batal
            </button>
            <button type="submit" disabled={savingSkill} className="reneo-btn-primary min-h-[40px] px-5 text-sm">
              {savingSkill ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Terbitkan Skill"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supporting Files Modal */}
      <Modal
        open={Boolean(filesSkill)}
        title={`File Pendukung: ${filesSkill?.name || ""}`}
        onClose={() => setFilesSkill(null)}
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-5">
          {fileError && (
            <div
              role="alert"
              className="rounded-[10px] border px-3 py-2 text-xs"
              style={{
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger)",
                color: "var(--danger-text)",
              }}
            >
              {fileError}
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold" style={{ color: "var(--ink-muted)" }}>
              File terlampir saat ini
            </h3>
            {filesLoading ? (
              <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                Memuat file...
              </p>
            ) : skillFiles.length === 0 ? (
              <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                Belum ada file pendukung. Tambahkan skrip, referensi, atau aset di bawah.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {skillFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-[10px] border px-3 py-2 text-xs"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div>
                      <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                        {f.relative_path}
                      </span>
                      <span className="ml-2 font-mono" style={{ color: "var(--ink-muted)" }}>
                        ({(f.size_bytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSupportFile(f.id)}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" }}
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSaveSupportFile} className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                Tambah atau Perbarui File Pendukung
              </h3>
              <label
                htmlFor="upload-support-file"
                className="reneo-btn-ghost inline-flex min-h-[34px] items-center gap-1.5 px-3 text-xs font-semibold"
                style={{ color: "var(--accent-text)" }}
              >
                <Upload size={13} strokeWidth={1.75} aria-hidden="true" />
                Unggah dari perangkat
                <input id="upload-support-file" type="file" onChange={handleUploadLocalSupportFile} className="sr-only" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sf-path" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                  Path relatif dalam folder skill
                </label>
                <input
                  id="sf-path"
                  type="text"
                  required
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="scripts/render_pdf.py"
                  className="reneo-field min-h-[40px] w-full px-3 font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="sf-mime" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                  Tipe MIME
                </label>
                <input
                  id="sf-mime"
                  type="text"
                  value={newFileMime}
                  onChange={(e) => setNewFileMime(e.target.value)}
                  className="reneo-field min-h-[40px] w-full px-3 font-mono text-xs"
                />
              </div>
            </div>

            {newFileBinary ? (
              <p
                className="rounded-[10px] border p-3 text-xs"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-body)" }}
              >
                File biner siap diunggah (tersimpan dalam format base64 dan otomatis diekstrak normal di dalam paket ZIP).
              </p>
            ) : (
              <div>
                <label htmlFor="sf-content" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                  Isi File
                </label>
                <textarea
                  id="sf-content"
                  rows={7}
                  required
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Tempelkan isi skrip atau dokumentasi referensi..."
                  className="w-full rounded-[12px] border p-3 font-mono text-xs text-slate-200"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--code-border)" }}
                />
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={savingFile} className="reneo-btn-primary min-h-[40px] px-4 text-sm">
                {savingFile ? "Menyimpan file..." : "Simpan File Pendukung"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Hapus Skill"
        onClose={() => setDeleteTarget(null)}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink-body)" }}>
          Anda yakin ingin menghapus skill <strong style={{ color: "var(--ink)" }}>{deleteTarget?.name}</strong> beserta
          seluruh file pendukungnya? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="reneo-btn-ghost min-h-[40px] px-4 text-sm">
            Batal
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleConfirmDelete()}
            className="min-h-[40px] rounded-[10px] px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--danger)", color: "#ffffff" }}
          >
            {deleting ? "Menghapus..." : "Hapus Permanen"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
