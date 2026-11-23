import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Code2, Copy, Download, ExternalLink, FileCode2, FileText } from "lucide-react";
import { api } from "../lib/api";
import { withBasePath } from "../lib/basePath";
import { renderMarkdownToHtml } from "../lib/markdown";
import type { Skill, SkillFile } from "../types";

export function SkillDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [files, setFiles] = useState<SkillFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "raw" | "files">("preview");
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadSkill = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPublicSkill(slug);
      setSkill(res.skill);
      setFiles(res.files);
      if (res.files.length > 0) setSelectedFileId(res.files[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail skill.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadSkill();
  }, [loadSkill]);

  const renderedHtml = useMemo(() => {
    return renderMarkdownToHtml(skill?.skill_markdown || "");
  }, [skill?.skill_markdown]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const zipUrl = skill ? `${origin}${withBasePath(`/api/skills/${skill.slug}/download`)}` : "";
  const rawUrl = skill ? `${origin}${withBasePath(`/api/skills/${skill.slug}/raw`)}` : "";

  const psCommand = skill
    ? `$d="$env:USERPROFILE\\.gemini\\config\\skills"; New-Item -ItemType Directory -Force $d | Out-Null; Invoke-WebRequest "${zipUrl}" -OutFile "$env:TEMP\\${skill.slug}.zip"; Expand-Archive "$env:TEMP\\${skill.slug}.zip" -DestinationPath $d -Force`
    : "";

  const bashCommand = skill
    ? `mkdir -p ~/.gemini/config/skills && curl -fsSL "${zipUrl}" -o /tmp/${skill.slug}.zip && unzip -o /tmp/${skill.slug}.zip -d ~/.gemini/config/skills`
    : "";

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div role="status" className="reneo-card p-10 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
          Memuat dokumentasi skill...
        </div>
      </main>
    );
  }

  if (error || !skill) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div role="alert" className="reneo-card p-6">
          <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            Skill tidak tersedia
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-body)" }}>
            {error || "Skill yang diminta tidak ditemukan atau masih berstatus draf."}
          </p>
          <Link to="/" className="reneo-btn-primary mt-4 inline-flex min-h-[40px] items-center gap-2 px-4 text-sm no-underline">
            <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
            Kembali ke Galeri Skill
          </Link>
        </div>
      </main>
    );
  }

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0] || null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-semibold no-underline hover:underline"
          style={{ color: "var(--accent-text)" }}
        >
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
          Galeri Skill
        </Link>
        <span style={{ color: "var(--ink-muted)" }}>/</span>
        <span className="font-mono" style={{ color: "var(--ink-muted)" }}>
          {skill.slug}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="border-b pb-5" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2.5 flex flex-wrap items-center gap-2 text-xs">
              {skill.is_official && (
                <span
                  className="inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold leading-none"
                  style={{
                    backgroundColor: "var(--accent-tint)",
                    borderColor: "var(--accent-border)",
                    color: "var(--accent-text)",
                  }}
                >
                  Official Reneo
                </span>
              )}
              <span className="font-semibold" style={{ color: "var(--accent-text)" }}>
                {skill.category_name || "Umum"}
              </span>
              <span style={{ color: "var(--ink-muted)" }} aria-hidden="true">·</span>
              <span className="font-mono font-medium" style={{ color: "var(--ink-muted)" }}>
                v{skill.version}
              </span>
              <span style={{ color: "var(--ink-muted)" }} aria-hidden="true">·</span>
              <span style={{ color: "var(--ink-muted)" }}>Oleh {skill.author}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--ink)" }}>
              {skill.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--ink-body)" }}>
              {skill.summary}
            </p>
          </div>

          <div
            className="flex flex-wrap gap-1 border-b pb-2"
            role="tablist"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "preview"}
              onClick={() => setActiveTab("preview")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === "preview" ? "var(--accent-tint)" : "transparent",
                color: activeTab === "preview" ? "var(--accent-text)" : "var(--ink-muted)",
              }}
            >
              <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
              Pratinjau SKILL.md
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "raw"}
              onClick={() => setActiveTab("raw")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === "raw" ? "var(--accent-tint)" : "transparent",
                color: activeTab === "raw" ? "var(--accent-text)" : "var(--ink-muted)",
              }}
            >
              <Code2 size={13} strokeWidth={1.75} aria-hidden="true" />
              Markdown Mentah
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "files"}
              onClick={() => setActiveTab("files")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === "files" ? "var(--accent-tint)" : "transparent",
                color: activeTab === "files" ? "var(--accent-text)" : "var(--ink-muted)",
              }}
            >
              <FileCode2 size={13} strokeWidth={1.75} aria-hidden="true" />
              File Pendukung ({files.length})
            </button>
          </div>

          {activeTab === "preview" && (
            <div className="reneo-card md-prose p-6" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          )}

          {activeTab === "raw" && (
            <div
              className="overflow-hidden rounded-xl border"
              style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--code-border)" }}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-2.5"
                style={{ borderColor: "var(--code-border)" }}
              >
                <span className="font-mono text-xs text-slate-300">SKILL.md</span>
                <button
                  type="button"
                  onClick={() => void copyText("raw", skill.skill_markdown || "")}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  {copiedKey === "raw" ? <Check size={12} strokeWidth={2} aria-hidden="true" /> : <Copy size={12} strokeWidth={1.75} aria-hidden="true" />}
                  {copiedKey === "raw" ? "Tersalin" : "Salin"}
                </button>
              </div>
              <pre className="reneo-code-scroll overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
                <code>{skill.skill_markdown}</code>
              </pre>
            </div>
          )}

          {activeTab === "files" && (
            <div>
              {files.length === 0 ? (
                <div className="reneo-card p-8 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
                  Skill ini hanya terdiri dari file utama SKILL.md tanpa skrip atau aset tambahan.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="space-y-1.5 sm:col-span-4">
                    {files.map((f) => {
                      const active = selectedFile?.id === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFileId(f.id)}
                          className="w-full rounded-[10px] border px-3 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: active ? "var(--accent-tint)" : "var(--surface-elevated)",
                            borderColor: active ? "var(--accent-border)" : "var(--border)",
                            color: active ? "var(--accent-text)" : "var(--ink)",
                          }}
                        >
                          <div className="truncate font-mono text-xs font-semibold">{f.relative_path}</div>
                          <div className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                            {(f.size_bytes / 1024).toFixed(1)} KB
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="overflow-hidden rounded-[14px] border sm:col-span-8"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--code-border)" }}
                  >
                    {selectedFile && (
                      <>
                        <div
                          className="flex items-center justify-between border-b px-4 py-2.5"
                          style={{ borderColor: "var(--code-border)" }}
                        >
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {selectedFile.relative_path}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">{selectedFile.mime_type}</span>
                        </div>
                        {selectedFile.is_binary ? (
                          <p className="p-6 text-sm text-slate-300">
                            File biner ({(selectedFile.size_bytes / 1024).toFixed(1)} KB). Unduh paket ZIP untuk
                            mengambil file ini.
                          </p>
                        ) : (
                          <pre className="reneo-code-scroll max-h-[420px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
                            <code>{selectedFile.content}</code>
                          </pre>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <div className="reneo-card p-5">
            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              Pasang Skill
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Unduh paket ZIP lengkap (SKILL.md dan file pendukung) atau salin perintah terminal di bawah.
            </p>

            <a
              href={zipUrl}
              className="reneo-btn-primary mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-sm no-underline"
            >
              <Download size={15} strokeWidth={1.75} aria-hidden="true" />
              Unduh Paket (.zip)
            </a>

            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="reneo-btn-ghost mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-1.5 px-4 text-xs font-semibold no-underline"
            >
              <ExternalLink size={13} strokeWidth={1.75} aria-hidden="true" />
              Buka SKILL.md Mentah
            </a>

            <div className="mt-5 space-y-3.5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                    PowerShell (Windows)
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyText("ps", psCommand)}
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {copiedKey === "ps" ? <Check size={12} strokeWidth={2} aria-hidden="true" /> : <Copy size={12} strokeWidth={1.75} aria-hidden="true" />}
                    {copiedKey === "ps" ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <pre
                  className="reneo-code-scroll overflow-x-auto rounded-[10px] border p-3 font-mono text-[11px] text-slate-200"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--code-border)" }}
                >
                  <code>{psCommand}</code>
                </pre>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                    Bash (Linux / macOS)
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyText("bash", bashCommand)}
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {copiedKey === "bash" ? <Check size={12} strokeWidth={2} aria-hidden="true" /> : <Copy size={12} strokeWidth={1.75} aria-hidden="true" />}
                    {copiedKey === "bash" ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <pre
                  className="reneo-code-scroll overflow-x-auto rounded-[10px] border p-3 font-mono text-[11px] text-slate-200"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--code-border)" }}
                >
                  <code>{bashCommand}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="reneo-card p-5">
            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              Metadata Paket
            </h2>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-muted)" }}>Slug</dt>
                <dd className="font-mono font-medium" style={{ color: "var(--ink)" }}>
                  {skill.slug}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-muted)" }}>Versi</dt>
                <dd className="font-mono font-medium" style={{ color: "var(--ink)" }}>
                  {skill.version}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-muted)" }}>Total unduhan</dt>
                <dd className="font-mono font-medium" style={{ color: "var(--ink)" }}>
                  {skill.download_count}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--ink-muted)" }}>File pendukung</dt>
                <dd className="font-mono font-medium" style={{ color: "var(--ink)" }}>
                  {files.length}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                Agent yang didukung
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skill.compatible_agents.map((agent) => (
                  <span
                    key={agent}
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--ink-body)",
                    }}
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </div>

            {skill.tags.length > 0 && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                  Tag
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 font-mono text-[11px]"
                      style={{
                        backgroundColor: "var(--surface)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
