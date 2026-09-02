/**
 * Overseas Explore destinations — day-seeded “trending today” order.
 * Same algorithm on server + web client fallback so offline still matches UTC day.
 */

export type DestinationImageKey = 'cliff' | 'cover' | 'beach' | 'dining' | 'resort' | 'salon';

export interface ExploreDestinationDto {
  id: string;
  name: string;
  region: string;
  blurb: string;
  locationName: string;
  /** Maps to platform assets (DestCliff, dest_cliff, etc.) */
  imageKey: DestinationImageKey;
  /** Relative score for the day (higher = more trending) */
  score: number;
}

export interface TrendingDestinationsResult {
  ok: true;
  day: string;
  label: string;
  refreshesAt: string;
  destinations: ExploreDestinationDto[];
  source: 'live' | 'local';
}

const CATALOG: Omit<ExploreDestinationDto, 'score'>[] = [
  {
    id: 'santorini',
    name: 'Santorini',
    region: 'Greece',
    blurb: 'White terraces & caldera light',
    locationName: 'Santorini, Greece',
    imageKey: 'cliff',
  },
  {
    id: 'amalfi',
    name: 'Amalfi',
    region: 'Italy',
    blurb: 'Cliffside vows above the sea',
    locationName: 'Amalfi Coast, Italy',
    imageKey: 'cover',
  },
  {
    id: 'bali',
    name: 'Bali',
    region: 'Indonesia',
    blurb: 'Jungle resorts & shore clubs',
    locationName: 'Bali, Indonesia',
    imageKey: 'beach',
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    region: 'Japan',
    blurb: 'Temple gardens & quiet formality',
    locationName: 'Kyoto, Japan',
    imageKey: 'dining',
  },
  {
    id: 'hawaii',
    name: 'Hawaii',
    region: 'USA',
    blurb: 'Pacific estates & lava shores',
    locationName: 'Hawaii, USA',
    imageKey: 'resort',
  },
  {
    id: 'phuket',
    name: 'Phuket',
    region: 'Thailand',
    blurb: 'Andaman beaches & private villas',
    locationName: 'Phuket, Thailand',
    imageKey: 'salon',
  },
];

/** Seasonal base weight by calendar month (1–12). */
const SEASONAL: Record<string, number[]> = {
  //                J   F   M   A   M   J   J   A   S   O   N   D
  santorini: [40, 45, 55, 70, 90, 95, 88, 85, 80, 70, 50, 42],
  amalfi: [35, 40, 55, 75, 90, 95, 92, 88, 78, 65, 45, 38],
  bali: [85, 80, 70, 60, 55, 50, 55, 60, 70, 80, 90, 92],
  kyoto: [55, 50, 85, 90, 70, 55, 50, 55, 65, 90, 85, 60],
  hawaii: [75, 70, 65, 60, 55, 50, 55, 60, 65, 70, 80, 85],
  phuket: [80, 75, 65, 55, 50, 45, 50, 55, 60, 70, 85, 90],
};

export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function nextUtcMidnightIso(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
  return next.toISOString();
}

function fnv1a(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seasonalWeight(id: string, month: number): number {
  const row = SEASONAL[id];
  if (!row) return 50;
  return row[Math.min(11, Math.max(0, month - 1))] ?? 50;
}

/**
 * Deterministic daily ranking: seasonal weight + day/id hash jitter.
 * Same UTC day → same order on every client that runs this logic.
 */
export function resolveTrendingDestinations(
  day?: string | null,
  source: 'live' | 'local' = 'local',
): TrendingDestinationsResult {
  const dayKey =
    day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : utcDayKey();
  const month = Number(dayKey.slice(5, 7));

  const destinations = CATALOG.map((dest) => {
    const jitter = fnv1a(`${dayKey}:${dest.id}`) % 1000;
    const score = seasonalWeight(dest.id, month) * 1000 + jitter;
    return { ...dest, score };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return {
    ok: true,
    day: dayKey,
    label: 'Trending today',
    refreshesAt: nextUtcMidnightIso(dayKey),
    destinations,
    source,
  };
}

export const EXPLORE_DESTINATION_CATALOG = CATALOG;
