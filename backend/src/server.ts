import fs from "fs";
import path from "path";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import type { DatabaseSync } from "node:sqlite";
import { config } from "./config";
import { getDb } from "./db";
import { registerAuthRoutes } from "./routes/auth";
import { registerCategoryRoutes } from "./routes/categories";
import { registerSkillRoutes } from "./routes/skills";

export async function buildServer(customDb?: DatabaseSync) {
  const app = Fastify({
    logger: config.nodeEnv !== "test",
    bodyLimit: 5 * 1024 * 1024,
  });

  const db = customDb || getDb();

  await app.register(cookie);
  await app.register(cors, {
    origin: config.corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  });

  app.get("/api/health", async () => ({ status: "ok", service: "reneo-skills" }));

  registerAuthRoutes(app, db);
  registerCategoryRoutes(app, db);
  registerSkillRoutes(app, db);

  if (fs.existsSync(config.frontendDistDir)) {
    await app.register(fastifyStatic, {
      root: config.frontendDistDir,
      prefix: "/",
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Endpoint tidak ditemukan." });
      }
      const indexHtml = path.join(config.frontendDistDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        return reply.type("text/html; charset=utf-8").send(fs.readFileSync(indexHtml));
      }
      return reply.code(404).send({ error: "Halaman tidak ditemukan." });
    });
  }

  return app;
}

async function start() {
  const app = await buildServer();
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Reneo Skills service aktif di http://${config.host}:${config.port}`);
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Gagal menjalankan server:", err);
    process.exit(1);
  });
}
