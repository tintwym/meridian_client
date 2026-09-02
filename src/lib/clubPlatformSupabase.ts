/**
 * Club users / sessions / OTP / plans / wishlist / vault / ledger in Supabase.
 * Service role only. Falls back silently when not configured or tables missing.
 */

import { getSupabaseAdmin, isSupabaseConfigured } from './supabaseAdmin';
import type {
  ClubLedgerEntry,
  SavedPlanRecord,
  UserRecord,
  VaultDoc,
  WishlistItem,
} from '../server/platformStore';

type ClubUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  google_sub: string | null;
  apple_sub: string | null;
  points: number;
  created_at: string;
};

function userFromRow(row: ClubUserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash || '',
    googleSub: row.google_sub || undefined,
    appleSub: row.apple_sub || undefined,
    points: row.points ?? 0,
    createdAt: row.created_at,
  };
}

function userToRow(user: UserRecord): ClubUserRow {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password_hash: user.passwordHash || '',
    google_sub: user.googleSub ?? null,
    apple_sub: user.appleSub ?? null,
    points: user.points,
    created_at: user.createdAt,
  };
}

export async function upsertUserRemote(user: UserRecord): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('club_users').upsert(userToRow(user), { onConflict: 'id' });
  if (error) {
    console.warn('[supabase] upsert club_users failed:', error.message);
    return false;
  }
  return true;
}

export async function getUserByEmailRemote(email: string): Promise<UserRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) {
    console.warn('[supabase] get club user by email failed:', error.message);
    return null;
  }
  return data ? userFromRow(data as ClubUserRow) : null;
}

export async function getUserByIdRemote(id: string): Promise<UserRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('club_users').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.warn('[supabase] get club user by id failed:', error.message);
    return null;
  }
  return data ? userFromRow(data as ClubUserRow) : null;
}

export async function getUserByGoogleSubRemote(sub: string): Promise<UserRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured() || !sub) return null;
  const { data, error } = await supabase
    .from('club_users')
    .select('*')
    .eq('google_sub', sub)
    .maybeSingle();
  if (error) {
    console.warn('[supabase] get club user by google sub failed:', error.message);
    return null;
  }
  return data ? userFromRow(data as ClubUserRow) : null;
}

export async function getUserByAppleSubRemote(sub: string): Promise<UserRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured() || !sub) return null;
  const { data, error } = await supabase
    .from('club_users')
    .select('*')
    .eq('apple_sub', sub)
    .maybeSingle();
  if (error) {
    console.warn('[supabase] get club user by apple sub failed:', error.message);
    return null;
  }
  return data ? userFromRow(data as ClubUserRow) : null;
}

export async function listUsersRemote(): Promise<UserRecord[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list club_users failed:', error.message);
    return null;
  }
  return (data as ClubUserRow[]).map(userFromRow);
}

export async function upsertSessionRemote(token: string, userId: string, createdAt: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from('club_sessions')
    .upsert({ token, user_id: userId, created_at: createdAt }, { onConflict: 'token' });
  if (error) {
    console.warn('[supabase] upsert club_sessions failed:', error.message);
    return false;
  }
  return true;
}

export async function getSessionRemote(token: string): Promise<{ userId: string } | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_sessions')
    .select('user_id')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    console.warn('[supabase] get club session failed:', error.message);
    return null;
  }
  return data ? { userId: (data as { user_id: string }).user_id } : null;
}

export async function upsertOtpRemote(email: string, codeHash: string, expiresAt: number, attempts: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('club_otps').upsert(
    {
      email,
      code_hash: codeHash,
      expires_at: new Date(expiresAt).toISOString(),
      attempts,
    },
    { onConflict: 'email' },
  );
  if (error) {
    console.warn('[supabase] upsert club_otps failed:', error.message);
    return false;
  }
  return true;
}

