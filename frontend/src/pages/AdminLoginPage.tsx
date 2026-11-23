import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { api } from "../lib/api";
import { withBasePath } from "../lib/basePath";
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
      <div className="reneo-card p-7">
        <div className="flex items-center gap-3">
          <img
            src={withBasePath("/logo.svg")}
            alt="Reneo Skills"
            width={40}
            height={40}
            className="rounded-[10px]"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Masuk Panel Admin
            </h1>
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
              Kelola katalog skill, SKILL.md, dan file pendukung
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-[10px] border px-3.5 py-2.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger-text)",
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
              className="reneo-field min-h-[42px] w-full px-3.5 text-sm"
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
              className="reneo-field min-h-[42px] w-full px-3.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="reneo-btn-primary inline-flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-sm"
          >
            <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
            {submitting ? "Memeriksa kredensial..." : "Masuk ke Panel Admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
