/**
 * Marketing + AI API routes shared by Docker (`server.ts`) and Vercel (`vercelApp.ts`).
 */

import type { Express } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  buildWeatherEstimate,
  mergeWeatherPayload,
  type WeatherEstimatePayload,
} from '../data/weatherStations';
import { resolveNearbyVenues } from '../data/venuesByCountry';
import { resolveTrendingDestinations } from '../data/exploreDestinations';
import * as platformStore from './platformStore';
import { getFallbackPlan } from './fallbackPlan';
import {
  GEMINI_IMAGE_MODEL,
  GEMINI_PLAN_MODEL,
  GEMINI_WEATHER_MODEL,
} from './geminiModels';
import { rateLimit } from './rateLimit';

export function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': process.env.VERCEL ? 'meridian-vercel' : 'meridian-atelier',
        },
      },
    });
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    return null;
  }
}

type WeatherPayload = WeatherEstimatePayload;
const weatherCache = new Map<
  string,
  { data: WeatherPayload; cachedAt: number; fallback: boolean }
>();
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const WEATHER_FALLBACK_TTL_MS = 45 * 1000;
let weatherQuotaCooldownUntil = 0;

const weatherSchema = {
  type: Type.OBJECT,
  properties: {
    locationName: { type: Type.STRING },
    stationName: { type: Type.STRING },
    stationLat: { type: Type.NUMBER },
    stationLng: { type: Type.NUMBER },
    currentTemp: { type: Type.NUMBER },
    condition: { type: Type.STRING },
    humidity: { type: Type.NUMBER },
    windSpeed: { type: Type.STRING },
    forecast: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          temp: { type: Type.NUMBER },
          condition: { type: Type.STRING },
        },
        required: ['day', 'temp', 'condition'],
      },
    },
  },
  required: [
    'locationName',
    'stationName',
    'stationLat',
    'stationLng',
    'currentTemp',
    'condition',
    'humidity',
    'windSpeed',
    'forecast',
  ],
};

const leadsLimit = rateLimit(20, 60 * 60 * 1000);

