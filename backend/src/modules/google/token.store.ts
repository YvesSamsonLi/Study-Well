import type { OAuth2Client } from "google-auth-library";

// token shape we persist
export type GoogleTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null; // ms since epoch
  scope?: string | null;
  token_type?: string | null;
};

const KEY = (studentId: string) => `gcal:tokens:${studentId}`;

// try to use your existing Redis helper (server.ts references ../core/cache/redis.ts)
async function getRedis() {
  try {
    const mod = await import("../../core/cache/redis");
    return (mod as any).getRedis?.();
  } catch { return undefined; }
}

// in-memory fallback (dev only)
const mem = new Map<string, GoogleTokens>();

export async function saveTokensTmp(studentId: string, tokens: GoogleTokens) {
  const redis = await getRedis();
  if (redis) {
    // keep ~30 days; refresh_token rarely changes, access_token rotates
    await redis.set(KEY(studentId), JSON.stringify(tokens), { EX: 30 * 24 * 3600 });
  } else {
    mem.set(studentId, tokens);
  }
}

export async function getTokensTmp(studentId: string): Promise<GoogleTokens | null> {
  const redis = await getRedis();
  if (redis) {
    const raw = await redis.get(KEY(studentId));
    return raw ? (JSON.parse(raw) as GoogleTokens) : null;
  }
  return mem.get(studentId) ?? null;
}

export async function clearTokensTmp(studentId: string) {
  const redis = await getRedis();
  if (redis) await redis.del(KEY(studentId));
  mem.delete(studentId);
}

// keep tokens fresh: update store whenever google client refreshes
export function wireAutoRefresh(oauth2: OAuth2Client, studentId: string) {
  oauth2.on("tokens", async (t: any) => {
    const prev = (await getTokensTmp(studentId)) ?? {};
    const updated: GoogleTokens = {
      ...prev,
      access_token: t.access_token ?? prev.access_token ?? null,
      expiry_date:  t.expiry_date  ?? prev.expiry_date  ?? null,
      token_type:   t.token_type   ?? prev.token_type   ?? null,
      scope:        t.scope        ?? prev.scope        ?? null,
      // refresh_token usually only on first consent; keep old if missing
      refresh_token: t.refresh_token ?? prev.refresh_token ?? null,
    };
    await saveTokensTmp(studentId, updated);
  });
}
