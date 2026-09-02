import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchNearbyVenues } from '../api';
import type { NearbyVenue } from '../api/types';
import { requestLocalCountry, type GeoFailureReason } from '../lib/geo';

export type NearbyLocationState = 'idle' | 'loading' | 'granted' | GeoFailureReason;

export function useNearbyVenues(enabled: boolean) {
  const [venues, setVenues] = useState<NearbyVenue[]>([]);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompted, setPrompted] = useState(false);
  const [locationState, setLocationState] = useState<NearbyLocationState>('idle');
  const [usingFallback, setUsingFallback] = useState(false);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? hasLoadedRef.current;
    if (!silent) {
      setLoading(true);
      setLocationState('loading');
    }
    setPrompted(true);
    try {
      const geo = await requestLocalCountry();
      if (geo.ok) {
        setLocationState('granted');
        const result = await fetchNearbyVenues({
          country: geo.locale.countryCode,
          city: geo.locale.city,
          lat: geo.locale.lat,
          lng: geo.locale.lng,
        });
        setVenues(result.venues);
        setCountryName(result.countryName);
        setCountryCode(result.countryCode);
        setUsingFallback(result.source === 'fallback' || result.source === 'mock');
      } else {
        setLocationState(geo.reason);
        const result = await fetchNearbyVenues({});
        setVenues(result.venues);
        setCountryName(result.countryName);
        setCountryCode(result.countryCode);
        setUsingFallback(true);
      }
      hasLoadedRef.current = true;
    } catch {
      setLocationState('error');
      try {
        const result = await fetchNearbyVenues({});
        setVenues(result.venues);
        setCountryName(result.countryName);
        setCountryCode(result.countryCode);
        setUsingFallback(true);
        hasLoadedRef.current = true;
      } catch {
        setVenues([]);
        setCountryName(null);
        setCountryCode(null);
        setUsingFallback(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // First load shows loading; re-enable (e.g. Local ↔ Overseas) stays silent.
    void refresh({ silent: hasLoadedRef.current });
  }, [enabled, refresh]);

  return {
    venues,
    countryName,
    countryCode,
    loading,
    prompted,
    locationState,
    usingFallback,
    refresh: () => refresh({ silent: false }),
  };
}
