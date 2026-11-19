import type { Exhibition, FlightLeg, ItineraryItem, TripPlan } from '../types';
import { ROUTE_TEMPLATES, VENUE_ACCESS, type VenueAccess } from '../data/routes';
import { flightFor, type FlightOption } from '../data/flights';
import { addDays, diffDays, minutes, rangeDates } from './dates';
import { TAGS, firmNames } from '../data/exhibitions';

export const ORIGIN = { code: 'ICN', name: '인천' };

export interface ProposeOptions {
  arrivalCutoff?: string; // 이 시각 이후 숙소 도착이면 하루 더 일찍 출국
  closeTime?: string; // 전시장 폐장 시각(가정)
  bufferH?: number; // 폐장 후 공항까지 여유(이동 외)
}

export function accessFor(ex: Exhibition): VenueAccess {
  return (
    VENUE_ACCESS[ex.id] ?? {
      route: 'europeWest', airport: '', airportName: ex.city, transferH: 1, lodgingCity: ex.city, lodgingCountry: ex.country,
    }
  );
}

export function tradeDates(ex: Exhibition): string[] {
  const acc = accessFor(ex);
  return rangeDates(ex.start, acc.tradeEnd ?? ex.end);
}

/** 전시회·날짜 기준 항공편(대한항공 우선). 기준표가 없으면 지역 대표 패턴으로 대신한다 */
export function flightPlanFor(ex: Exhibition, date: string): FlightOption {
  const acc = accessFor(ex);
  const f = flightFor(acc.airport, date);
  if (f) return f;
  const r = ROUTE_TEMPLATES[acc.route];
  return {
    key: `tpl-${r.key}`, carrier: '대표 패턴(항공사 미지정)', direct: r.outbound.via === '직항',
    out: { flightNo: '', ...r.outbound }, in: { flightNo: '', ...r.inbound },
    fareEconomyKRW: r.fareEconomyKRW, mealsOut: 2, mealsIn: 2,
  };
}

function legsFor(ex: Exhibition, f: FlightOption, depDate: string, retDate: string): { outbound: FlightLeg; inbound: FlightLeg } {
  const acc = accessFor(ex);
  return {
    outbound: {
      date: depDate, dep: f.out.dep, arrDate: addDays(depDate, f.out.arrOffsetDays), arr: f.out.arr,
      flightNo: f.out.flightNo, from: ORIGIN.code, to: acc.airport, carrier: f.carrier, via: f.out.via,
    },
    inbound: {
      date: retDate, dep: f.in.dep, arrDate: addDays(retDate, f.in.arrOffsetDays), arr: f.in.arr,
      flightNo: f.in.flightNo, from: acc.airport, to: ORIGIN.code, carrier: f.carrier, via: f.in.via,
    },
  };
}

let seq = 0;
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export interface Proposal {
  label: string;
  visitDates: string[];
  outbound: FlightLeg;
  inbound: FlightLeg;
}

export function propose(ex: Exhibition, visitDays: number, startIndex = 0, opt: ProposeOptions = {}): Proposal {
  const acc = accessFor(ex);
  const cutoff = minutes(opt.arrivalCutoff ?? '20:00');
  const close = minutes(opt.closeTime ?? '17:00');
  const buffer = (opt.bufferH ?? 3) * 60;
  const td = tradeDates(ex);
  const n = Math.max(1, Math.min(visitDays, td.length));
  const s = Math.max(0, Math.min(startIndex, td.length - n));
  const visit = td.slice(s, s + n);
  const first = visit[0];
  const last = visit[visit.length - 1];
  const f = flightPlanFor(ex, first);

  // 출국편: 첫 참관일 전날 숙소 도착을 목표로 역산
  let arrDate = addDays(first, -1);
  if (minutes(f.out.arr) + acc.transferH * 60 > cutoff) arrDate = addDays(arrDate, -1);
  const depDate = addDays(arrDate, -f.out.arrOffsetDays);

  // 귀국편: 마지막 참관일 폐장 후 이동·여유를 두고 탈 수 있으면 당일, 아니면 다음 날
  const canSameDay = minutes(f.in.dep) >= close + acc.transferH * 60 + buffer;
  const retDate = canSameDay ? last : addDays(last, 1);
  const { outbound, inbound } = legsFor(ex, f, depDate, retDate);
  return { label: n === td.length ? '무역일 전체안' : `${n}일 참관안`, visitDates: visit, outbound, inbound };
}

