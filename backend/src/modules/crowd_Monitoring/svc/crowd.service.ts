// src/modules/crowd-monitoring/svc/crowd.service.ts
// Carpark API as the *only* data source; aggregate to library crowd via mapping.
import { LIBRARIES, type LibraryId } from '../configs/library-map';
import type {
  CrowdLevelKey,
  CrowdLevelThresholds,
  LocationCrowdData,
  CrowdMonitoringResponse,
} from '../types';

const API_BASE = process.env.CAR_PARK_API_BASE ?? 'https://api.data.gov.sg/v1/transport/carpark-availability';
const API_TIMEOUT_MS = Number(process.env.CROWD_API_TIMEOUT_MS ?? 8000);

// Recency check for carpark readings contributing to a library (mins)
const RECENCY_MIN = Number(process.env.CROWD_RECENCY_MIN ?? 15);

// If needd: nicer names per carpark_number
const NAME_OVERRIDES: Record<string, string> = {
  // 'HLM': 'N2 Multi-storey (HLM)',
};

type CarparkRow = {
  carpark_number?: string;
  update_datetime?: string;
  carpark_info?: Array<{
    total_lots?: string;
    lots_available?: string;
    lot_type?: string; // C, M, H, etc; we only use 'C'
  }>;
};

type CarparkSnapshot = {
  id: string;
  total: number;
  available: number;
  used: number;
  pct: number;            // used/total * 100
  lastUpdatedIso: string;
  isRecent: boolean;
};

export type LibraryCrowd = {
  libraryId: LibraryId;
  name: string;
  occupancyPct: number;   // 0..100  (weighted mean of contributing carparks)
  crowdLevel: CrowdLevelKey;
  contributingCarparks: Array<{ id: string; weight: number; pct: number; isRecent: boolean }>;
  lastUpdated: string;    // newest contributing reading
};

function isRecentIso(iso: string): boolean {
  const t = new Date(iso).getTime();
  return (Date.now() - t) <= RECENCY_MIN * 60_000;
}

export class CrowdMonitoringService {
  private readonly THRESHOLDS: CrowdLevelThresholds = { low: 33, medium: 66, high: 100 };

  // ------------------ Public API (carpark-level) ------------------
  async getCurrentCrowdLevels(): Promise<CrowdMonitoringResponse> {
    const raw = await this.fetchCarparkData();
    const locations = this.processCarparkRaw(raw);
    return { locations, timestamp: new Date().toISOString() };
  }

  async getLocationCrowdLevel(locationId: string): Promise<LocationCrowdData> {
    const raw = await this.fetchCarparkData();
    const locations = this.processCarparkRaw(raw);
    const found = locations.find((l) => l.locationId === locationId);
    if (!found) throw new Error('Location not found');
    return found;
  }

  // ------------------ Public API (library-level) ------------------
  async getLibrariesCrowd(): Promise<{ libraries: LibraryCrowd[]; timestamp: string }> {
    const raw = await this.fetchCarparkData();
    const index = this.buildCarparkIndex(raw);

    const out: LibraryCrowd[] = [];
    for (const [libId, cfg] of Object.entries(LIBRARIES) as Array<[LibraryId, (typeof LIBRARIES)[LibraryId]]>) {
      let sumW = 0;
      let sumWPct = 0;
      let newest = 0;
      const contributing: LibraryCrowd['contributingCarparks'] = [];

      for (const { id, weight = 1 } of cfg.carparks) {
        const cp = index[id];
        if (!cp || cp.total <= 0) continue;

        contributing.push({ id, weight, pct: cp.pct, isRecent: cp.isRecent });
        sumW += weight;
        sumWPct += weight * cp.pct;
        newest = Math.max(newest, new Date(cp.lastUpdatedIso).getTime());
      }

      const occupancyPct = sumW > 0 ? (sumWPct / sumW) : 0; // if no contributors, treat as 0% (least crowded)
      const level = this.levelFor(occupancyPct);

      out.push({
        libraryId: libId,
        name: cfg.name,
        occupancyPct,
        crowdLevel: level,
        contributingCarparks: contributing,
        lastUpdated: newest ? new Date(newest).toISOString() : new Date().toISOString(),
      });
    }

    // Sort least crowded → most crowded
    out.sort((a, b) => {
      const order = (x: CrowdLevelKey) => (x === 'low' ? 0 : x === 'medium' ? 1 : 2);
      const d = order(a.crowdLevel) - order(b.crowdLevel);
      if (d !== 0) return d;
      return a.occupancyPct - b.occupancyPct;
    });

    return { libraries: out, timestamp: new Date().toISOString() };
  }

