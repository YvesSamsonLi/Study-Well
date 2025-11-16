import { z } from 'zod';

// keep these
export const CrowdLevelEnum = z.enum(['low','medium','high']);
export const LocationParamsSchema = z.object({ locationId: z.string() });
export const SubscribeBodySchema = z.object({
  locationId: z.string(),      // carpark_number
  targetLevel: CrowdLevelEnum, // 'low' | 'medium' | 'high'
});

// libraryId params (align with LIBRARIES keys)
export const LibraryIdSchema = z.enum(['lwn','business','nie','hss']);
export const LibraryParamsSchema = z.object({
  libraryId: LibraryIdSchema,
});

// response validators if you want runtime validation for /libraries:
export const LibraryCrowdSchema = z.object({
  libraryId: LibraryIdSchema,
  name: z.string(),
  occupancyPct: z.number(),                 // 0..100
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

export const LibrariesCrowdResponseSchema = z.object({
  libraries: z.array(LibraryCrowdSchema),
  timestamp: z.string().datetime(),
});
