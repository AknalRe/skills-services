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
      return <BookOpen size={17} strokeWidth={1.75} aria-hidden="true" />;
    case "bisnis-penawaran":
      return <FolderKanban size={17} strokeWidth={1.75} aria-hidden="true" />;
    case "engineering":
      return <Code2 size={17} strokeWidth={1.75} aria-hidden="true" />;
    default:
      return <Wrench size={17} strokeWidth={1.75} aria-hidden="true" />;
  }
}

export function SkillCard({ skill, layout = "grid" }: SkillCardProps) {
  const downloadHref = withBasePath(`/api/skills/${encodeURIComponent(skill.slug)}/download`);

  if (layout === "list") {
    return (
      <article className="reneo-card reneo-card--interactive flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
            style={{
              backgroundColor: skill.featured ? "var(--accent-tint)" : "var(--surface)",
              color: skill.featured ? "var(--accent-text)" : "var(--ink-body)",
            }}
          >
            {renderCategoryGlyph(skill.category_slug)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                <Link to={`/skills/${skill.slug}`} className="no-underline hover:underline">
                  {skill.name}
                </Link>
              </h2>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
                style={{ backgroundColor: "var(--surface)", color: "var(--ink-muted)" }}
              >
                v{skill.version}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: "var(--accent-tint)", color: "var(--accent-text)" }}
              >
                {skill.category_name || "Umum"}
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs leading-relaxed" style={{ color: "var(--ink-body)" }}>
              {skill.summary}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
              <span>{skill.slug}</span>
              <span>{skill.download_count} unduhan</span>
              {skill.file_count > 0 && <span>{skill.file_count} file</span>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={downloadHref}
            aria-label={`Unduh paket ${skill.name}`}
            className="reneo-btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-3 text-xs font-semibold no-underline"
          >
            <Download size={13} strokeWidth={1.75} aria-hidden="true" />
            ZIP
          </a>
          <Link
            to={`/skills/${skill.slug}`}
            className="reneo-btn-primary inline-flex min-h-[36px] items-center px-3.5 text-xs no-underline"
          >
            Buka Detail
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      className="reneo-card reneo-card--interactive flex flex-col justify-between p-5"
      style={{
        borderColor: skill.featured ? "var(--accent-border)" : undefined,
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
              style={{
                backgroundColor: skill.featured ? "var(--accent-tint)" : "var(--surface)",
                color: skill.featured ? "var(--accent-text)" : "var(--ink-body)",
              }}
            >
              {renderCategoryGlyph(skill.category_slug)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                <Link to={`/skills/${skill.slug}`} className="no-underline hover:underline">
                  {skill.name}
                </Link>
              </h2>
              <p className="truncate font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                {skill.slug}
              </p>
            </div>
          </div>

          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--ink-muted)",
            }}
          >
            v{skill.version}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: "var(--accent-tint)",
              color: "var(--accent-text)",
            }}
          >
            {skill.category_name || "Umum"}
          </span>
          {skill.featured && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: "var(--emerald-bg)",
                color: "var(--emerald-text)",
              }}
            >
              <span className="status-dot" style={{ backgroundColor: "var(--emerald)" }} aria-hidden="true" />
              Unggulan
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed" style={{ color: "var(--ink-body)" }}>
          {skill.summary}
        </p>

        {skill.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {skill.tags.slice(0, 4).map((tag) => (
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
        )}
      </div>

      <div
        className="mt-5 flex items-center justify-between gap-2 border-t pt-3.5"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-muted)" }}>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Download size={12} strokeWidth={1.75} aria-hidden="true" />
            {skill.download_count}
          </span>
          {skill.file_count > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <FileCode2 size={12} strokeWidth={1.75} aria-hidden="true" />
              {skill.file_count} file
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={downloadHref}
            aria-label={`Unduh ZIP ${skill.name}`}
            className="reneo-btn-ghost inline-flex min-h-[32px] items-center gap-1 px-2.5 text-xs font-semibold no-underline"
          >
            <Download size={12} strokeWidth={1.75} aria-hidden="true" />
            ZIP
          </a>
          <Link
            to={`/skills/${skill.slug}`}
            className="inline-flex min-h-[32px] items-center rounded-[9px] px-3 text-xs font-semibold no-underline transition-colors"
            style={{
              backgroundColor: "var(--accent-tint)",
              color: "var(--accent-text)",
            }}
          >
            Buka Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
