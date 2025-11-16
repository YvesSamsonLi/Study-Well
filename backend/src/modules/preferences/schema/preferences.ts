import { z } from "zod";

/**
 * Preferences DTO exchanged at the API boundary.
 * - Times are hour-of-day integers [0..23]
 * - `quietHours` may cross midnight (e.g., 23→7)
 */
export const PreferencesSchema = z.object({
  outdoorAllowed: z.boolean().default(true),
  nudgeWindow: z.object({
    start: z.number().int().min(0).max(23),
    end:   z.number().int().min(0).max(23),
  }),
  quietHours: z.object({
    start: z.number().int().min(0).max(23),
    end:   z.number().int().min(0).max(23),
  }),
  timezone: z.string().optional(), 
});

export type PreferencesDTO = z.infer<typeof PreferencesSchema>;

/** Server-side default if a user hasn't saved preferences yet. */
export const defaultPrefs: PreferencesDTO = {
  outdoorAllowed: true,
  nudgeWindow: { start: 9, end: 21 },
  quietHours:   { start: 23, end: 7 },
};
