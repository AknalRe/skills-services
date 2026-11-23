import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
  skill_markdown: "---\nname: nama-skill\ndescription: Jelaskan kapan skill ini dipakai.\n---\n\n# Judul Skill\n\nTuliskan instruksi langkah kerja di sini.\n",
  status: "published",
  featured: false,
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

  // Skill editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<SkillFormState>(EMPTY_FORM);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [savingSkill, setSavingSkill] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Supporting files modal state
  const [filesSkill, setFilesSkill] = useState<Skill | null>(null);
  const [skillFiles, setSkillFiles] = useState<SkillFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [newFileMime, setNewFileMime] = useState("text/plain");
  const [newFileBinary, setNewFileBinary] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savingFile, setSavingFile] = useState(false);

  // Category form state
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
    const isText = file.type.startsWith("text/") || /\.(md|py|sh|ts|tsx|js|json|yaml|yml|css|scss|txt)$/i.test(file.name);
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            Manajemen Skill
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            Tambah, perbarui konten SKILL.md, lampirkan skrip pendukung, dan atur status publikasi galeri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSection("skills")}
            className="min-h-[42px] rounded-md border px-3.5 text-sm font-semibold"
            style={{
              backgroundColor: section === "skills" ? "var(--surface)" : "transparent",
              borderColor: section === "skills" ? "var(--brand)" : "var(--border)",
              color: "var(--ink)",
            }}
          >
            Daftar Skill ({summary?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setSection("categories")}
            className="min-h-[42px] rounded-md border px-3.5 text-sm font-semibold"
            style={{
              backgroundColor: section === "categories" ? "var(--surface)" : "transparent",
              borderColor: section === "categories" ? "var(--brand)" : "var(--border)",
              color: "var(--ink)",
            }}
          >
            Kategori ({categories.length})
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[42px] rounded-md px-4 text-sm font-semibold"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
            }}
          >
            Tambah Skill Baru
          </button>
        </div>
      </div>

      {summary && section === "skills" && (
        <div className="mt-5 flex flex-wrap gap-6 text-sm" style={{ color: "var(--ink-body)" }}>
          <span>
            Terbit: <strong className="font-mono" style={{ color: "var(--ink)" }}>{summary.published}</strong>
          </span>
          <span>
            Draf: <strong className="font-mono" style={{ color: "var(--ink)" }}>{summary.draft}</strong>
          </span>
          <span>
            Total unduhan: <strong className="font-mono" style={{ color: "var(--ink)" }}>{summary.downloads}</strong>
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-md border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--danger-bg)",
            borderColor: "var(--danger)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      {section === "skills" && (
        <section className="mt-5">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <label htmlFor="admin-skill-search" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                Cari di katalog admin
              </label>
              <input
                id="admin-skill-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, slug, atau tag..."
                className="min-h-[42px] w-full rounded-md border px-3 text-sm"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="admin-status-filter" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                Status publikasi
              </label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[42px] w-full rounded-md border px-3 text-sm"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--ink)",
                }}
              >
                <option value="">Semua status</option>
                <option value="published">Terbit</option>
                <option value="draft">Draf</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div
              role="status"
              className="rounded-lg border p-8 text-center text-sm"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--ink-muted)",
              }}
            >
              Memuat data skill...
            </div>
          ) : skills.length === 0 ? (
            <div
              className="rounded-lg border p-8 text-center"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                Belum ada skill pada filter ini.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 min-h-[40px] rounded-md px-4 text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              >
                Buat Skill Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
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
                    <tr
                      key={skill.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        backgroundColor: "var(--surface-elevated)",
                      }}
                    >
                      <td className="px-4 py-3 align-top">
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
                      <td className="px-4 py-3 align-top text-xs" style={{ color: "var(--ink-body)" }}>
                        {skill.category_name || "Umum"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(skill)}
                          className="rounded px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: skill.status === "published" ? "var(--success-bg)" : "var(--warning-bg)",
                            color: skill.status === "published" ? "var(--success)" : "var(--warning)",
                          }}
                        >
                          {skill.status === "published" ? "Terbit" : "Draf"}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs" style={{ color: "var(--ink-body)" }}>
                        {skill.file_count} file / {skill.download_count} unduhan
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          {skill.status === "published" && (
                            <Link
                              to={`/skills/${skill.slug}`}
                              className="inline-flex min-h-[34px] items-center rounded border px-2.5 text-xs font-medium no-underline"
                              style={{ borderColor: "var(--border)", color: "var(--ink-body)" }}
                            >
                              Lihat
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => void openFilesModal(skill)}
                            className="min-h-[34px] rounded border px-2.5 text-xs font-medium"
                            style={{ borderColor: "var(--border)", color: "var(--ink-body)" }}
                          >
                            File ({skill.file_count})
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(skill)}
                            className="min-h-[34px] rounded border px-2.5 text-xs font-semibold"
                            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(skill)}
                            className="min-h-[34px] rounded border px-2.5 text-xs font-semibold"
                            style={{ borderColor: "var(--border)", color: "var(--danger)" }}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {section === "categories" && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div
            className="rounded-lg border p-5 lg:col-span-5"
            style={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border)",
            }}
          >
            <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>
              Tambah Kategori
            </h2>
            {catError && (
              <div
                role="alert"
                className="mt-3 rounded border px-3 py-2 text-xs"
                style={{
                  backgroundColor: "var(--danger-bg)",
                  borderColor: "var(--danger)",
                  color: "var(--danger)",
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
                  className="min-h-[42px] w-full rounded-md border px-3 text-sm"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                  className="w-full rounded-md border p-3 text-sm"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
                />
              </div>
              <button
                type="submit"
                disabled={savingCat}
                className="min-h-[42px] rounded-md px-4 text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              >
                {savingCat ? "Menyimpan..." : "Simpan Kategori"}
              </button>
            </form>
          </div>

          <div className="space-y-2.5 lg:col-span-7">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                }}
              >
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
                  className="min-h-[36px] shrink-0 rounded border px-3 text-xs font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--danger)" }}
                >
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
              className="rounded-md border px-3.5 py-2.5 text-sm"
              style={{
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger)",
                color: "var(--danger)",
              }}
            >
              {formError}
            </div>
          )}

          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3.5 py-2.5"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--ink-body)" }}>
              Sudah punya file SKILL.md di komputer? Impor langsung untuk mengisi otomatis.
            </span>
            <label
              htmlFor="import-skill-md"
              className="inline-flex min-h-[34px] items-center rounded border px-3 text-xs font-semibold"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--accent)" }}
            >
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
                className="min-h-[40px] w-full rounded-md border px-3 text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                className="min-h-[40px] w-full rounded-md border px-3 font-mono text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
              className="w-full rounded-md border p-3 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                className="min-h-[40px] w-full rounded-md border px-2.5 text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                className="min-h-[40px] w-full rounded-md border px-3 font-mono text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                className="min-h-[40px] w-full rounded-md border px-3 text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                className="min-h-[40px] w-full rounded-md border px-2.5 text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                className="min-h-[40px] w-full rounded-md border px-3 font-mono text-xs"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex items-end pb-2">
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
                    className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs"
                    style={{
                      backgroundColor: checked ? "var(--accent-tint)" : "var(--surface)",
                      borderColor: checked ? "var(--accent)" : "var(--border)",
                      color: checked ? "var(--accent)" : "var(--ink-body)",
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
                  className="rounded border px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: editorTab === "write" ? "var(--accent-tint)" : "transparent",
                    borderColor: editorTab === "write" ? "var(--accent)" : "var(--border)",
                    color: editorTab === "write" ? "var(--accent)" : "var(--ink-muted)",
                  }}
                >
                  Tulis
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className="rounded border px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: editorTab === "preview" ? "var(--accent-tint)" : "transparent",
                    borderColor: editorTab === "preview" ? "var(--accent)" : "var(--border)",
                    color: editorTab === "preview" ? "var(--accent)" : "var(--ink-muted)",
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
                className="w-full rounded-md border p-3 font-mono text-xs leading-relaxed"
                style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--ink)" }}
              />
            ) : (
              <div
                className="md-prose max-h-[300px] overflow-y-auto rounded-md border p-4"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                dangerouslySetInnerHTML={{ __html: editorPreviewHtml }}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="min-h-[42px] rounded-md border px-4 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--ink-body)" }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingSkill}
              className="min-h-[42px] rounded-md px-5 text-sm font-semibold"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
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
              className="rounded border px-3 py-2 text-xs"
              style={{
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger)",
                color: "var(--danger)",
              }}
            >
              {fileError}
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
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
                    className="flex items-center justify-between rounded border px-3 py-2 text-xs"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div>
                      <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                        {f.relative_path}
                      </span>
                      <span className="ml-2" style={{ color: "var(--ink-muted)" }}>
                        ({(f.size_bytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSupportFile(f.id)}
                      className="rounded border px-2 py-1 text-xs font-semibold"
                      style={{ borderColor: "var(--border)", color: "var(--danger)" }}
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
                className="inline-flex min-h-[34px] items-center rounded border px-3 text-xs font-semibold"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--accent)" }}
              >
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
                  className="min-h-[40px] w-full rounded-md border px-3 font-mono text-xs"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
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
                  className="min-h-[40px] w-full rounded-md border px-3 font-mono text-xs"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--ink)" }}
                />
              </div>
            </div>

            {newFileBinary ? (
              <p className="rounded border p-3 text-xs" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-body)" }}>
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
                  className="w-full rounded-md border p-3 font-mono text-xs"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--ink)" }}
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingFile}
                className="min-h-[40px] rounded-md px-4 text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              >
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
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="min-h-[40px] rounded-md border px-4 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--ink-body)" }}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleConfirmDelete()}
            className="min-h-[40px] rounded-md px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--danger)", color: "#ffffff" }}
          >
            {deleting ? "Menghapus..." : "Hapus Permanen"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
