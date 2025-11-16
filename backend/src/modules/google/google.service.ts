// src/modules/google/google.service.ts
import { google } from "googleapis";
import { prisma } from "../../core/db/prisma";
import { createOAuthClient } from "./google.oauth";
import { getTokensTmp, saveTokensTmp, wireAutoRefresh } from "./token.store";

// ---- 1) Exchange code and stash tokens (Redis or in-memory) ----
export async function exchangeAndSave(studentId: string, code: string) {
  const oauth2 = createOAuthClient();
  const { tokens } = await oauth2.getToken(code);

  await saveTokensTmp(studentId, {
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
    scope: tokens.scope ?? null,
    token_type: tokens.token_type ?? null,
  });
  return { ok: true };
}

// ---- 2) Build calendar client using stored tokens ----
export async function getCalendarClient(studentId: string) {
  const tokens = await getTokensTmp(studentId);
  if (!tokens?.refresh_token && !tokens?.access_token) {
    throw new Error("Google not linked or tokens missing");
  }

  const oauth2 = createOAuthClient();
  oauth2.setCredentials({
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  });
  wireAutoRefresh(oauth2 as any, studentId);

  return google.calendar({ version: "v3", auth: oauth2 });
}

// ---- 3) Push unsynced MainCalendar rows → Google (title, start, end, location) ----
export async function pushUnsyncedMainCalendar(studentId: string) {
  const calendar = await getCalendarClient(studentId);

  const rows = await prisma.mainCalendar.findMany({
    where: { studentId, isSynced: false },
    select: { id: true, title: true, startsAt: true, endsAt: true, location: true },
    orderBy: { startsAt: "asc" },
  });

  const created: string[] = [];
  for (const e of rows) {
    const body = {
      summary: e.title,
      location: e.location ?? undefined,
      start: { dateTime: e.startsAt.toISOString() },
      end:   { dateTime: e.endsAt.toISOString() },
    };
    const res = await calendar.events.insert({ calendarId: "primary", requestBody: body });
    const gId = res.data.id ?? null;
    if (gId) created.push(gId);

    await prisma.mainCalendar.update({
      where: { id: e.id },
      data: { googleEventId: gId, isSynced: true },
    });
  }

  return { created: created.length, googleIds: created };
}

// ---- 4) Delete previously-synced Google events and reset DB flags ----
export async function deleteSyncedMainCalendar(studentId: string) {
  const calendar = await getCalendarClient(studentId);

  const rows = await prisma.mainCalendar.findMany({
    where: { studentId, googleEventId: { not: null } },
    select: { id: true, googleEventId: true },
  });

  let deleted = 0;
  for (const row of rows) {
    const gId = row.googleEventId!;
    try {
      await calendar.events.delete({ calendarId: "primary", eventId: gId });
      deleted++;
    } catch (err: any) {
      const status = err?.code || err?.response?.status;
      if (status !== 404) {
      }
    }
  }

  await prisma.mainCalendar.updateMany({
    where: { studentId, googleEventId: { not: null } },
    data: { isSynced: false, googleEventId: null },
  });

  return { totalFound: rows.length, deletedFromGoogle: deleted, resetDb: true };
}
