// shared/endpoints/google.calendar.ts
import type {
  GoogleAuthQueryType,
  GoogleSyncBodyType,
  GooglePurgeBodyType,
  GoogleUnlinkBodyType,
  GoogleStatusQueryType,
  GoogleSyncResponseType,
  GooglePurgeResponseType,
  GoogleStatusResponseType,
} from "../contracts/google.calendar";

export const GOOGLE_ROUTES = {
  AUTH: {
    path: (q: GoogleAuthQueryType) => `/v1/google/auth?studentId=${encodeURIComponent(q.studentId)}`,
    method: "GET" as const,
  },
  CALLBACK: {
    path: `/v1/google/callback`,
    method: "GET" as const,
  },
  SYNC: {
    path: `/v1/google/sync`,
    method: "POST" as const,
  },
  PURGE: {
    path: `/v1/google/purge`,
    method: "POST" as const,
  },
  UNLINK: {
    path: `/v1/google/unlink`,
    method: "POST" as const,
  },
  STATUS: {
    path: (q: GoogleStatusQueryType) => `/v1/google/status?studentId=${encodeURIComponent(q.studentId)}`,
    method: "GET" as const,
  },
};


const BACKEND_URL = "http://localhost:3000";

// Helper wrappers if you have a FE fetch util 
export const GoogleCalendarAPI = {
  startAuth: (studentId: string) => fetch(GOOGLE_ROUTES.AUTH.path({ studentId })),
  sync: (body: GoogleSyncBodyType) =>
    fetch(BACKEND_URL + GOOGLE_ROUTES.SYNC.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as Promise<GoogleSyncResponseType>,
  purge: (body: GooglePurgeBodyType) =>
    fetch(BACKEND_URL + GOOGLE_ROUTES.PURGE.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as Promise<GooglePurgeResponseType>,
  unlink: (body: GoogleUnlinkBodyType) =>
    fetch(BACKEND_URL + GOOGLE_ROUTES.UNLINK.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  status: (studentId: string) => fetch(BACKEND_URL + GOOGLE_ROUTES.STATUS.path({ studentId })) as Promise<GoogleStatusResponseType>,
};
