/**
 * Meridian platform store — Club accounts persist in Supabase (service role).
 * In-memory maps are a per-instance cache; signed OTP tickets still work if
 * the database is unreachable or tables have not been migrated yet.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type ConsultStatus =
  | 'received'
  | 'assigned'
  | 'call_scheduled'
  | 'deposit'
  | 'completed';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  /** Empty for social / OTP-only accounts */
  passwordHash: string;
  googleSub?: string;
  appleSub?: string;
  points: number;
  createdAt: string;
}

interface OtpRecord {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

export type SocialProvider = 'google' | 'apple';

const users = new Map<string, UserRecord>();
const sessions = new Map<string, SessionRecord>();
const otpByEmail = new Map<string, OtpRecord>();
const ledger: ClubLedgerEntry[] = [];
const plans = new Map<string, SavedPlanRecord>();
const wishlists = new Map<string, WishlistItem>();
const inquiries = new Map<string, InquiryRecord>();
const vault = new Map<string, VaultDoc>();
const eventGuests = new Map<string, EventGuestRecord>();
const guestsByToken = new Map<string, string>(); // token → guest id

export type RsvpStatus = 'pending' | 'accepted' | 'declined';

export interface EventGuestRecord {
  id: string;
  inquiryId: string;
  hostUserId: string;
  name: string;
  email: string;
  inviteToken: string;
  rsvpStatus: RsvpStatus;
  hasAllergy: boolean;
  allergyNote?: string;
  eventTitle?: string;
  eventLocation?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const GUEST_MESSAGING_STATUSES: ConsultStatus[] = ['deposit', 'completed'];

const POINTS = {
  welcome: 100,
  savePlan: 25,
  inquire: 50,
  consultBooked: 200,
  eventCompleted: 1000,
  redeemPerUsd: 100, // 100 pts = $1 planning credit
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export interface ClubLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  createdAt: string;
  balanceAfter: number;
}

export interface SavedPlanRecord {
  id: string;
  userId: string;
  title: string;
  plan: unknown;
  input: unknown;
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
  phone?: string;
  location?: string;
  date?: string;
  budget?: string;
  vision?: string;
  planTitle?: string;
  planTagline?: string;
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
  kind: 'proposal' | 'contract' | 'moodboard' | 'other';
  summary: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function hashPassword(password: string, salt = crypto.randomBytes(8).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const next = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'));
}

function now() {
  return new Date().toISOString();
}

function cacheUser(user: UserRecord) {
  users.set(user.id, user);
  return user;
}

function warnSupabase(scope: string, err: unknown) {
  console.warn(`[supabase] ${scope} skipped:`, err instanceof Error ? err.message : err);
}

async function persistUser(user: UserRecord) {
  try {
    const { upsertUserRemote } = await import('../lib/clubPlatformSupabase');
    await upsertUserRemote(user);
  } catch (err) {
    warnSupabase('persist user', err);
  }
}

async function persistSession(token: string, userId: string, createdAt: string) {
  try {
    const { upsertSessionRemote } = await import('../lib/clubPlatformSupabase');
    await upsertSessionRemote(token, userId, createdAt);
  } catch (err) {
    warnSupabase('persist session', err);
  }
}

async function persistOtp(email: string, codeHash: string, expiresAt: number, attempts: number) {
  try {
    const { upsertOtpRemote } = await import('../lib/clubPlatformSupabase');
    await upsertOtpRemote(email, codeHash, expiresAt, attempts);
  } catch (err) {
    warnSupabase('persist otp', err);
  }
}

async function persistLedger(entry: ClubLedgerEntry) {
  try {
    const { upsertLedgerRemote } = await import('../lib/clubPlatformSupabase');
    await upsertLedgerRemote(entry);
  } catch (err) {
    warnSupabase('persist ledger', err);
  }
}

async function persistPlan(record: SavedPlanRecord) {
  try {
    const { upsertPlanRemote } = await import('../lib/clubPlatformSupabase');
    await upsertPlanRemote(record);
  } catch (err) {
    warnSupabase('persist plan', err);
  }
}

async function persistWishlist(item: WishlistItem) {
  try {
    const { upsertWishlistRemote } = await import('../lib/clubPlatformSupabase');
    await upsertWishlistRemote(item);
  } catch (err) {
    warnSupabase('persist wishlist', err);
  }
}

async function persistVault(doc: VaultDoc) {
  try {
    const { upsertVaultRemote } = await import('../lib/clubPlatformSupabase');
    await upsertVaultRemote(doc);
  } catch (err) {
    warnSupabase('persist vault', err);
  }
}

export async function getUserByToken(authHeader?: string): Promise<UserRecord | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const session = sessions.get(token);
  if (session) {
    const mem = users.get(session.userId);
    if (mem) return mem;
  }

  try {
    const { getSessionRemote, getUserByIdRemote } = await import('../lib/clubPlatformSupabase');
    const remoteSession = session ? { userId: session.userId } : await getSessionRemote(token);
    if (remoteSession) {
      sessions.set(token, {
        token,
        userId: remoteSession.userId,
        createdAt: session?.createdAt || now(),
      });
      const remoteUser =
        users.get(remoteSession.userId) ?? (await getUserByIdRemote(remoteSession.userId));
      if (remoteUser) return cacheUser(remoteUser);
    }
  } catch (err) {
    warnSupabase('session lookup', err);
  }

