import assert from "node:assert/strict";
import test from "node:test";
import { getDb } from "./db";
import { buildServer } from "./server";
import { config } from "./config";

test("Reneo Skills API: public gallery, admin auth, CRUD, supporting files, and ZIP download", async () => {
  const db = getDb(":memory:");
  const app = await buildServer(db);

  // 1. Public gallery returns seeded published skills
  const listRes = await app.inject({ method: "GET", url: "/api/skills" });
  assert.equal(listRes.statusCode, 200);
  const listBody = listRes.json();
  assert.ok(Array.isArray(listBody.skills));
  assert.ok(listBody.skills.length >= 2);
  assert.equal(listBody.stats.total_published, listBody.skills.length);

  // 2. Admin endpoint rejects unauthenticated requests
  const unauthRes = await app.inject({ method: "GET", url: "/api/admin/skills" });
  assert.equal(unauthRes.statusCode, 401);

  // 3. Admin login sets HttpOnly cookie
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: config.adminEmail, password: config.adminPassword },
  });
  assert.equal(loginRes.statusCode, 200);
  const setCookie = loginRes.headers["set-cookie"];
  assert.ok(setCookie, "Expected session cookie on login");
  const cookieHeader = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : String(setCookie).split(";")[0];

  // 4. Create new skill via admin API
  const createRes = await app.inject({
    method: "POST",
    url: "/api/admin/skills",
    headers: { cookie: cookieHeader },
    payload: {
      name: "Audit Server Linux",
      slug: "audit-server-linux",
      summary: "Checklist pemeriksaan kesehatan CPU, disk, port, dan layanan systemd di server Linux.",
      version: "1.0.0",
      author: "Renaldi",
      tags: ["linux", "systemd", "audit"],
      compatible_agents: ["Antigravity", "Claude Code"],
      skill_markdown: "# Audit Server Linux\n\nPeriksa status systemd dan kapasitas disk.",
      status: "published",
    },
  });
  assert.equal(createRes.statusCode, 201);
  const createdSkill = createRes.json().skill;
  assert.equal(createdSkill.slug, "audit-server-linux");

  // 5. Attach supporting script file
  const fileRes = await app.inject({
    method: "POST",
    url: `/api/admin/skills/${createdSkill.id}/files`,
    headers: { cookie: cookieHeader },
    payload: {
      relative_path: "scripts/check_disk.sh",
      mime_type: "text/x-shellscript",
      is_binary: false,
      content: "#!/bin/sh\ndf -h\n",
    },
  });
  assert.equal(fileRes.statusCode, 201);
  assert.equal(fileRes.json().files.length, 1);

  // 6. Download ZIP increments download_count
  const zipRes = await app.inject({
    method: "GET",
    url: "/api/skills/audit-server-linux/download",
  });
  assert.equal(zipRes.statusCode, 200);
  assert.equal(zipRes.headers["content-type"], "application/zip");
  assert.ok(zipRes.rawPayload.length > 50);

  const detailRes = await app.inject({ method: "GET", url: "/api/skills/audit-server-linux" });
  assert.equal(detailRes.statusCode, 200);
  assert.equal(detailRes.json().skill.download_count, 1);

  await app.close();
});
