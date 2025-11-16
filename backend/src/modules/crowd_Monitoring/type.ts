export type CrowdLevelKey = 'low' | 'medium' | 'high';

export interface CrowdLevelThresholds {
  low: number;    // <= low%
  medium: number; // <= medium%
  high: number;   // <= 100%
}

export interface LocationCrowdData {
  locationId: string;        // carpark_number
  name: string;              // "Carpark {number}" or overridden
  currentOccupancy: number;  // used (= total - lots_available)
  maxCapacity: number;       // total_lots
  crowdLevel: CrowdLevelKey;
  lastUpdated: string;       // ISO string
}

export interface CrowdMonitoringResponse {
  locations: LocationCrowdData[];
  timestamp: string; // ISO
}

export interface Subscription {
  userId: string;
  locationId: string;     // carpark_number
  targetLevel: CrowdLevelKey;
  createdAt: string;      // ISO
}

// library-level types
export type LibraryId = 'lwn' | 'business' | 'nie' | 'hss';

export interface LibraryCrowd {
  libraryId: LibraryId;
  name: string;
  occupancyPct: number;   // weighted mean of contributing carparks
  crowdLevel: CrowdLevelKey;
  contributingCarparks: Array<{ id: string; weight: number; pct: number; isRecent: boolean }>;
  lastUpdated: string;    
}

export interface LibrariesCrowdResponse {
  libraries: LibraryCrowd[];
  timestamp: string;
}
