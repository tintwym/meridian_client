/**
 * Platform routes shared by Web / iOS / Android standalone clients.
 */

import type { Express, Request, Response, NextFunction } from 'express';
import * as store from './platformStore';
import { rateLimit } from './rateLimit';

const authLoginLimit = rateLimit(12, 15 * 60 * 1000);
const otpLimit = rateLimit(8, 15 * 60 * 1000);
const leadsLimit = rateLimit(20, 60 * 60 * 1000);

async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    (req as Request & { user?: store.UserRecord | null }).user = await store.getUserByToken(
      req.header('authorization') || undefined,
    );
    next();
  } catch (err) {
    next(err);
  }
}

function requireUser(req: Request, res: Response): store.UserRecord | null {
  const user = (req as Request & { user?: store.UserRecord | null }).user;
  if (!user) {
    res.status(401).json({ ok: false, error: 'Sign in required' });
    return null;
  }
  return user;
}

function requireAdmin(req: Request, res: Response) {
  if (!store.isAdminToken(req.header('authorization') || undefined)) {
    res.status(401).json({ ok: false, error: 'Admin sign-in required' });
    return false;
  }
  return true;
}

function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowed = new Set<string>();
  for (const raw of [
    process.env.APP_URL,
    process.env.ADMIN_ORIGIN,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]) {
    if (!raw) continue;
    for (const part of String(raw).split(',')) {
      const value = part.trim();
      if (value) allowed.add(value);
    }
  }
  const lanPrivate =
    typeof origin === 'string' &&
    /^https?:\/\/(?:10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+):300[01]$/.test(
      origin,
    );
  if (origin && (allowed.has(origin) || lanPrivate || /\.vercel\.app$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

export function mountPlatformRoutes(app: Express) {
  app.use(cors);
  app.use(auth);

  app.post('/api/admin/login', authLoginLimit, (req, res) => {
    try {
      const { email, password } = req.body || {};
      const result = store.adminLoginFlexible(
        typeof email === 'string' ? email : undefined,
        password || '',
      );
      res.json({ ok: true, ...result });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/admin/register', (req, res) => {
    try {
      const { name, email, password, inviteCode } = req.body || {};
      const result = store.registerAdmin({
        name: name || '',
        email: email || '',
        password: password || '',
        inviteCode: inviteCode || '',
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/admin/overview', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      await store.listAllInquiries();
      res.json({ ok: true, ...(await store.adminOverview()) });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/admin/inquiries', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const inquiries = await store.listAllInquiries();
      res.json({ ok: true, inquiries });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.patch('/api/admin/inquiries/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const status = req.body?.status as store.ConsultStatus;
    const allowed: store.ConsultStatus[] = [
      'received',
      'assigned',
      'call_scheduled',
      'deposit',
      'completed',
    ];
    if (!allowed.includes(status)) {
      res.status(400).json({ ok: false, error: 'Invalid status' });
      return;
    }
    try {
      const inquiry = await store.adminUpdateInquiryStatus(req.params.id, status);
      res.json({ ok: true, inquiry });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/admin/members', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    res.json({ ok: true, members: await store.listAllMembers() });
  });

  app.get('/api/admin/plans', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    res.json({ ok: true, plans: await store.listAllPlansSummary() });
  });

  app.get('/api/platform/health', (_req, res) => {
    const payload: Record<string, unknown> = {
      ok: true,
      product: 'Meridian Atelier',
      clients: ['web', 'ios', 'android', 'admin'],
      club: store.clubPointRules,
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.config = {
        supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
        adminPassword: Boolean(process.env.ADMIN_PASSWORD),
        otpEmail: Boolean(process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL),
      };
    }
    res.json(payload);
  });

  app.post('/api/auth/register', authLoginLimit, async (req, res) => {
    try {
      const { email, password, name } = req.body || {};
      const result = await store.registerUser(email, password, name || '');
      res.json({ ok: true, ...result });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/auth/login', authLoginLimit, async (req, res) => {
    try {
      const { email, password } = req.body || {};
      const result = await store.loginUser(
        typeof email === 'string' ? email : '',
        typeof password === 'string' ? password : '',
      );
      res.json({ ok: true, ...result });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/auth/otp/request', otpLimit, async (req, res) => {
    try {
      const result = await store.requestEmailOtp(req.body?.email || '');
      res.json(result);
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/auth/otp/verify', otpLimit, async (req, res) => {
    try {
      const { email, code, password, name, otpTicket } = req.body || {};
      const result = await store.verifyEmailOtp(email, code, { password, name, otpTicket });
      res.json({ ok: true, ...result });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/auth/social', authLoginLimit, async (req, res) => {
    try {
      const result = await store.socialSignIn(req.body || {});
      res.json({ ok: true, ...result });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ ok: true, user: store.publicUser(user) });
  });

  app.patch('/api/auth/me', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const next = await store.updateUserProfile(user, { name: req.body?.name });
      res.json({ ok: true, user: next });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/club', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ ok: true, ...(await store.clubSummary(user)) });
  });

  app.get('/api/plans', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ ok: true, plans: await store.listUserPlans(user.id) });
  });

  app.post('/api/plans', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const { plan, input, title } = req.body || {};
    if (!plan) {
      res.status(400).json({ ok: false, error: 'plan required' });
      return;
    }
    const result = await store.saveUserPlan(user, plan, input, title);
    await store.addVaultDoc(user, result.plan.title, 'proposal', 'Saved event blueprint');
    res.json({ ok: true, ...result });
  });

  app.get('/api/wishlist', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ ok: true, items: await store.listWishlist(user.id) });
  });

  app.post('/api/wishlist', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    const { label, locationType, notes } = req.body || {};
    if (!label) {
      res.status(400).json({ ok: false, error: 'label required' });
      return;
    }
    const item = await store.addWishlist(
      user,
      label,
      locationType === 'local' ? 'local' : 'overseas',
      notes,
    );
    res.json({ ok: true, item });
  });

  app.delete('/api/wishlist/:id', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      res.json(await store.removeWishlist(user.id, req.params.id));
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/inquiries', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const inquiries = await store.listInquiries(user.id);
      res.json({ ok: true, inquiries });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  // Consult status is planner-controlled (admin dashboard). Hosts see read-only updates via Realtime.
  app.patch('/api/inquiries/:id/status', (_req, res) => {
    res.status(403).json({
      ok: false,
      error: 'Consult status is updated by your planner. Track progress under Club → Consult.',
    });
  });

  // —— Guest Messaging v1 (host + public invite) ——
  app.get('/api/inquiries/:id/guests', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      // Hydrate inquiries first so guest handlers don't 404 on cold cache.
      await store.listInquiries(user.id);
      const guests = await store.listGuestsForInquiry(user.id, req.params.id);
      const inquiries = await store.listInquiries(user.id);
      const inq = inquiries.find((i) => i.id === req.params.id);
      res.json({
        ok: true,
        guests,
        unlocked: inq ? store.canManageGuests(inq.status) : false,
      });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/inquiries/:id/guests', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const guest = await store.addGuest(user, req.params.id, {
        name: req.body?.name || '',
        email: req.body?.email || '',
      });
      const base =
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const inviteUrl = `${base.replace(/\/$/, '')}/invite/${guest.inviteToken}`;
      res.json({ ok: true, guest, inviteUrl });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/invite/:token', async (req, res) => {
    try {
      const invite = await store.getGuestByToken(req.params.token);
      res.json({ ok: true, invite });
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/invite/:token/rsvp', async (req, res) => {
    try {
      const result = await store.submitGuestRsvp(req.params.token, {
        accept: Boolean(req.body?.accept),
        hasAllergy: Boolean(req.body?.hasAllergy),
        allergyNote: req.body?.allergyNote,
      });
      res.json(result);
    } catch (err) {
      const e = err as Error & { status?: number };
      res.status(e.status || 500).json({ ok: false, error: e.message });
    }
  });

  app.get('/api/vault', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ ok: true, documents: await store.listVault(user.id) });
  });
}
