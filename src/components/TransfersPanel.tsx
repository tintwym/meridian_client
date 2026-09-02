import { useMemo, useState } from 'react';
import { Car, Check } from 'lucide-react';
import type { EventType, PackageLineItem, TransferOption } from '../types';
import { TRANSFER_OPTIONS } from '../data/transfers';
import { transferToLine } from '../lib/packageLines';
import { linePrice } from '../lib/pricing';

interface TransfersPanelProps {
  eventType: EventType;
  guestCount: number;
  defaultDate: string;
  addedIds: Set<string>;
  onAdd: (line: PackageLineItem) => void;
}

const DEFAULT_TIMES: Record<string, string> = {
  'xfer-airport-hotel': '10:00',
  'xfer-hotel-venue': '14:30',
  'xfer-venue-reception': '17:00',
  'xfer-late-return': '23:00',
  'xfer-hotel-airport': '09:00',
};

export default function TransfersPanel({
  eventType,
  guestCount,
  defaultDate,
  addedIds,
  onAdd,
}: TransfersPanelProps) {
  const [timeById, setTimeById] = useState<Record<string, string>>({});

  const options = useMemo(() => TRANSFER_OPTIONS, []);

  const addTransfer = (xfer: TransferOption) => {
    const time = timeById[xfer.id] ?? DEFAULT_TIMES[xfer.id] ?? '12:00';
    onAdd(transferToLine(xfer, guestCount, defaultDate, time, eventType));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-serif text-base text-navy">Transfers</h4>
        <p className="text-xs text-slate mt-1">
          Airport, venue, and hotel logistics legs — timed onto your day timeline.
        </p>
      </div>
      <div className="space-y-3">
        {options.map((xfer) => {
          const time = timeById[xfer.id] ?? DEFAULT_TIMES[xfer.id] ?? '12:00';
          const estimate = linePrice(
            xfer.basePrice,
            xfer.pricePerGuest,
            Math.min(guestCount, xfer.maxGuests),
          );
          const added = addedIds.has(xfer.id);
          return (
            <article
              key={xfer.id}
              className="rounded-2xl border border-navy/10 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Car className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-1">
                  <h5 className="font-serif text-navy text-sm">{xfer.title}</h5>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-sage">
                    {xfer.fromLabel} → {xfer.toLabel} · {xfer.durationMinutes} min · {xfer.vehicle}
                  </p>
                  <p className="text-xs text-slate leading-relaxed">{xfer.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTimeById((prev) => ({ ...prev, [xfer.id]: e.target.value }))
                    }
                    className="rounded-lg border border-navy/15 px-2 py-1 text-sm font-mono"
                  />
                </div>
                <p className="font-mono text-sm font-bold text-navy">${estimate.toLocaleString()}</p>
                <button
                  type="button"
                  disabled={added}
                  onClick={() => addTransfer(xfer)}
                  className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold transition-colors ${
                    added
                      ? 'bg-sage/20 text-sage cursor-default'
                      : 'bg-navy text-white hover:bg-sage'
                  }`}
                >
                  {added ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    'Add transfer'
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
