import type { Exhibition, TripPlan } from '../../types';
import { RATES, RULE_VERSION, CLASS_LABEL } from '../../data/travelRules';
import { computeBudget, defaultFare, krw, usd } from '../../lib/budget';
import { autoDays, flightPlanFor, uid } from '../../lib/itinerary';
import { FARE_NOTE } from '../../data/flights';
import type { Update } from './Planner';

export default function BudgetStep({ plan, ex, update }: { plan: TripPlan; ex: Exhibition; update: Update }) {
  const b = computeBudget(plan, ex);
  const auto = autoDays(plan);
  const setB = (patch: Partial<TripPlan['budget']>) => update((p) => ({ ...p, budget: { ...p.budget, ...patch } }));
  const setDay = (k: 'travelDays' | 'mealDays' | 'nights', v: string) =>
    setB({ dayOverrides: { ...plan.budget.dayOverrides, [k]: v === '' ? undefined : Math.max(0, Number(v)) } });
  const f = flightPlanFor(ex, plan.outbound.date || ex.start);
  const im = b.inflight;
  const setMeal = (k: 'out' | 'in', v: string) =>
    setB({ inflightMeals: { ...(plan.budget.inflightMeals ?? {}), [k]: v === '' ? undefined : Math.max(0, Number(v)) } });
  const num = (v: string) => (v === '' ? 0 : Number(v.replace(/[^\d.]/g, '')));

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 17 }}>여비 예산</h2>
        <p className="hint">
          출장자별 여비 구분과 {b.grade}등급 단가로 계산합니다. 숙박비는 상한액 기준 예산이며 실제로는 상한 안에서 실비 정산합니다. 기준: {RULE_VERSION.label}
        </p>
      </div>

      <div className="card pad row" style={{ alignItems: 'flex-end' }}>
        <label className="field">
          <span>환율(원/$)</span>
          <input type="number" min={0} step={1} value={plan.budget.fxRate} onChange={(e) => setB({ fxRate: num(e.target.value) })} style={{ width: 110 }} />
        </label>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          <span>환율 기준 메모</span>
          <input type="text" value={plan.budget.fxNote} onChange={(e) => setB({ fxNote: e.target.value })} placeholder="예: 2026-11-19 매매기준율" />
        </label>
        {(['travelDays', 'mealDays', 'nights'] as const).map((k) => (
          <label className="field" key={k}>
            <span>{k === 'travelDays' ? '여행일수(일비)' : k === 'mealDays' ? '식비 일수' : '숙박(박)'} · 자동 {auto[k]}</span>
            <input type="number" min={0} value={plan.budget.dayOverrides[k] ?? ''} placeholder={String(auto[k])} onChange={(e) => setDay(k, e.target.value)} style={{ width: 90 }} />
          </label>
        ))}
      </div>
      <p className="hint">일수를 비워 두면 일정에서 자동 계산한 값을 씁니다. 하루 종일 기내에 있는 날은 식비 일수에서 빼는 등 기관 처리 기준에 맞게 고치세요.</p>

      <div className="card pad stack">
        <h3 style={{ fontSize: 14 }}>항공편·기내식</h3>
        <p className="hint" style={{ margin: 0 }}>
          기준 항공편: <b>{f.carrier}</b> · {f.direct ? '직항' : '경유'} · 출국 {plan.outbound.flightNo || f.out.flightNo} / 귀국 {plan.inbound.flightNo || f.in.flightNo} · 왕복 일반석 기본 {krw(f.fareEconomyKRW)}
          {f.note ? ` · ${f.note}` : ''}
        </p>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label className="check" style={{ flex: '1 1 260px' }}>
            <input type="checkbox" checked={im.deduct} onChange={(e) => setB({ deductInflightMeals: e.target.checked })} />
            <span>기내식 제공분 식비 감액 (1식당 1일 식비의 1/3)</span>
          </label>
          <label className="field">
            <span>가는 편 기내식 · 기준 {im.auto.out}식</span>
            <input type="number" min={0} max={6} value={plan.budget.inflightMeals?.out ?? ''} placeholder={String(im.auto.out)} onChange={(e) => setMeal('out', e.target.value)} style={{ width: 90 }} />
          </label>
          <label className="field">
            <span>오는 편 기내식 · 기준 {im.auto.in}식</span>
            <input type="number" min={0} max={6} value={plan.budget.inflightMeals?.in ?? ''} placeholder={String(im.auto.in)} onChange={(e) => setMeal('in', e.target.value)} style={{ width: 90 }} />
          </label>
        </div>
        <p className="hint" style={{ margin: 0 }}>{FARE_NOTE} 기내식 감액 방식은 소속 기관 여비 지침을 확인하세요.</p>
      </div>

      <div className="tbl-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th>출장자</th><th>구분</th><th className="num">항공료(원)</th><th className="num">일비</th><th className="num">식비</th><th className="num">숙박(상한)</th>
              {plan.budget.includeReserve && <th className="num">예비비</th>}
              <th className="num">합계(원)</th>
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r) => (
              <tr key={r.travelerId}>
                <td><b>{r.label}</b><div className="hint">{r.rank}</div></td>
                <td>{r.clsLabel}<div className="hint">{r.seat}</div></td>
                <td className="num">
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={plan.budget.fareOverrides[r.travelerId] ?? defaultFare(ex, r.cls, plan.outbound.date)}
                    onChange={(e) => setB({ fareOverrides: { ...plan.budget.fareOverrides, [r.travelerId]: num(e.target.value) } })}
                    style={{ width: 120, textAlign: 'right' }}
                    aria-label={`${r.label} 항공료`}
                  />
                  {plan.budget.fareOverrides[r.travelerId] === undefined && <div className="hint">대한항공 일반석 가정치</div>}
                </td>
                <td className="num">{usd(r.dailyUSD)}</td>
                <td className="num">{usd(r.mealUSD)}{r.mealDeductUSD > 0 && <div className="hint">기내식 −{usd(r.mealDeductUSD)}</div>}</td>
                <td className="num">{usd(r.lodgingUSD)}</td>
                {plan.budget.includeReserve && <td className="num">{usd(r.reserveUSD)}</td>}
                <td className="num"><b>{krw(r.totalKRW)}</b></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>소계</td>
              <td className="num">{krw(b.totalFareKRW)}</td>
              <td className="num" colSpan={plan.budget.includeReserve ? 4 : 3}>체재비 {usd(b.totalUSD)} × {b.fxRate.toLocaleString('ko-KR')}원</td>
              <td className="num">{krw(b.totalKRW - b.othersKRW)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <label className="check">
        <input type="checkbox" checked={plan.budget.includeReserve} onChange={(e) => setB({ includeReserve: e.target.checked })} />
        <span>예비비 포함: 부득이하게 상한을 넘길 때 추가 지급할 수 있는 숙박비·식비의 1/2을 예산에 더합니다.</span>
      </label>

      <div className="card pad stack">
        <h3 style={{ fontSize: 14 }}>기타 경비(실비)</h3>
        {plan.budget.others.map((o) => (
          <div className="row" key={o.id}>
            <input type="text" value={o.label} placeholder="예: 전시회 등록비, 여행자보험, 비자" style={{ flex: 1 }} onChange={(e) => setB({ others: plan.budget.others.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })} />
            <input type="number" min={0} step={10000} value={o.amountKRW} style={{ width: 140, textAlign: 'right' }} onChange={(e) => setB({ others: plan.budget.others.map((x) => (x.id === o.id ? { ...x, amountKRW: num(e.target.value) } : x)) })} aria-label="금액(원)" />
            <button className="btn sm danger" onClick={() => setB({ others: plan.budget.others.filter((x) => x.id !== o.id) })}>삭제</button>
          </div>
        ))}
        <div className="row">
          <button className="btn sm" onClick={() => setB({ others: [...plan.budget.others, { id: uid('oc'), label: '', amountKRW: 0 }] })}>+ 항목 추가</button>
          {b.othersKRW > 0 && <span className="hint">기타 경비 {krw(b.othersKRW)}</span>}
        </div>
      </div>

      <details>
        <summary className="hint" style={{ cursor: 'pointer' }}>산출 근거 보기</summary>
        <ul className="tight" style={{ marginTop: 8 }}>
          {b.rows.map((r) => <li key={r.travelerId}>{r.label}({r.clsLabel}): {r.basis}</li>)}
          <li>적용 단가({b.grade}등급): {Object.entries(RATES).map(([c, g]) => `${CLASS_LABEL[c as keyof typeof RATES]} 일비 $${g[b.grade].daily}·숙박 $${g[b.grade].lodgingCap}·식비 $${g[b.grade].meal}`).join(' / ')}</li>
        </ul>
      </details>
    </div>
  );
}
