import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { api } from "./lib/api";
import type { User } from "./types";
import { Header } from "./components/Header";
import { GalleryPage } from "./pages/GalleryPage";
import { SkillDetailPage } from "./pages/SkillDetailPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("reneo_skills_theme");
    return saved === "dark" ? "dark" : "light";
  });
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("reneo_skills_theme", theme);
  }, [theme]);

  useEffect(() => {
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          user={user}
          onLogout={() => void handleLogout()}
        />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/skills/:slug" element={<SkillDetailPage />} />
            <Route
              path="/admin"
              element={
                !authChecked ? (
                  <main className="mx-auto max-w-6xl px-4 py-12 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
                    Memeriksa sesi admin...
                  </main>
                ) : user ? (
                  <AdminDashboardPage />
                ) : (
                  <AdminLoginPage onSuccess={(u) => setUser(u)} />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <footer className="border-t py-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-xs sm:px-6" style={{ color: "var(--ink-muted)" }}>
            <span>Reneo Skills Registry</span>
            <a href="https://reneo.my.id" target="_blank" rel="noopener noreferrer" className="font-mono hover:underline" style={{ color: "var(--ink-body)" }}>
              reneo.my.id
            </a>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