/** 출국 출발일·귀국 출발일을 직접 정하면 그 사이 참관 가능한 무역일을 골라 일정안을 만든다 */
export function proposeCustom(ex: Exhibition, depDate: string, retDate: string, opt: ProposeOptions = {}): Proposal {
  const acc = accessFor(ex);
  const close = minutes(opt.closeTime ?? '17:00');
  const buffer = (opt.bufferH ?? 3) * 60;
  const f = flightPlanFor(ex, depDate);
  const { outbound, inbound } = legsFor(ex, f, depDate, retDate < depDate ? depDate : retDate);
  const arriveAt = minutes(outbound.arr) + acc.transferH * 60;
  const firstOk = arriveAt <= minutes('11:00') ? outbound.arrDate : addDays(outbound.arrDate, 1);
  const lastOk = minutes(inbound.dep) >= close + acc.transferH * 60 + buffer ? inbound.date : addDays(inbound.date, -1);
  let visit = tradeDates(ex).filter((d) => d >= firstOk && d <= lastOk);
  if (!visit.length) visit = rangeDates(ex.start, ex.end).filter((d) => d >= firstOk && d <= lastOk);
  return { label: '직접 입력안', visitDates: visit, outbound, inbound };
}

/** 출장 일수(출국일~인천 도착일)로 귀국 출발일을 계산 */
export function returnDateForDays(ex: Exhibition, depDate: string, totalDays: number): string {
  const f = flightPlanFor(ex, depDate);
  const arrHome = addDays(depDate, Math.max(1, totalDays) - 1);
  return addDays(arrHome, -f.in.arrOffsetDays);
}

export function buildItems(ex: Exhibition, p: Proposal): ItineraryItem[] {
  const acc = accessFor(ex);
  const items: ItineraryItem[] = [];
  const fl = (l: FlightLeg) => [l.flightNo, l.via].filter(Boolean).join(' · ');
  const add = (date: string, time: string, kind: ItineraryItem['kind'], text: string, place: string) =>
    items.push({ id: uid('it'), date, time, kind, text, place });

  add(p.outbound.date, p.outbound.dep, '이동', `인천(ICN) 출발 → ${acc.airportName}(${acc.airport})${fl(p.outbound) ? ' · ' + fl(p.outbound) : ''}`, '인천국제공항');
  add(p.outbound.arrDate, p.outbound.arr, '이동', `${acc.airportName} 도착, 숙소 이동(약 ${acc.transferH}시간)${acc.accessNote ? ' · ' + acc.accessNote : ''}`, acc.lodgingCity);
  const firstV = p.visitDates[0] ?? addDays(p.inbound.date, 1);
  const lastV = p.visitDates[p.visitDates.length - 1] ?? p.outbound.arrDate;
  for (const d of rangeDates(addDays(p.outbound.arrDate, 1), addDays(firstV, -1))) {
    add(d, '10:00', '기타', '현지 준비, 사전 미팅 일정 확인', acc.lodgingCity);
  }
  const trendText = ex.trends.map((t) => TAGS[t.t] ?? t.t);
  p.visitDates.forEach((d, i) => {
    if (i === 0) {
      add(d, '09:00', '참관', `${ex.name} 등록, 주요 부스 참관: ${firmNames(ex).slice(0, 4).join(', ')}`, ex.venue);
    } else {
      add(d, '09:00', '참관', `기술동향 확인: ${trendText.slice((i - 1) * 2, (i - 1) * 2 + 3).join(', ') || trendText.join(', ')}`, ex.venue);
    }
    add(d, '14:00', '미팅', i === 0 && ex.kr.length ? `한국 기업 부스 방문: ${ex.kr.slice(0, 3).join(', ')}` : '기업 미팅(상대·주제 입력)', ex.venue);
    if (i === p.visitDates.length - 1) add(d, '16:00', '기타', '컨퍼런스·세미나 청취 또는 자료 정리', ex.venue);
  });
  if (p.visitDates.length && p.inbound.date !== lastV) {
    for (const d of rangeDates(addDays(lastV, 1), addDays(p.inbound.date, -1))) {
      add(d, '10:00', '기타', '자료 정리 또는 연계 방문(선택)', acc.lodgingCity);
    }
  }
  if (p.inbound.date !== lastV && p.inbound.date !== p.outbound.arrDate && minutes(p.inbound.dep) >= minutes('12:00')) {
    add(p.inbound.date, '10:00', '기타', '숙소 정리, 참관 결과 메모 작성', acc.lodgingCity);
  }
  add(p.inbound.date, p.inbound.dep, '이동', `${acc.airportName}(${acc.airport}) 출발 → 인천${fl(p.inbound) ? ' · ' + fl(p.inbound) : ''}`, acc.airportName);
  add(p.inbound.arrDate, p.inbound.arr, '이동', '인천 도착', '인천국제공항');
  return sortItems(items);
}

