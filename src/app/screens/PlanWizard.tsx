import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type {
  CateringStyle,
  DesignerPrefill,
  EventType,
  LocalCategory,
  MessageStyle,
  OverseasCategory,
  PlannerInput,
} from '../../types';
import NearbyVenueChips, { venueToLocalCategory } from '../../components/NearbyVenueChips';
import { useNearbyVenues } from '../../hooks/useNearbyVenues';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATERING: { value: CateringStyle; label: string }[] = [
  { value: 'fine_dining', label: 'Fine dining' },
  { value: 'buffet', label: 'Curated buffet' },
  { value: 'cocktail_reception', label: 'Cocktail reception' },
  { value: 'themed_bbq', label: 'Artisanal BBQ' },
  { value: 'traditional_banquet', label: 'Traditional banquet' },
];

const STYLES: { value: MessageStyle; label: string }[] = [
  { value: 'romantic', label: 'Romantic' },
  { value: 'formal', label: 'Formal' },
  { value: 'modern_minimalist', label: 'Minimal' },
  { value: 'warm_festive', label: 'Festive' },
];

interface PlanWizardProps {
  initial?: DesignerPrefill | null;
  generating: boolean;
  error: string | null;
  onGenerate: (input: PlannerInput) => void;
}

export default function PlanWizard({ initial, generating, error, onGenerate }: PlanWizardProps) {
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventType>(initial?.eventType ?? 'overseas');
  const [localCategory, setLocalCategory] = useState<LocalCategory>(initial?.localCategory ?? 'resort');
  const [overseasCategory, setOverseasCategory] = useState<OverseasCategory>(
    initial?.overseasCategory ?? 'wedding_ceremony',
  );
  const [locationName, setLocationName] = useState(initial?.locationName ?? '');
  const [guestCount, setGuestCount] = useState(initial?.guestCount ?? 100);
  const nearby = useNearbyVenues(eventType === 'local');
  const [targetMonth, setTargetMonth] = useState(initial?.targetMonth ?? 'September');
  const [cateringStyle, setCateringStyle] = useState<CateringStyle>(initial?.cateringStyle ?? 'fine_dining');
  const [messageStyle, setMessageStyle] = useState<MessageStyle>(initial?.messageStyle ?? 'romantic');
  const [specialNotes, setSpecialNotes] = useState(initial?.specialNotes ?? '');

  useEffect(() => {
    if (!initial) return;
    if (initial.eventType) setEventType(initial.eventType);
    if (initial.localCategory) setLocalCategory(initial.localCategory);
    if (initial.overseasCategory) setOverseasCategory(initial.overseasCategory);
    if (initial.locationName) setLocationName(initial.locationName);
    if (initial.guestCount) setGuestCount(initial.guestCount);
    if (initial.targetMonth) setTargetMonth(initial.targetMonth);
    if (initial.cateringStyle) setCateringStyle(initial.cateringStyle);
    if (initial.messageStyle) setMessageStyle(initial.messageStyle);
    if (initial.specialNotes) setSpecialNotes(initial.specialNotes);
    setStep(0);
  }, [initial]);

  const buildInput = (): PlannerInput => ({
    eventType,
    localCategory: eventType === 'local' ? localCategory : undefined,
    overseasCategory: eventType === 'overseas' ? overseasCategory : undefined,
    locationName:
      locationName.trim() ||
      (eventType === 'local' ? 'Local Premium Venue' : 'Santorini, Greece'),
    guestCount,
    cateringStyle,
    messageStyle,
    targetMonth,
    specialNotes: specialNotes.trim() || undefined,
  });

  return (
    <div className="px-5 py-6">
      <div className="mb-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden bg-ink/10">
            <div
              className={`h-full bg-atlantic transition-all duration-300 ease-out ${
                i <= step ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="font-app-display text-3xl text-ink">What are you planning?</h2>
          <div className="grid gap-3">
            <Choice
              active={eventType === 'overseas'}
              title="Overseas"
              subtitle="Destination wedding or celebration abroad"
              onClick={() => setEventType('overseas')}
            />
            <Choice
              active={eventType === 'local'}
              title="Local"
              subtitle="Estate, resort, or city venue near you"
              onClick={() => setEventType('local')}
            />
          </div>

          {eventType === 'overseas' ? (
            <ChipRow
              label="Focus"
              options={[
                { value: 'wedding_ceremony', label: 'Ceremony' },
                { value: 'air_ticket', label: 'Travel' },
                { value: 'hotel', label: 'Stays' },
                { value: 'concierge', label: 'Concierge' },
              ]}
              value={overseasCategory}
              onChange={(v) => setOverseasCategory(v as OverseasCategory)}
            />
          ) : (
            <ChipRow
              label="Venue mood"
              options={[
                { value: 'resort', label: 'Resort' },
                { value: 'beach', label: 'Beach' },
                { value: 'hotel', label: 'Hotel' },
                { value: 'restaurant', label: 'Dining' },
              ]}
              value={localCategory}
              onChange={(v) => setLocalCategory(v as LocalCategory)}
            />
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-app-display text-3xl text-ink">Place & scale</h2>
          <label className="block space-y-1.5">
            <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">Location</span>
            <input
              className="app-input"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={eventType === 'overseas' ? 'e.g. Santorini' : 'e.g. Cotswolds estate'}
            />
          </label>
          {eventType === 'local' && (
            <NearbyVenueChips
              countryName={nearby.countryName}
              venues={nearby.venues}
              selectedName={locationName}
              filterCategory={localCategory}
              loading={nearby.loading}
              onSelect={(v) => {
                setLocationName(v.name);
                setLocalCategory(venueToLocalCategory(v.localCategory));
              }}
            />
          )}
          <label className="block space-y-1.5">
            <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
              Guests · {guestCount}
            </span>
            <input
              type="range"
              min={20}
              max={400}
              step={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full accent-atlantic"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">Target month</span>
            <select
              className="app-input"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h2 className="font-app-display text-3xl text-ink">Tone & table</h2>
          <ChipRow
            label="Catering"
            options={CATERING}
            value={cateringStyle}
            onChange={(v) => setCateringStyle(v as CateringStyle)}
          />
          <ChipRow
            label="Voice"
            options={STYLES}
            value={messageStyle}
            onChange={(v) => setMessageStyle(v as MessageStyle)}
          />
          <label className="block space-y-1.5">
            <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">Notes</span>
            <textarea
              className="app-input min-h-24 resize-none"
              rows={3}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Anything we should know…"
            />
          </label>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="mt-4 font-app-sans text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={generating}
            className="app-btn app-btn-ghost w-auto! min-w-22 shrink-0 flex-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="app-btn app-btn-ink flex-1"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={generating}
            onClick={() => onGenerate(buildInput())}
            className="app-btn app-btn-atlantic flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Generate blueprint
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-4 text-left transition-colors duration-200 ${
        active ? 'border-atlantic bg-atlantic text-paper' : 'border-ink/10 bg-white text-ink'
      }`}
    >
      <span className="block font-app-display text-2xl">{title}</span>
      <span className={`mt-1 block font-app-sans text-sm ${active ? 'text-paper/75' : 'text-ink/55'}`}>
        {subtitle}
      </span>
    </button>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`app-chip ${value === opt.value ? 'app-chip-active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
