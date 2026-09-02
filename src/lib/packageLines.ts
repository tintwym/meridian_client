import type { LineKind, PackageLineItem, StayOption, TransferOption, EventType, PackageLocation } from '../types';
import { linePrice } from '../lib/pricing';
import { addDaysISO } from '../lib/schedule';

function uid() {
  return `pkg_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveLocation(
  optionLoc: PackageLocation,
  eventType: EventType,
): Exclude<PackageLocation, 'Both'> {
  if (optionLoc === 'Both') return eventType === 'overseas' ? 'Overseas' : 'Local';
  return optionLoc;
}

export function stayToLine(
  stay: StayOption,
  guests: number,
  checkInDate: string,
  nights: number,
  eventType: EventType,
): PackageLineItem {
  const capped = Math.min(guests, stay.maxGuests);
  const n = Math.max(1, nights);
  const loc = resolveLocation(stay.location, eventType);
  const calculatedPrice = Math.round(
    n * (stay.pricePerNight + stay.pricePerGuestPerNight * capped),
  );
  return {
    id: uid(),
    activityId: stay.id,
    title: `${stay.name} (${n} night${n === 1 ? '' : 's'})`,
    location: loc,
    category: 'Stays',
    date: checkInDate,
    time: '15:00',
    guests: capped,
    notes: `${stay.neighborhood} · check-out ${addDaysISO(checkInDate, n)} 11:00 · ${stay.description}`,
    basePrice: stay.pricePerNight * n,
    pricePerGuest: stay.pricePerGuestPerNight * n,
    calculatedPrice,
    durationMinutes: n * 24 * 60,
    kind: 'stay',
    nights: n,
    mapQuery: stay.mapQuery,
    venueKey: `stay:${stay.id}`,
  };
}

export function transferToLine(
  transfer: TransferOption,
  guests: number,
  date: string,
  time: string,
  eventType: EventType,
): PackageLineItem {
  const capped = Math.min(guests, transfer.maxGuests);
  const loc = resolveLocation(transfer.location, eventType);
  return {
    id: uid(),
    activityId: transfer.id,
    title: transfer.title,
    location: loc,
    category: 'Transfers',
    date,
    time,
    guests: capped,
    notes: `${transfer.fromLabel} → ${transfer.toLabel} · ${transfer.vehicle} · ${transfer.description}`,
    basePrice: transfer.basePrice,
    pricePerGuest: transfer.pricePerGuest,
    calculatedPrice: linePrice(transfer.basePrice, transfer.pricePerGuest, capped),
    durationMinutes: transfer.durationMinutes,
    kind: 'transfer',
    fromLabel: transfer.fromLabel,
    toLabel: transfer.toLabel,
    venueKey: `xfer:${transfer.id}`,
  };
}

export function kindLabel(kind?: LineKind, fallback = 'Event'): string {
  switch (kind) {
    case 'experience':
      return 'Experience';
    case 'stay':
      return 'Stay';
    case 'transfer':
      return 'Transfer';
    case 'event':
      return 'Event';
    default:
      return fallback;
  }
}
