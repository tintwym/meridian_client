/**
 * Meridian Club + account platform API (shared with iOS / Android).
 */

import { apiUrl } from './config';
import { clearSession, loadToken, type AuthUser } from './authStorage';
import type { EventPlanResponse, PlannerInput } from '../types';

export type ConsultStatus =
  | 'received'
  | 'assigned'
  | 'call_scheduled'
  | 'deposit'
  | 'completed';

export interface ClubLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  createdAt: string;
  balanceAfter: number;
}

export interface ClubSummary {
  points: number;
  creditUsd: number;
  redeemRate: number;
  history: ClubLedgerEntry[];
}

export interface SavedPlanRecord {
  id: string;
  userId: string;
  title: string;
  plan: EventPlanResponse;
  input: PlannerInput | unknown;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  label: string;
  locationType: 'local' | 'overseas';
  notes?: string;
  createdAt: string;
}

export interface InquiryRecord {
  id: string;
  userId?: string;
  name: string;
  email: string;
  location?: string;
  date?: string;
  budget?: string;
  vision?: string;
  planTitle?: string;
  status: ConsultStatus;
  pointsRedeemed: number;
  creditAppliedUsd: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultDoc {
  id: string;
  userId: string;
  title: string;
  kind: string;
  summary: string;
  createdAt: string;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = loadToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

let unauthorizedHandler: (() => void) | null = null;

/** AuthContext registers this to sign out when any platform call returns 401. */
export function setPlatformUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: authHeaders(init?.headers),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    unauthorizedHandler?.();
    clearSession();
    throw new Error((json as { error?: string }).error || 'Session expired — sign in again.');
  }
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  }
  return json as T;
}

export async function registerAccount(
  email: string,
  password: string,
  name: string,
): Promise<{ user: AuthUser; token: string }> {
  const json = await platformFetch<{ ok: boolean; user: AuthUser; token: string }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password, name }) },
  );
  return { user: json.user, token: json.token };
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const json = await platformFetch<{ ok: boolean; user: AuthUser; token: string }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
  return { user: json.user, token: json.token };
}

export async function requestOtp(email: string): Promise<{
  message: string;
  expiresInSec: number;
  devCode?: string;
  otpTicket?: string;
}> {
  return platformFetch('/api/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(
  email: string,
  code: string,
  opts?: { password?: string; name?: string; otpTicket?: string },
): Promise<{ user: AuthUser; token: string }> {
  const json = await platformFetch<{ ok: boolean; user: AuthUser; token: string }>(
    '/api/auth/otp/verify',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        password: opts?.password,
        name: opts?.name,
        otpTicket: opts?.otpTicket,
      }),
    },
  );
  return { user: json.user, token: json.token };
}

export async function socialSignIn(payload: {
  provider: 'google' | 'apple';
  idToken?: string;
  email?: string;
  name?: string;
  subject?: string;
}): Promise<{ user: AuthUser; token: string }> {
  const json = await platformFetch<{ ok: boolean; user: AuthUser; token: string }>(
    '/api/auth/social',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return { user: json.user, token: json.token };
}

export async function fetchMe(): Promise<AuthUser> {
  const json = await platformFetch<{ ok: boolean; user: AuthUser }>('/api/auth/me');
  return json.user;
}

export async function updateProfile(name: string): Promise<AuthUser> {
  const json = await platformFetch<{ ok: boolean; user: AuthUser }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return json.user;
}

export async function fetchClub(): Promise<ClubSummary> {
  const json = await platformFetch<{ ok: boolean } & ClubSummary>('/api/club');
  return {
    points: json.points,
    creditUsd: json.creditUsd,
    redeemRate: json.redeemRate,
    history: json.history,
  };
}

export async function saveCloudPlan(
  plan: EventPlanResponse,
  input: PlannerInput,
  title?: string,
): Promise<{ plan: SavedPlanRecord; club: ClubSummary }> {
  return platformFetch('/api/plans', {
    method: 'POST',
    body: JSON.stringify({ plan, input, title }),
  });
}

export async function listCloudPlans(): Promise<SavedPlanRecord[]> {
  const json = await platformFetch<{ ok: boolean; plans: SavedPlanRecord[] }>('/api/plans');
  return json.plans;
}

export async function listWishlist(): Promise<WishlistItem[]> {
  const json = await platformFetch<{ ok: boolean; items: WishlistItem[] }>('/api/wishlist');
  return json.items;
}

export async function addWishlistItem(
  label: string,
  locationType: 'local' | 'overseas',
  notes?: string,
): Promise<WishlistItem> {
  const json = await platformFetch<{ ok: boolean; item: WishlistItem }>('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify({ label, locationType, notes }),
  });
  return json.item;
}

