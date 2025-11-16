// src/modules/google/routes.ts
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { getAuthUrl } from "./google.oauth";
import {
  exchangeAndSave,
  pushUnsyncedMainCalendar,
  deleteSyncedMainCalendar,
  // getCalendarClient, // not needed here; remove if unused
} from "./google.service";
import { clearTokensTmp, getTokensTmp } from "./token.store";

/**
 * All Google routes live inside this plugin.
 * This file is registered with prefix "/google", so route paths here
 * should NOT start with "/google".
 */
const googleRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /v1/google/ping
  app.get("/google/ping", async () => ({ pong: true, scope: "google" }));

  // GET /v1/google/auth?studentId=...
  app.get("/google/auth", async (req, reply) => {
    const q = req.query as any;
    const sid: string = q.studentId || q.studentID || ""; // accept both
    const base = getAuthUrl();
    const url = sid ? `${base}&state=${encodeURIComponent(sid)}` : base;
    return reply.redirect(url);
  });

  // GET /v1/google/callback?code=...&state=...
  app.get("/google/callback", async (req, reply) => {
    const q = req.query as any;
    const code: string | undefined = q.code;
    const sid: string | undefined =
      q.state || q.studentId || q.studentID || (req as any).user?.id;

    if (!code || !sid) {
      req.log.error({ codePresent: !!code, sid }, "Missing code or studentId");
      return reply.code(400).send({ ok: false, error: "Missing code or studentId" });
    }

    await exchangeAndSave(String(sid), String(code));
    return reply.redirect('http://localhost:5173/calendar');
  });

  // POST /v1/google/sync  { studentId }
  app.post("/google/sync", async (req, reply) => {
    const { studentId } = req.body as { studentId: string };
    if (!studentId) return reply.code(400).send({ ok: false, error: "Missing studentId" });
    const out = await pushUnsyncedMainCalendar(studentId);
    return reply.send({ ok: true, ...out });
  });

  // POST /v1/google/purge  { studentId }
  app.post("/google/purge", async (req, reply) => {
    const { studentId } = req.body as { studentId: string };
    if (!studentId) return reply.code(400).send({ ok: false, error: "Missing studentId" });

    try {
      const out = await deleteSyncedMainCalendar(studentId);
      return reply.send({ ok: true, ...out });
    } catch (err: any) {
      req.log.error({ err }, "purge failed");
      return reply.code(500).send({ ok: false, error: err?.message || "purge failed" });
    }
  });

  // POST /v1/google/unlink  { studentId }
  app.post("/google/unlink", async (req, reply) => {
    const { studentId } = req.body as { studentId: string };
    if (!studentId) return reply.code(400).send({ ok: false, error: "Missing studentId" });
    await clearTokensTmp(studentId);
    return reply.send({ ok: true });
  });

  // GET /v1/google/status?studentId=...
  app.get("/google/status", async (req, reply) => {
    const q = req.query as any;
    const sid: string = q.studentId || q.studentID || "";
    if (!sid) return reply.code(400).send({ ok: false, error: "Missing studentId" });
    const t = await getTokensTmp(sid);
    return reply.send({ ok: true, linked: !!t, hasRefresh: !!t?.refresh_token });
  });
};

export default fp(googleRoutes, { name: "google-routes" });
