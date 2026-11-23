import { useCallback, useEffect, useState } from "react";
import { Check, Copy, LayoutGrid, List, RefreshCw, Search, Terminal } from "lucide-react";
import { api } from "../lib/api";
import { withBasePath } from "../lib/basePath";
import type { Category, PublicStats, Skill } from "../types";
import { SkillCard } from "../components/SkillCard";

const AGENT_OPTIONS = ["Antigravity", "Claude Code", "Codex", "Cursor", "Cline", "Gemini CLI"];

export function GalleryPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeAgent, setActiveAgent] = useState("");
  const [sort, setSort] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedQuick, setCopiedQuick] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [skillsRes, catRes] = await Promise.all([
        api.listPublicSkills({
          q: search.trim() || undefined,
          category: activeCategory || undefined,
          agent: activeAgent || undefined,
          sort,
        }),
        api.listCategories(),
      ]);
      setSkills(skillsRes.skills);
      setStats(skillsRes.stats);
      setCategories(catRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar skill.");
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeAgent, sort]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const hasFilters = Boolean(search.trim() || activeCategory || activeAgent);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("");
    setActiveAgent("");
    setSort("featured");
  };

  const featuredSlug = skills[0]?.slug || "reneo-penawaran";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const quickInstallCmd = `curl -fsSL "${origin}${withBasePath(`/api/skills/${featuredSlug}/download`)}" -o /tmp/${featuredSlug}.zip && unzip -o /tmp/${featuredSlug}.zip -d ~/.gemini/config/skills`;

  const copyQuick = async () => {
    try {
      await navigator.clipboard.writeText(quickInstallCmd);
      setCopiedQuick(true);
      window.setTimeout(() => setCopiedQuick(false), 1800);
    } catch {
      setCopiedQuick(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
      {/* Asymmetric hero header + live stats & quick install snippet */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <h1 className="text-3xl font-bold tracking-tight sm:text-[34px]" style={{ color: "var(--ink)" }}>
            Galeri Skill Agent Reneo
          </h1>
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--ink-body)" }}>
            Katalog terpusat untuk menyimpan, meninjau instruksi <code className="font-mono text-xs">SKILL.md</code>,
            dan mengunduh paket skill lengkap beserta skrip pendukung untuk Antigravity, Claude Code, Codex, dan
            agent coding lainnya.
          </p>

          {stats && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="reneo-card flex items-center gap-3 px-4 py-2.5">
                <span className="status-dot" style={{ backgroundColor: "var(--emerald)" }} aria-hidden="true" />
                <div>
                  <div className="font-mono text-base font-bold leading-none" style={{ color: "var(--ink)" }}>
                    {stats.total_published}
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    Skill terbit
                  </div>
                </div>
              </div>
              <div className="reneo-card flex items-center gap-3 px-4 py-2.5">
                <div>
                  <div className="font-mono text-base font-bold leading-none" style={{ color: "var(--ink)" }}>
                    {stats.total_downloads}
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    Total unduhan
                  </div>
                </div>
              </div>
              <div className="reneo-card flex items-center gap-3 px-4 py-2.5">
                <div>
                  <div className="font-mono text-base font-bold leading-none" style={{ color: "var(--ink)" }}>
                    {categories.length}
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    Kategori aktif
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="overflow-hidden rounded-[14px] border lg:col-span-5"
          style={{
            backgroundColor: "var(--code-bg)",
            borderColor: "var(--code-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2.5"
            style={{ borderColor: "var(--code-border)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Terminal size={13} strokeWidth={1.75} aria-hidden="true" />
              <span className="font-mono">Pasang cepat ({featuredSlug})</span>
            </div>
            <button
              type="button"
              onClick={() => void copyQuick()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              {copiedQuick ? (
                <>
                  <Check size={12} strokeWidth={2} aria-hidden="true" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={1.75} aria-hidden="true" />
                  Salin
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-slate-200">
            <code>{quickInstallCmd}</code>
          </pre>
        </div>
      </section>

      {/* Unified Reneo filter toolbar */}
      <section aria-label="Filter dan pencarian skill" className="reneo-card mt-7 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <label htmlFor="skill-search" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
              Cari skill, tag, atau slug
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
                id="skill-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari penawaran, anti-slop, linux..."
                className="reneo-field min-h-[40px] w-full pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="agent-filter" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
              Kompatibilitas agent
            </label>
            <select
              id="agent-filter"
              value={activeAgent}
              onChange={(e) => setActiveAgent(e.target.value)}
              className="reneo-field min-h-[40px] w-full px-3 text-sm"
            >
              <option value="">Semua agent</option>
              {AGENT_OPTIONS.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sort-filter" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
              Urutkan
            </label>
            <select
              id="sort-filter"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="reneo-field min-h-[40px] w-full px-3 text-sm"
            >
              <option value="featured">Unggulan</option>
              <option value="downloads">Terbanyak</option>
              <option value="newest">Terbaru</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-1.5 md:col-span-2">
            <div
              className="inline-flex rounded-[10px] border p-0.5"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              role="group"
              aria-label="Mode tampilan"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Tampilan kartu"
                aria-pressed={viewMode === "grid"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                style={{
                  backgroundColor: viewMode === "grid" ? "var(--surface-elevated)" : "transparent",
                  color: viewMode === "grid" ? "var(--accent-text)" : "var(--ink-muted)",
                }}
              >
                <LayoutGrid size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Tampilan daftar"
                aria-pressed={viewMode === "list"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                style={{
                  backgroundColor: viewMode === "list" ? "var(--surface-elevated)" : "transparent",
                  color: viewMode === "list" ? "var(--accent-text)" : "var(--ink-muted)",
                }}
              >
                <List size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              aria-label="Muat ulang daftar skill"
              className="reneo-btn-ghost inline-flex h-10 w-10 items-center justify-center"
            >
              <RefreshCw size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t pt-3.5" role="group" aria-label="Filter kategori" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            className="min-h-[32px] rounded-full px-3 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: activeCategory === "" ? "var(--accent)" : "var(--surface)",
              color: activeCategory === "" ? "#ffffff" : "var(--ink-body)",
            }}
          >
            Semua kategori
          </button>
          {categories.map((cat) => {
            const active = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className="min-h-[32px] rounded-full px-3 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: active ? "var(--accent)" : "var(--surface)",
                  color: active ? "#ffffff" : "var(--ink-body)",
                }}
              >
                {cat.name} ({cat.published_count ?? 0})
              </button>
            );
          })}
        </div>
      </section>

      {/* Catalog content */}
      <section aria-label="Daftar skill" className="mt-6">
        {loading && (
          <div role="status" className="reneo-card p-10 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
            Memuat katalog skill...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-[14px] border p-6"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger-text)",
            }}
          >
            <p className="text-sm font-semibold">Gagal memuat katalog skill</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-4 min-h-[38px] rounded-[10px] border px-4 text-xs font-semibold"
              style={{
                backgroundColor: "var(--surface-elevated)",
                borderColor: "var(--danger)",
                color: "var(--danger-text)",
              }}
            >
              Muat ulang daftar
            </button>
          </div>
        )}

        {!loading && !error && skills.length === 0 && (
          <div className="reneo-card p-10 text-center">
            <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>
              {hasFilters ? "Tidak ada skill yang cocok dengan filter" : "Belum ada skill yang dipublikasikan"}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              {hasFilters
                ? "Ubah kata kunci pencarian atau hapus filter kategori dan agent untuk melihat seluruh katalog."
                : "Masuk ke Panel Admin untuk menambahkan dan mempublikasikan skill pertama."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="reneo-btn-primary mt-4 min-h-[40px] px-4 text-sm"
              >
                Reset semua filter
              </button>
            )}
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} layout="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} layout="list" />
              ))}
            </div>
          )
        )}
      </section>
    </main>
  );
}
