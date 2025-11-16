// shared/contracts/crowdMonitoring.ts
import { z } from "zod";

/** Levels */
export const CrowdLevelEnum = z.enum(["low", "medium", "high"]);
export type CrowdLevel = z.infer<typeof CrowdLevelEnum>;

/** Carpark (location) payloads */
export const LocationCrowdDataSchema = z.object({
  locationId: z.string().describe("carpark_number"),
  name: z.string(),
  currentOccupancy: z.number().int().nonnegative(), 
  maxCapacity: z.number().int().positive(),         // total_lots
  crowdLevel: CrowdLevelEnum,
  lastUpdated: z.string().datetime(),               // ISO
});
export type LocationCrowdData = z.infer<typeof LocationCrowdDataSchema>;

export const CrowdMonitoringResponseSchema = z.object({
  locations: z.array(LocationCrowdDataSchema),
  timestamp: z.string().datetime(),
});
export type CrowdMonitoringResponse = z.infer<typeof CrowdMonitoringResponseSchema>;

export const LocationParamsSchema = z.object({
  locationId: z.string().describe("carpark_number"),
});

/** Subscriptions (carpark-level) */
export const SubscribeBodySchema = z.object({
  locationId: z.string(),
  targetLevel: CrowdLevelEnum,
});
export type SubscribeBody = z.infer<typeof SubscribeBodySchema>;

/** Libraries */
export const LibraryIdSchema = z.enum(["lwn", "business", "nie", "hss"]);
export type LibraryId = z.infer<typeof LibraryIdSchema>;

export const LibraryParamsSchema = z.object({
  libraryId: LibraryIdSchema,
});

export const LibraryCrowdSchema = z.object({
  libraryId: LibraryIdSchema,
  name: z.string(),
  occupancyPct: z.number(), // 0..100
  crowdLevel: CrowdLevelEnum,
  contributingCarparks: z.array(
    z.object({
      id: z.string(),
      weight: z.number(),
      pct: z.number(),
      isRecent: z.boolean(),
    })
  ),
  lastUpdated: z.string().datetime(),
});
export type LibraryCrowd = z.infer<typeof LibraryCrowdSchema>;

export const LibrariesCrowdResponseSchema = z.object({
  libraries: z.array(LibraryCrowdSchema),
  timestamp: z.string().datetime(),
});
export type LibrariesCrowdResponse = z.infer<typeof LibrariesCrowdResponseSchema>;
