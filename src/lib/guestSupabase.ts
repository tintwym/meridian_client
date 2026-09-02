/**
 * Event guest persistence via Supabase (Guest Messaging v1).
 * Falls back silently when Supabase is not configured / table missing.
 */

import { getSupabaseAdmin, isSupabaseConfigured } from './supabaseAdmin';
import type { EventGuestRecord } from '../server/platformStore';

type GuestRow = {
  id: string;
  inquiry_id: string;
  host_user_id: string;
  name: string;
  email: string;
  invite_token: string;
  rsvp_status: EventGuestRecord['rsvpStatus'];
  has_allergy: boolean;
  allergy_note: string | null;
  event_title: string | null;
  event_location: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: GuestRow): EventGuestRecord {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    hostUserId: row.host_user_id,
    name: row.name,
    email: row.email,
    inviteToken: row.invite_token,
    rsvpStatus: row.rsvp_status,
    hasAllergy: row.has_allergy,
    allergyNote: row.allergy_note || undefined,
    eventTitle: row.event_title || undefined,
    eventLocation: row.event_location || undefined,
    respondedAt: row.responded_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(g: EventGuestRecord): GuestRow {
  return {
    id: g.id,
    inquiry_id: g.inquiryId,
    host_user_id: g.hostUserId,
    name: g.name,
    email: g.email,
    invite_token: g.inviteToken,
    rsvp_status: g.rsvpStatus,
    has_allergy: g.hasAllergy,
    allergy_note: g.allergyNote ?? null,
    event_title: g.eventTitle ?? null,
    event_location: g.eventLocation ?? null,
    responded_at: g.respondedAt ?? null,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  };
}

export async function upsertGuestRemote(record: EventGuestRecord): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('event_guests').upsert(toRow(record), { onConflict: 'id' });
  if (error) {
    console.warn('[supabase] upsert guest failed:', error.message);
    return false;
  }
  return true;
}

export async function listGuestsRemote(inquiryId: string): Promise<EventGuestRecord[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('event_guests')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list guests failed:', error.message);
    return null;
  }
  return (data as GuestRow[]).map(fromRow);
}

export async function fetchGuestByTokenRemote(token: string): Promise<EventGuestRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('event_guests')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle();
  if (error) {
    console.warn('[supabase] guest by token failed:', error.message);
    return null;
  }
  return data ? fromRow(data as GuestRow) : null;
}
