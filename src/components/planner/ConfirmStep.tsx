import { useState } from 'react';
import type { Exhibition, TripPlan } from '../../types';
import { computeBudget, krw } from '../../lib/budget';
import { validate } from '../../lib/itinerary';
import { confirmPlan } from '../../lib/plan';
import { downloadHwpx, hwpxFileName } from '../../lib/hwpx/generate';
import { fmtDot, fmtLocalStamp, todayISO } from '../../lib/dates';

export default function ConfirmStep({ plan, ex, replace, notify }: { plan: TripPlan; ex: Exhibition; replace: (p: TripPlan) => Promise<void>; notify: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const b = computeBudget(plan, ex);
  const warns = validate(plan, ex);
  const locked = plan.status === 'confirmed';
  const blocking = warns.filter((w) => !w.includes('추정치'));

  const download = async () => {
    setBusy(true);
    setErr('');
    try {
      const kind = await downloadHwpx(plan, ex, todayISO());
      notify(kind === 'zip' ? 'HWPX 계획서를 zip으로 저장했습니다' : 'HWPX 계획서를 만들었습니다');
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'declined') setErr('저장을 취소했습니다.');
      else setErr(`파일을 만들지 못했습니다: ${(e as Error).message ?? code}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 17 }}>확정·HWPX 계획서</h2>
        <p className="hint">확정하면 이 버전의 일정·인원·예산이 고정되고, 그 내용으로 공무국외출장 계획서(HWPX)를 내려받을 수 있습니다.</p>
      </div>
      <dl className="kv card pad">
        <dt>출장명</dt><dd>{plan.title}</dd>
        <dt>기간</dt><dd>{fmtDot(plan.outbound.date)} ~ {fmtDot(plan.inbound.arrDate)} ({b.days.travelDays}일 · {b.days.nights}박)</dd>
        <dt>인원</dt><dd>{plan.travelers.map((t, i) => `${t.name || `출장자 ${i + 1}`}(${t.service} ${t.rank})`).join(', ')}</dd>
        <dt>예산</dt><dd className="mono">{krw(b.totalKRW)}</dd>
        <dt>파일명</dt><dd className="mono" style={{ wordBreak: 'break-all' }}>{hwpxFileName(plan, ex)}</dd>
      </dl>
      {warns.map((w) => <div key={w} className={`note ${w.includes('추정치') ? '' : 'bad'}`}>{w}</div>)}

      {!locked ? (
        <div className="row">
          <button
            className="btn accent"
            disabled={blocking.length > 0}
            onClick={async () => {
              await replace(confirmPlan(plan));
              notify(`v${plan.version}을 확정했습니다`);
            }}
          >
            이 내용으로 확정
          </button>
          {blocking.length > 0 && <span className="hint">빨간 경고를 먼저 해결하세요.</span>}
        </div>
      ) : (
        <div className="stack">
          <div className="note info">v{plan.version} 확정됨 · {fmtLocalStamp(plan.confirmedAt)}</div>
          <div className="row">
            <button className="btn primary" disabled={busy} onClick={download}>{busy ? '만드는 중…' : 'HWPX 계획서 내려받기'}</button>
          </div>
          {err && <div className="note bad">{err}</div>}
          <p className="hint">
            한/글 2014 이상에서 열립니다. .hwp가 필요하면 한/글에서 ‘다른 이름으로 저장’하세요. Claude 미리보기 화면에서는 .hwpx를 zip에 담아 저장합니다(압축을 풀어 사용). 배포한 사이트에서는 .hwpx로 바로 내려받습니다.
          </p>
        </div>
      )}
      {plan.history.length > 0 && (
        <details>
          <summary className="hint" style={{ cursor: 'pointer' }}>확정 이력 {plan.history.length}건</summary>
          <ul className="tight" style={{ marginTop: 8 }}>
            {plan.history.map((h) => <li key={h.version + h.confirmedAt}>v{h.version} · {fmtLocalStamp(h.confirmedAt)}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
