import fp from "fastify-plugin";
import pino from "pino";

export default fp(async (app) => {
  app.log = pino({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    redact: { paths: ["req.headers.authorization", "response.headers.set-cookie", "password", "token"], remove: true },
  }) as any;

  app.addHook("onRequest", async (req, _reply) => {
    req.log = app.log.child({ reqId: req.headers["x-request-id"] || req.id });
  });

  app.addHook("onResponse", async (req, reply) => {
    req.log.info({ status: reply.statusCode, path: req.routerPath }, "request done");
  });
});
