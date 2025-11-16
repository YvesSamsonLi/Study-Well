// src/app/routes.ts
import type { FastifyInstance, FastifyPluginAsync, FastifyRegisterOptions } from "fastify";

const API_PREFIX = "/v1";

/** Helper to lazy-load and register a module route plugin with consistent error logs */
async function registerLazy<TOpts>(
  app: FastifyInstance,
  modulePath: string,
  opts?: FastifyRegisterOptions<TOpts>
) {
  try {
    const mod = await import(modulePath);
    const plugin = (mod.default ?? mod) as FastifyPluginAsync<TOpts> | ((app: FastifyInstance, opts: TOpts) => Promise<void> | void);
    
    await app.register(plugin, opts as any);
    app.log.info({ modulePath, prefix: (opts as any)?.prefix }, "Registered routes");
  } catch (err) {
    app.log.error({ err, modulePath, opts }, "Failed to register route module");
    throw err; // Fail fast at boot so we don't run a half-broken API
  }
}

/** Central place to bind all /v1 routes. */
export const registerRoutes: FastifyPluginAsync = async (app) => {
  // All routes below mount under /v1/*
  const v1 = app.withTypeProvider().register(async (scoped) => {
    // --- Health / Liveness ---
    scoped.get("/health", async () => ({
      status: "ok",
      service: "studywell-api",
      version: "1.0.0",
      time: new Date().toISOString(),
    }));

    // ---- Module routers ----
    // Auth -> /v1/auth/*
    await registerLazy(scoped, "../modules/auth/routes", { prefix: "/auth" });

    // Calendar -> /v1/calendar/*
    await registerLazy(scoped, "../modules/calendar/routes/index", { prefix: "/calendar" });

    // Preferences -> /v1/preferences/*
    // (module defines absolute paths internally; no prefix is fine if that’s the contract)
    await registerLazy(scoped, "../modules/preferences/routes");

    // ICS export -> /v1/interop/ics
    await registerLazy(scoped, "../modules/interop/ics/routes.export");

    // Omodules to be  toggle later
    await registerLazy(scoped, "../modules/ingestion/routes", { prefix: "/ingestion" });
    // await registerLazy(scoped, "../modules/nudges/routes",   { prefix: "/nudges" });

    await registerLazy(scoped, "../modules/google/routes", { prefix: "/google" });

    // Crowd Monitoring -> /v1/crowd/*
    await registerLazy(scoped, "../modules/crowd_Monitoring/routes", { prefix: "/crowd" });


    // --- 404 within /v1 ---
    scoped.setNotFoundHandler((req, reply) => {
      reply.code(404).send({
        error: "Not Found",
        method: req.method,
        path: req.url,
      });
    });
  }, { prefix: API_PREFIX });

  await v1; // ensure registration completes before returning
};

export default registerRoutes;
