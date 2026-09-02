import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import TabBar, { type AppTab } from './components/TabBar';
import HomeScreen from './screens/HomeScreen';
import PlanScreen, { type PlanPhase } from './screens/PlanScreen';
import InquireScreen from './screens/InquireScreen';
import ClubScreen from './screens/ClubScreen';
import { AuthProvider } from './AuthContext';
import type { DesignerPrefill, EventPlanResponse, PlannerInput } from '../types';
import { loadPlanBundle, savePlanBundle } from '../lib/planStorage';

function MobileAppShell() {
  const stored = typeof window !== 'undefined' ? loadPlanBundle() : null;

  const [tab, setTab] = useState<AppTab>('home');
  const [prefill, setPrefill] = useState<DesignerPrefill | null>(null);
  const [prefillKey, setPrefillKey] = useState(0);
  const [activePlan, setActivePlan] = useState<EventPlanResponse | null>(stored?.plan ?? null);
  const [planInput, setPlanInput] = useState<PlannerInput | null>(stored?.input ?? null);
  const [planPhase, setPlanPhase] = useState<PlanPhase>(stored?.plan ? 'proposal' : 'wizard');

  useEffect(() => {
    const bundle = loadPlanBundle();
    if (bundle) {
      setActivePlan(bundle.plan);
      setPlanInput(bundle.input);
    }
  }, []);

  const changeTab = (next: AppTab) => {
    setTab(next);
  };

  const openPlan = (next?: DesignerPrefill, phase: PlanPhase = 'wizard') => {
    if (next) {
      setPrefill(next);
      setPrefillKey((k) => k + 1);
    } else {
      setPrefill(null);
    }
    setPlanPhase(phase);
    changeTab('plan');
  };

  const handlePlanGenerated = (plan: EventPlanResponse, input: PlannerInput) => {
    setActivePlan(plan);
    setPlanInput(input);
    savePlanBundle(plan, input);
    setPlanPhase('proposal');
  };

  const handleConsult = (plan: EventPlanResponse | null) => {
    if (plan) {
      setActivePlan(plan);
      if (planInput) savePlanBundle(plan, planInput);
    }
    changeTab('inquire');
  };

  return (
    <div className="app-shell flex min-h-svh flex-col bg-paper text-ink antialiased">
      <main
        className="relative flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full"
            style={{ transform: 'none' }}
          >
            {tab === 'home' && (
              <HomeScreen
                savedPlan={activePlan}
                onOpenPlan={(prefill) => openPlan(prefill)}
                onContinuePlan={() => openPlan(undefined, 'proposal')}
              />
            )}
            {tab === 'plan' && (
              <PlanScreen
                prefill={prefill}
                prefillKey={prefillKey}
                activePlan={activePlan}
                lastInput={planInput}
                initialPhase={planPhase}
                onPlanGenerated={handlePlanGenerated}
                onRequestConsult={handleConsult}
                onPhaseChange={setPlanPhase}
              />
            )}
            {tab === 'inquire' && <InquireScreen activePlan={activePlan} />}
            {tab === 'club' && <ClubScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar active={tab} onChange={changeTab} />
    </div>
  );
}

export default function MobileApp() {
  return (
    <AuthProvider>
      <MobileAppShell />
    </AuthProvider>
  );
}
