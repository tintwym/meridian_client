type Props = {
  /** Kept for ClubScreen compatibility; preview lock UI removed. */
  unlocked?: boolean;
};

/**
 * Guest messaging intro for Club → Guests.
 * Live invites / RSVP live in ClubGuestPanel below — no phone preview mock.
 */
export default function CommunicationSuite(_props: Props) {
  return (
    <div className="space-y-2">
      <p className="font-app-sans text-[11px] tracking-[0.18em] text-atlantic uppercase">
        Communication Suite
      </p>
      <div>
        <h3 className="font-app-display text-2xl tracking-tight text-ink">Bespoke Guest Messaging</h3>
        <p className="mt-1 font-app-sans text-sm leading-relaxed text-ink/55">
          Add guests below to create invite links, collect RSVPs, and share logistics for each
          consult.
        </p>
      </div>
    </div>
  );
}
