import type { FastifyInstance } from "fastify";
import type { DatabaseSync } from "node:sqlite";
import { clearSessionCookie, getRequestUser, setSessionCookie, verifyPassword } from "../auth";

interface LoginBody {
  email?: string;
  password?: string;
}

export function registerAuthRoutes(app: FastifyInstance, db: DatabaseSync): void {
  app.post<{ Body: LoginBody }>("/api/auth/login", async (request, reply) => {
    const email = (request.body?.email || "").trim().toLowerCase();
    const password = request.body?.password || "";

    if (!email || !password) {
      return reply.code(400).send({ error: "Email dan kata sandi wajib diisi." });
    }

    const row = db
      .prepare("SELECT id, email, name, password_hash, role FROM users WHERE email = ?")
      .get(email) as { id: number; email: string; name: string; password_hash: string; role: string } | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      return reply.code(401).send({ error: "Email atau kata sandi tidak cocok." });
    }

    const user = { id: row.id, email: row.email, name: row.name, role: row.role };
    setSessionCookie(request, reply, user);
    return { user };
  });

  app.post("/api/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/auth/me", async (request) => {
    const user = getRequestUser(request);
    return { user };
  });
}
