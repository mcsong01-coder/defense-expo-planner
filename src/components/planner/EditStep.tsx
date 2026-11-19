import type { Exhibition, FlightLeg, ItemKind, ItineraryItem, TripPlan } from '../../types';
import { GRADE_CITY_LIST, gradeFor } from '../../data/travelRules';
import { accessFor, autoDays, sortItems, uid, validate } from '../../lib/itinerary';
import { addDays, diffDays, fmtKDate } from '../../lib/dates';
import type { Update } from './Planner';

const KINDS: ItemKind[] = ['이동', '참관', '미팅', '방문', '기타'];

function LegEditor({ title, leg, onChange }: { title: string; leg: FlightLeg; onChange: (l: FlightLeg) => void }) {
  const set = (patch: Partial<FlightLeg>) => onChange({ ...leg, ...patch });
  return (
    <div className="card pad stack">
      <h3 style={{ fontSize: 14 }}>{title} <span className="hint">{leg.from} → {leg.to || '(공항)'}</span></h3>
      <div className="leg">
        <label className="field"><span>편명</span><input type="text" value={leg.flightNo} placeholder="예: KE907" onChange={(e) => set({ flightNo: e.target.value.toUpperCase() })} /></label>
        <label className="field"><span>출발 공항</span><input type="text" value={leg.from} onChange={(e) => set({ from: e.target.value.toUpperCase() })} /></label>
        <label className="field"><span>도착 공항</span><input type="text" value={leg.to} onChange={(e) => set({ to: e.target.value.toUpperCase() })} /></label>
        <label className="field"><span>출발일(현지) · 도착일 함께 이동</span><input type="date" value={leg.date} onChange={(e) => { const d = e.target.value; if (!d) return; set({ date: d, arrDate: addDays(leg.arrDate, diffDays(leg.date, d)) }); }} /></label>
        <label className="field"><span>출발 시각</span><input type="time" value={leg.dep} onChange={(e) => set({ dep: e.target.value })} /></label>
        <span />
        <label className="field"><span>도착일(현지)</span><input type="date" value={leg.arrDate} onChange={(e) => set({ arrDate: e.target.value })} /></label>
        <label className="field"><span>도착 시각</span><input type="time" value={leg.arr} onChange={(e) => set({ arr: e.target.value })} /></label>
      </div>
    </div>
  );
}

export default function EditStep({ plan, ex, update }: { plan: TripPlan; ex: Exhibition; update: Update }) {
  const acc = accessFor(ex);
  const warns = validate(plan, ex);
  const d = autoDays(plan);
  const auto = gradeFor(plan.lodgingCity, acc.lodgingCountry);
  const setItem = (id: string, patch: Partial<ItineraryItem>) =>
    update((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const move = (idx: number, dir: -1 | 1) =>
    update((p) => {
      const items = [...p.items];
      const j = idx + dir;
      if (j < 0 || j >= items.length) return p;
      [items[idx], items[j]] = [items[j], items[idx]];
      return { ...p, items };
    });

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 17 }}>일정 직접 수정</h2>
        <p className="hint">항공편과 숙박지, 일자별 활동을 고치면 여행일수·숙박 수·여비 등급이 바로 다시 계산됩니다.</p>
      </div>
      {warns.length > 0 && (
        <div className="warns">
          {warns.map((w) => <div key={w} className="note bad">{w}</div>)}
        </div>
      )}
      <div className="flight-grid">
        <LegEditor title="출국편" leg={plan.outbound} onChange={(l) => update((p) => ({ ...p, outbound: l }))} />
        <LegEditor title="귀국편" leg={plan.inbound} onChange={(l) => update((p) => ({ ...p, inbound: l }))} />
      </div>
      <div className="card pad row" style={{ alignItems: 'flex-end' }}>
        <label className="field">
          <span>숙박 도시</span>
          <input type="text" value={plan.lodgingCity} list="grade-cities" onChange={(e) => update((p) => ({ ...p, lodgingCity: e.target.value }))} />
          <datalist id="grade-cities">{[acc.lodgingCity, ...GRADE_CITY_LIST].map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="field">
          <span>여비 등급</span>
          <select value={plan.gradeOverride ?? ''} onChange={(e) => update((p) => ({ ...p, gradeOverride: (e.target.value || null) as TripPlan['gradeOverride'] }))}>
            <option value="">자동({auto}등급)</option>
            {(['가', '나', '다', '라'] as const).map((g) => <option key={g} value={g}>{g}등급(직접 지정)</option>)}
          </select>
        </label>
        <span className="hint" style={{ flex: 1 }}>
          자동 계산: 여행일수 {d.travelDays}일 · 현지 숙박 {d.nights}박. {acc.accessNote ?? ''}
        </span>
      </div>

      <div className="tbl-wrap">
        <table className="grid items">
          <thead>
            <tr><th style={{ width: 140 }}>날짜</th><th style={{ width: 104 }}>시간</th><th style={{ width: 92 }}>구분</th><th>내용</th><th style={{ width: 130 }}>장소</th><th style={{ width: 120 }} /></tr>
          </thead>
          <tbody>
            {plan.items.map((it, i) => (
              <tr key={it.id} className={i > 0 && plan.items[i - 1].date !== it.date ? 'date-start' : ''}>
                <td><input type="date" value={it.date} aria-label="날짜" onChange={(e) => setItem(it.id, { date: e.target.value })} /><div className="hint">{fmtKDate(it.date)}</div></td>
                <td><input type="time" value={it.time} aria-label="시간" onChange={(e) => setItem(it.id, { time: e.target.value })} /></td>
                <td>
                  <select value={it.kind} aria-label="구분" onChange={(e) => setItem(it.id, { kind: e.target.value as ItemKind })}>
                    {KINDS.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </td>
                <td><input type="text" value={it.text} aria-label="내용" onChange={(e) => setItem(it.id, { text: e.target.value })} /></td>
                <td><input type="text" value={it.place} aria-label="장소" onChange={(e) => setItem(it.id, { place: e.target.value })} /></td>
                <td>
                  <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                    <button className="btn sm" aria-label="위로" onClick={() => move(i, -1)}>↑</button>
                    <button className="btn sm" aria-label="아래로" onClick={() => move(i, 1)}>↓</button>
                    <button className="btn sm danger" onClick={() => update((p) => ({ ...p, items: p.items.filter((x) => x.id !== it.id) }))}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row">
        <button
          className="btn"
          onClick={() =>
            update((p) => ({
              ...p,
              items: [...p.items, { id: uid('it'), date: p.items[p.items.length - 1]?.date ?? p.outbound.arrDate, time: '10:00', kind: '미팅', text: '', place: ex.venue }],
            }))
          }
        >
          + 일정 추가
        </button>
        <button className="btn" onClick={() => update((p) => ({ ...p, items: sortItems(p.items) }))}>날짜·시간순 정렬</button>
      </div>
    </div>
  );
}
