import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Layers,
  Printer,
  Sparkles,
} from 'lucide-react';
import type {
  EventActivity,
  EventPlanResponse,
  EventType,
  PackageLineItem,
  PackageLocation,
} from '../types';
import { CATALOG_ACTIVITIES } from '../data/catalog';
import { EXPERIENCES } from '../data/experiences';
import { computePackageTotals, linePrice } from '../lib/pricing';
import {
  findConflicts,
  groupByDate,
  monthToSeedDate,
  parseClockTime,
  rootPackageLineId,
} from '../lib/schedule';
import {
  buildAgendaPlainText,
  downloadIcs,
  downloadPackagePdf,
  downloadPackagePdfFile,
  downloadTextFile,
} from '../lib/export';
import EventCard from './EventCard';
import DayTimeline from './DayTimeline';
import CustomLineForm from './CustomLineForm';
import InquiryForm from './InquiryForm';
import StaysPanel from './StaysPanel';
import TransfersPanel from './TransfersPanel';
import DestinationMap from './DestinationMap';

interface PackageStudioProps {
  plan: EventPlanResponse;
  eventType: EventType;
  guestCount: number;
  targetMonth: string;
  locationName: string;
  onRequestConsult?: (plan: EventPlanResponse | null) => void;
}

type StudioTab =
  | 'timeline'
  | 'catalog'
  | 'experiences'
  | 'stays'
  | 'transfers'
  | 'map'
  | 'custom'
  | 'handoff';

function uid() {
  return `pkg_${Math.random().toString(36).slice(2, 10)}`;
}

function seedFromPlan(
  plan: EventPlanResponse,
  guestCount: number,
  targetMonth: string,
  eventType: EventType,
): PackageLineItem[] {
  const seedDate = monthToSeedDate(targetMonth);
  const location: PackageLocation = eventType === 'overseas' ? 'Overseas' : 'Local';
  const perItemBudget = Math.max(400, Math.round((guestCount * 80) / Math.max(plan.itinerary.length, 1)));

  return plan.itinerary.map((step, index) => {
    const time = parseClockTime(step.time);
    return {
      id: uid(),
      title: step.activity,
      location,
      category: index === 0 ? 'Weddings' : index === plan.itinerary.length - 1 ? 'Dinners' : 'Activities',
      date: seedDate,
      time,
      guests: guestCount,
      notes: step.description,
      calculatedPrice: perItemBudget + guestCount * 15,
      basePrice: perItemBudget,
      pricePerGuest: 15,
      durationMinutes: 90,
      kind: 'event' as const,
      venueKey: `plan:${plan.location}`,
    };
  });
}

function activityToLine(
  activity: EventActivity,
  guests: number,
  date: string,
  kind: 'event' | 'experience',
  eventType: EventType,
): PackageLineItem {
  const capped = Math.min(guests, activity.maxGuests);
  const loc: PackageLocation =
    activity.location === 'Both'
      ? eventType === 'overseas'
        ? 'Overseas'
        : 'Local'
      : activity.location;

  return {
    id: uid(),
    activityId: activity.id,
    title: activity.title,
    location: loc,
    category: activity.category,
    date,
    time: kind === 'experience' ? '16:00' : '11:00',
    guests: capped,
    notes: activity.description,
    basePrice: activity.basePrice,
    pricePerGuest: activity.pricePerGuest,
    calculatedPrice: linePrice(activity.basePrice, activity.pricePerGuest, capped),
    durationMinutes: activity.durationMinutes,
    kind,
    venueKey: `${activity.id}:${loc}`,
  };
}

