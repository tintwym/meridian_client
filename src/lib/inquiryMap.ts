/**
 * Shared inquiry row ↔ record mapping (safe for browser + server).
 */

export type InquiryRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  date: string | null;
  budget: string | null;
  vision: string | null;
  plan_title: string | null;
  plan_tagline: string | null;
  status: string;
  points_redeemed: number;
  credit_applied_usd: number;
  created_at: string;
  updated_at: string;
};

export function clubChannelName(userId: string) {
  return `club:${userId}`;
}

export type InquiryMapped = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  date?: string;
  budget?: string;
  vision?: string;
  planTitle?: string;
  planTagline?: string;
  status: string;
  pointsRedeemed: number;
  creditAppliedUsd: number;
  createdAt: string;
  updatedAt: string;
};

export function fromRow(row: InquiryRow): InquiryMapped {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    location: row.location || undefined,
    date: row.date || undefined,
    budget: row.budget || undefined,
    vision: row.vision || undefined,
    planTitle: row.plan_title || undefined,
    planTagline: row.plan_tagline || undefined,
    status: row.status,
    pointsRedeemed: row.points_redeemed,
    creditAppliedUsd: row.credit_applied_usd,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toRow(record: InquiryMapped): InquiryRow {
  return {
    id: record.id,
    user_id: record.userId ?? null,
    name: record.name,
    email: record.email,
    phone: record.phone ?? null,
    location: record.location ?? null,
    date: record.date ?? null,
    budget: record.budget ?? null,
    vision: record.vision ?? null,
    plan_title: record.planTitle ?? null,
    plan_tagline: record.planTagline ?? null,
    status: record.status,
    points_redeemed: record.pointsRedeemed,
    credit_applied_usd: record.creditAppliedUsd,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}
