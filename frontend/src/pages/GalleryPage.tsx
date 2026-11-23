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
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-8">
      {/* Header + inline metrics + compact CLI install bar */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[32px]" style={{ color: "var(--ink)" }}>
            Galeri Skill Agent Reneo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--ink-body)" }}>
            Katalog terpusat untuk meninjau instruksi <code className="font-mono text-xs">SKILL.md</code> dan
            mengunduh paket skill beserta skrip pendukung untuk Antigravity, Claude Code, Codex, dan agent lainnya.
          </p>

          {stats && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--ink-muted)" }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="status-dot" style={{ backgroundColor: "var(--emerald)" }} aria-hidden="true" />
                <strong className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                  {stats.total_published}
                </strong>{" "}
                skill terbit
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                  {stats.total_downloads}
                </strong>{" "}
                total unduhan
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                  {categories.length}
                </strong>{" "}
                kategori
              </span>
            </div>
          )}
        </div>

        <div
          className="overflow-hidden rounded-[10px] border lg:col-span-5"
          style={{
            backgroundColor: "var(--code-bg)",
            borderColor: "var(--code-border)",
          }}
        >
          <div
            className="flex items-center justify-between border-b px-3.5 py-2"
            style={{ borderColor: "var(--code-border)" }}
          >
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Terminal size={12} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
              <span className="truncate font-mono">Pasang cepat: {featuredSlug}</span>
            </div>
            <button
              type="button"
              onClick={() => void copyQuick()}
              className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/70 px-2 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              {copiedQuick ? (
                <>
                  <Check size={11} strokeWidth={2} aria-hidden="true" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy size={11} strokeWidth={1.75} aria-hidden="true" />
                  Salin
                </>
              )}
            </button>
          </div>
          <pre className="reneo-code-scroll overflow-x-auto px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-slate-200">
            <code>{quickInstallCmd}</code>
          </pre>
        </div>
      </section>

      {/* Flat borderless filter toolbar */}
      <section
        aria-label="Filter dan pencarian skill"
        className="mt-7 border-y py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <label htmlFor="skill-search" className="sr-only">
              Cari skill, tag, atau slug
            </label>
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
              placeholder="Cari skill, tag, atau slug..."
              className="reneo-field h-9 w-full pl-9 pr-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label htmlFor="agent-filter" className="sr-only">
                Kompatibilitas agent
              </label>
              <select
                id="agent-filter"
                value={activeAgent}
                onChange={(e) => setActiveAgent(e.target.value)}
                className="reneo-field reneo-select h-9 pl-3 text-xs font-medium"
              >
                <option value="">Semua agent</option>
                {AGENT_OPTIONS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-filter" className="sr-only">
                Urutkan skill
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="reneo-field reneo-select h-9 pl-3 text-xs font-medium"
              >
                <option value="featured">Unggulan</option>
                <option value="downloads">Terbanyak</option>
                <option value="newest">Terbaru</option>
                <option value="name">Nama (A-Z)</option>
              </select>
            </div>

            <div
              className="inline-flex h-9 items-center rounded-lg border p-0.5"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              role="group"
              aria-label="Mode tampilan"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Tampilan kartu"
                aria-pressed={viewMode === "grid"}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{
                  backgroundColor: viewMode === "grid" ? "var(--surface-elevated)" : "transparent",
                  color: viewMode === "grid" ? "var(--accent-text)" : "var(--ink-muted)",
                }}
              >
                <LayoutGrid size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Tampilan daftar"
                aria-pressed={viewMode === "list"}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{
                  backgroundColor: viewMode === "list" ? "var(--surface-elevated)" : "transparent",
                  color: viewMode === "list" ? "var(--accent-text)" : "var(--ink-muted)",
                }}
              >
                <List size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              aria-label="Muat ulang daftar skill"
              className="reneo-btn-ghost inline-flex h-9 w-9 items-center justify-center"
            >
              <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter kategori">
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            className="h-7 rounded-md border px-2.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === "" ? "var(--accent-tint)" : "transparent",
              borderColor: activeCategory === "" ? "var(--accent-border)" : "transparent",
              color: activeCategory === "" ? "var(--accent-text)" : "var(--ink-muted)",
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
                className="h-7 rounded-md border px-2.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--accent-tint)" : "transparent",
                  borderColor: active ? "var(--accent-border)" : "transparent",
                  color: active ? "var(--accent-text)" : "var(--ink-muted)",
                }}
              >
                {cat.name}{" "}
                <span className="font-mono text-[11px] opacity-75">({cat.published_count ?? 0})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Catalog content */}
      <section aria-label="Daftar skill" className="mt-6">
        {loading && (
          <div role="status" className="py-12 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
            Memuat katalog skill...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border p-5"
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
              className="reneo-btn-ghost mt-3 inline-flex h-8 items-center px-3 text-xs font-semibold"
              style={{ borderColor: "var(--danger)", color: "var(--danger-text)" }}
            >
              Muat ulang daftar
            </button>
          </div>
        )}

        {!loading && !error && skills.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
              {hasFilters ? "Tidak ada skill yang cocok dengan filter" : "Belum ada skill yang dipublikasikan"}
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
              {hasFilters
                ? "Ubah kata kunci pencarian atau hapus filter kategori dan agent untuk melihat seluruh katalog."
                : "Masuk ke Panel Admin untuk menambahkan dan mempublikasikan skill pertama."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="reneo-btn-primary mt-4 inline-flex h-9 items-center px-4 text-xs"
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
            <div className="divide-y rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}>
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
