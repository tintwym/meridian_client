import { useEffect, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface DestinationMapProps {
  locationName: string;
  /** Optional catalog map query override (e.g. hotel name). */
  mapQuery?: string;
  className?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Venue / destination map via OpenStreetMap (no API key).
 * Falls back to a search link if geocoding fails.
 */
export default function DestinationMap({
  locationName,
  mapQuery,
  className = '',
}: DestinationMapProps) {
  const query = (mapQuery || locationName || 'luxury event venue').trim();
  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

    fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        // Nominatim usage policy requires a identifying User-Agent.
        'User-Agent': 'MeridianAtelier/0.1 (event-planner; local-dev)',
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Geocode failed');
        return r.json() as Promise<NominatimResult[]>;
      })
      .then((results) => {
        if (cancelled) return;
        const hit = results[0];
        if (!hit) {
          setCoords(null);
          setError('Map pin unavailable — open search instead.');
          return;
        }
        setCoords({
          lat: parseFloat(hit.lat),
          lon: parseFloat(hit.lon),
          label: hit.display_name,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setCoords(null);
          setError('Map pin unavailable — open search instead.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query]);

  const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
  const delta = 0.04;
  const embedUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - delta}%2C${coords.lat - delta}%2C${coords.lon + delta}%2C${coords.lat + delta}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`
    : null;

  return (
    <div className={`rounded-2xl border border-navy/10 bg-white overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-navy/10">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-sage shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-navy">Destination map</p>
            <p className="text-xs text-slate truncate">{coords?.label || query}</p>
          </div>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-sage hover:text-navy shrink-0"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading && (
        <div className="h-48 flex items-center justify-center text-xs text-slate bg-champagne/40">
          Locating {query}…
        </div>
      )}

      {!loading && embedUrl && (
        <iframe
          title={`Map of ${query}`}
          src={embedUrl}
          className="w-full h-52 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {!loading && !embedUrl && (
        <div className="h-40 flex flex-col items-center justify-center gap-2 px-4 bg-champagne/40 text-center">
          <p className="text-xs text-slate">{error || 'Map unavailable offline.'}</p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-wider font-bold text-navy underline"
          >
            Search on OpenStreetMap
          </a>
        </div>
      )}
    </div>
  );
}
