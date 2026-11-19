import { useEffect, useRef, useState } from 'react';
import type { TripRepository } from '../../repo';
import type { TripPlan } from '../../types';
import { findExhibition } from '../../data/exhibitions';
import { fmtDot } from '../../lib/dates';
import { reopenAsNewVersion } from '../../lib/plan';
import TeamStep from './TeamStep';
import ProposeStep from './ProposeStep';
import EditStep from './EditStep';
import BudgetStep from './BudgetStep';
import ConfirmStep from './ConfirmStep';
import BudgetSummary from './BudgetSummary';

export type Update = (fn: (p: TripPlan) => TripPlan) => void;

const STEPS = [
  ['team', '출장단 구성'],
  ['propose', '항공편·일정 제안'],
  ['edit', '일정 직접 수정'],
  ['budget', '여비 예산'],
  ['confirm', '확정·HWPX 계획서'],
] as const;
type StepKey = (typeof STEPS)[number][0];

export default function Planner({ repo, planId, notify, onBack }: { repo: TripRepository; planId: string; notify: (m: string) => void; onBack: () => void }) {
  const [plan, setPlan] = useState<TripPlan | null | undefined>(undefined);
  const [step, setStep] = useState<StepKey>('team');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    repo.get(planId).then(setPlan);
  }, [repo, planId]);

  const persist = (p: TripPlan) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => repo.save(p), 400);
  };
  const update: Update = (fn) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      persist(next);
      return next;
    });
  };
  const replace = async (p: TripPlan) => {
    setPlan(p);
    await repo.save(p);
  };

  if (plan === undefined) return <div className="card empty">불러오는 중…</div>;
  if (plan === null) {
    return (
      <div className="card empty">
        출장안을 찾지 못했습니다. 다른 브라우저에서 만든 출장안은 이 브라우저에 없습니다.
        <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}><button className="btn" onClick={onBack}>내 출장안으로</button></div>
      </div>
    );
  }
  const ex = findExhibition(plan.exhibitionId);
  if (!ex) return <div className="card empty">전시회 정보를 찾지 못했습니다.</div>;
  const locked = plan.status === 'confirmed';

  return (
    <>
      <div className="plan-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="row">
            <span className={`pill ${plan.status}`}>{locked ? `확정 v${plan.version}` : `작성 중 v${plan.version}`}</span>
            <input
              type="text"
              value={plan.title}
              disabled={locked}
              onChange={(e) => update((p) => ({ ...p, title: e.target.value }))}
              aria-label="출장명"
              style={{ fontSize: 18, fontWeight: 700, minWidth: 320, background: 'transparent', border: '1px solid transparent' }}
            />
          </div>
          <span className="hint">
            {ex.name} · {ex.city}({ex.country}) · 전시 {fmtDot(ex.start)}~{fmtDot(ex.end)}
          </span>
        </div>
        <div className="row">
          {locked && (
            <button className="btn" onClick={() => { replace(reopenAsNewVersion(plan)); notify(`v${plan.version + 1} 작성을 시작했습니다`); }}>
              새 버전으로 수정
            </button>
          )}
          <button className="btn" onClick={onBack}>내 출장안</button>
        </div>
      </div>
      {locked && <div className="note info" style={{ marginBottom: 12 }}>확정된 출장안은 수정할 수 없습니다. 바꾸려면 ‘새 버전으로 수정’을 누르세요.</div>}

      <div className="plan-layout">
        <nav className="steps" aria-label="단계">
          {STEPS.map(([k, l], i) => (
            <button key={k} className="step" aria-current={step === k ? 'step' : undefined} onClick={() => setStep(k)}>
              <span className="no">{i + 1}</span>
              {l}
            </button>
          ))}
        </nav>
        <section className="card pad stack" style={{ minWidth: 0 }}>
          <fieldset disabled={locked && step !== 'confirm'} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            {step === 'team' && <TeamStep plan={plan} update={update} />}
            {step === 'propose' && <ProposeStep plan={plan} ex={ex} update={update} onApplied={() => { notify('일정안을 적용했습니다'); setStep('edit'); }} />}
            {step === 'edit' && <EditStep plan={plan} ex={ex} update={update} />}
            {step === 'budget' && <BudgetStep plan={plan} ex={ex} update={update} />}
            {step === 'confirm' && <ConfirmStep plan={plan} ex={ex} replace={replace} notify={notify} />}
          </fieldset>
          <div className="row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <button className="btn" disabled={step === STEPS[0][0]} onClick={() => setStep(STEPS[STEPS.findIndex((s) => s[0] === step) - 1][0])}>이전 단계</button>
            <button className="btn primary" disabled={step === 'confirm'} onClick={() => setStep(STEPS[STEPS.findIndex((s) => s[0] === step) + 1][0])}>다음 단계</button>
          </div>
        </section>
        <BudgetSummary plan={plan} ex={ex} />
      </div>
    </>
  );
}
