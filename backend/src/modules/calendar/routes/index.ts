// src/modules/calendar/routes/index.ts
import { FastifyInstance } from "fastify";

import list from "./list_Calendar";
import create from "./create_Calendar";
import update from "./update_Calendar";
import del from "./delete_Calendar";
import range from "./range";
import terms from "./terms";

export default async function registerCalendar(app: FastifyInstance) {
  app.log.debug("calendar: registering");

  // Read endpoints
  await terms(app);   // GET /v1/calendar/terms
  await list(app);    // GET /v1/calendar/events
  await range(app);   // GET /v1/calendar/range?from=&to=&termId=&page=&limit=

  // Write endpoints (user events)
  await create(app);  // POST   /v1/calendar/events
  await update(app);  // PATCH  /v1/calendar/events/:id
  await del(app);     // DELETE /v1/calendar/events/:id

  app.log.debug("calendar: ready");
}
