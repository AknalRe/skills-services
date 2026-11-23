import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--ink)" }}>
              Galeri Skill Agent Reneo
            </h1>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--ink-body)" }}>
              Katalog terpusat untuk menyimpan, membaca dokumentasi, dan mengunduh paket skill beserta skrip pendukung
              bagi Antigravity, Claude Code, Codex, dan agent coding lainnya.
            </p>
          </div>

          {stats && (
            <div
              className="flex shrink-0 gap-6 rounded-lg border px-5 py-3.5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <div className="font-mono text-2xl font-bold" style={{ color: "var(--ink)" }}>
                  {stats.total_published}
                </div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Skill tersedia
                </div>
              </div>
              <div className="w-px" style={{ backgroundColor: "var(--border)" }} aria-hidden="true" />
              <div>
                <div className="font-mono text-2xl font-bold" style={{ color: "var(--ink)" }}>
                  {stats.total_downloads}
                </div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Total unduhan
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-label="Filter dan pencarian skill" className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <label htmlFor="skill-search" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
              Cari skill, tag, atau slug
            </label>
            <input
              id="skill-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Contoh: penawaran, anti-slop, linux"
              className="min-h-[44px] w-full rounded-md border px-3.5 text-sm"
              style={{
                backgroundColor: "var(--surface-elevated)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="agent-filter" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
              Kompatibilitas agent
            </label>
            <select
              id="agent-filter"
              value={activeAgent}
              onChange={(e) => setActiveAgent(e.target.value)}
              className="min-h-[44px] w-full rounded-md border px-3 text-sm"
              style={{
                backgroundColor: "var(--surface-elevated)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            >
              <option value="">Semua agent</option>
              {AGENT_OPTIONS.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="sort-filter" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
              Urutkan
            </label>
            <select
              id="sort-filter"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="min-h-[44px] w-full rounded-md border px-3 text-sm"
              style={{
                backgroundColor: "var(--surface-elevated)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            >
              <option value="featured">Unggulan &amp; terbaru</option>
              <option value="downloads">Paling banyak diunduh</option>
              <option value="newest">Terbaru dibuat</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter kategori">
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            className="min-h-[38px] rounded-md border px-3 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: activeCategory === "" ? "var(--brand)" : "var(--surface)",
              borderColor: activeCategory === "" ? "var(--brand)" : "var(--border)",
              color: activeCategory === "" ? "var(--brand-ink)" : "var(--ink-body)",
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
                className="min-h-[38px] rounded-md border px-3 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: active ? "var(--brand)" : "var(--surface)",
                  borderColor: active ? "var(--brand)" : "var(--border)",
                  color: active ? "var(--brand-ink)" : "var(--ink-body)",
                }}
              >
                {cat.name} ({cat.published_count ?? 0})
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Daftar skill" className="mt-8">
        {loading && (
          <div
            role="status"
            className="rounded-lg border p-8 text-center text-sm"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--ink-muted)",
            }}
          >
            Memuat katalog skill dari server...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-lg border p-6"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            <p className="text-sm font-semibold">Gagal memuat katalog skill</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-4 min-h-[40px] rounded-md border px-4 text-xs font-semibold"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--danger)",
                color: "var(--danger)",
              }}
            >
              Muat ulang daftar
            </button>
          </div>
        )}

        {!loading && !error && skills.length === 0 && (
          <div
            className="rounded-lg border p-10 text-center"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
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
                className="mt-4 min-h-[40px] rounded-md px-4 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#ffffff",
                }}
              >
                Reset semua filter
              </button>
            )}
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