  const payload = readPayload<{
    t?: string;
    sub?: string;
    email?: string;
    name?: string;
    points?: number;
    createdAt?: string;
    exp?: number;
  }>(token);
  if (!payload || payload.t !== 'sess' || !payload.sub) return null;
  if (payload.exp && Date.now() > payload.exp) return null;
  const existing = users.get(payload.sub);
  if (existing) return existing;
  try {
    const { getUserByIdRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await getUserByIdRemote(payload.sub);
    if (remote) return cacheUser(remote);
  } catch (err) {
    warnSupabase('user by token', err);
  }
  if (!payload.email) return null;
  const hydrated: UserRecord = {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    passwordHash: '',
    points: payload.points ?? 0,
    createdAt: payload.createdAt || now(),
  };
  return cacheUser(hydrated);
}

async function addPoints(user: UserRecord, delta: number, reason: string) {
  user.points = Math.max(0, user.points + delta);
  const entry: ClubLedgerEntry = {
    id: id('pts'),
    userId: user.id,
    delta,
    reason,
    createdAt: now(),
    balanceAfter: user.points,
  };
  ledger.unshift(entry);
  await persistUser(user);
  await persistLedger(entry);
  return entry;
}

export async function registerUser(email: string, password: string, name: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || password.length < 6) {
    throw Object.assign(new Error('Valid email and password (6+ chars) required'), { status: 400 });
  }
  if (await findUserByEmail(normalized)) {
    throw Object.assign(new Error('Account already exists'), { status: 409 });
  }
  const user: UserRecord = {
    id: id('usr'),
    email: normalized,
    name: name.trim() || normalized.split('@')[0],
    passwordHash: hashPassword(password),
    points: 0,
    createdAt: now(),
  };
  cacheUser(user);
  await addPoints(user, POINTS.welcome, 'Welcome to Meridian Club');
  const token = await createSession(user.id);
  return { user: publicUser(user), token };
}

export async function loginUser(email: string, password: string) {
  const found = await findUserByEmail(email);
  if (!found || !found.passwordHash || !verifyPassword(password, found.passwordHash)) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  const token = await createSession(found.id);
  return { user: publicUser(found), token };
}

async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const normalized = email.trim().toLowerCase();
  let mem: UserRecord | undefined;
  for (const u of users.values()) {
    if (u.email === normalized) {
      mem = u;
      break;
    }
  }
  try {
    const { getUserByEmailRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await getUserByEmailRemote(normalized);
    if (remote) {
      if (mem?.passwordHash && !remote.passwordHash) {
        remote.passwordHash = mem.passwordHash;
      }
      return cacheUser(remote);
    }
  } catch (err) {
    warnSupabase('user by email', err);
  }
  return mem;
}

async function findUserBySocial(opts: { googleSub?: string; appleSub?: string }) {
  if (opts.googleSub) {
    const mem = [...users.values()].find((u) => u.googleSub === opts.googleSub);
    if (mem) return mem;
    try {
      const { getUserByGoogleSubRemote } = await import('../lib/clubPlatformSupabase');
      const remote = await getUserByGoogleSubRemote(opts.googleSub);
      if (remote) return cacheUser(remote);
    } catch (err) {
      warnSupabase('user by google sub', err);
    }
  }
  if (opts.appleSub) {
    const mem = [...users.values()].find((u) => u.appleSub === opts.appleSub);
    if (mem) return mem;
    try {
      const { getUserByAppleSubRemote } = await import('../lib/clubPlatformSupabase');
      const remote = await getUserByAppleSubRemote(opts.appleSub);
      if (remote) return cacheUser(remote);
    } catch (err) {
      warnSupabase('user by apple sub', err);
    }
  }
  return undefined;
}

async function upsertSocialOrOtpUser(opts: {
  email?: string;
  name?: string;
  googleSub?: string;
  appleSub?: string;
}) {
  let user = await findUserBySocial({ googleSub: opts.googleSub, appleSub: opts.appleSub });

  if (user) {
    if (opts.googleSub) user.googleSub = opts.googleSub;
    if (opts.appleSub) user.appleSub = opts.appleSub;
    if (opts.name?.trim()) user.name = opts.name.trim();
    if (opts.email?.trim().includes('@') && !user.email) {
      user.email = opts.email.trim().toLowerCase();
    }
    await persistUser(user);
    const token = await createSession(user.id);
    return { user: publicUser(user), token };
  }

  const normalized = (opts.email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw Object.assign(
      new Error('Email required for first-time Apple/Google sign-in'),
      { status: 400 },
    );
  }

  user = await findUserByEmail(normalized);
  if (!user) {
    user = {
      id: id('usr'),
      email: normalized,
      name: (opts.name || '').trim() || normalized.split('@')[0],
      passwordHash: '',
      googleSub: opts.googleSub,
      appleSub: opts.appleSub,
      points: 0,
      createdAt: now(),
    };
    cacheUser(user);
    await addPoints(user, POINTS.welcome, 'Welcome to Meridian Club');
  } else {
    if (opts.googleSub) user.googleSub = opts.googleSub;
    if (opts.appleSub) user.appleSub = opts.appleSub;
    if (opts.name?.trim() && user.name === user.email.split('@')[0]) {
      user.name = opts.name.trim();
    }
    await persistUser(user);
  }

  const token = await createSession(user.id);
  return { user: publicUser(user), token };
}

function hashOtp(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function authSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.ADMIN_PASSWORD;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET (or SUPABASE_SECRET_KEY / ADMIN_PASSWORD) is required in production');
    }
    return 'meridian-local-auth-dev-only';
  }
  return secret;
}

