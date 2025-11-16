// auth/routes/index.ts
import { FastifyInstance } from "fastify";

import register from "./register";
import login from "./login";
import logout from "./logout";
import me from "./me";
import changePassword from "./change_Password";

export default async function (app: FastifyInstance) {
  await register(app);        // POST   /v1/auth/register
  await login(app);           // POST   /v1/auth/login
  await me(app);              // GET    /v1/auth/me
  await changePassword(app);  // PATCH  /v1/auth/password
  await logout(app);          // POST   /v1/auth/logout  (stateless)
}
