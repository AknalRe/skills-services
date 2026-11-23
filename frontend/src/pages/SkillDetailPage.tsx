import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
        <div
          role="status"
          className="rounded-lg border p-8 text-center text-sm"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--ink-muted)",
          }}
        >
          Memuat dokumentasi skill...
        </div>
      </main>
    );
  }

  if (error || !skill) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div
          role="alert"
          className="rounded-lg border p-6"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            Skill tidak tersedia
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-body)" }}>
            {error || "Skill yang diminta tidak ditemukan atau masih berstatus draf."}
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-[40px] items-center rounded-md px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--brand)", color: "var(--brand-ink)" }}
          >
            Kembali ke Galeri Skill
          </Link>
        </div>
      </main>
    );
  }

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0] || null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm">
        <Link to="/" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Galeri Skill
        </Link>
        <span className="mx-2" style={{ color: "var(--ink-muted)" }}>
          /
        </span>
        <span className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
          {skill.slug}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="border-b pb-6" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className="rounded border px-2 py-0.5 font-semibold"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--ink-body)",
                }}
              >
                {skill.category_name || "Umum"}
              </span>
              <span className="font-mono" style={{ color: "var(--ink-muted)" }}>
                v{skill.version}
              </span>
              <span style={{ color: "var(--ink-muted)" }}>Oleh {skill.author}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--ink)" }}>
              {skill.name}
            </h1>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--ink-body)" }}>
              {skill.summary}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-b pb-3" role="tablist" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "preview"}
              onClick={() => setActiveTab("preview")}
              className="min-h-[40px] rounded-md px-3.5 text-sm font-semibold"
              style={{
                backgroundColor: activeTab === "preview" ? "var(--accent-tint)" : "transparent",
                color: activeTab === "preview" ? "var(--accent)" : "var(--ink-body)",
              }}
            >
              Pratinjau SKILL.md
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "raw"}
              onClick={() => setActiveTab("raw")}
              className="min-h-[40px] rounded-md px-3.5 text-sm font-semibold"
              style={{
                backgroundColor: activeTab === "raw" ? "var(--accent-tint)" : "transparent",
                color: activeTab === "raw" ? "var(--accent)" : "var(--ink-body)",
              }}
            >
              Markdown Mentah
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "files"}
              onClick={() => setActiveTab("files")}
              className="min-h-[40px] rounded-md px-3.5 text-sm font-semibold"
              style={{
                backgroundColor: activeTab === "files" ? "var(--accent-tint)" : "transparent",
                color: activeTab === "files" ? "var(--accent)" : "var(--ink-body)",
              }}
            >
              File Pendukung ({files.length})
            </button>
          </div>

          <div className="mt-5">
            {activeTab === "preview" && (
              <div
                className="md-prose rounded-lg border p-6"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                }}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            )}

            {activeTab === "raw" && (
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--code-bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void copyText("raw", skill.skill_markdown || "")}
                    className="min-h-[36px] rounded-md border px-3 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--bg)",
                      borderColor: "var(--border)",
                      color: "var(--ink)",
                    }}
                  >
                    {copiedKey === "raw" ? "Tersalin" : "Salin SKILL.md"}
                  </button>
                </div>
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed" style={{ color: "var(--ink)" }}>
                  <code>{skill.skill_markdown}</code>
                </pre>
              </div>
            )}

            {activeTab === "files" && (
              <div>
                {files.length === 0 ? (
                  <div
                    className="rounded-lg border p-8 text-center text-sm"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--ink-muted)",
                    }}
                  >
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
                            className="w-full rounded-md border px-3 py-2.5 text-left"
                            style={{
                              backgroundColor: active ? "var(--accent-tint)" : "var(--surface)",
                              borderColor: active ? "var(--accent)" : "var(--border)",
                              color: active ? "var(--accent)" : "var(--ink)",
                            }}
                          >
                            <div className="truncate font-mono text-xs font-semibold">{f.relative_path}</div>
                            <div className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                              {(f.size_bytes / 1024).toFixed(1)} KB
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="rounded-lg border p-4 sm:col-span-8"
                      style={{
                        backgroundColor: "var(--code-bg)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {selectedFile && (
                        <>
                          <div className="mb-2 flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                            <span className="font-mono text-xs font-semibold" style={{ color: "var(--ink)" }}>
                              {selectedFile.relative_path}
                            </span>
                            <span className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
                              {selectedFile.mime_type}
                            </span>
                          </div>
                          {selectedFile.is_binary ? (
                            <p className="py-6 text-sm" style={{ color: "var(--ink-muted)" }}>
                              File biner ({(selectedFile.size_bytes / 1024).toFixed(1)} KB). Unduh paket ZIP untuk
                              mengambil file ini.
                            </p>
                          ) : (
                            <pre className="max-h-[420px] overflow-auto font-mono text-xs leading-relaxed" style={{ color: "var(--ink)" }}>
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
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <div
            className="rounded-lg border p-5"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              Pasang Skill
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Unduh arsip ZIP lengkap (berisi SKILL.md dan seluruh file pendukung) atau salin perintah terminal di bawah.
            </p>

            <a
              href={zipUrl}
              className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-md px-4 text-sm font-semibold no-underline"
              style={{
                backgroundColor: "var(--accent)",
                color: "#ffffff",
              }}
            >
              Unduh Paket (.zip)
            </a>

            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 flex min-h-[42px] w-full items-center justify-center rounded-md border px-4 text-sm font-medium no-underline"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            >
              Buka SKILL.md Mentah
            </a>

            <div className="mt-5 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                    PowerShell (Windows)
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyText("ps", psCommand)}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {copiedKey === "ps" ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <pre
                  className="overflow-x-auto rounded border p-2.5 font-mono text-[11px]"
                  style={{
                    backgroundColor: "var(--code-bg)",
                    borderColor: "var(--border)",
                    color: "var(--ink)",
                  }}
                >
                  <code>{psCommand}</code>
                </pre>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
                    Bash (Linux / macOS)
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyText("bash", bashCommand)}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {copiedKey === "bash" ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <pre
                  className="overflow-x-auto rounded border p-2.5 font-mono text-[11px]"
                  style={{
                    backgroundColor: "var(--code-bg)",
                    borderColor: "var(--border)",
                    color: "var(--ink)",
                  }}
                >
                  <code>{bashCommand}</code>
                </pre>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border p-5"
            style={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border)",
            }}
          >
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
                    className="rounded border px-2 py-0.5 text-xs"
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
                      className="rounded px-2 py-0.5 font-mono text-xs"
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
