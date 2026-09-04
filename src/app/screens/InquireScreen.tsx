import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Send } from 'lucide-react';
import { submitLead } from '../../api';
import type { EventPlanResponse } from '../../types';
import { BRAND } from '../../brand';
import { useAuth } from '../AuthContext';

interface InquireScreenProps {
  activePlan: EventPlanResponse | null;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function InquireScreen({ activePlan }: InquireScreenProps) {
  const { user, setUserPoints, refreshClub } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: activePlan?.location || '',
    date: '',
    budget: activePlan?.estimatedBudgetRange || '',
    vision: activePlan ? `${activePlan.title} — ${activePlan.tagline}` : '',
  });
  const [redeemHundreds, setRedeemHundreds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name,
      email: prev.email || user.email,
    }));
  }, [user]);

  const maxRedeemHundreds = user ? Math.floor(user.points / 100) : 0;
  const redeemPoints = redeemHundreds * 100;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await submitLead({
        ...formData,
        planTitle: activePlan?.title,
        planTagline: activePlan?.tagline,
        redeemPoints: user && redeemPoints > 0 ? redeemPoints : undefined,
      });
      setMessage(result.message);
      setDone(result.ok);
      if (result.club) {
        setUserPoints(result.club.points, result.club.creditUsd);
        await refreshClub();
      }
    } catch {
      setMessage('Could not submit — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-paper text-ink">
      <header
        className="sticky top-0 z-20 border-b border-ink/8 bg-paper/95 px-5 py-4 backdrop-blur-md"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <p className="font-app-sans text-[11px] font-medium tracking-[0.22em] text-atlantic uppercase">
          Inquire
        </p>
        <h1 className="font-app-display text-2xl tracking-tight text-ink">Talk to a planner</h1>
      </header>

      <div className="px-5 py-8 pb-12">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.42, ease }}
              className="space-y-5 py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.08, ease }}
              >
                <CheckCircle2 className="mx-auto h-12 w-12 text-atlantic" />
              </motion.div>
              <h2 className="font-app-display text-3xl text-ink">Thank you, {formData.name}</h2>
              <p className="mx-auto max-w-sm font-app-sans text-sm leading-relaxed text-ink/60">
                A planner will follow up at {formData.email}.
                {message ? ` ${message}` : ''} Track status in Meridian Club.
              </p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="font-app-sans text-sm text-atlantic underline-offset-4 hover:underline"
              >
                Send another inquiry
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease }}
              onSubmit={onSubmit}
              className="mx-auto max-w-md space-y-5"
            >
            <p className="font-app-sans text-sm leading-relaxed text-ink/60">
              Share a few details. We’ll reply from {BRAND.email.planner}.
            </p>

            {activePlan && (
              <div className="rounded-xl border border-atlantic/20 bg-atlantic/5 px-4 py-3">
                <p className="font-app-sans text-[10px] tracking-[0.18em] text-atlantic uppercase">
                  Attached plan
                </p>
                <p className="mt-1 font-app-display text-xl text-ink">{activePlan.title}</p>
                <p className="font-app-sans text-xs text-ink/55">{activePlan.estimatedBudgetRange}</p>
              </div>
            )}

            <Field label="Full name">
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="app-input"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="app-input"
                placeholder="you@email.com"
              />
            </Field>
            <Field label="Location">
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="app-input"
                placeholder="City or destination"
              />
            </Field>
            <Field label="Target month / season">
              <input
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="app-input"
                placeholder="e.g. September 2026"
              />
            </Field>
            <Field label="Budget">
              <input
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="app-input"
                placeholder="Range or notes"
              />
            </Field>
            <Field label="Vision">
              <textarea
                rows={4}
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                className="app-input min-h-24 resize-none"
                placeholder="Aesthetic, guests, travel needs…"
              />
            </Field>

            {user && maxRedeemHundreds > 0 && (
              <div className="space-y-2 border border-atlantic/25 bg-atlantic/5 px-4 py-3">
                <p className="font-app-sans text-[11px] tracking-[0.16em] text-atlantic uppercase">
                  Club credit
                </p>
                <p className="font-app-sans text-xs text-ink/60">
                  You have {user.points.toLocaleString()} pts (≈ ${user.creditUsd}). Apply up to $
                  {maxRedeemHundreds} toward planning.
                </p>
                <input
                  type="range"
                  min={0}
                  max={maxRedeemHundreds}
                  step={1}
                  value={redeemHundreds}
                  onChange={(e) => setRedeemHundreds(Number(e.target.value))}
                  className="w-full accent-atlantic"
                />
                <p className="font-app-sans text-sm text-ink">
                  Redeem {redeemPoints} pts → ${redeemHundreds} credit
                </p>
              </div>
            )}

            {message && !done && (
              <p className="font-app-sans text-sm text-red-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="app-btn app-btn-ink"
            >
              {submitting ? 'Sending…' : 'Send inquiry'}
              <Send className="h-4 w-4" />
            </button>
          </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-app-sans text-[11px] font-medium tracking-[0.16em] text-ink/50 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
