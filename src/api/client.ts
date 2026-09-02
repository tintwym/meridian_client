/**
 * Meridian API client — one entry point for UI.
 * mock / auto / live controlled by VITE_API_MODE.
 */

import type { PlannerInput } from '../types';
import { loadToken } from './authStorage';
import { apiUrl, shouldMockLiveRoutes, shouldMockUnbacked } from './config';
import {
  mockCheckAvailability,
  mockGeneratePlan,
  mockMoodBoard,
  mockReserve,
  mockSubmitLead,
  mockWeather,
} from './mocks';
import type {
  AvailabilityRequest,
  AvailabilityResult,
  GeneratePlanResult,
  LeadPayload,
  LeadResult,
  MoodBoardResult,
  ReserveRequest,
  ReserveResult,
  WeatherResult,
  NearbyVenuesResult,
} from './types';
import { resolveNearbyVenues } from '../data/venuesByCountry';
import {
  resolveTrendingDestinations,
  type TrendingDestinationsResult,
} from '../data/exploreDestinations';

function authJsonHeaders(): HeadersInit {
  const token = loadToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function liveGeneratePlan(input: PlannerInput): Promise<GeneratePlanResult> {
  const response = await fetch(apiUrl('/api/generate-plan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`generate-plan failed (${response.status})`);
  const plan = await response.json();
  const source = plan.generationSource === 'ai' ? 'live' : 'fallback';
  return { plan, source };
}

async function liveWeather(location: string): Promise<WeatherResult> {
  const res = await fetch(apiUrl(`/api/weather?location=${encodeURIComponent(location)}`));
  if (!res.ok) throw new Error(`weather failed (${res.status})`);
  const json = await res.json();
  return {
    data: json.data,
    source: json.fallback ? 'fallback' : 'live',
    note: json.error,
  };
}

async function liveMoodBoard(prompt: string): Promise<MoodBoardResult> {
  const res = await fetch(apiUrl('/api/gemini/generate-image'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    return {
      imageUrl: null,
      source: 'live',
      error: json.error || 'Mood board generation failed',
    };
  }
  return { imageUrl: json.imageUrl, source: 'live' };
}

/** Proposal engine — live Express + Gemini/fallback, or full client mock */
export async function generatePlan(input: PlannerInput): Promise<GeneratePlanResult> {
  if (shouldMockLiveRoutes()) return mockGeneratePlan(input);
  try {
    return await liveGeneratePlan(input);
  } catch (err) {
    console.warn('generatePlan live failed → mock', err);
    return mockGeneratePlan(input);
  }
}

export async function fetchWeather(location: string): Promise<WeatherResult> {
  if (shouldMockLiveRoutes()) return mockWeather(location);
  try {
    return await liveWeather(location);
  } catch (err) {
    console.warn('fetchWeather live failed → mock', err);
    return mockWeather(location);
  }
}

export async function generateMoodBoard(prompt: string): Promise<MoodBoardResult> {
  if (shouldMockLiveRoutes()) return mockMoodBoard(prompt);
  try {
    return await liveMoodBoard(prompt);
  } catch (err) {
    console.warn('generateMoodBoard live failed → mock', err);
    return mockMoodBoard(prompt);
  }
}

/** No real backend yet — mock until VITE_API_MODE=live + CRM endpoint exists */
export async function checkAvailability(
  req: AvailabilityRequest,
): Promise<AvailabilityResult> {
  if (shouldMockUnbacked()) return mockCheckAvailability(req);

  const res = await fetch(apiUrl('/api/availability'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`availability failed (${res.status})`);
  return { ...(await res.json()), source: 'live' };
}

export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  if (shouldMockUnbacked()) return mockSubmitLead(payload);

  const res = await fetch(apiUrl('/api/leads'), {
    method: 'POST',
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`leads failed (${res.status})`);
  return { ...(await res.json()), source: 'live' };
}

export async function reserveHold(req: ReserveRequest): Promise<ReserveResult> {
  if (shouldMockUnbacked()) return mockReserve(req);

  const res = await fetch(apiUrl('/api/reservations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`reservations failed (${res.status})`);
  return { ...(await res.json()), source: 'live' };
}

/** GPS-scoped local venues — live API with catalog fallback */
export async function fetchNearbyVenues(opts: {
  country?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<NearbyVenuesResult> {
  const q = new URLSearchParams();
  if (opts.country) q.set('country', opts.country);
  if (opts.city) q.set('city', opts.city);
  if (opts.lat != null) q.set('lat', String(opts.lat));
  if (opts.lng != null) q.set('lng', String(opts.lng));

  try {
    if (!shouldMockLiveRoutes()) {
      const res = await fetch(apiUrl(`/api/venues/nearby?${q.toString()}`));
      if (res.ok) {
        const json = await res.json();
        return {
          ok: true,
          countryCode: json.countryCode,
          countryName: json.countryName,
          venues: json.venues,
          source: json.source === 'fallback' ? 'fallback' : 'country',
        };
      }
    }
  } catch (err) {
    console.warn('fetchNearbyVenues live failed → catalog', err);
  }

  const local = resolveNearbyVenues({ country: opts.country, city: opts.city });
  return {
    ok: true,
    countryCode: local.countryCode,
    countryName: local.countryName,
    venues: local.venues,
    source: local.source === 'fallback' ? 'fallback' : 'mock',
  };
}

/** Overseas Explore — day-seeded trending destinations */
export async function fetchTrendingDestinations(
  day?: string,
): Promise<TrendingDestinationsResult> {
  try {
    if (!shouldMockLiveRoutes()) {
      const q = day ? `?day=${encodeURIComponent(day)}` : '';
      const res = await fetch(apiUrl(`/api/explore/destinations${q}`));
      if (res.ok) {
        return (await res.json()) as TrendingDestinationsResult;
      }
    }
  } catch (err) {
    console.warn('fetchTrendingDestinations live failed → local day seed', err);
  }
  return resolveTrendingDestinations(day, 'local');
}
