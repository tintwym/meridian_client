import { useEffect, useState } from 'react';
import { fetchTrendingDestinations } from '../api';
import type { ExploreDestinationDto, TrendingDestinationsResult } from '../data/exploreDestinations';
import { resolveTrendingDestinations } from '../data/exploreDestinations';

export function useTrendingDestinations() {
  const [data, setData] = useState<TrendingDestinationsResult>(() =>
    resolveTrendingDestinations(undefined, 'local'),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await fetchTrendingDestinations();
        if (!cancelled) setData(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    day: data.day,
    label: data.label,
    destinations: data.destinations as ExploreDestinationDto[],
    loading,
    source: data.source,
  };
}
