/**
 * Club Consult Realtime — postgres_changes + broadcast fallback.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { InquiryRecord } from '../api/platform';
import { clubChannelName, fromRow, type InquiryRow } from './inquiryMap';
import { getSupabaseBrowser } from './supabaseBrowser';

export type InquiryLiveHandler = (inquiry: InquiryRecord) => void;

function asInquiry(payload: unknown): InquiryRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.id === 'string' && typeof raw.status === 'string') {
    return {
      id: raw.id,
      userId: typeof raw.userId === 'string' ? raw.userId : undefined,
      name: String(raw.name ?? ''),
      email: String(raw.email ?? ''),
      location: typeof raw.location === 'string' ? raw.location : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
      budget: typeof raw.budget === 'string' ? raw.budget : undefined,
      vision: typeof raw.vision === 'string' ? raw.vision : undefined,
      planTitle: typeof raw.planTitle === 'string' ? raw.planTitle : undefined,
      status: raw.status as InquiryRecord['status'],
      pointsRedeemed: Number(raw.pointsRedeemed ?? 0),
      creditAppliedUsd: Number(raw.creditAppliedUsd ?? 0),
      createdAt: String(raw.createdAt ?? ''),
      updatedAt: String(raw.updatedAt ?? ''),
    };
  }
  return null;
}

/**
 * Subscribe to live inquiry updates for a Club member.
 * Returns an unsubscribe function. No-ops when Supabase Vite env is missing.
 */
export function subscribeClubInquiries(userId: string, onInquiry: InquiryLiveHandler): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return () => undefined;

  const channels: RealtimeChannel[] = [];

  const tableChannel = supabase
    .channel(`inquiries-pg:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inquiries',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = (payload.new || payload.old) as InquiryRow | null;
        if (!row?.id) return;
        if (payload.eventType === 'DELETE') return;
        onInquiry(fromRow(row) as InquiryRecord);
      },
    )
    .subscribe();
  channels.push(tableChannel);

  const broadcastChannel = supabase
    .channel(clubChannelName(userId))
    .on('broadcast', { event: 'inquiry' }, ({ payload }) => {
      const inquiry = asInquiry((payload as { inquiry?: unknown })?.inquiry);
      if (inquiry) onInquiry(inquiry);
    })
    .subscribe();
  channels.push(broadcastChannel);

  return () => {
    for (const ch of channels) {
      void supabase.removeChannel(ch);
    }
  };
}
