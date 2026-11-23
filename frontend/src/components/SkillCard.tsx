import { Link } from "react-router-dom";
import type { Skill } from "../types";

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <article
      className="flex flex-col justify-between rounded-lg border p-5 transition-colors"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: skill.featured ? "var(--accent)" : "var(--border)",
      }}
    >
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className="rounded px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--ink-body)",
              border: "1px solid var(--border)",
            }}
          >
            {skill.category_name || "Umum"}
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
            v{skill.version}
          </span>
        </div>

        <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          <Link to={`/skills/${skill.slug}`} className="hover:underline">
            {skill.name}
          </Link>
        </h2>
        <p className="mt-1 font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
          {skill.slug}
        </p>

        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-body)" }}>
          {skill.summary}
        </p>

        {skill.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {skill.tags.slice(0, 4).map((tag) => (
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
        )}
      </div>

      <div
        className="mt-5 flex items-center justify-between border-t pt-3 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--ink-muted)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span>{skill.download_count} unduhan</span>
          {skill.file_count > 0 && <span>{skill.file_count} file pendukung</span>}
        </div>
        <Link
          to={`/skills/${skill.slug}`}
          className="font-semibold hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Buka detail
        </Link>
      </div>
    </article>
  );
}