export function mountMeridianApiRoutes(
  app: Express,
  deps: { getAi: () => GoogleGenAI | null },
) {
  app.post('/api/generate-plan', async (req, res) => {
    const input = req.body;
    const ai = deps.getAi();

    if (!ai) {
      const mockPlan = getFallbackPlan(input);
      mockPlan.generationSource = 'fallback';
      return res.json(mockPlan);
    }

    try {
      const isLocal = input.eventType === 'local';
      const categoryName = isLocal ? input.localCategory : input.overseasCategory;
      const cateringText = input.cateringStyle?.replace(/_/g, ' ') || 'fine dining';
      const messageText = input.messageStyle?.replace(/_/g, ' ') || 'romantic';

      const prompt = `Generate a comprehensive, bespoke event planning proposal for a ${input.eventType} event.
Input Details:
- Location / Target Destination Name: ${input.locationName || (isLocal ? 'Local Oceanfront' : 'Coastal Tuscany')}
- Event Category: ${categoryName} (For Local: hotels, beach, resorts, restaurants. For Overseas: air ticket, hotel, wedding ceremony)
- Guest Count: ${input.guestCount}
- Catering/Food Style: ${cateringText}
- Message Style / Tone: ${messageText}
- Target Month/Season: ${input.targetMonth}
- Special Requests & Notes: ${input.specialNotes || 'None'}

Please construct:
1. An elegant event title and custom romantic/professional tagline.
2. An estimated budget range based on guest count and premium planning requirements.
3. A detailed itinerary (5 items max) with realistic times and luxurious descriptions.
4. A custom culinary menu matching the theme (2 Appetizers, 1 Main, 1 Dessert, 1 Beverage).
5. A custom drafted invitation message and RSVP guidelines.
6. A weather forecast and advice tailored to the location in "${input.targetMonth}", including a detailed weather-contingency plan (specify indoor options).
7. A specific event checklist for the host.`;

      const response = await ai.models.generateContent({
        model: GEMINI_PLAN_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a world-class luxury event planning coordinator for both local (resorts, beaches, restaurants, hotels) and overseas destinations (handling air travel, luxury hotels, and majestic wedding ceremonies). You write detailed, evocative, highly professional event plans with delicious curated menus, beautiful written invitations, precise localized weather forecasts, and clear contingency guidelines. Respond strictly in valid JSON matching the exact schema properties.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tagline: { type: Type.STRING },
              location: { type: Type.STRING },
              estimatedBudgetRange: { type: Type.STRING },
              itinerary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    activity: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['time', 'activity', 'description'],
                },
              },
              cateringMenu: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description: 'Must be one of: Appetizers, Mains, Desserts, Beverages',
                    },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['category', 'name', 'description'],
                },
              },
              message: {
                type: Type.OBJECT,
                properties: {
                  invitationSubject: { type: Type.STRING },
                  invitationBody: { type: Type.STRING },
                  rsvpDeadlineNote: { type: Type.STRING },
                },
                required: ['invitationSubject', 'invitationBody', 'rsvpDeadlineNote'],
              },
              weatherForecast: {
                type: Type.OBJECT,
                properties: {
                  conditions: { type: Type.STRING },
                  temperatureAvg: { type: Type.STRING },
                  advice: { type: Type.STRING },
                  indoorContingencyNeeded: { type: Type.BOOLEAN },
                  contingencyPlan: { type: Type.STRING },
                },
                required: [
                  'conditions',
                  'temperatureAvg',
                  'advice',
                  'indoorContingencyNeeded',
                  'contingencyPlan',
                ],
              },
              eventChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'title',
              'tagline',
              'location',
              'estimatedBudgetRange',
              'itinerary',
              'cateringMenu',
              'message',
              'weatherForecast',
              'eventChecklist',
            ],
          },
        },
      });

      const parsedData = JSON.parse((response.text ?? '{}').trim());
      parsedData.generationSource = 'ai';
      res.json(parsedData);
    } catch (error) {
      console.error('Gemini Generation Error:', error);
      const mockPlan = getFallbackPlan(input);
      mockPlan.generationSource = 'fallback';
      res.json(mockPlan);
    }
  });

  app.post('/api/leads', leadsLimit, async (req, res) => {
    try {
      const user = await platformStore.getUserByToken(req.header('authorization') || undefined);
      const result = await platformStore.createInquiry(req.body || {}, user);
      res.json({ ...result, source: 'live' });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/availability', (req, res) => {
    const { eventType, locationType } = req.body || {};
    const loc = locationType === 'Destination' ? 'Horizon' : 'Heritage';
    res.json({
      available: true,
      packageName: `${loc} Elite ${eventType || 'Event'}`,
      slotsNote:
        locationType === 'Local'
          ? 'Only 3 curated dates left for Autumn 2026'
          : 'Booking window open for Spring/Summer 2027',
      source: 'live',
    });
  });

  app.get('/api/venues/nearby', (req, res) => {
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const resolved = resolveNearbyVenues({ country, city });
    res.json({
      ok: true,
      countryCode: resolved.countryCode,
      countryName: resolved.countryName,
      venues: resolved.venues,
      source: resolved.source,
    });
  });

  app.get('/api/explore/destinations', (req, res) => {
    const day = typeof req.query.day === 'string' ? req.query.day : undefined;
    res.json(resolveTrendingDestinations(day, 'live'));
  });

  app.post('/api/reservations', (req, res) => {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok: false, error: 'email required' });
    }
    const confirmationId = `rsvp_${Date.now().toString(36)}`;
    res.json({
      ok: true,
      confirmationId,
      source: 'live',
      message: `Hold confirmed · ${confirmationId}`,
    });
  });

  app.get('/api/weather', async (req, res) => {
    let location = 'Santorini, Greece';
    try {
      location = (req.query.location as string) || 'Santorini, Greece';
      const cacheKey = location.trim().toLowerCase();
      const cached = weatherCache.get(cacheKey);
      const now = Date.now();
      const fallback = () => buildWeatherEstimate(location);
      const ai = deps.getAi();

      if (cached) {
        const ttl = cached.fallback ? WEATHER_FALLBACK_TTL_MS : WEATHER_CACHE_TTL_MS;
        if (now - cached.cachedAt < ttl) {
          return res.json({
            success: false,
            fallback: true,
            error:
              'Model weather estimate (not a live station feed). Use for planning context only.',
            data: mergeWeatherPayload(fallback(), cached.data),
          });
        }
      }

      if (now < weatherQuotaCooldownUntil || !ai) {
        const data = mergeWeatherPayload(fallback(), cached?.data ?? {});
        return res.json({
          success: false,
          fallback: true,
          error: !ai
            ? 'Gemini unavailable. Showing a regional estimate.'
            : 'Weather API rate limit reached. Showing an estimate.',
          data,
        });
      }

      const promptText = `Provide a realistic seasonal weather estimate and 3-day outlook for "${location}" (not live observations). Temperatures in Celsius. Include a plausible nearest weather station name plus stationLat/stationLng. Wind as a string with km/h. Return only JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: GEMINI_WEATHER_MODEL,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: weatherSchema,
        },
      });

      const textOutput = response.text?.trim() || '{}';
      const parsedData = JSON.parse(textOutput) as Partial<WeatherPayload>;
      const data = mergeWeatherPayload(fallback(), parsedData);
      weatherCache.set(cacheKey, { data, cachedAt: now, fallback: true });
      res.json({
        success: false,
        fallback: true,
        error:
          'Model weather estimate (not a live station feed). Use for planning context only.',
        data,
      });
    } catch (error: unknown) {
      const message = String(error instanceof Error ? error.message : error);
      const isQuota =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('quota');

      if (isQuota) {
        weatherQuotaCooldownUntil = Date.now() + 60 * 1000;
      }

      console.warn(`Weather API failed for ${location}. Using fallback. (${message})`);
      const data = buildWeatherEstimate(location);
      weatherCache.set(location.trim().toLowerCase(), {
        data,
        cachedAt: Date.now(),
        fallback: true,
      });
      res.json({
        success: false,
        fallback: true,
        error: isQuota
          ? 'Weather API quota exceeded. Showing an estimate.'
          : 'Live weather unavailable. Showing an estimate.',
        data,
      });
    }
  });

  app.post('/api/gemini/generate-image', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt is required' });
      }
      const ai = deps.getAi();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'GEMINI_API_KEY not configured. Mood boards require a live Gemini key.',
        });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: {
          parts: [
            {
              text: `${prompt}. Ultra-luxurious, premium wedding/dinner/event mood board concept, photorealistic, architectural digest style, warm lighting.`,
            },
          ],
        },
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ success: true, imageUrl });
      } else {
        res.status(500).json({
          success: false,
          error: 'Gemini did not return image data. Try again or check model access.',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate image';
      console.error(`Mood board error: ${message}`);
      res.status(500).json({ success: false, error: message });
    }
  });
}
