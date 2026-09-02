/**
 * Browser geolocation → country / city for Local venue suggestions.
 */

export type GeoLocale = {
  lat: number;
  lng: number;
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
};

export type GeoFailureReason = 'denied' | 'unavailable' | 'timeout' | 'error';

export type GeoRequestResult =
  | { ok: true; locale: GeoLocale }
  | { ok: false; reason: GeoFailureReason };

/** Session cache so multiple Local sections don't re-prompt GPS / re-geocode. */
let cachedResult: GeoRequestResult | null = null;
let inflight: Promise<GeoRequestResult> | null = null;

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation unavailable'), { code: 0 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      // Shorter timeout — iOS Safari often hangs near the old 12s limit when denied/slow.
      timeout: 6000,
      maximumAge: 30 * 60 * 1000,
    });
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<{
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
}> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('reverse geocode failed');
    const json = (await res.json()) as {
      address?: {
        country_code?: string;
        country?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
      };
    };
    const a = json.address || {};
    return {
      countryCode: a.country_code ? a.country_code.toUpperCase() : null,
      countryName: a.country || null,
      city: a.city || a.town || a.village || a.state || null,
    };
  } catch {
    return { countryCode: null, countryName: null, city: null };
  }
}

function failureReason(err: unknown): GeoFailureReason {
  if (typeof err === 'object' && err && 'code' in err) {
    const code = Number((err as { code: number }).code);
    if (code === 1) return 'denied';
    if (code === 3) return 'timeout';
    if (code === 0) return 'unavailable';
  }
  if (typeof navigator !== 'undefined' && !navigator.geolocation) return 'unavailable';
  return 'error';
}

async function resolveLocalCountry(): Promise<GeoRequestResult> {
  try {
    const pos = await getPosition();
    const { latitude: lat, longitude: lng } = pos.coords;
    const place = await reverseGeocode(lat, lng);
    return {
      ok: true,
      locale: {
        lat,
        lng,
        countryCode: place.countryCode,
        countryName: place.countryName,
        city: place.city,
      },
    };
  } catch (err) {
    return { ok: false, reason: failureReason(err) };
  }
}

/** Request location when user chooses Local. Never throws. Deduped per session. */
export async function requestLocalCountry(): Promise<GeoRequestResult> {
  if (cachedResult) return cachedResult;
  if (inflight) return inflight;

  inflight = resolveLocalCountry().then((result) => {
    cachedResult = result;
    inflight = null;
    return result;
  });

  return inflight;
}