export function sortItems(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
}

export interface DayCounts { travelDays: number; mealDays: number; nights: number }

/** 여행일수 = 출국일~인천 도착일, 숙박 = 현지 도착일~현지 출발일 사이 밤 수 */
export function autoDays(plan: Pick<TripPlan, 'outbound' | 'inbound'>): DayCounts {
  const travelDays = diffDays(plan.outbound.date, plan.inbound.arrDate) + 1;
  const nights = Math.max(0, diffDays(plan.outbound.arrDate, plan.inbound.date));
  return { travelDays, mealDays: travelDays, nights };
}

export function effectiveDays(plan: TripPlan): DayCounts {
  const a = autoDays(plan);
  const o = plan.budget.dayOverrides;
  return {
    travelDays: o.travelDays ?? a.travelDays,
    mealDays: o.mealDays ?? a.mealDays,
    nights: o.nights ?? a.nights,
  };
}

export function validate(plan: TripPlan, ex: Exhibition): string[] {
  const w: string[] = [];
  const { outbound: o, inbound: r } = plan;
  if (o.arrDate < o.date) w.push('출국편 도착일이 출발일보다 빠릅니다.');
  if (r.arrDate < r.date) w.push('귀국편 도착일이 출발일보다 빠릅니다.');
  if (r.date < o.arrDate) w.push('귀국 출발일이 현지 도착일보다 빠릅니다.');
  const visits = plan.items.filter((i) => i.kind === '참관');
  for (const v of visits) {
    if (v.date < ex.start || v.date > ex.end) w.push(`${v.date} 참관 일정이 전시 기간(${ex.start}~${ex.end}) 밖입니다.`);
    if (v.date < o.arrDate || (v.date === o.arrDate && v.time < o.arr)) w.push(`${v.date} ${v.time} 참관 일정이 현지 도착 전입니다.`);
    if (v.date > r.date || (v.date === r.date && v.time > r.dep)) w.push(`${v.date} ${v.time} 참관 일정이 귀국편 출발 뒤입니다.`);
  }
  for (const i of plan.items) {
    if (i.date < o.date || i.date > r.arrDate) w.push(`${i.date} "${i.text.slice(0, 18)}…" 일정이 출장 기간 밖입니다.`);
  }
  if (!visits.length) w.push('참관 일정이 없습니다.');
  if (ex.status === 'est') w.push('이 전시회는 날짜가 추정치입니다. 확정 전에 공식 사이트에서 날짜를 확인하세요.');
  if (plan.travelers.length === 0) w.push('출장자가 없습니다.');
  return [...new Set(w)];
}