export async function removeWishlistItem(id: string): Promise<void> {
  await platformFetch(`/api/wishlist/${id}`, { method: 'DELETE' });
}

export async function listInquiries(): Promise<InquiryRecord[]> {
  const json = await platformFetch<{ ok: boolean; inquiries: InquiryRecord[] }>('/api/inquiries');
  return json.inquiries;
}

export async function updateInquiryStatus(
  id: string,
  status: ConsultStatus,
): Promise<{ inquiry: InquiryRecord; club: ClubSummary }> {
  return platformFetch(`/api/inquiries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function listVault(): Promise<VaultDoc[]> {
  const json = await platformFetch<{ ok: boolean; documents: VaultDoc[] }>('/api/vault');
  return json.documents;
}

export type RsvpStatus = 'pending' | 'accepted' | 'declined';

export interface EventGuest {
  id: string;
  inquiryId: string;
  name: string;
  email: string;
  rsvpStatus: RsvpStatus;
  hasAllergy: boolean;
  allergyNote?: string;
  eventTitle?: string;
  eventLocation?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  inviteToken: string;
}

export interface PublicInvite {
  id: string;
  name: string;
  eventTitle?: string;
  eventLocation?: string;
  rsvpStatus: RsvpStatus;
  hasAllergy: boolean;
  allergyNote?: string;
  respondedAt?: string;
}

export async function listInquiryGuests(
  inquiryId: string,
): Promise<{ guests: EventGuest[]; unlocked: boolean }> {
  const json = await platformFetch<{ ok: boolean; guests: EventGuest[]; unlocked: boolean }>(
    `/api/inquiries/${inquiryId}/guests`,
  );
  return { guests: json.guests, unlocked: json.unlocked };
}

export async function addInquiryGuest(
  inquiryId: string,
  name: string,
  email: string,
): Promise<{ guest: EventGuest; inviteUrl: string }> {
  return platformFetch(`/api/inquiries/${inquiryId}/guests`, {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

export async function fetchInvite(token: string): Promise<PublicInvite> {
  const res = await fetch(apiUrl(`/api/invite/${encodeURIComponent(token)}`));
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Invite failed (${res.status})`);
  }
  return (json as { invite: PublicInvite }).invite;
}

export async function submitInviteRsvp(
  token: string,
  payload: { accept: boolean; hasAllergy?: boolean; allergyNote?: string },
): Promise<{ ok: boolean; rsvpStatus: RsvpStatus; eventTitle?: string; message: string }> {
  const res = await fetch(apiUrl(`/api/invite/${encodeURIComponent(token)}/rsvp`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `RSVP failed (${res.status})`);
  }
  return json as {
    ok: boolean;
    rsvpStatus: RsvpStatus;
    eventTitle?: string;
    message: string;
  };
}

export const CONSULT_STATUS_LABELS: Record<ConsultStatus, string> = {
  received: 'Received',
  assigned: 'Planner assigned',
  call_scheduled: 'Call scheduled',
  deposit: 'Deposit stage',
  completed: 'Celebration complete',
};
