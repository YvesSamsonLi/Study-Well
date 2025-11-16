import { prisma } from "../../../core/db/prisma";

export default async function exportIcsRoute(app: FastifyInstance) {
  app.get("/interop/ics", async (_req, reply) => {
    const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      ...events.map(e => [
        "BEGIN:VEVENT",
        `SUMMARY:${e.title}`,
        `DTSTART:${e.startsAt.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTEND:${e.endsAt.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DESCRIPTION:${e.category ?? ""}`,
        "END:VEVENT",
      ].join("\n")),
      "END:VCALENDAR",
    ].join("\n");

    reply.type("text/calendar").send(ics);
  });
}
