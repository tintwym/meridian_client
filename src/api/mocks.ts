import type { EventPlanResponse, PlannerInput } from '../types';
import { buildWeatherEstimate } from '../data/weatherStations';
import type {
  AvailabilityRequest,
  AvailabilityResult,
  LeadPayload,
  LeadResult,
  MoodBoardResult,
  ReserveRequest,
  ReserveResult,
  WeatherResult,
  GeneratePlanResult,
} from './types';

function delay(ms = 450) {
  return new Promise((r) => setTimeout(r, ms));
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function mockGeneratePlan(input: PlannerInput): Promise<GeneratePlanResult> {
  await delay(600);
  const isLocal = input.eventType === 'local';
  const location =
    input.locationName || (isLocal ? 'Heritage Coastal Estate' : 'Santorini Cliffside Sanctuary');

  const plan: EventPlanResponse = {
    title: isLocal ? 'Curated Local Celebration Blueprint' : 'Destination Horizon Proposal',
    tagline: `A mock Meridian proposal for ${input.guestCount} guests · ${input.targetMonth}`,
    location,
    estimatedBudgetRange: input.guestCount > 150 ? '$45,000 – $95,000' : '$18,000 – $45,000',
    itinerary: [
      {
        time: '3:00 PM',
        activity: 'Guest Arrival & Welcome',
        description: 'Champagne greeting and soft acoustic ambience.',
      },
      {
        time: '4:30 PM',
        activity: 'Ceremony / Keynote Moment',
        description: 'Primary gathering framed by floral architecture.',
      },
      {
        time: '6:00 PM',
        activity: 'Cocktail Hour',
        description: 'Canapés and signature drinks on terrace.',
      },
      {
        time: '7:30 PM',
        activity: 'Seated Celebration Dinner',
        description: `${input.cateringStyle.replace(/_/g, ' ')} service for ${input.guestCount} guests.`,
      },
      {
        time: '10:00 PM',
        activity: 'Late Evening Send-Off',
        description: 'Dessert station and curated exit moment.',
      },
    ],
    cateringMenu: [
      {
        category: 'Appetizers',
        name: 'Garden Crudo Selection',
        description: 'Seasonal citrus, herbs, and artisan oils.',
      },
      {
        category: 'Mains',
        name: 'Herb-Crusted Catch or Local Roast',
        description: 'Dual entrée designed for mixed dietary notes.',
      },
      {
        category: 'Desserts',
        name: 'Champagne Sabayon & Berries',
        description: 'Light finish with edible florals.',
      },
    ],
    message: {
      invitationSubject: `You're invited — ${location}`,
      invitationBody: `Dear Guest,\n\nWe would be honored by your presence at our ${input.targetMonth} celebration in ${location}.\n\nWith warmth,\nYour Hosts`,
      rsvpDeadlineNote: 'Kindly RSVP within 21 days.',
    },
    weatherForecast: {
      conditions: 'Mild & clear',
      temperatureAvg: '24°C',
      advice: 'Ideal for outdoor segments with light evening wrap recommended.',
      indoorContingencyNeeded: false,
      contingencyPlan: 'Adjacent salon held on soft hold for wind or rain.',
    },
    eventChecklist: [
      'Confirm guest count and dietary matrix',
      'Lock ceremony / reception floor plan',
      'Finalize floral & lighting mood board',
      'Schedule rehearsal walkthrough',
      'Issue vendor call sheet',
    ],
    generationSource: 'fallback',
  };

  return { plan, source: 'mock' };
}

export async function mockWeather(location: string): Promise<WeatherResult> {
  await delay(350);
  const data = buildWeatherEstimate(location || 'Santorini, Greece');
  return {
    data,
    source: 'mock',
    note: 'Mock weather estimate — swap to live backend when ready.',
  };
}

export async function mockMoodBoard(_prompt: string): Promise<MoodBoardResult> {
  await delay(400);
  return {
    imageUrl: null,
    source: 'mock',
    error: 'Mood boards need a live Gemini backend. Set VITE_API_MODE=live with GEMINI_API_KEY.',
  };
}

export async function mockCheckAvailability(
  req: AvailabilityRequest,
): Promise<AvailabilityResult> {
  await delay(700);
  const loc = req.locationType === 'Destination' ? 'Horizon' : 'Heritage';
  return {
    available: true,
    packageName: `${loc} Elite ${req.eventType}`,
    slotsNote:
      req.locationType === 'Local'
        ? 'Only 3 curated dates left for Autumn 2026'
        : 'Booking window open for Spring/Summer 2027',
    source: 'mock',
  };
}

export async function mockSubmitLead(payload: LeadPayload): Promise<LeadResult> {
  await delay(500);
  const stored = JSON.parse(localStorage.getItem('meridian_mock_leads') || '[]') as LeadPayload[];
  stored.push({ ...payload });
  localStorage.setItem('meridian_mock_leads', JSON.stringify(stored.slice(-50)));
  return {
    ok: true,
    id: id('lead'),
    source: 'mock',
    message: 'Lead saved locally (mock). Will POST to CRM when backend is live.',
  };
}

export async function mockReserve(req: ReserveRequest): Promise<ReserveResult> {
  await delay(400);
  const key = 'meridian_mock_reserves';
  const stored = JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
  const confirmationId = id('rsvp');
  stored.push({ ...req, confirmationId, at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(stored.slice(-50)));
  return {
    ok: true,
    confirmationId,
    source: 'mock',
    message: `Hold confirmed (mock) · ${confirmationId}`,
  };
}
