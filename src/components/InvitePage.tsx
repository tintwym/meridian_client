import { useEffect, useState, type FormEvent } from 'react';
import { Check, Mail, Sparkles } from 'lucide-react';
import { fetchInvite, submitInviteRsvp, type PublicInvite } from '../api/platform';

type Props = { token: string };

/**
 * Public guest invite + RSVP (Guest Messaging v1).
 * Opened via /invite/:token — no Club auth required.
 */
export default function InvitePage({ token }: Props) {
  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accept, setAccept] = useState<boolean | null>(null);
  const [hasAllergy, setHasAllergy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInvite(token)
      .then((data) => {
        if (cancelled) return;
        setInvite(data);
        if (data.rsvpStatus === 'accepted') setAccept(true);
        if (data.rsvpStatus === 'declined') setAccept(false);
        setHasAllergy(data.hasAllergy);
        if (data.rsvpStatus !== 'pending') {
          setDoneMessage(
            data.rsvpStatus === 'accepted'
              ? 'Your acceptance is already recorded.'
              : 'Your decline is already recorded.',
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Invite unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (accept === null) {
      setError('Please accept or decline');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await submitInviteRsvp(token, { accept, hasAllergy });
      setDoneMessage(res.message);
      setInvite((prev) =>
        prev
          ? {
              ...prev,
              rsvpStatus: res.rsvpStatus,
              hasAllergy,
              respondedAt: new Date().toISOString(),
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit RSVP');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-champagne text-navy flex flex-col">
      <header className="px-6 py-5 border-b border-navy/8">
        <p className="font-serif text-xl tracking-[0.18em] font-semibold">MERIDIAN</p>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate mt-1">
          Guest invitation
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {loading && (
            <p className="text-sm text-slate text-center">Opening your invitation…</p>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 text-center space-y-2">
              <p className="font-serif text-xl">Invite unavailable</p>
              <p className="text-sm text-slate">{error}</p>
            </div>
          )}

          {invite && !loading && (
            <div className="rounded-3xl border border-navy/10 bg-[#1A1F28] text-white p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/55 uppercase tracking-widest">
                  RSVP Confirmation Portal
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#C4B59A]" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-serif italic text-[#C4B59A]">
                  The honor of your presence
                </p>
                <h1 className="font-serif text-2xl font-semibold leading-tight">
                  {invite.eventTitle || 'A Meridian celebration'}
                </h1>
                {invite.eventLocation && (
                  <p className="text-xs text-white/55">{invite.eventLocation}</p>
                )}
                <p className="text-xs text-white/70 pt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  For {invite.name}
                </p>
              </div>

              {doneMessage ? (
                <div className="text-center py-4 space-y-3">
                  <Check className="w-10 h-10 text-sage mx-auto" />
                  <p className="font-serif text-lg">{doneMessage}</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-sm font-serif">Will you join?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAccept(true)}
                        className={`flex-1 py-2 text-[10px] font-mono uppercase rounded-full border transition-all cursor-pointer ${
                          accept === true
                            ? 'bg-sage border-sage text-white'
                            : 'bg-transparent border-white/20 text-white/80'
                        }`}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccept(false)}
                        className={`flex-1 py-2 text-[10px] font-mono uppercase rounded-full border transition-all cursor-pointer ${
                          accept === false
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-transparent border-white/20 text-white/80'
                        }`}
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-3 text-[9px] font-mono text-white/60 uppercase tracking-wide">
                    Severe food allergies?
                    <input
                      type="checkbox"
                      checked={hasAllergy}
                      onChange={(e) => setHasAllergy(e.target.checked)}
                      className="accent-sage size-4"
                    />
                  </label>

                  {error && <p className="text-xs text-red-300">{error}</p>}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-paper text-navy text-[10px] font-mono uppercase tracking-widest py-3 rounded-full font-bold hover:bg-sage hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {busy ? 'Sending…' : 'Submit Response'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
