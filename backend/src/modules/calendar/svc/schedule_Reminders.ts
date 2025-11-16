import { enqueueReminder } from "../../../jobs/queues";

/**
 * Very simple reminder strategy:
 * - Schedule one reminder 10 minutes before start (if in the future).
 * Extend to user preference later (lead times, channels).
 */
export async function scheduleReminders(event: { id: string; startsAt: Date; title: string; studentId: string }) {
  const leadMs = 10 * 60 * 1000;
  const at = event.startsAt.getTime() - leadMs;
  const delay = at - Date.now();
  if (delay > 0) {
    await enqueueReminder(
      { eventId: event.id, studentId: event.studentId, title: event.title, atISO: event.startsAt.toISOString() },
      delay
    );
  }
}
