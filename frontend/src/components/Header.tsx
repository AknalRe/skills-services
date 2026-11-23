import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
      className="sticky top-0 z-30 border-b"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <img src="/favicon.svg" alt="Reneo" width={34} height={34} className="rounded-md" />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Reneo Skills
            </span>
            <span className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
              reneo.my.id
            </span>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-2 sm:flex">
          <Link
            to="/"
            className="min-h-[40px] inline-flex items-center rounded-md px-3.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isGallery ? "var(--accent-tint)" : "transparent",
              color: isGallery ? "var(--accent)" : "var(--ink-body)",
            }}
          >
            Galeri Skill
          </Link>
          <Link
            to="/admin"
            className="min-h-[40px] inline-flex items-center rounded-md px-3.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isAdmin ? "var(--accent-tint)" : "transparent",
              color: isAdmin ? "var(--accent)" : "var(--ink-body)",
            }}
          >
            Panel Admin
          </Link>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
            className="min-h-[40px] rounded-md border px-3 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--ink-body)",
            }}
          >
            {theme === "light" ? "Mode Gelap" : "Mode Terang"}
          </button>

          {user && (
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] rounded-md border px-3 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--danger)",
              }}
            >
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
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border px-3 text-sm font-medium sm:hidden"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--ink)",
          }}
        >
          {mobileOpen ? "Tutup" : "Menu"}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="border-t px-4 py-3 sm:hidden"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="min-h-[44px] flex items-center rounded-md px-3 text-sm font-medium"
              style={{
                backgroundColor: isGallery ? "var(--accent-tint)" : "transparent",
                color: isGallery ? "var(--accent)" : "var(--ink)",
              }}
            >
              Galeri Skill
            </Link>
            <Link
              to="/admin"
              className="min-h-[44px] flex items-center rounded-md px-3 text-sm font-medium"
              style={{
                backgroundColor: isAdmin ? "var(--accent-tint)" : "transparent",
                color: isAdmin ? "var(--accent)" : "var(--ink)",
              }}
            >
              Panel Admin
            </Link>
            <button
              type="button"
              onClick={onToggleTheme}
              className="min-h-[44px] rounded-md border px-3 text-left text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--ink)",
              }}
            >
              {theme === "light" ? "Ubah ke Mode Gelap" : "Ubah ke Mode Terang"}
            </button>
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[44px] rounded-md border px-3 text-left text-sm font-medium"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--danger)",
                }}
              >
                Keluar ({user.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
