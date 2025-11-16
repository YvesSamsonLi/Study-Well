// shared/endpoints/crowdMonitoring.ts
import { z } from "zod";
import {
  CrowdMonitoringResponseSchema,
  LocationCrowdDataSchema,
  LocationParamsSchema,
  SubscribeBodySchema,
  LibrariesCrowdResponseSchema,
  LibraryParamsSchema,
  LibraryCrowdSchema,
} from "../contracts/crowd_Monitoring";

export const CROWD_BASE = "/crowd";

export const CrowdPaths = {
  list: () => `${CROWD_BASE}`,                                // GET
  byId: (locationId: string) => `${CROWD_BASE}/${locationId}`, // GET
  subscribe: () => `${CROWD_BASE}/subscribe`,                  // POST

  libraries: () => `${CROWD_BASE}/libraries`,                  // GET
  libraryById: (libraryId: string) => `${CROWD_BASE}/libraries/${libraryId}`, // GET
  librarySummary: () => `${CROWD_BASE}/libraries/summary`,     // GET
};

export const CrowdResponses = {
  list: CrowdMonitoringResponseSchema,
  byId: LocationCrowdDataSchema,
  subscribe: z.undefined().or(z.null()).optional(),

  libraries: LibrariesCrowdResponseSchema,
  libraryById: LibraryCrowdSchema,
  librarySummary: z.object({
    text: z.string(),
    libraries: LibrariesCrowdResponseSchema.shape.libraries,
    timestamp: z.string().datetime(),
  }),
};

// --- Minimal fetch helpers ---
export async function getAllCrowd(baseUrl: string, token?: string) {
  const res = await fetch(`${baseUrl}${CrowdPaths.list()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET /crowd failed: ${res.status}`);
  return CrowdResponses.list.parse(await res.json());
}

export async function getCrowdById(baseUrl: string, locationId: string, token?: string) {
  LocationParamsSchema.parse({ locationId });
  const res = await fetch(`${baseUrl}${CrowdPaths.byId(locationId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET /crowd/${locationId} failed: ${res.status}`);
  return CrowdResponses.byId.parse(await res.json());
}

export async function postSubscribe(baseUrl: string, body: z.infer<typeof SubscribeBodySchema>, token?: string) {
  const payload = SubscribeBodySchema.parse(body);
  const res = await fetch(`${baseUrl}${CrowdPaths.subscribe()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  if (!res.ok && res.status !== 204) throw new Error(`POST /crowd/subscribe failed: ${res.status}`);
}

export async function getLibraries(baseUrl: string, token?: string) {
  const res = await fetch(`${baseUrl}${CrowdPaths.libraries()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET /crowd/libraries failed: ${res.status}`);
  return CrowdResponses.libraries.parse(await res.json());
}

export async function getLibraryById(baseUrl: string, libraryId: string, token?: string) {
  LibraryParamsSchema.parse({ libraryId });
  const res = await fetch(`${baseUrl}${CrowdPaths.libraryById(libraryId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET /crowd/libraries/${libraryId} failed: ${res.status}`);
  // Some backends wrap as { library, timestamp }; if yours does, adjust parse:
  const json = await res.json();
  // Accept either raw object or wrapped
  if (json?.library && json?.timestamp) return LibraryCrowdSchema.parse(json.library);
  return LibraryCrowdSchema.parse(json);
}

export async function getLibrarySummary(baseUrl: string, token?: string) {
  const res = await fetch(`${baseUrl}${CrowdPaths.librarySummary()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GET /crowd/libraries/summary failed: ${res.status}`);
  return CrowdResponses.librarySummary.parse(await res.json());
}
