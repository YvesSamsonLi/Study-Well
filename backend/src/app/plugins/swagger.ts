// src/app/plugins/swagger.ts
import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

const swaggerPlugin = fp(async (fastify) => {
  // 1) Core OpenAPI/Swagger JSON route
  // Expose the JSON at /openapi.json (NOT /docs/json)
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "StudyWell API",
        description: "API documentation for StudyWell backend",
        version: "1.0.0",
      },
      servers: [{ url: "/v1" }], // your versioned routes live under /v1
      components: {},
      security: [],
      tags: [],
    },
    // IMPORTANT: exposeRoute + routePrefix ensure the JSON route path
    exposeRoute: true,
    // In @fastify/swagger v8, this option is named 'routePrefix' if you want to change the base path
    // JSON will be at `${routePrefix}/json` by default. Set a unique one to avoid collisions.
    // We'll place JSON under '/openapi' => '/openapi/json'
    routePrefix: "/openapi",
  });

  // 2) Swagger UI at /docs (separate prefix from JSON)
  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Optional: small helper redirect to the UI
  fastify.get("/", async (_req, reply) => {
    reply.redirect("/docs");
  });
});

export default swaggerPlugin;
