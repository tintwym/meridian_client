import type { DesignerPrefill, EventPlanResponse, PlannerInput } from '../types';

const PLAN_KEY = 'meridian.activePlan';
const INPUT_KEY = 'meridian.planInput';
const PREFILL_KEY = 'meridian.planPrefill';

export interface StoredPlanBundle {
  plan: EventPlanResponse;
  input: PlannerInput;
  savedAt: string;
}

export function savePlanBundle(plan: EventPlanResponse, input: PlannerInput): void {
  try {
    const bundle: StoredPlanBundle = {
      plan,
      input,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(PLAN_KEY, JSON.stringify(bundle));
    localStorage.setItem(INPUT_KEY, JSON.stringify(input));
  } catch {
    // Ignore quota / private mode.
  }
}

export function loadPlanBundle(): StoredPlanBundle | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlanBundle;
    if (!parsed?.plan?.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlanBundle(): void {
  try {
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(INPUT_KEY);
  } catch {
    // ignore
  }
}

export function savePrefill(prefill: DesignerPrefill): void {
  try {
    localStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
  } catch {
    // ignore
  }
}

export function loadPrefill(): DesignerPrefill | null {
  try {
    const raw = localStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DesignerPrefill;
  } catch {
    return null;
  }
}
