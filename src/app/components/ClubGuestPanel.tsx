import { useEffect, useState, type FormEvent } from 'react';
import {
  addInquiryGuest,
  listInquiryGuests,
  type EventGuest,
  type InquiryRecord,
} from '../../api/platform';

type Props = {
  inquiry: InquiryRecord;
};

/** Host guest list — unlocked at Deposit / Completed. */
export default function ClubGuestPanel({ inquiry }: Props) {
  const unlocked = inquiry.status === 'deposit' || inquiry.status === 'completed';
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!unlocked) {
      setGuests([]);
      return;
    }
    let cancelled = false;

    const refresh = () => {
      listInquiryGuests(inquiry.id)
        .then((res) => {
          if (!cancelled) setGuests(res.guests);
        })
        .catch(() => {
          if (!cancelled) setGuests([]);
        });
    };

    refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [inquiry.id, unlocked, inquiry.status]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInviteUrl(null);
    try {
      const res = await addInquiryGuest(inquiry.id, name.trim(), email.trim());
      setGuests((prev) => [res.guest, ...prev]);
      setInviteUrl(res.inviteUrl);
      setName('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add guest');
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <p className="font-app-sans text-xs text-ink/45 leading-relaxed">
        Guest Messaging unlocks at <span className="text-ink/70">Deposit stage</span> — add
        guests, copy invite links, and collect RSVPs.
      </p>
    );
  }

  return (
    <div className="space-y-3 border-t border-ink/8 pt-3">
      <p className="font-app-sans text-[10px] tracking-[0.16em] text-atlantic uppercase">
        Guest Messaging
      </p>

      <form onSubmit={onAdd} className="space-y-2">
        <input
          className="app-input"
          placeholder="Guest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="app-input"
          type="email"
          placeholder="Guest email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={busy} className="app-btn app-btn-ink w-full disabled:opacity-50">
          {busy ? 'Creating invite…' : 'Add guest & create invite'}
        </button>
      </form>

      {error && <p className="font-app-sans text-xs text-red-700">{error}</p>}

      {inviteUrl && (
        <div className="rounded-xl border border-ink/10 bg-paper/80 px-3 py-2 space-y-1">
          <p className="font-app-sans text-[10px] tracking-wide text-ink/50 uppercase">
            Invite link
          </p>
          <p className="font-app-sans text-xs text-ink break-all">{inviteUrl}</p>
          <button
            type="button"
            className="font-app-sans text-[11px] text-atlantic underline"
            onClick={() => void navigator.clipboard.writeText(inviteUrl)}
          >
            Copy link
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {guests.length === 0 && (
          <li className="font-app-sans text-xs text-ink/45">No guests yet.</li>
        )}
        {guests.map((g) => (
          <li key={g.id} className="flex items-start justify-between gap-2 text-xs">
            <div>
              <p className="font-app-sans text-ink">{g.name}</p>
              <p className="font-app-sans text-ink/45">{g.email}</p>
            </div>
            <span className="font-app-sans text-[10px] uppercase tracking-wide text-ink/50 shrink-0">
              {g.rsvpStatus}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
