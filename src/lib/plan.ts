import type { Exhibition, TripPlan } from '../types';
import { accessFor, buildItems, propose, uid, type Proposal } from './itinerary';

export const DEFAULT_FX = 1400;

export function createPlan(ex: Exhibition): TripPlan {
  const p = propose(ex, 2);
  const now = new Date().toISOString();
  return {
    id: uid('trip'),
    exhibitionId: ex.id,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
    title: `${ex.name} 참관 출장`,
    purposeNote: '',
    travelers: [{ id: uid('tr'), name: '', org: '', service: '일반직', rank: '6급' }],
    visitDays: p.visitDates.length,
    outbound: p.outbound,
    inbound: p.inbound,
    lodgingCity: accessFor(ex).lodgingCity,
    gradeOverride: null,
    items: buildItems(ex, p),
    budget: {
      fxRate: DEFAULT_FX,
      fxNote: '가정치(실제 적용 환율로 수정)',
      fareOverrides: {},
      others: [],
      includeReserve: false,
      escortRule: false,
      dayOverrides: {},
    },
    history: [],
  };
}

export function applyProposal(plan: TripPlan, ex: Exhibition, p: Proposal): TripPlan {
  return {
    ...plan,
    visitDays: p.visitDates.length,
    outbound: p.outbound,
    inbound: p.inbound,
    items: buildItems(ex, p),
    budget: { ...plan.budget, dayOverrides: {} },
  };
}

export function confirmPlan(plan: TripPlan): TripPlan {
  const at = new Date().toISOString();
  const confirmed: TripPlan = { ...plan, status: 'confirmed', confirmedAt: at };
  const snap = JSON.stringify({ ...confirmed, history: undefined });
  return { ...confirmed, history: [...plan.history, { version: plan.version, confirmedAt: at, snapshot: snap }] };
}

export function reopenAsNewVersion(plan: TripPlan): TripPlan {
  return { ...plan, status: 'draft', version: plan.version + 1, confirmedAt: undefined };
}
