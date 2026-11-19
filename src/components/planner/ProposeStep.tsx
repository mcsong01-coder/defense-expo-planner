import { useState } from 'react';
import type { Exhibition, TripPlan } from '../../types';
import { accessFor, autoDays, flightPlanFor, propose, proposeCustom, returnDateForDays, tradeDates, type Proposal } from '../../lib/itinerary';
import { applyProposal } from '../../lib/plan';
import { computeBudget, krw } from '../../lib/budget';
import { addDays, diffDays, fmtKDate } from '../../lib/dates';
import type { Update } from './Planner';

export default function ProposeStep({ plan, ex, update, onApplied }: { plan: TripPlan; ex: Exhibition; update: Update; onApplied: () => void }) {
  const td = tradeDates(ex);
  const acc = accessFor(ex);
  const f = flightPlanFor(ex, td[0]);
  const base = propose(ex, Math.min(plan.visitDays || 2, td.length), 0);
  const [cDep, setCDep] = useState(plan.outbound.date || base.outbound.date);
  const [cRet, setCRet] = useState(plan.inbound.date || base.inbound.date);
  const tripDays = (dep: string, ret: string) => diffDays(dep, addDays(ret, flightPlanFor(ex, dep).in.arrOffsetDays)) + 1;
  const cDays = tripDays(cDep, cRet);
  const custom = proposeCustom(ex, cDep, cRet);
  const [days, setDays] = useState(Math.min(plan.visitDays || 2, td.length));
  const [start, setStart] = useState(0);
  const options: Proposal[] = [propose(ex, days, start)];
  if (days !== td.length) options.push(propose(ex, td.length, 0));
  if (days !== 1) options.push(propose(ex, 1, start));

  const isCurrent = (p: Proposal) => p.outbound.date === plan.outbound.date && p.inbound.date === plan.inbound.date && p.visitDates.length === plan.visitDays;

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 17 }}>항공편 기반 일정 제안</h2>
        <p className="hint">
          첫 참관일 전날 숙소에 도착하는 출국편과, 마지막 참관일 폐장 뒤 탈 수 있는 귀국편을 역산합니다. 무역일(일반 공개일 제외)은 {fmtKDate(td[0])}~{fmtKDate(td[td.length - 1])}입니다.
        </p>
      </div>
      <div className="note info">
        항공편: <b>{f.carrier}</b> {f.direct ? '직항' : '경유'} · 인천(ICN) → {acc.airportName}({acc.airport}) · 출국 {f.out.flightNo} {f.out.dep}→{f.out.arr}
        {f.out.arrOffsetDays ? `(+${f.out.arrOffsetDays}일)` : ''} / 귀국 {f.in.flightNo} {f.in.dep}→{f.in.arr}{f.in.arrOffsetDays ? `(+${f.in.arrOffsetDays}일)` : ''} · 일반석.
        시각은 기준 시간표이며 예약 후 일정 수정 단계에서 실제 편명·시각으로 고치세요.{f.note ? ` (${f.note})` : ''}
      </div>
      <div className="card pad stack custom-dates">
        <h3 style={{ fontSize: 14 }}>날짜 직접 입력</h3>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label className="field">
            <span>출발일(인천)</span>
            <input type="date" value={cDep} onChange={(e) => { const d = e.target.value; if (!d) return; setCRet(returnDateForDays(ex, d, cDays)); setCDep(d); }} />
          </label>
          <label className="field">
            <span>출장 일수(출발~인천 도착)</span>
            <input type="number" min={1} max={30} value={cDays} onChange={(e) => { const n = Math.max(1, Number(e.target.value) || 1); setCRet(returnDateForDays(ex, cDep, n)); }} style={{ width: 100 }} />
          </label>
          <label className="field">
            <span>귀국 출발일(현지)</span>
            <input type="date" value={cRet} min={cDep} onChange={(e) => e.target.value && setCRet(e.target.value)} />
          </label>
          <button className="btn primary" disabled={!custom.visitDates.length} onClick={() => { update((pl) => applyProposal(pl, ex, custom)); onApplied(); }}>
            이 날짜로 일정 만들기
          </button>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          {custom.visitDates.length
            ? `현지 도착 ${fmtKDate(custom.outbound.arrDate)} ${custom.outbound.arr} · 참관 가능일 ${custom.visitDates.map(fmtKDate).join(', ')} · 인천 도착 ${fmtKDate(custom.inbound.arrDate)} ${custom.inbound.arr} · 예산 ${krw(computeBudget(applyProposal(plan, ex, custom), ex).totalKRW)}`
            : '입력한 날짜 사이에 참관 가능한 전시일이 없습니다. 출발일을 당기거나 귀국일을 늦추세요.'}
          {' '}출발일이나 일수를 바꾸면 귀국 출발일이, 귀국 출발일을 바꾸면 일수가 다시 계산됩니다.
        </p>
      </div>
      <h3 style={{ fontSize: 14, marginTop: 4 }}>자동 제안</h3>
      <div className="row">
        <label className="field">
          <span>참관 일수</span>
          <select value={days} onChange={(e) => { setDays(Number(e.target.value)); setStart(0); }}>
            {td.map((_, i) => <option key={i} value={i + 1}>{i + 1}일</option>)}
          </select>
        </label>
        <label className="field">
          <span>첫 참관일</span>
          <select value={start} onChange={(e) => setStart(Number(e.target.value))}>
            {td.slice(0, td.length - days + 1).map((d, i) => <option key={d} value={i}>{fmtKDate(d)}</option>)}
          </select>
        </label>
      </div>
      <div className="proposals">
        {options.map((p, i) => {
          const tmp = applyProposal(plan, ex, p);
          const d = autoDays(tmp);
          const b = computeBudget(tmp, ex);
          return (
            <div key={i} className={`prop ${isCurrent(p) ? 'cur' : ''}`}>
              <h3>{i === 0 ? '선택한 조건' : p.label}{isCurrent(p) && <span className="pill confirmed" style={{ marginLeft: 8 }}>적용 중</span>}</h3>
              <dl className="kv">
                <dt>출국</dt><dd className="mono">{fmtKDate(p.outbound.date)} {p.outbound.dep} → {fmtKDate(p.outbound.arrDate)} {p.outbound.arr}</dd>
                <dt>참관</dt><dd>{p.visitDates.map(fmtKDate).join(', ')}</dd>
                <dt>귀국</dt><dd className="mono">{fmtKDate(p.inbound.date)} {p.inbound.dep} → {fmtKDate(p.inbound.arrDate)} {p.inbound.arr}</dd>
                <dt>일수</dt><dd>{d.travelDays}일 · 현지 {d.nights}박</dd>
                <dt>예산</dt><dd className="mono"><b>{krw(b.totalKRW)}</b> ({plan.travelers.length}명)</dd>
              </dl>
              <button className="btn primary" onClick={() => { update((pl) => applyProposal(pl, ex, p)); onApplied(); }}>
                이 안으로 일정 만들기
              </button>
            </div>
          );
        })}
      </div>
      <p className="hint">적용하면 일자별 일정표가 새로 만들어집니다. 이미 고친 일정이 있으면 덮어씁니다.</p>
    </div>
  );
}