function signPayload(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', authSecret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function readPayload<T>(token: string): T | null {
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto.createHmac('sha256', authSecret()).update(body).digest('base64url');
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

/** Request a 6-digit email OTP. Emails when RESEND is configured; otherwise returns devCode. */
export async function requestEmailOtp(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw Object.assign(new Error('Valid email required'), { status: 400 });
  }
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = Date.now() + OTP_TTL_MS;
  const record: OtpRecord = {
    email: normalized,
    codeHash: hashOtp(code),
    expiresAt,
    attempts: 0,
  };
  otpByEmail.set(normalized, record);
  await persistOtp(normalized, record.codeHash, record.expiresAt, record.attempts);

  const otpTicket = signPayload({ e: normalized, h: hashOtp(code), x: expiresAt });
  if (process.env.NODE_ENV !== 'production' || process.env.OTP_EXPOSE_CODE === '1') {
    console.log(`[Meridian OTP] ${normalized} → ${code}`);
  }

  let emailed = false;
  try {
    const { sendOtpEmail } = await import('../lib/otpEmail');
    emailed = await sendOtpEmail(normalized, code);
  } catch (err) {
    warnSupabase('otp email', err);
  }

  const exposeCode = process.env.OTP_EXPOSE_CODE === '1' || (!emailed && process.env.NODE_ENV !== 'production');

  return {
    ok: true,
    email: normalized,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    message: emailed
      ? 'We sent a verification code to your email.'
      : `Your verification code is ${code}.`,
    ...(exposeCode ? { devCode: code } : {}),
    otpTicket,
    emailed,
  };
}

export async function verifyEmailOtp(
  email: string,
  code: string,
  opts?: { password?: string; name?: string; otpTicket?: string },
) {
  const normalized = email.trim().toLowerCase();
  let record = otpByEmail.get(normalized);
  if (!record) {
    try {
      const { getOtpRemote } = await import('../lib/clubPlatformSupabase');
      const remote = await getOtpRemote(normalized);
      if (remote) {
        record = {
          email: remote.email,
          codeHash: remote.codeHash,
          expiresAt: remote.expiresAt,
          attempts: remote.attempts,
        };
        otpByEmail.set(normalized, record);
      }
    } catch (err) {
      warnSupabase('otp lookup', err);
    }
  }
  if (!record && opts?.otpTicket) {
    const ticket = readPayload<{ e: string; h: string; x: number }>(opts.otpTicket);
    if (ticket?.e === normalized && ticket.x >= Date.now()) {
      record = {
        email: normalized,
        codeHash: ticket.h,
        expiresAt: ticket.x,
        attempts: 0,
      };
    }
  }
  if (!record) {
    throw Object.assign(new Error('No code requested for this email'), { status: 400 });
  }
  if (Date.now() > record.expiresAt) {
    otpByEmail.delete(normalized);
    try {
      const { deleteOtpRemote } = await import('../lib/clubPlatformSupabase');
      await deleteOtpRemote(normalized);
    } catch (err) {
      warnSupabase('delete expired otp', err);
    }
    throw Object.assign(new Error('Code expired — request a new one'), { status: 400 });
  }
  record.attempts += 1;
  if (record.attempts > OTP_MAX_ATTEMPTS) {
    otpByEmail.delete(normalized);
    try {
      const { deleteOtpRemote } = await import('../lib/clubPlatformSupabase');
      await deleteOtpRemote(normalized);
    } catch (err) {
      warnSupabase('delete otp after attempts', err);
    }
    throw Object.assign(new Error('Too many attempts — request a new code'), { status: 429 });
  }
  if (hashOtp(String(code).trim()) !== record.codeHash) {
    await persistOtp(normalized, record.codeHash, record.expiresAt, record.attempts);
    throw Object.assign(new Error('Invalid code'), { status: 401 });
  }
  otpByEmail.delete(normalized);
  try {
    const { deleteOtpRemote } = await import('../lib/clubPlatformSupabase');
    await deleteOtpRemote(normalized);
  } catch (err) {
    warnSupabase('delete otp', err);
  }

  const password = opts?.password?.trim();
  if (password) {
    if (password.length < 6) {
      throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
    }
    // Registration path: email verified via OTP, then account with password
    const existing = await findUserByEmail(normalized);
    if (existing?.passwordHash) {
      throw Object.assign(new Error('Account already exists — sign in instead'), { status: 409 });
    }
    if (existing) {
      existing.passwordHash = hashPassword(password);
      if (opts?.name?.trim()) existing.name = opts.name.trim();
      await persistUser(existing);
      const token = await createSession(existing.id);
      return { user: publicUser(existing), token };
    }
    const user: UserRecord = {
      id: id('usr'),
      email: normalized,
      name: (opts?.name || '').trim() || normalized.split('@')[0],
      passwordHash: hashPassword(password),
      points: 0,
      createdAt: now(),
    };
    cacheUser(user);
    await addPoints(user, POINTS.welcome, 'Welcome to Meridian Club');
    const token = await createSession(user.id);
    return { user: publicUser(user), token };
  }

  return upsertSocialOrOtpUser({ email: normalized, name: opts?.name });
}