export async function getOtpRemote(email: string): Promise<{
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
} | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('club_otps').select('*').eq('email', email).maybeSingle();
  if (error) {
    console.warn('[supabase] get club otp failed:', error.message);
    return null;
  }
  if (!data) return null;
  const row = data as { email: string; code_hash: string; expires_at: string; attempts: number };
  return {
    email: row.email,
    codeHash: row.code_hash,
    expiresAt: Date.parse(row.expires_at),
    attempts: row.attempts ?? 0,
  };
}

export async function deleteOtpRemote(email: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from('club_otps').delete().eq('email', email);
  if (error) console.warn('[supabase] delete club otp failed:', error.message);
}

export async function upsertLedgerRemote(entry: ClubLedgerEntry) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('club_ledger').upsert(
    {
      id: entry.id,
      user_id: entry.userId,
      delta: entry.delta,
      reason: entry.reason,
      created_at: entry.createdAt,
      balance_after: entry.balanceAfter,
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.warn('[supabase] upsert club_ledger failed:', error.message);
    return false;
  }
  return true;
}

export async function listLedgerRemote(userId: string): Promise<ClubLedgerEntry[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) {
    console.warn('[supabase] list club_ledger failed:', error.message);
    return null;
  }
  return (data as Array<{
    id: string;
    user_id: string;
    delta: number;
    reason: string;
    created_at: string;
    balance_after: number;
  }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    delta: row.delta,
    reason: row.reason,
    createdAt: row.created_at,
    balanceAfter: row.balance_after,
  }));
}

export async function upsertPlanRemote(record: SavedPlanRecord) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('club_plans').upsert(
    {
      id: record.id,
      user_id: record.userId,
      title: record.title,
      plan: record.plan,
      input: record.input,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.warn('[supabase] upsert club_plans failed:', error.message);
    return false;
  }
  return true;
}

export async function listPlansRemote(userId: string): Promise<SavedPlanRecord[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_plans')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list club_plans failed:', error.message);
    return null;
  }
  return (data as Array<{
    id: string;
    user_id: string;
    title: string;
    plan: unknown;
    input: unknown;
    created_at: string;
    updated_at: string;
  }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    plan: row.plan,
    input: row.input,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listAllPlansRemote(): Promise<SavedPlanRecord[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_plans')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list all club_plans failed:', error.message);
    return null;
  }
  return (data as Array<{
    id: string;
    user_id: string;
    title: string;
    plan: unknown;
    input: unknown;
    created_at: string;
    updated_at: string;
  }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    plan: row.plan,
    input: row.input,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertWishlistRemote(item: WishlistItem) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('club_wishlist').upsert(
    {
      id: item.id,
      user_id: item.userId,
      label: item.label,
      location_type: item.locationType,
      notes: item.notes ?? null,
      created_at: item.createdAt,
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.warn('[supabase] upsert club_wishlist failed:', error.message);
    return false;
  }
  return true;
}

export async function listWishlistRemote(userId: string): Promise<WishlistItem[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_wishlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list club_wishlist failed:', error.message);
    return null;
  }
  return (data as Array<{
    id: string;
    user_id: string;
    label: string;
    location_type: 'local' | 'overseas';
    notes: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    label: row.label,
    locationType: row.location_type,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  }));
}

export async function deleteWishlistRemote(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from('club_wishlist').delete().eq('id', id);
  if (error) console.warn('[supabase] delete wishlist failed:', error.message);
}

export async function upsertVaultRemote(doc: VaultDoc) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('club_vault').upsert(
    {
      id: doc.id,
      user_id: doc.userId,
      title: doc.title,
      kind: doc.kind,
      summary: doc.summary,
      created_at: doc.createdAt,
    },
    { onConflict: 'id' },
  );
  if (error) {
    console.warn('[supabase] upsert club_vault failed:', error.message);
    return false;
  }
  return true;
}

export async function listVaultRemote(userId: string): Promise<VaultDoc[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('club_vault')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[supabase] list club_vault failed:', error.message);
    return null;
  }
  return (data as Array<{
    id: string;
    user_id: string;
    title: string;
    kind: VaultDoc['kind'];
    summary: string;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    kind: row.kind,
    summary: row.summary,
    createdAt: row.created_at,
  }));
}
