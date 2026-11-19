import type { Exhibition, Grade, TravelClass, TripPlan } from '../types';
import { CLASS_LABEL, CLASS_ORDER, RATES, classOf, gradeFor } from '../data/travelRules';
import { accessFor, effectiveDays, flightPlanFor } from './itinerary';

export interface TravelerBudget {
  travelerId: string;
  label: string;
  rank: string;
  cls: TravelClass;
  clsLabel: string;
  stayCls: TravelClass; // 숙박·식비에 적용한 구분(동행 특례 반영)
  seat: string;
  dailyUSD: number;
  mealUSD: number; // 기내식 감액 후
  mealDeductUSD: number; // 기내식 감액분
  lodgingUSD: number;
  reserveUSD: number;
  stayUSD: number;
  fareKRW: number;
  stayKRW: number;
  totalKRW: number;
  basis: string;
}

export interface BudgetResult {
  grade: Grade;
  gradeAuto: Grade;
  days: { travelDays: number; mealDays: number; nights: number };
  rows: TravelerBudget[];
  othersKRW: number;
  totalUSD: number;
  totalFareKRW: number;
  totalKRW: number;
  fxRate: number;
  inflight: InflightMeals;
}

export interface InflightMeals { out: number; in: number; total: number; deduct: boolean; auto: { out: number; in: number } }

export const krw = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
export const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function travelerLabel(i: number, name: string) {
  return name.trim() || `출장자 ${i + 1}`;
}

/** 기본 항공료: 대한항공 우선·직항 우선, 왕복 일반석(이코노미) 가정치 */
export function defaultFare(ex: Exhibition, _cls?: TravelClass, date?: string): number {
  return flightPlanFor(ex, date ?? ex.start).fareEconomyKRW;
}

export const SEAT_TEXT = '일반석(이코노미)';

export function inflightMeals(plan: TripPlan, ex: Exhibition): InflightMeals {
  const f = flightPlanFor(ex, plan.outbound.date || ex.start);
  const o = plan.budget.inflightMeals ?? {};
  const out = o.out ?? f.mealsOut;
  const inn = o.in ?? f.mealsIn;
  return { out, in: inn, total: out + inn, deduct: plan.budget.deductInflightMeals ?? true, auto: { out: f.mealsOut, in: f.mealsIn } };
}

export function computeBudget(plan: TripPlan, ex: Exhibition): BudgetResult {
  const gradeAuto = gradeFor(plan.lodgingCity, accessFor(ex).lodgingCountry);
  const grade = plan.gradeOverride ?? gradeAuto;
  const days = effectiveDays(plan);
  const fx = plan.budget.fxRate || 0;
  const classes = plan.travelers.map((t) => classOf(t.service, t.rank));
  const top = classes.length ? CLASS_ORDER.find((c) => classes.includes(c))! : '2';
  const meals = inflightMeals(plan, ex);

  const rows: TravelerBudget[] = plan.travelers.map((t, i) => {
    const cls = classes[i];
    const stayCls: TravelClass = plan.budget.escortRule && plan.travelers.length > 1 ? top : cls;
    const own = RATES[cls][grade];
    const stay = RATES[stayCls][grade];
    const dailyUSD = own.daily * days.travelDays;
    const mealFull = stay.meal * days.mealDays;
    // 기내식 1식 = 해당 1일 식비의 1/3 감액(식사를 제공받은 경우 감액 원칙). 식비가 음수가 되지 않게 한다
    const mealDeductUSD = meals.deduct ? Math.min(mealFull, Math.round((stay.meal / 3) * meals.total * 100) / 100) : 0;
    const mealUSD = mealFull - mealDeductUSD;
    const lodgingUSD = stay.lodgingCap * days.nights;
    const reserveUSD = plan.budget.includeReserve ? (mealUSD + lodgingUSD) / 2 : 0;
    const stayUSD = dailyUSD + mealUSD + lodgingUSD + reserveUSD;
    const fareKRW = plan.budget.fareOverrides[t.id] ?? defaultFare(ex, cls, plan.outbound.date);
    const stayKRW = stayUSD * fx;
    const basis =
      `일비 $${own.daily}×${days.travelDays}일, 식비 $${stay.meal}×${days.mealDays}일` +
      (mealDeductUSD ? `−기내식 ${meals.total}식($${stay.meal}÷3×${meals.total}=$${mealDeductUSD})` : '') +
      `, 숙박 상한 $${stay.lodgingCap}×${days.nights}박` +
      (reserveUSD ? `, 예비비(숙박·식비 1/2) $${reserveUSD}` : '') +
      (stayCls !== cls ? ` (숙박·식비는 동행 상급자 ${CLASS_LABEL[stayCls]} 기준)` : '');
    return {
      travelerId: t.id,
      label: travelerLabel(i, t.name),
      rank: `${t.service} ${t.rank}`,
      cls,
      clsLabel: CLASS_LABEL[cls],
      stayCls,
      seat: SEAT_TEXT,
      dailyUSD, mealUSD, mealDeductUSD, lodgingUSD, reserveUSD, stayUSD,
      fareKRW, stayKRW, totalKRW: fareKRW + stayKRW,
      basis,
    };
  });
  const othersKRW = plan.budget.others.reduce((s, o) => s + (Number(o.amountKRW) || 0), 0);
  const totalUSD = rows.reduce((s, r) => s + r.stayUSD, 0);
  const totalFareKRW = rows.reduce((s, r) => s + r.fareKRW, 0);
  return {
    grade, gradeAuto, days, rows, othersKRW, totalUSD, totalFareKRW,
    totalKRW: totalUSD * fx + totalFareKRW + othersKRW,
    fxRate: fx,
    inflight: meals,
  };
}