/**
 * Google / Apple sign-in.
 * - Google: verify idToken when GOOGLE_CLIENT_ID is set.
 * - Apple: decode idToken claims (JWKS verify later); accept email + subject.
 * - Stub: email + provider when token verify isn't available.
 *   Allowed in development by default. In production, stub only if AUTH_SOCIAL_STUB=1.
 *   Set AUTH_SOCIAL_STUB=0 to forbid stub even in development.
 */
export async function socialSignIn(body: {
  provider: SocialProvider;
  idToken?: string;
  email?: string;
  name?: string;
  subject?: string;
}) {
  const provider = body.provider;
  if (provider !== 'google' && provider !== 'apple') {
    throw Object.assign(new Error('Unsupported provider'), { status: 400 });
  }

  const stubExplicitlyOff = process.env.AUTH_SOCIAL_STUB === '0';
  const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const canVerifyGoogle = Boolean(googleClientId);
  /** Dev-only stub unless AUTH_SOCIAL_STUB=1 is set explicitly in production. */
  const stubAllowed =
    process.env.AUTH_SOCIAL_STUB === '1' ||
    (!stubExplicitlyOff && process.env.NODE_ENV !== 'production');

  let email = (body.email || '').trim().toLowerCase();
  let name = (body.name || '').trim();
  let subject = (body.subject || '').trim();

  if (body.idToken && provider === 'google' && canVerifyGoogle) {
    const verified = await verifyGoogleIdToken(body.idToken, googleClientId);
    email = verified.email;
    name = name || verified.name || '';
    subject = verified.sub;
  } else if (body.idToken && provider === 'apple') {
    // Full Apple JWKS verify can be plugged in later; accept email/sub from token + body.
    const payload = decodeJwtPayload(body.idToken);
    email = email || String(payload.email || '').toLowerCase();
    subject = subject || String(payload.sub || '');
    if (!subject) {
      throw Object.assign(new Error('Apple token missing sub'), { status: 400 });
    }
    // Returning Apple users often omit email; upsertSocialOrOtpUser resolves by appleSub.
  } else if (stubAllowed && email) {
    subject =
      subject || `${provider}_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`;
  } else if (!email) {
    throw Object.assign(new Error('email required for social sign-in'), { status: 400 });
  } else {
    throw Object.assign(
      new Error(
        stubExplicitlyOff
          ? 'Social stub disabled (AUTH_SOCIAL_STUB=0). Configure GOOGLE_CLIENT_ID and send idToken, or set AUTH_SOCIAL_STUB=1.'
          : 'Configure GOOGLE_CLIENT_ID / Apple verify, or set AUTH_SOCIAL_STUB=1',
      ),
      { status: 501 },
    );
  }

  return upsertSocialOrOtpUser({
    email,
    name,
    googleSub: provider === 'google' ? subject : undefined,
    appleSub: provider === 'apple' ? subject : undefined,
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function verifyGoogleIdToken(idToken: string, clientId: string) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw Object.assign(new Error('Invalid Google token'), { status: 401 });
  }
  const json = (await res.json()) as { aud?: string; email?: string; name?: string; sub?: string };
  if (json.aud !== clientId || !json.email || !json.sub) {
    throw Object.assign(new Error('Google token audience mismatch'), { status: 401 });
  }
  return { email: json.email.toLowerCase(), name: json.name || '', sub: json.sub };
}

async function createSession(userId: string) {
  const user = users.get(userId);
  const createdAt = now();
  const token = signPayload({
    t: 'sess',
    sub: userId,
    email: user?.email,
    name: user?.name,
    points: user?.points ?? 0,
    createdAt: user?.createdAt,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  sessions.set(token, { token, userId, createdAt });
  await persistSession(token, userId, createdAt);
  return token;
}

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    points: user.points,
    creditUsd: Math.floor(user.points / POINTS.redeemPerUsd),
    createdAt: user.createdAt,
  };
}

/** Update display name (email changes require a separate verified flow). */
export async function updateUserProfile(user: UserRecord, body: { name?: string }) {
  const nextName = (body.name ?? '').trim();
  if (!nextName) {
    const err = new Error('Name is required') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  if (nextName.length > 80) {
    const err = new Error('Name is too long') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  user.name = nextName;
  cacheUser(user);
  await persistUser(user);
  return publicUser(user);
}

export async function clubSummary(user: UserRecord) {
  try {
    const { listLedgerRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await listLedgerRemote(user.id);
    if (remote) {
      const ids = new Set(ledger.map((e) => e.id));
      for (const entry of remote) {
        if (!ids.has(entry.id)) ledger.push(entry);
      }
    }
  } catch (err) {
    warnSupabase('list ledger', err);
  }
  const history = ledger
    .filter((e) => e.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 40);
  return {
    points: user.points,
    creditUsd: Math.floor(user.points / POINTS.redeemPerUsd),
    redeemRate: POINTS.redeemPerUsd,
    history,
  };
}

export async function saveUserPlan(user: UserRecord, plan: unknown, input: unknown, title?: string) {
  const planTitle =
    title ||
    (typeof plan === 'object' && plan && 'title' in plan
      ? String((plan as { title: string }).title)
      : 'Meridian blueprint');
  const record: SavedPlanRecord = {
    id: id('plan'),
    userId: user.id,
    title: planTitle,
    plan,
    input,
    createdAt: now(),
    updatedAt: now(),
  };
  plans.set(record.id, record);
  await persistPlan(record);
  await addPoints(user, POINTS.savePlan, `Saved plan · ${planTitle}`);
  return { plan: record, club: await clubSummary(user) };
}

export async function listUserPlans(userId: string) {
  try {
    const { listPlansRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await listPlansRemote(userId);
    if (remote) {
      for (const row of remote) plans.set(row.id, row);
      return remote.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
  } catch (err) {
    warnSupabase('list plans', err);
  }
  return [...plans.values()]
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function addWishlist(
  user: UserRecord,
  label: string,
  locationType: 'local' | 'overseas',
  notes?: string,
) {
  const item: WishlistItem = {
    id: id('wish'),
    userId: user.id,
    label: label.trim(),
    locationType,
    notes,
    createdAt: now(),
  };
  wishlists.set(item.id, item);
  await persistWishlist(item);
  return item;
}

export async function listWishlist(userId: string) {
  try {
    const { listWishlistRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await listWishlistRemote(userId);
    if (remote) {
      for (const row of remote) wishlists.set(row.id, row);
      return remote.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch (err) {
    warnSupabase('list wishlist', err);
  }
  return [...wishlists.values()]
    .filter((w) => w.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function removeWishlist(userId: string, wishId: string) {
  const item = wishlists.get(wishId);
  if (item && item.userId !== userId) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }
  if (!item) {
    try {
      const { listWishlistRemote } = await import('../lib/clubPlatformSupabase');
      const remote = await listWishlistRemote(userId);
      const found = remote?.find((w) => w.id === wishId);
      if (!found) throw Object.assign(new Error('Not found'), { status: 404 });
    } catch (err) {
      if ((err as Error & { status?: number }).status === 404) throw err;
      warnSupabase('wishlist lookup', err);
      throw Object.assign(new Error('Not found'), { status: 404 });
    }
  }
  wishlists.delete(wishId);
  try {
    const { deleteWishlistRemote } = await import('../lib/clubPlatformSupabase');
    await deleteWishlistRemote(wishId);
  } catch (err) {
    warnSupabase('delete wishlist', err);
  }
  return { ok: true };
}

async function persistInquiry(record: InquiryRecord) {
  try {
    const { upsertInquiryRemote } = await import('../lib/inquirySupabase');
    await upsertInquiryRemote(record);
  } catch (err) {
    console.warn('[supabase] persist skipped:', err instanceof Error ? err.message : err);
  }
}

export async function createInquiry(
  body: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    date?: string;
    budget?: string;
    vision?: string;
    planTitle?: string;
    planTagline?: string;
    redeemPoints?: number;
  },
  user?: UserRecord | null,
) {
  if (!body.name || !body.email) {
    throw Object.assign(new Error('name and email required'), { status: 400 });
  }

  let pointsRedeemed = 0;
  let creditAppliedUsd = 0;
  if (user && body.redeemPoints && body.redeemPoints > 0) {
    const redeem = Math.min(body.redeemPoints, user.points);
    const rounded = redeem - (redeem % POINTS.redeemPerUsd);
    if (rounded >= POINTS.redeemPerUsd) {
      pointsRedeemed = rounded;
      creditAppliedUsd = rounded / POINTS.redeemPerUsd;
      await addPoints(user, -rounded, `Redeemed for $${creditAppliedUsd} planning credit`);
    }
  }

  const record: InquiryRecord = {
    id: id('lead'),
    userId: user?.id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    location: body.location,
    date: body.date,
    budget: body.budget,
    vision: body.vision,
    planTitle: body.planTitle,
    planTagline: body.planTagline,
    status: 'received',
    pointsRedeemed,
    creditAppliedUsd,
    createdAt: now(),
    updatedAt: now(),
  };
  inquiries.set(record.id, record);
  void persistInquiry(record);

  if (user) {
    await addPoints(user, POINTS.inquire, 'Submitted planner inquiry');
  }

  if (process.env.DEMO_MODE === '1') {
    setTimeout(() => {
      const current = inquiries.get(record.id);
      if (current && current.status === 'received') {
        current.status = 'assigned';
        current.updatedAt = now();
        if (user) void addPoints(user, POINTS.consultBooked, 'Planner assigned to your inquiry');
        void persistInquiry(current);
      }
    }, 4000);
  }

  return {
    ok: true,
    id: record.id,
    status: record.status,
    pointsRedeemed,
    creditAppliedUsd,
    message: creditAppliedUsd
      ? `Inquiry received. $${creditAppliedUsd} Club credit applied.`
      : 'Inquiry received. A Meridian planner will follow up shortly.',
    club: user ? await clubSummary(user) : null,
  };
}

export async function listInquiries(userId: string) {
  try {
    const { listInquiriesRemote } = await import('../lib/inquirySupabase');
    const remote = await listInquiriesRemote(userId);
    if (remote) {
      for (const row of remote) {
        inquiries.set(row.id, row as InquiryRecord);
      }
      return remote as InquiryRecord[];
    }
  } catch (err) {
    console.warn('[supabase] list skipped:', err instanceof Error ? err.message : err);
  }
  return [...inquiries.values()]
    .filter((i) => i.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateInquiryStatus(userId: string, inquiryId: string, status: ConsultStatus) {
  const record = await ensureInquiryForUser(userId, inquiryId);
  record.status = status;
  record.updatedAt = now();
  const user = users.get(userId);
  if (user && status === 'completed') {
    await addPoints(user, POINTS.eventCompleted, 'Celebration completed');
  }
  void persistInquiry(record);
  return record;
}

export async function listVault(userId: string) {
  try {
    const { listVaultRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await listVaultRemote(userId);
    if (remote) {
      for (const row of remote) vault.set(row.id, row);
      return remote.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch (err) {
    warnSupabase('list vault', err);
  }
  return [...vault.values()]
    .filter((d) => d.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addVaultDoc(
  user: UserRecord,
  title: string,
  kind: VaultDoc['kind'],
  summary: string,
) {
  const doc: VaultDoc = {
    id: id('doc'),
    userId: user.id,
    title,
    kind,
    summary,
    createdAt: now(),
  };
  vault.set(doc.id, doc);
  await persistVault(doc);
  return doc;
}

function publicGuest(g: EventGuestRecord) {
  return {
    id: g.id,
    inquiryId: g.inquiryId,
    name: g.name,
    email: g.email,
    rsvpStatus: g.rsvpStatus,
    hasAllergy: g.hasAllergy,
    allergyNote: g.allergyNote,
    eventTitle: g.eventTitle,
    eventLocation: g.eventLocation,
    respondedAt: g.respondedAt,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    inviteToken: g.inviteToken,
  };
}

async function persistGuest(record: EventGuestRecord) {
  try {
    const { upsertGuestRemote } = await import('../lib/guestSupabase');
    await upsertGuestRemote(record);
  } catch (err) {
    console.warn('[supabase] guest persist skipped:', err instanceof Error ? err.message : err);
  }
}

/** Hydrate inquiry cache from Supabase before guest / status mutations. */
async function ensureInquiryForUser(userId: string, inquiryId: string): Promise<InquiryRecord> {
  let inquiry = inquiries.get(inquiryId);
  if (inquiry && inquiry.userId === userId) return inquiry;
  await listInquiries(userId);
  inquiry = inquiries.get(inquiryId);
  if (!inquiry || inquiry.userId !== userId) {
    throw Object.assign(new Error('Inquiry not found'), { status: 404 });
  }
  return inquiry;
}

export function canManageGuests(status: ConsultStatus) {
  return GUEST_MESSAGING_STATUSES.includes(status);
}

export async function listGuestsForInquiry(userId: string, inquiryId: string) {
  await ensureInquiryForUser(userId, inquiryId);
  try {
    const { listGuestsRemote } = await import('../lib/guestSupabase');
    const remote = await listGuestsRemote(inquiryId);
    if (remote) {
      for (const row of remote) {
        eventGuests.set(row.id, row);
        guestsByToken.set(row.inviteToken, row.id);
      }
      return remote.map(publicGuest);
    }
  } catch (err) {
    console.warn('[supabase] guest list skipped:', err instanceof Error ? err.message : err);
  }
  return [...eventGuests.values()]
    .filter((g) => g.inquiryId === inquiryId && g.hostUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(publicGuest);
}

export async function addGuest(
  user: UserRecord,
  inquiryId: string,
  body: { name: string; email: string },
) {
  const inquiry = await ensureInquiryForUser(user.id, inquiryId);
  if (!canManageGuests(inquiry.status)) {
    throw Object.assign(
      new Error('Guest invites are not available for this consult status.'),
      { status: 403 },
    );
  }
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!name || !email || !email.includes('@')) {
    throw Object.assign(new Error('Guest name and valid email required'), { status: 400 });
  }

  const token = crypto.randomBytes(18).toString('base64url');
  const record: EventGuestRecord = {
    id: id('guest'),
    inquiryId,
    hostUserId: user.id,
    name,
    email,
    inviteToken: token,
    rsvpStatus: 'pending',
    hasAllergy: false,
    eventTitle: inquiry.planTitle || `${inquiry.name}'s celebration`,
    eventLocation: inquiry.location,
    createdAt: now(),
    updatedAt: now(),
  };
  eventGuests.set(record.id, record);
  guestsByToken.set(token, record.id);
  void persistGuest(record);
  return publicGuest(record);
}

export async function getGuestByToken(token: string) {
  const trimmed = (token || '').trim();
  if (!trimmed) {
    throw Object.assign(new Error('Invite token required'), { status: 400 });
  }

  let guestId = guestsByToken.get(trimmed);
  if (!guestId) {
    try {
      const { fetchGuestByTokenRemote } = await import('../lib/guestSupabase');
      const remote = await fetchGuestByTokenRemote(trimmed);
      if (remote) {
        eventGuests.set(remote.id, remote);
        guestsByToken.set(remote.inviteToken, remote.id);
        guestId = remote.id;
      }
    } catch (err) {
      console.warn('[supabase] guest token lookup skipped:', err instanceof Error ? err.message : err);
    }
  }

  const guest = guestId ? eventGuests.get(guestId) : undefined;
  if (!guest) {
    throw Object.assign(new Error('Invite not found or expired'), { status: 404 });
  }

  return {
    id: guest.id,
    name: guest.name,
    eventTitle: guest.eventTitle,
    eventLocation: guest.eventLocation,
    rsvpStatus: guest.rsvpStatus,
    hasAllergy: guest.hasAllergy,
    allergyNote: guest.allergyNote,
    respondedAt: guest.respondedAt,
  };
}

export async function submitGuestRsvp(
  token: string,
  body: { accept: boolean; hasAllergy?: boolean; allergyNote?: string },
) {
  const trimmed = (token || '').trim();
  let guestId = guestsByToken.get(trimmed);
  if (!guestId) {
    try {
      const { fetchGuestByTokenRemote } = await import('../lib/guestSupabase');
      const remote = await fetchGuestByTokenRemote(trimmed);
      if (remote) {
        eventGuests.set(remote.id, remote);
        guestsByToken.set(remote.inviteToken, remote.id);
        guestId = remote.id;
      }
    } catch {
      /* fall through */
    }
  }

  const guest = guestId ? eventGuests.get(guestId) : undefined;
  if (!guest) {
    throw Object.assign(new Error('Invite not found or expired'), { status: 404 });
  }

  guest.rsvpStatus = body.accept ? 'accepted' : 'declined';
  guest.hasAllergy = Boolean(body.hasAllergy);
  guest.allergyNote = body.hasAllergy ? (body.allergyNote || '').trim() || undefined : undefined;
  guest.respondedAt = now();
  guest.updatedAt = now();
  void persistGuest(guest);

  console.log(
    `[Meridian Guest RSVP] ${guest.email} → ${guest.rsvpStatus}` +
      (guest.hasAllergy ? ' (allergy flagged)' : ''),
  );

  return {
    ok: true as const,
    rsvpStatus: guest.rsvpStatus,
    eventTitle: guest.eventTitle,
    message:
      guest.rsvpStatus === 'accepted'
        ? 'Response recorded. We look forward to welcoming you.'
        : 'Response recorded. Thank you for letting us know.',
  };
}

const adminSessions = new Map<string, { expiresAt: number; adminId?: string }>();
const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

const adminUsers = new Map<string, AdminUserRecord>();
let adminUsersHydrated = false;

function adminInviteExpected() {
  return (process.env.ADMIN_INVITE_CODE || process.env.ADMIN_PASSWORD || '').trim();
}

function publicAdmin(user: AdminUserRecord) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

function adminDataPath() {
  return path.join(process.cwd(), 'data', 'admin-users.json');
}

function adminSessionsPath() {
  return path.join(process.cwd(), 'data', 'admin-sessions.json');
}

function hydrateAdminUsers() {
  if (adminUsersHydrated) return;
  adminUsersHydrated = true;
  try {
    const raw = fs.readFileSync(adminDataPath(), 'utf8');
    const rows = JSON.parse(raw) as AdminUserRecord[];
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row?.id && row?.email && row?.passwordHash) {
          adminUsers.set(row.id, row);
        }
      }
    }
  } catch {
    // missing or unreadable — start empty
  }
  try {
    const raw = fs.readFileSync(adminSessionsPath(), 'utf8');
    const rows = JSON.parse(raw) as { token: string; expiresAt: number; adminId?: string }[];
    if (Array.isArray(rows)) {
      const nowMs = Date.now();
      for (const row of rows) {
        if (row?.token && row.expiresAt > nowMs) {
          adminSessions.set(row.token, { expiresAt: row.expiresAt, adminId: row.adminId });
        }
      }
    }
  } catch {
    // optional
  }
}

function persistAdminUsers() {
  try {
    const dir = path.dirname(adminDataPath());
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(adminDataPath(), JSON.stringify([...adminUsers.values()], null, 2), {
      mode: 0o644,
    });
  } catch (err) {
    console.error('[admin] could not persist admin users:', err instanceof Error ? err.message : err);
  }
}

function persistAdminSessions() {
  try {
    const dir = path.dirname(adminSessionsPath());
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    const nowMs = Date.now();
    const rows = [...adminSessions.entries()]
      .filter(([, s]) => s.expiresAt > nowMs)
      .map(([token, s]) => ({ token, expiresAt: s.expiresAt, adminId: s.adminId }));
    fs.writeFileSync(adminSessionsPath(), JSON.stringify(rows, null, 2), { mode: 0o644 });
  } catch (err) {
    console.error('[admin] could not persist admin sessions:', err instanceof Error ? err.message : err);
  }
}

function findAdminByEmail(email: string) {
  hydrateAdminUsers();
  const normalized = email.trim().toLowerCase();
  for (const u of adminUsers.values()) {
    if (u.email === normalized) return u;
  }
  return undefined;
}

function issueAdminToken(adminId?: string) {
  hydrateAdminUsers();
  const expiresAt = Date.now() + ADMIN_SESSION_MS;
  // HMAC-signed so tokens survive restarts / multi-instance without shared memory.
  const token = signPayload({
    t: 'admin',
    sub: adminId || 'legacy',
    exp: expiresAt,
  });
  adminSessions.set(token, { expiresAt, adminId });
  persistAdminSessions();
  return { token, expiresInHours: 12 };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared ADMIN_PASSWORD login (legacy) — no email required. */
export function adminLogin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw Object.assign(new Error('Admin is not configured (set ADMIN_PASSWORD)'), { status: 503 });
  }
  const givenHash = crypto.createHash('sha256').update(password || '').digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(givenHash, expectedHash)) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  return issueAdminToken();
}

/**
 * Planner email login, with fallback to shared ADMIN_PASSWORD when no account matches.
 * Lets the UI always send email+password without blocking ops who only set ADMIN_PASSWORD.
 */
export function adminLoginFlexible(email: string | undefined, password: string) {
  const normalized = (email || '').trim().toLowerCase();
  if (normalized && EMAIL_RE.test(normalized)) {
    const found = findAdminByEmail(normalized);
    if (found) {
      if (!password || password.length < 8) {
        throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
      }
      if (!verifyPassword(password, found.passwordHash)) {
        throw Object.assign(new Error('Invalid email or password'), { status: 401 });
      }
      const issued = issueAdminToken(found.id);
      return { ...issued, admin: publicAdmin(found) };
    }
  }
  return adminLogin(password || '');
}

/** @deprecated Prefer adminLoginFlexible — kept for password-only callers. */
export function adminLoginAccount(email: string, password: string) {
  return adminLoginFlexible(email, password);
}

export function registerAdmin(opts: {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
}) {
  const name = (opts.name || '').trim();
  const email = (opts.email || '').trim().toLowerCase();
  const password = opts.password || '';
  const invite = (opts.inviteCode || '').trim();
  const expectedInvite = adminInviteExpected();

  if (!expectedInvite) {
    throw Object.assign(new Error('Admin registration is not configured'), { status: 503 });
  }
  if (name.length < 2) {
    throw Object.assign(new Error('Name must be at least 2 characters'), { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    throw Object.assign(new Error('Enter a valid work email'), { status: 400 });
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw Object.assign(
      new Error('Password must be 8+ characters with at least one letter and one number'),
      { status: 400 },
    );
  }
  const inviteHash = crypto.createHash('sha256').update(invite).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedInvite).digest();
  if (!crypto.timingSafeEqual(inviteHash, expectedHash)) {
    throw Object.assign(new Error('Invalid invite code'), { status: 403 });
  }
  if (findAdminByEmail(email)) {
    throw Object.assign(new Error('An admin account with this email already exists'), { status: 409 });
  }

  const user: AdminUserRecord = {
    id: id('adm'),
    email,
    name,
    passwordHash: hashPassword(password),
    createdAt: now(),
  };
  adminUsers.set(user.id, user);
  persistAdminUsers();
  const issued = issueAdminToken(user.id);
  return { ...issued, admin: publicAdmin(user) };
}

export function isAdminToken(authHeader?: string) {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  hydrateAdminUsers();

  const payload = readPayload<{ t?: string; exp?: number }>(token);
  if (payload?.t === 'admin' && typeof payload.exp === 'number') {
    if (payload.exp < Date.now()) return false;
    return true;
  }

  const session = adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

export async function listAllInquiries() {
  try {
    const { listAllInquiriesRemote } = await import('../lib/inquirySupabase');
    const remote = await listAllInquiriesRemote();
    if (remote) {
      for (const row of remote) {
        inquiries.set(row.id, row as InquiryRecord);
      }
      return remote as InquiryRecord[];
    }
  } catch (err) {
    console.warn('[supabase] admin list skipped:', err instanceof Error ? err.message : err);
  }
  return [...inquiries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function adminUpdateInquiryStatus(inquiryId: string, status: ConsultStatus) {
  const record = inquiries.get(inquiryId);
  if (!record) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }
  if (record.userId) {
    return updateInquiryStatus(record.userId, inquiryId, status);
  }
  record.status = status;
  record.updatedAt = now();
  void persistInquiry(record);
  return record;
}

export async function listAllMembers() {
  try {
    const { listUsersRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await listUsersRemote();
    if (remote) {
      for (const row of remote) cacheUser(row);
    }
  } catch (err) {
    warnSupabase('list members', err);
  }
  return [...users.values()]
    .map(publicUser)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllPlansSummary() {
  try {
    const { listAllPlansRemote } = await import('../lib/clubPlatformSupabase');
    const remote = await listAllPlansRemote();
    if (remote) {
      for (const row of remote) plans.set(row.id, row);
    }
  } catch (err) {
    warnSupabase('list all plans', err);
  }
  return [...plans.values()]
    .map((p) => ({
      id: p.id,
      userId: p.userId,
      title: p.title,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function adminOverview() {
  await listAllMembers();
  await listAllPlansSummary();
  const all = [...inquiries.values()];
  const byStatus = {
    received: 0,
    assigned: 0,
    call_scheduled: 0,
    deposit: 0,
    completed: 0,
  } satisfies Record<ConsultStatus, number>;
  for (const row of all) {
    byStatus[row.status] += 1;
  }
  return {
    members: users.size,
    inquiries: all.length,
    plans: plans.size,
    byStatus,
  };
}

export const clubPointRules = POINTS;
