import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layers, LogOut, Menu, Moon, Settings2, Sun, X } from "lucide-react";
import { withBasePath } from "../lib/basePath";
import type { User } from "../types";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  user: User | null;
  onLogout: () => void;
}

export function Header({ theme, onToggleTheme, user, onLogout }: HeaderProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const isGallery = location.pathname === "/" || location.pathname.startsWith("/skills/");
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: "var(--header-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <img
            src={withBasePath("/logo.svg")}
            alt="Reneo Skills"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Reneo Skills
            </span>
            <span className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
              reneo.my.id
            </span>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1.5 sm:flex">
          <Link
            to="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold no-underline transition-colors"
            style={{
              backgroundColor: isGallery ? "var(--accent-tint)" : "transparent",
              color: isGallery ? "var(--accent-text)" : "var(--ink-body)",
            }}
          >
            <Layers size={14} strokeWidth={1.75} aria-hidden="true" />
            Galeri Skill
          </Link>
          <Link
            to="/admin"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold no-underline transition-colors"
            style={{
              backgroundColor: isAdmin ? "var(--accent-tint)" : "transparent",
              color: isAdmin ? "var(--accent-text)" : "var(--ink-body)",
            }}
          >
            <Settings2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Panel Admin
          </Link>

          <span className="mx-1 h-4 w-px" style={{ backgroundColor: "var(--border)" }} aria-hidden="true" />

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
            className="reneo-btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-xs font-medium"
          >
            {theme === "light" ? (
              <>
                <Moon size={14} strokeWidth={1.75} aria-hidden="true" />
                Gelap
              </>
            ) : (
              <>
                <Sun size={14} strokeWidth={1.75} aria-hidden="true" />
                Terang
              </>
            )}
          </button>

          {user && (
            <button
              type="button"
              onClick={onLogout}
              className="reneo-btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-xs font-medium"
              style={{ color: "var(--danger-text)" }}
            >
              <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
              Keluar
            </button>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-panel"
          aria-label="Buka menu navigasi"
          className="reneo-btn-ghost inline-flex h-10 w-10 items-center justify-center sm:hidden"
        >
          {mobileOpen ? <X size={18} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={18} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="border-t px-4 py-3 sm:hidden"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-elevated)",
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Link
              to="/"
              className="flex min-h-[42px] items-center gap-2 rounded-lg px-3 text-sm font-semibold no-underline"
              style={{
                backgroundColor: isGallery ? "var(--accent-tint)" : "transparent",
                color: isGallery ? "var(--accent-text)" : "var(--ink)",
              }}
            >
              <Layers size={16} strokeWidth={1.75} aria-hidden="true" />
              Galeri Skill
            </Link>
            <Link
              to="/admin"
              className="flex min-h-[42px] items-center gap-2 rounded-lg px-3 text-sm font-semibold no-underline"
              style={{
                backgroundColor: isAdmin ? "var(--accent-tint)" : "transparent",
                color: isAdmin ? "var(--accent-text)" : "var(--ink)",
              }}
            >
              <Settings2 size={16} strokeWidth={1.75} aria-hidden="true" />
              Panel Admin
            </Link>
            <button
              type="button"
              onClick={onToggleTheme}
              className="reneo-btn-ghost flex min-h-[42px] items-center gap-2 px-3 text-left text-sm font-medium"
            >
              {theme === "light" ? <Moon size={16} strokeWidth={1.75} aria-hidden="true" /> : <Sun size={16} strokeWidth={1.75} aria-hidden="true" />}
              {theme === "light" ? "Ubah ke Mode Gelap" : "Ubah ke Mode Terang"}
            </button>
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="reneo-btn-ghost flex min-h-[42px] items-center gap-2 px-3 text-left text-sm font-medium"
                style={{ color: "var(--danger-text)" }}
              >
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                Keluar ({user.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
