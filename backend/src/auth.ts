import crypto from "crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config";

export const SESSION_COOKIE_NAME = "reneo_skills_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSession(user: SessionUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ ...user, exp }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & { exp?: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(request: FastifyRequest, reply: FastifyReply, user: SessionUser): void {
  const token = signSession(user);
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "").toLowerCase();
  const isHttps = request.protocol === "https" || forwardedProto.includes("https");
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}

export function getRequestUser(request: FastifyRequest): SessionUser | null {
  const cookieToken = request.cookies?.[SESSION_COOKIE_NAME];
  return verifySession(cookieToken);
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<SessionUser | undefined> {
  const user = getRequestUser(request);
  if (!user) {
    reply.code(401).send({ error: "Sesi admin tidak aktif. Silakan masuk terlebih dahulu." });
    return undefined;
  }
  return user;
}
