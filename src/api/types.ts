/**
 * Meridian API contracts — stable shapes for mock today, real backend tomorrow.
 */

import type { EventPlanResponse, PlannerInput } from '../types';

export type ApiMode = 'mock' | 'live' | 'auto';

export type ApiSource = 'mock' | 'live' | 'fallback';

export interface WeatherEstimate {
  locationName: string;
  stationName: string;
  stationLat: number;
  stationLng: number;
  currentTemp: number;
  condition: string;
  humidity: number;
  windSpeed: string;
  forecast: { day: string; temp: number; condition: string }[];
}

export interface WeatherResult {
  data: WeatherEstimate;
  source: ApiSource;
  note?: string;
}

export interface GeneratePlanResult {
  plan: EventPlanResponse;
  source: ApiSource;
}

export interface MoodBoardResult {
  imageUrl: string | null;
  source: ApiSource;
  error?: string;
}

export interface AvailabilityRequest {
  eventType: string;
  locationType: string;
  guestCount: string;
}

export interface AvailabilityResult {
  available: boolean;
  slotsNote: string;
  packageName: string;
  source: ApiSource;
}

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  date?: string;
  budget?: string;
  vision?: string;
  planTitle?: string;
  planTagline?: string;
  redeemPoints?: number;
}

export interface LeadResult {
  ok: boolean;
  id: string;
  source: ApiSource;
  message: string;
  status?: string;
  pointsRedeemed?: number;
  creditAppliedUsd?: number;
  club?: {
    points: number;
    creditUsd: number;
    redeemRate: number;
  } | null;
}

export interface ReserveRequest {
  email: string;
  availability: AvailabilityResult;
}

export interface ReserveResult {
  ok: boolean;
  confirmationId: string;
  source: ApiSource;
  message: string;
}

export interface NearbyVenue {
  id: string;
  name: string;
  localCategory: 'hotel' | 'beach' | 'resort' | 'restaurant';
  city: string;
  countryCode: string;
  mapQuery: string;
  tag?: string;
  imageUrl?: string;
}

export interface NearbyVenuesResult {
  ok: boolean;
  countryCode: string;
  countryName: string;
  venues: NearbyVenue[];
  source: 'country' | 'fallback' | 'mock';
}

export type { EventPlanResponse, PlannerInput };
