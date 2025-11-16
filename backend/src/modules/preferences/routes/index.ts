import { FastifyInstance } from "fastify";
import { getPrefsRoute } from "./get";
import { updatePrefsRoute } from "./update";
import { patchPrefsRoute } from "./patch";

/** Register all /preferences routes under a single plugin. */
export default async function (app: FastifyInstance) {
  await getPrefsRoute(app);
  await updatePrefsRoute(app);
  await patchPrefsRoute(app);
}
