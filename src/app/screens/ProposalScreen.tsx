import { useState } from 'react';
import { ArrowRight, CloudUpload, Download, Layers, MessageCircle, RefreshCw, Share2 } from 'lucide-react';
import type { EventPlanResponse, PlannerInput } from '../../types';
import WeatherContingencyCard from '../components/WeatherContingencyCard';
import { shareOrDownloadPlan, buildPlanSummaryText, downloadTextFile } from '../../lib/export';
import { saveCloudPlan } from '../../api/platform';
import { useAuth } from '../AuthContext';

interface ProposalScreenProps {
  plan: EventPlanResponse;
  input?: PlannerInput | null;
  onOpenStudio: () => void;
  onInquire: () => void;
  onStartOver: () => void;
}

export default function ProposalScreen({
  plan,
  input,
  onOpenStudio,
  onInquire,
  onStartOver,
}: ProposalScreenProps) {
  const { user, setUserPoints, refreshClub } = useAuth();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleShare = async () => {
    setShareNote(null);
    try {
      const result = await shareOrDownloadPlan(plan);
      if (result === 'shared') setShareNote('Shared');
      else if (result === 'downloaded') setShareNote('Downloaded summary');
      else setShareNote('Copied to clipboard');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setShareNote('Could not share — try download');
    }
  };

  const handleSyncClub = async () => {
    if (!user || !input) {
      setSyncNote(
        user ? 'Generate from the wizard first to sync input.' : 'Sign in to Meridian Club to sync.',
      );
      return;
    }
    setSyncing(true);
    setSyncNote(null);
    try {
      const result = await saveCloudPlan(plan, input, plan.title);
      setUserPoints(result.club.points, result.club.creditUsd);
      await refreshClub();
      setSyncNote(`Saved to Club · +25 pts (balance ${result.club.points})`);
    } catch (err) {
      setSyncNote(err instanceof Error ? err.message : 'Could not sync plan');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-10">
      <div className="space-y-2">
        <p className="font-app-sans text-[11px] font-medium tracking-[0.22em] text-atlantic uppercase">
          Your blueprint
        </p>
        <h1 className="font-app-display text-3xl leading-tight tracking-tight text-ink">{plan.title}</h1>
        <p className="font-app-sans text-sm leading-relaxed text-ink/60">{plan.tagline}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-app-sans text-xs text-ink/55">
          <span>{plan.location}</span>
          <span>{plan.estimatedBudgetRange}</span>
        </div>
      </div>

      <WeatherContingencyCard forecast={plan.weatherForecast} />

      <section className="space-y-3">
        <h2 className="font-app-sans text-[11px] font-medium tracking-[0.18em] text-ink/45 uppercase">
          Itinerary
        </h2>
        <ol className="space-y-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
          {plan.itinerary.slice(0, 5).map((step) => (
            <li
              key={`${step.time}-${step.activity}`}
              className="border-b border-ink/5 pb-3 last:border-0 last:pb-0"
            >
              <p className="font-app-sans text-[11px] tracking-wide text-atlantic">{step.time}</p>
              <p className="font-app-display text-lg text-ink">{step.activity}</p>
              <p className="font-app-sans text-xs leading-relaxed text-ink/55">{step.description}</p>
            </li>
          ))}
          {plan.itinerary.length > 5 && (
            <li className="font-app-sans text-xs text-ink/45">
              +{plan.itinerary.length - 5} more in Package Studio
            </li>
          )}
        </ol>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/15 px-3 py-3 font-app-sans text-sm font-medium text-ink"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          onClick={() => {
            downloadTextFile(
              `${plan.title.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'meridian-plan'}.txt`,
              buildPlanSummaryText(plan),
              'text/plain;charset=utf-8',
            );
            setShareNote('Downloaded summary');
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/15 px-3 py-3 font-app-sans text-sm font-medium text-ink"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
      {shareNote && <p className="font-app-sans text-xs text-atlantic">{shareNote}</p>}

      {user && (
        <button
          type="button"
          onClick={handleSyncClub}
          disabled={syncing}
          className="inline-flex w-full items-center justify-center gap-2 border border-atlantic/40 px-4 py-3 font-app-sans text-sm font-medium text-atlantic disabled:opacity-60"
        >
          <CloudUpload className="h-4 w-4" />
          {syncing ? 'Syncing…' : 'Save to Meridian Club (+25 pts)'}
        </button>
      )}
      {syncNote && <p className="font-app-sans text-xs text-atlantic">{syncNote}</p>}

      <div className="grid gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex items-center justify-center gap-2 bg-ink px-5 py-3.5 font-app-sans text-sm font-semibold text-paper"
        >
          <Layers className="h-4 w-4" />
          Refine package
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onInquire}
          className="inline-flex items-center justify-center gap-2 bg-atlantic px-5 py-3.5 font-app-sans text-sm font-semibold text-paper"
        >
          <MessageCircle className="h-4 w-4" />
          Talk to a planner
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center justify-center gap-2 py-2 font-app-sans text-sm text-ink/50 hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Start a new plan
        </button>
      </div>
    </div>
  );
}
