/**
 * Inquiry persistence + Realtime broadcast via Supabase.
 * Falls back silently when Supabase is not configured / table missing.
 */

import { clubChannelName, toRow, fromRow, type InquiryMapped } from './inquiryMap';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabaseAdmin';
import type { InquiryRow } from './inquiryMap';

export type InquiryPayload = InquiryMapped;

export async function upsertInquiryRemote(record: InquiryPayload): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('inquiries').upsert(toRow(record), { onConflict: 'id' });
  if (error) {
    console.warn('[supabase] upsert inquiry failed:', error.message);
    return false;
  }
  if (record.userId) {
    await broadcastInquiry(record.userId, record);
  }
  return true;
}

export async function listInquiriesRemote(userId: string): Promise<InquiryPayload[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list inquiries failed:', error.message);
    return null;
  }
  return (data as InquiryRow[]).map(fromRow);
}

export async function listAllInquiriesRemote(): Promise<InquiryPayload[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list all inquiries failed:', error.message);
    return null;
  }
  return (data as InquiryRow[]).map(fromRow);
}

async function broadcastInquiry(userId: string, inquiry: InquiryPayload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const channel = supabase.channel(clubChannelName(userId));
  try {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('subscribe timeout')), 2500);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(t);
          resolve();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(t);
          reject(new Error(status));
        }
      });
    });
    await channel.send({
      type: 'broadcast',
      event: 'inquiry',
      payload: { inquiry },
    });
  } catch (err) {
    console.warn('[supabase] broadcast failed:', err instanceof Error ? err.message : err);
  } finally {
    await supabase.removeChannel(channel);
  }
}
