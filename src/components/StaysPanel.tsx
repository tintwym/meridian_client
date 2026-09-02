import { useMemo, useState } from 'react';
import { BedDouble, Check } from 'lucide-react';
import type { EventType, PackageLineItem, StayOption } from '../types';
import { STAY_OPTIONS } from '../data/stays';
import { stayToLine } from '../lib/packageLines';

interface StaysPanelProps {
  eventType: EventType;
  guestCount: number;
  defaultDate: string;
  locationName: string;
  addedIds: Set<string>;
  onAdd: (line: PackageLineItem) => void;
}

export default function StaysPanel({
  eventType,
  guestCount,
  defaultDate,
  locationName,
  addedIds,
  onAdd,
}: StaysPanelProps) {
  const [nightsById, setNightsById] = useState<Record<string, number>>({});

  const options = useMemo(
    () =>
      STAY_OPTIONS.filter(
        (s) => s.location === 'Both' || s.location === (eventType === 'overseas' ? 'Overseas' : 'Local'),
      ),
    [eventType],
  );

  const addStay = (stay: StayOption) => {
    const nights = nightsById[stay.id] ?? stay.nightsDefault;
    onAdd(stayToLine(stay, guestCount, defaultDate, nights, eventType));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-serif text-base text-navy">Stays</h4>
        <p className="text-xs text-slate mt-1">
          Block hotel or villa nights for {locationName || 'your destination'}. Nights attach to the
          timeline as check-in blocks.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((stay) => {
          const nights = nightsById[stay.id] ?? stay.nightsDefault;
          const estimate = Math.round(
            nights * (stay.pricePerNight + stay.pricePerGuestPerNight * Math.min(guestCount, stay.maxGuests)),
          );
          const added = addedIds.has(stay.id);
          return (
            <article
              key={stay.id}
              className="rounded-2xl border border-navy/10 bg-white overflow-hidden flex flex-col"
            >
              <div
                className="h-32 bg-cover bg-center"
                style={{ backgroundImage: `url(${stay.image})` }}
                role="img"
                aria-label={stay.name}
              />
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-start gap-2">
                  <BedDouble className="w-4 h-4 text-sage mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-serif text-navy text-sm">{stay.name}</h5>
                    <p className="text-[10px] uppercase tracking-wider text-sage font-mono">
                      {stay.neighborhood} · {stay.location}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate leading-relaxed flex-1">{stay.description}</p>
                <ul className="text-[10px] text-slate space-y-0.5">
                  {stay.amenities.slice(0, 3).map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate">
                    Nights
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={nights}
                    onChange={(e) =>
                      setNightsById((prev) => ({
                        ...prev,
                        [stay.id]: Math.max(1, Math.min(14, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-16 rounded-lg border border-navy/15 px-2 py-1 text-sm font-mono"
                  />
                  <span className="ml-auto font-mono text-sm font-bold text-navy">
                    ${estimate.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={added}
                  onClick={() => addStay(stay)}
                  className={`w-full py-2.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-colors ${
                    added
                      ? 'bg-sage/20 text-sage cursor-default'
                      : 'bg-navy text-white hover:bg-sage'
                  }`}
                >
                  {added ? (
                    <span className="inline-flex items-center gap-1 justify-center">
                      <Check className="w-3.5 h-3.5" /> On timeline
                    </span>
                  ) : (
                    'Add stay'
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
