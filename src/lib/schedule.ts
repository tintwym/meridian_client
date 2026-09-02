import type { PackageCategory, PackageLineItem } from '../types';

export function defaultDurationHours(category: PackageCategory): number {
  switch (category) {
    case 'Weddings':
      return 3;
    case 'Dinners':
      return 2.5;
    case 'Corporate':
      return 4;
    case 'Stays':
      return 24;
    case 'Transfers':
      return 1;
    case 'Activities':
    default:
      return 2;
  }
}

export function defaultDurationMinutes(category: PackageCategory): number {
  return Math.round(defaultDurationHours(category) * 60);
}

export function getItemDurationMinutes(item: PackageLineItem): number {
  if (
    typeof item.durationMinutes === 'number' &&
    Number.isFinite(item.durationMinutes) &&
    item.durationMinutes > 0
  ) {
    return Math.round(item.durationMinutes);
  }
  return defaultDurationMinutes(item.category);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function formatMinutes(total: number): string {
  const clamped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getItemWindow(item: PackageLineItem): {
  start: number;
  end: number;
  crossesMidnight: boolean;
} {
  const start = timeToMinutes(item.time);
  const end = start + getItemDurationMinutes(item);
  return { start, end, crossesMidnight: end >= 24 * 60 };
}

export function formatTimeRange(item: PackageLineItem): string {
  const { start, end, crossesMidnight } = getItemWindow(item);
  const endLabel = formatMinutes(end);
  return crossesMidnight
    ? `${formatMinutes(start)}–${endLabel} (+1 day)`
    : `${formatMinutes(start)}–${endLabel}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export interface ScheduleConflict {
  aId: string;
  bId: string;
  aTitle: string;
  bTitle: string;
  date: string;
  location: string;
}

type TimedSlot = {
  item: PackageLineItem;
  absStart: number;
  absEnd: number;
};

function dateToEpochDay(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** Same-day / overnight overlaps by venueKey (or location label when no venue) */
export function findConflicts(items: PackageLineItem[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const byVenue = new Map<string, TimedSlot[]>();

  for (const item of items) {
    // Overnight stay blocks use unique venue keys; skip conflict pairing noise.
    if (item.kind === 'stay') continue;
    const key = item.venueKey || `${item.location}:${item.date}`;
    const day = dateToEpochDay(item.date);
    const { start, end } = getItemWindow(item);
    const slot: TimedSlot = {
      item,
      absStart: day * 24 * 60 + start,
      absEnd: day * 24 * 60 + end,
    };
    const list = byVenue.get(key) ?? [];
    list.push(slot);
    byVenue.set(key, list);
  }

  for (const [, group] of byVenue) {
    const sorted = [...group].sort(
      (a, b) => a.absStart - b.absStart || a.item.id.localeCompare(b.item.id),
    );
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (a.absStart < b.absEnd && b.absStart < a.absEnd) {
          conflicts.push({
            aId: a.item.id,
            bId: b.item.id,
            aTitle: a.item.title,
            bTitle: b.item.title,
            date: a.item.date,
            location: a.item.location,
          });
        }
      }
    }
  }

  return conflicts;
}

export function conflictedItemCount(conflicts: ScheduleConflict[]): number {
  const ids = new Set<string>();
  for (const c of conflicts) {
    ids.add(c.aId);
    ids.add(c.bId);
  }
  return ids.size;
}

export function itemHasConflict(itemId: string, conflicts: ScheduleConflict[]): boolean {
  return conflicts.some((c) => c.aId === itemId || c.bId === itemId);
}

export type DayGroup = {
  date: string;
  items: PackageLineItem[];
};

export function groupByDate(items: PackageLineItem[]): DayGroup[] {
  const map = new Map<string, PackageLineItem[]>();
  for (const item of expandStaysAcrossNights(items)) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayItems]) => ({
      date,
      items: [...dayItems].sort(
        (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time) || a.title.localeCompare(b.title),
      ),
    }));
}

/**
 * Expand a multi-night stay into one timeline row per night (virtual ids: `${id}#n${i}`).
 * Price stays on night 0 only so totals aren't double-counted when displaying.
 */
export function expandStaysAcrossNights(items: PackageLineItem[]): PackageLineItem[] {
  const out: PackageLineItem[] = [];
  for (const item of items) {
    const nights = item.kind === 'stay' ? Math.max(1, item.nights ?? 1) : 1;
    if (item.kind !== 'stay' || nights <= 1) {
      out.push(item);
      continue;
    }
    for (let i = 0; i < nights; i++) {
      const nightDate = addDaysISO(item.date, i);
      const label =
        i === 0
          ? `${baseStayTitle(item.title)} · check-in`
          : i === nights - 1
            ? `${baseStayTitle(item.title)} · night ${i + 1} / check-out eve`
            : `${baseStayTitle(item.title)} · night ${i + 1}`;
      out.push({
        ...item,
        id: `${item.id}#n${i}`,
        title: label,
        date: nightDate,
        time: i === 0 ? item.time || '15:00' : '12:00',
        durationMinutes: 24 * 60,
        calculatedPrice: i === 0 ? item.calculatedPrice : 0,
        notes:
          i === 0
            ? item.notes
            : `Part of ${nights}-night stay (price on check-in). ${item.notes}`.trim(),
      });
    }
  }
  return out;
}

function baseStayTitle(title: string): string {
  return title.replace(/\s*\(\d+\s*nights?\)\s*$/i, '').trim();
}

/** Resolve virtual night id back to the stored package line id. */
export function rootPackageLineId(id: string): string {
  const idx = id.indexOf('#n');
  return idx >= 0 ? id.slice(0, idx) : id;
}

export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Map month name + year to a mid-month ISO date for seeding */
export function monthToSeedDate(monthName: string, year = new Date().getFullYear() + 1): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const idx = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
  const m = idx >= 0 ? idx + 1 : 9;
  return `${year}-${String(m).padStart(2, '0')}-15`;
}

export function parseClockTime(raw: string): string {
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return '10:00';
  let h = parseInt(match[1], 10);
  const mins = match[2];
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mins}`;
}