export default function PackageStudio({
  plan,
  eventType,
  guestCount,
  targetMonth,
  locationName,
  onRequestConsult,
}: PackageStudioProps) {
  const seedDate = monthToSeedDate(targetMonth);
  const defaultLocation: PackageLocation = eventType === 'overseas' ? 'Overseas' : 'Local';
  const place = locationName || plan.location;

  const [lines, setLines] = useState<PackageLineItem[]>(() =>
    seedFromPlan(plan, guestCount, targetMonth, eventType),
  );
  const [tab, setTab] = useState<StudioTab>('timeline');
  const [planKey, setPlanKey] = useState(plan.title);

  useEffect(() => {
    if (plan.title !== planKey) {
      setLines(seedFromPlan(plan, guestCount, targetMonth, eventType));
      setPlanKey(plan.title);
      setTab('timeline');
    }
  }, [plan, planKey, guestCount, targetMonth, eventType]);

  const totals = useMemo(() => computePackageTotals(lines), [lines]);
  const conflicts = useMemo(() => findConflicts(lines), [lines]);
  const groups = useMemo(() => groupByDate(lines), [lines]);
  const addedCatalogIds = useMemo(
    () => new Set(lines.map((l) => l.activityId).filter(Boolean) as string[]),
    [lines],
  );

  const addLine = (item: Omit<PackageLineItem, 'id'> | PackageLineItem) => {
    setLines((prev) => [...prev, 'id' in item && item.id ? (item as PackageLineItem) : { ...item, id: uid() }]);
    setTab('timeline');
  };

  const removeLine = (id: string) => {
    const root = rootPackageLineId(id);
    setLines((prev) => prev.filter((l) => l.id !== root));
  };

  const hasActivity = (activityId: string) => lines.some((l) => l.activityId === activityId);

  const handlePrint = () => {
    window.print();
  };

  const handleIcs = () => downloadIcs(plan.title, lines);

  const handleAgendaTxt = () => {
    const text = buildAgendaPlainText(plan.title, lines);
    downloadTextFile(
      `${plan.title.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'meridian'}-agenda.txt`,
      text,
      'text/plain;charset=utf-8',
    );
  };

  const handlePdf = () => downloadPackagePdf(plan.title, lines, place);

  const tabs: { id: StudioTab; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'stays', label: 'Stays' },
    { id: 'transfers', label: 'Transfers' },
    { id: 'map', label: 'Map' },
    { id: 'custom', label: 'Custom' },
    { id: 'handoff', label: 'Export & Inquiry' },
  ];

  return (
    <div
      id="package-studio"
      className="glass-panel rounded-2xl border border-navy/10 p-6 md:p-8 space-y-6 shadow-sm print:shadow-none"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-navy/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-sage" />
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-navy">
              Package Studio
            </h3>
          </div>
          <p className="font-serif text-xl text-navy">{plan.title}</p>
          <p className="text-xs text-slate mt-1">
            Seeded from your AI proposal · {place} · {targetMonth}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleIcs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-navy/10 text-[10px] uppercase tracking-wider font-bold text-navy hover:bg-champagne"
          >
            <Calendar className="w-3.5 h-3.5 text-sage" /> ICS
          </button>
          <button
            type="button"
            onClick={handleAgendaTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-navy/10 text-[10px] uppercase tracking-wider font-bold text-navy hover:bg-champagne"
          >
            <Download className="w-3.5 h-3.5 text-sage" /> Agenda
          </button>
          <button
            type="button"
            onClick={handlePdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-navy/10 text-[10px] uppercase tracking-wider font-bold text-navy hover:bg-champagne"
          >
            <FileText className="w-3.5 h-3.5 text-sage" /> PDF / Print
          </button>
          <button
            type="button"
            onClick={() => downloadPackagePdfFile(plan.title, lines, place)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-navy/10 text-[10px] uppercase tracking-wider font-bold text-navy hover:bg-champagne"
          >
            <Download className="w-3.5 h-3.5 text-sage" /> Text PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-navy/10 text-[10px] uppercase tracking-wider font-bold text-navy hover:bg-champagne"
          >
            <Printer className="w-3.5 h-3.5 text-sage" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-champagne border border-navy/10 p-3">
          <p className="text-[9px] uppercase tracking-wider font-mono text-slate">Events</p>
          <p className="font-mono text-lg font-bold text-navy">
            ${totals.eventsTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-champagne border border-navy/10 p-3">
          <p className="text-[9px] uppercase tracking-wider font-mono text-slate">Experiences</p>
          <p className="font-mono text-lg font-bold text-navy">
            ${totals.experiencesTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-champagne border border-navy/10 p-3">
          <p className="text-[9px] uppercase tracking-wider font-mono text-slate">Stays</p>
          <p className="font-mono text-lg font-bold text-navy">
            ${totals.staysTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-champagne border border-navy/10 p-3">
          <p className="text-[9px] uppercase tracking-wider font-mono text-slate">Transfers</p>
          <p className="font-mono text-lg font-bold text-navy">
            ${totals.transfersTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-champagne border border-navy/10 p-3">
          <p className="text-[9px] uppercase tracking-wider font-mono text-slate">Grand Total</p>
          <p className="font-mono text-lg font-bold text-navy">
            ${totals.grandTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-navy text-champagne p-3">
          <p className="text-[9px] uppercase tracking-wider font-mono text-champagne/70">
            Deposit 25%
          </p>
          <p className="font-mono text-lg font-bold">${totals.deposit.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b border-navy/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 px-3 py-2.5 text-[10px] font-bold tracking-wider uppercase transition-colors duration-200 ${
              tab === t.id ? 'text-navy' : 'text-slate hover:text-navy'
            }`}
          >
            {t.label}
            <span
              className={`absolute inset-x-2 bottom-0 h-0.5 transition-colors duration-200 ${
                tab === t.id ? 'bg-sage' : 'bg-transparent'
              }`}
            />
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <DayTimeline groups={groups} conflicts={conflicts} onRemove={removeLine} />
      )}

      {tab === 'catalog' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATALOG_ACTIVITIES.map((activity) => (
            <div key={activity.id}>
              <EventCard
                activity={activity}
                isAdded={hasActivity(activity.id)}
                onAdd={(a) => addLine(activityToLine(a, guestCount, seedDate, 'event', eventType))}
              />
            </div>
          ))}
        </div>
      )}

      {tab === 'experiences' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPERIENCES.map((activity) => (
            <div key={activity.id}>
              <EventCard
                activity={activity}
                isAdded={hasActivity(activity.id)}
                onAdd={(a) =>
                  addLine(activityToLine(a, guestCount, seedDate, 'experience', eventType))
                }
              />
            </div>
          ))}
        </div>
      )}

      {tab === 'stays' && (
        <StaysPanel
          eventType={eventType}
          guestCount={guestCount}
          defaultDate={seedDate}
          locationName={place}
          addedIds={addedCatalogIds}
          onAdd={addLine}
        />
      )}

      {tab === 'transfers' && (
        <TransfersPanel
          eventType={eventType}
          guestCount={guestCount}
          defaultDate={seedDate}
          addedIds={addedCatalogIds}
          onAdd={addLine}
        />
      )}

      {tab === 'map' && <DestinationMap locationName={place} />}

      {tab === 'custom' && (
        <CustomLineForm
          defaultGuests={guestCount}
          defaultLocation={defaultLocation}
          defaultDate={seedDate}
          onAdd={addLine}
        />
      )}

      {tab === 'handoff' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InquiryForm
            plannerName={plan.title}
            items={lines}
            total={totals.grandTotal}
            deposit={totals.deposit}
            initialMessage={`${plan.title} — ${plan.tagline}\nLocation: ${plan.location}\nAI budget note: ${plan.estimatedBudgetRange}`}
          />
          <div className="space-y-4">
            <div className="rounded-2xl border border-navy/10 bg-champagne/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sage" />
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-navy">
                  Next step
                </h4>
              </div>
              <p className="text-xs text-slate leading-relaxed">
                Export ICS or PDF, send a mailto inquiry with the full package, or continue to a live
                planner consult with your proposal context.
              </p>
              <button
                type="button"
                onClick={handlePdf}
                className="w-full py-3 border border-navy/15 text-navy text-[10px] uppercase tracking-widest font-bold rounded-full hover:bg-white transition-colors"
              >
                Download package PDF
              </button>
              <button
                type="button"
                onClick={() => onRequestConsult?.(plan)}
                className="w-full py-3 bg-navy hover:bg-sage text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-colors"
              >
                Talk to a Planner
              </button>
            </div>
            <pre className="text-[10px] text-slate bg-white border border-navy/10 rounded-xl p-4 max-h-56 overflow-auto whitespace-pre-wrap font-mono">
              {buildAgendaPlainText(plan.title, lines)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