  buildLibrarySummaryMessage(payload: { libraries: LibraryCrowd[]; timestamp: string }): string {
    const least = payload.libraries[0];
    const lines = [
      `📚 Library crowd summary @ ${new Date(payload.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}`,
    ];
    for (const lib of payload.libraries) {
      const pct = Math.round(lib.occupancyPct);
      const stale = lib.contributingCarparks.every(c => !c.isRecent) ? ' (stale)' : '';
      lines.push(`• ${lib.name}: ${lib.crowdLevel.toUpperCase()} — ~${pct}% full${stale}`);
    }
    if (least) {
      lines.push(`\n Least crowded now: ${least.name} (~${Math.round(least.occupancyPct)}% full, ${least.crowdLevel})`);
    }
    return lines.join('\n');
  }

  // ------------------ Internals ------------------
  private async fetchCarparkData(): Promise<CarparkRow[]> {
    // API expects `date_time=YYYY-MM-DDTHH:MM` (no seconds)
    const iso = new Date().toISOString();                 // 2025-11-07T05:30:12.345Z
    const timestamp = iso.replace(/:\d{2}\.\d{3}Z$/, ''); // 2025-11-07T05:30

    const url = `${API_BASE}?date_time=${encodeURIComponent(timestamp)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = (data?.items?.[0]?.carpark_data ?? []) as CarparkRow[];
      if (!Array.isArray(arr)) throw new Error('Malformed payload: items[0].carpark_data missing');
      return arr;
    } catch (err: any) {
      throw new Error(`Carpark API error: ${err?.message ?? String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  private processCarparkRaw(raw: CarparkRow[]): LocationCrowdData[] {
    return raw.map((carpark) => {
      const infoArray = (carpark?.carpark_info ?? []) as Array<{ total_lots?: string; lots_available?: string; lot_type?: string }>;
      // Prefer only car lots ("C")
      const carOnly = infoArray.filter(i => (i.lot_type ?? 'C') === 'C');

      const total = carOnly.reduce((s, i) => s + (parseInt(i.total_lots ?? '0', 10) || 0), 0);
      const available = carOnly.reduce((s, i) => s + (parseInt(i.lots_available ?? '0', 10) || 0), 0);
      const used = Math.max(0, total - available);
      const pct = total > 0 ? (used / total) * 100 : 0;

      const id = String(carpark?.carpark_number ?? 'unknown');

      return {
        locationId: id,
        name: NAME_OVERRIDES[id] ?? `Carpark ${id}`,
        currentOccupancy: used,
        maxCapacity: total,
        crowdLevel: this.levelFor(pct),
        lastUpdated: new Date(carpark?.update_datetime ?? Date.now()).toISOString(),
      };
    });
  }

  private buildCarparkIndex(raw: CarparkRow[]): Record<string, CarparkSnapshot> {
    const index: Record<string, CarparkSnapshot> = {};
    for (const carpark of raw) {
      const infoArray = (carpark?.carpark_info ?? []) as Array<{ total_lots?: string; lots_available?: string; lot_type?: string }>;
      const carOnly = infoArray.filter(i => (i.lot_type ?? 'C') === 'C');

      const total = carOnly.reduce((s, i) => s + (parseInt(i.total_lots ?? '0', 10) || 0), 0);
      const available = carOnly.reduce((s, i) => s + (parseInt(i.lots_available ?? '0', 10) || 0), 0);
      const used = Math.max(0, total - available);
      const pct = total > 0 ? (used / total) * 100 : 0;

      const id = String(carpark?.carpark_number ?? 'unknown');
      const updatedIso = new Date(carpark?.update_datetime ?? Date.now()).toISOString();

      index[id] = {
        id,
        total,
        available,
        used,
        pct,
        lastUpdatedIso: updatedIso,
        isRecent: isRecentIso(updatedIso),
      };
    }
    return index;
  }

  private levelFor(pct: number): CrowdLevelKey {
    if (pct <= this.THRESHOLDS.low) return 'low';
    if (pct <= this.THRESHOLDS.medium) return 'medium';
    return 'high';
  }
}
