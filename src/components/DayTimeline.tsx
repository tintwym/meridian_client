import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import type { PackageLineItem } from '../types';
import {
  type DayGroup,
  type ScheduleConflict,
  conflictedItemCount,
  formatDisplayDate,
  formatTimeRange,
  itemHasConflict,
} from '../lib/schedule';

interface DayTimelineProps {
  groups: DayGroup[];
  conflicts: ScheduleConflict[];
  onRemove?: (id: string) => void;
}

export default function DayTimeline({ groups, conflicts, onRemove }: DayTimelineProps) {
  if (groups.length === 0) {
    return (
      <p className="text-xs text-slate italic py-4">
        Add catalog items or custom lines to build your day timeline.
      </p>
    );
  }

  const conflicted = conflictedItemCount(conflicts);

  return (
    <div className="space-y-4" id="day-timeline-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-base text-navy">Day Timeline</h3>
          <p className="text-[10px] uppercase tracking-wider font-mono text-slate mt-0.5">
            Durations · venue overlaps flagged
          </p>
        </div>
        {conflicted > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            {conflicted} conflict{conflicted === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {conflicts.length > 0 && (
        <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3" aria-label="Schedule conflicts">
          {conflicts.map((c) => (
            <li key={`${c.aId}-${c.bId}`} className="text-xs text-amber-900">
              <span className="font-semibold">{formatDisplayDate(c.date)}</span> ({c.location}):{' '}
              <span className="font-medium">{c.aTitle}</span> overlaps{' '}
              <span className="font-medium">{c.bTitle}</span>
            </li>
          ))}
        </ul>
      )}

      {groups.map((group) => (
        <div key={group.date} className="space-y-2">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-sage font-bold">
            {formatDisplayDate(group.date)}
          </h4>
          <ul className="space-y-2 border-l border-sage/30 pl-4 ml-1">
            {group.items.map((item: PackageLineItem) => {
              const hasConflict = itemHasConflict(item.id, conflicts);
              return (
                <li
                  key={item.id}
                  className={`relative rounded-xl border p-3 ${
                    hasConflict
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-navy/10 bg-white'
                  }`}
                >
                  <div className="absolute -left-5.25 top-4 w-2.5 h-2.5 rounded-full bg-navy border-2 border-white" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-sage">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeRange(item)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                        {item.kind === 'experience' && (
                          <span className="bg-sage/15 text-sage px-1.5 py-0.5 rounded-full uppercase font-bold">
                            Experience
                          </span>
                        )}
                        {item.kind === 'stay' && (
                          <span className="bg-navy/10 text-navy px-1.5 py-0.5 rounded-full uppercase font-bold">
                            Stay{item.nights ? ` · ${item.nights}n` : ''}
                          </span>
                        )}
                        {item.kind === 'transfer' && (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase font-bold">
                            Transfer
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-serif text-navy font-semibold truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate">
                        {item.guests} guests
                        {item.calculatedPrice > 0
                          ? ` · $${item.calculatedPrice.toLocaleString()}`
                          : item.kind === 'stay'
                            ? ' · stay night'
                            : ''}
                      </p>
                    </div>
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="text-[10px] uppercase tracking-wider text-slate hover:text-navy font-bold shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
