import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import PackageStudio from '../../components/PackageStudio';
import { generatePlan } from '../../api';
import type { DesignerPrefill, EventPlanResponse, PlannerInput } from '../../types';
import { clearPlanBundle, savePlanBundle, savePrefill } from '../../lib/planStorage';
import PlanWizard from './PlanWizard';
import ProposalScreen from './ProposalScreen';

export type PlanPhase = 'wizard' | 'proposal' | 'studio';

interface PlanScreenProps {
  prefill: DesignerPrefill | null;
  prefillKey: number;
  activePlan: EventPlanResponse | null;
  lastInput?: PlannerInput | null;
  initialPhase?: PlanPhase;
  onPlanGenerated: (plan: EventPlanResponse, input: PlannerInput) => void;
  onRequestConsult: (plan: EventPlanResponse | null) => void;
  onPhaseChange?: (phase: PlanPhase) => void;
}

export default function PlanScreen({
  prefill,
  prefillKey,
  activePlan,
  lastInput = null,
  initialPhase,
  onPlanGenerated,
  onRequestConsult,
  onPhaseChange,
}: PlanScreenProps) {
  const [phase, setPhase] = useState<PlanPhase>(() => {
    if (initialPhase) return initialPhase;
    return activePlan ? 'proposal' : 'wizard';
  });
  const [plan, setPlan] = useState<EventPlanResponse | null>(activePlan);
  const [input, setInput] = useState<PlannerInput | null>(lastInput);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizardSeed, setWizardSeed] = useState<DesignerPrefill | null>(prefill);

  useEffect(() => {
    setWizardSeed(prefill);
    if (prefill) {
      setPhase('wizard');
      onPhaseChange?.('wizard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefillKey forces reseed
  }, [prefillKey]);

  useEffect(() => {
    if (activePlan && !plan) {
      setPlan(activePlan);
      if (phase === 'wizard' && !prefill) {
        setPhase('proposal');
        onPhaseChange?.('proposal');
      }
    }
  }, [activePlan, plan, phase, prefill, onPhaseChange]);

  const go = (next: PlanPhase) => {
    setPhase(next);
    onPhaseChange?.(next);
  };

  const handleGenerate = async (body: PlannerInput) => {
    setGenerating(true);
    setError(null);
    savePrefill(body);
    try {
      const { plan: data } = await generatePlan(body);
      setPlan(data);
      setInput(body);
      savePlanBundle(data, body);
      onPlanGenerated(data, body);
      go('proposal');
    } catch (err) {
      console.error(err);
      setError('Could not generate a plan. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const startOver = () => {
    clearPlanBundle();
    setPlan(null);
    setInput(null);
    setWizardSeed(prefill ?? { eventType: 'overseas' });
    go('wizard');
  };

  return (
    <div className="min-h-full bg-paper text-ink">
      <header
        className="sticky top-0 z-20 border-b border-ink/8 bg-paper/95 px-5 py-4 backdrop-blur-md"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <p className="font-app-sans text-[11px] font-medium tracking-[0.22em] text-atlantic uppercase">
          Plan
        </p>
        <h1 className="font-app-display text-2xl tracking-tight text-ink">
          {phase === 'wizard' && 'Guided blueprint'}
          {phase === 'proposal' && 'Proposal'}
          {phase === 'studio' && 'Package Studio'}
        </h1>
        {phase !== 'wizard' && (
          <div className="mt-3 flex gap-2 overflow-x-auto font-app-sans text-xs">
            <PhaseTab label="Proposal" active={phase === 'proposal'} onClick={() => plan && go('proposal')} />
            <PhaseTab label="Studio" active={phase === 'studio'} onClick={() => plan && go('studio')} />
          </div>
        )}
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {phase === 'wizard' && (
            <PlanWizard
              key={prefillKey}
              initial={wizardSeed}
              generating={generating}
              error={error}
              onGenerate={handleGenerate}
            />
          )}

          {phase === 'proposal' && plan && (
            <ProposalScreen
              plan={plan}
              input={input}
              onOpenStudio={() => go('studio')}
              onInquire={() => onRequestConsult(plan)}
              onStartOver={startOver}
            />
          )}

          {phase === 'studio' && plan && (
            <div className="app-designer-compact px-1 pb-6">
              <PackageStudio
                plan={plan}
                eventType={input?.eventType ?? 'overseas'}
                guestCount={input?.guestCount ?? 100}
                targetMonth={input?.targetMonth ?? 'September'}
                locationName={input?.locationName ?? plan.location}
                onRequestConsult={(p) => onRequestConsult(p ?? plan)}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PhaseTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-chip ${active ? 'app-chip-active' : ''}`}
    >
      {label}
    </button>
  );
}
