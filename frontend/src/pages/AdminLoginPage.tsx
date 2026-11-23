import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import type { User } from "../types";

interface AdminLoginPageProps {
  onSuccess: (user: User) => void;
}

export function AdminLoginPage({ onSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Masukkan email dan kata sandi admin.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke panel admin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div
        className="rounded-lg border p-6 sm:p-7"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "var(--border)",
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Masuk Panel Admin Skill
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
          Kelola katalog skill, edit dokumentasi SKILL.md, file pendukung, dan status publikasi.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border px-3.5 py-2.5 text-sm"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
              Email Admin
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@reneo.my.id"
              className="min-h-[44px] w-full rounded-md border px-3.5 text-sm"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs font-semibold" style={{ color: "var(--ink-body)" }}>
              Kata Sandi
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="min-h-[44px] w-full rounded-md border px-3.5 text-sm"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] w-full rounded-md px-4 text-sm font-semibold"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
            }}
          >
            {submitting ? "Memeriksa kredensial..." : "Masuk ke Panel Admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
