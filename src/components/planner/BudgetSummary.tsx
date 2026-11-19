import type { Exhibition, TripPlan } from '../../types';
import { computeBudget, krw, usd } from '../../lib/budget';
import { validate } from '../../lib/itinerary';
import { fmtKDate } from '../../lib/dates';

export default function BudgetSummary({ plan, ex }: { plan: TripPlan; ex: Exhibition }) {
  const b = computeBudget(plan, ex);
  const warns = validate(plan, ex);
  return (
    <aside className="summary" aria-label="예산 요약">
      <div className="card pad stack">
        <span className="hint">총 예산(추정)</span>
        <span className="big">{krw(b.totalKRW)}</span>
        <div className="sum-line"><span>항공료</span><span className="mono">{krw(b.totalFareKRW)}</span></div>
        <div className="sum-line"><span>체재비</span><span className="mono">{usd(b.totalUSD)} · {krw(b.totalUSD * b.fxRate)}</span></div>
        {b.othersKRW > 0 && <div className="sum-line"><span>기타 경비</span><span className="mono">{krw(b.othersKRW)}</span></div>}
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '4px 0' }} />
        <div className="sum-line"><span>인원</span><span>{plan.travelers.length}명</span></div>
        <div className="sum-line"><span>여비 등급</span><span>{b.grade}등급 ({plan.lodgingCity})</span></div>
        <div className="sum-line"><span>일수</span><span>{b.days.travelDays}일 · {b.days.nights}박</span></div>
        <div className="sum-line"><span>출국</span><span className="mono">{fmtKDate(plan.outbound.date)} {plan.outbound.dep}</span></div>
        <div className="sum-line"><span>귀국 도착</span><span className="mono">{fmtKDate(plan.inbound.arrDate)} {plan.inbound.arr}</span></div>
      </div>
      {warns.length > 0 && (
        <div className="card pad stack">
          <span className="hint">확인 필요 {warns.length}건</span>
          {warns.slice(0, 4).map((w) => <div key={w} className="note">{w}</div>)}
        </div>
      )}
    </aside>
  );
}
