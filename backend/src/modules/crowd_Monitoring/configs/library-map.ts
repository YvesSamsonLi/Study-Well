// You can tweak this at any time without code changes elsewhere.
// Use carpark_number codes from the API payload.

export type LibraryId = 'lwn' | 'business' | 'nie' | 'hss';

export const LIBRARIES: Record<LibraryId, {
  name: string;
  carparks: Array<{ id: string; weight?: number }>;
}> = {
  lwn: {
    name: 'Lee Wee Nam Library',
    carparks: [
      { id: 'HLM', weight: 1.0 },  // example mapping
      { id: 'C6',  weight: 0.6 },
      { id: 'HE12', weight: 0.4 },
    ],
  },
  business: {
    name: 'Business Library',
    carparks: [
      { id: 'TG1', weight: 0.8 },
      { id: 'TG2', weight: 0.8 },
      { id: 'C20', weight: 0.4 },
    ],
  },
  nie: {
    name: 'NIE Library',
    carparks: [
      { id: 'RHM', weight: 1.0 },
      { id: 'C32', weight: 0.5 },
    ],
  },
  hss: {
    name: 'HSS Library',
    carparks: [
      { id: 'FR3M', weight: 1.0 },
      { id: 'Q81',  weight: 0.7 },
      { id: 'BM29', weight: 0.5 },
    ],
  },
};
