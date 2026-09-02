import type { PackageLineItem } from '../types';

export const DEPOSIT_PCT = 0.25;

export function isExperience(item: PackageLineItem): boolean {
  return item.kind === 'experience';
}

export function isStay(item: PackageLineItem): boolean {
  return item.kind === 'stay';
}

export function isTransfer(item: PackageLineItem): boolean {
  return item.kind === 'transfer';
}

export interface PackageTotals {
  eventsTotal: number;
  experiencesTotal: number;
  staysTotal: number;
  transfersTotal: number;
  grandTotal: number;
  depositPct: number;
  deposit: number;
  eventCount: number;
  experienceCount: number;
  stayCount: number;
  transferCount: number;
  itemCount: number;
}

export function computePackageTotals(itinerary: PackageLineItem[]): PackageTotals {
  let eventsTotal = 0;
  let experiencesTotal = 0;
  let staysTotal = 0;
  let transfersTotal = 0;
  let eventCount = 0;
  let experienceCount = 0;
  let stayCount = 0;
  let transferCount = 0;

  for (const item of itinerary) {
    if (isStay(item)) {
      staysTotal += item.calculatedPrice;
      stayCount += 1;
    } else if (isTransfer(item)) {
      transfersTotal += item.calculatedPrice;
      transferCount += 1;
    } else if (isExperience(item)) {
      experiencesTotal += item.calculatedPrice;
      experienceCount += 1;
    } else {
      eventsTotal += item.calculatedPrice;
      eventCount += 1;
    }
  }

  const grandTotal = eventsTotal + experiencesTotal + staysTotal + transfersTotal;

  return {
    eventsTotal,
    experiencesTotal,
    staysTotal,
    transfersTotal,
    grandTotal,
    depositPct: DEPOSIT_PCT,
    deposit: Math.round(grandTotal * DEPOSIT_PCT),
    eventCount,
    experienceCount,
    stayCount,
    transferCount,
    itemCount: itinerary.length,
  };
}

export function linePrice(base: number, perGuest: number, guests: number): number {
  return Math.max(0, Math.round(base + perGuest * guests));
}
