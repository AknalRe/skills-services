import { Link } from "react-router-dom";
import { BookOpen, Code2, Download, FileCode2, FolderKanban, Wrench } from "lucide-react";
import { withBasePath } from "../lib/basePath";
import type { Skill } from "../types";

interface SkillCardProps {
  skill: Skill;
  layout?: "grid" | "list";
}

function renderCategoryGlyph(categorySlug?: string | null) {
  switch (categorySlug) {
    case "desain-ui":
      return <BookOpen size={16} strokeWidth={1.75} aria-hidden="true" />;
    case "bisnis-penawaran":
      return <FolderKanban size={16} strokeWidth={1.75} aria-hidden="true" />;
    case "engineering":
      return <Code2 size={16} strokeWidth={1.75} aria-hidden="true" />;
    default:
      return <Wrench size={16} strokeWidth={1.75} aria-hidden="true" />;
  }
}

export function SkillCard({ skill, layout = "grid" }: SkillCardProps) {
  const downloadHref = withBasePath(`/api/skills/${encodeURIComponent(skill.slug)}/download`);

  if (layout === "list") {
    return (
      <article className="flex flex-col justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-slate-500/[0.04] sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: skill.featured ? "var(--accent-tint)" : "var(--surface)",
              color: skill.featured ? "var(--accent-text)" : "var(--ink-muted)",
            }}
          >
            {renderCategoryGlyph(skill.category_slug)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 className="truncate text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                <Link to={`/skills/${skill.slug}`} className="no-underline hover:underline">
                  {skill.name}
                </Link>
              </h2>
              {skill.is_official && (
                <span
                  className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                  style={{
                    backgroundColor: "var(--accent-tint)",
                    borderColor: "var(--accent-border)",
                    color: "var(--accent-text)",
                  }}
                >
                  Official Reneo
                </span>
              )}
              <span className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                v{skill.version}
              </span>
              <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                · {skill.category_name || "Umum"}
              </span>
              {skill.featured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--emerald-text)" }}>
                  <span className="status-dot" style={{ backgroundColor: "var(--emerald)" }} aria-hidden="true" />
                  Unggulan
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed" style={{ color: "var(--ink-body)" }}>
              {skill.summary}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
              <span>{skill.slug}</span>
              <span>{skill.download_count} unduhan</span>
              {skill.file_count > 0 && <span>{skill.file_count} file</span>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={downloadHref}
            aria-label={`Unduh paket ${skill.name}`}
            className="reneo-btn-ghost inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium no-underline"
          >
            <Download size={12} strokeWidth={1.75} aria-hidden="true" />
            ZIP
          </a>
          <Link
            to={`/skills/${skill.slug}`}
            className="reneo-btn-secondary inline-flex h-8 items-center px-3 text-xs no-underline"
          >
            Buka Detail
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="reneo-card reneo-card--interactive flex flex-col justify-between p-4">
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: skill.featured ? "var(--accent-tint)" : "var(--surface)",
                color: skill.featured ? "var(--accent-text)" : "var(--ink-muted)",
              }}
            >
              {renderCategoryGlyph(skill.category_slug)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-[15px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                  <Link to={`/skills/${skill.slug}`} className="no-underline hover:underline">
                    {skill.name}
                  </Link>
                </h2>
                {skill.is_official && (
                  <span
                    className="inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                    style={{
                      backgroundColor: "var(--accent-tint)",
                      borderColor: "var(--accent-border)",
                      color: "var(--accent-text)",
                    }}
                  >
                    Official Reneo
                  </span>
                )}
              </div>
              <p className="truncate font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                {skill.slug}
              </p>
            </div>
          </div>

          <span className="shrink-0 font-mono text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>
            v{skill.version}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium">
          <span style={{ color: "var(--accent-text)" }}>{skill.category_name || "Umum"}</span>
          {skill.featured && (
            <>
              <span style={{ color: "var(--ink-muted)" }} aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1" style={{ color: "var(--emerald-text)" }}>
                <span className="status-dot" style={{ backgroundColor: "var(--emerald)" }} aria-hidden="true" />
                Unggulan
              </span>
            </>
          )}
        </div>

        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed" style={{ color: "var(--ink-body)" }}>
          {skill.summary}
        </p>

        {skill.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
            {skill.tags.slice(0, 4).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div
        className="mt-4 flex items-center justify-between gap-2 border-t pt-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
          <span className="inline-flex items-center gap-1">
            <Download size={12} strokeWidth={1.75} aria-hidden="true" />
            {skill.download_count}
          </span>
          {skill.file_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <FileCode2 size={12} strokeWidth={1.75} aria-hidden="true" />
              {skill.file_count} file
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={downloadHref}
            aria-label={`Unduh ZIP ${skill.name}`}
            className="reneo-btn-ghost inline-flex h-8 items-center gap-1 px-2.5 text-xs font-medium no-underline"
          >
            <Download size={12} strokeWidth={1.75} aria-hidden="true" />
            ZIP
          </a>
          <Link
            to={`/skills/${skill.slug}`}
            className="reneo-btn-secondary inline-flex h-8 items-center px-3 text-xs no-underline"
          >
            Buka Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
