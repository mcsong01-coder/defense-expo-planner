import type { ServiceType, TripPlan } from '../../types';
import { CLASS_LABEL, RANKS, classOf } from '../../data/travelRules';
import { uid } from '../../lib/itinerary';
import type { Update } from './Planner';

export default function TeamStep({ plan, update }: { plan: TripPlan; update: Update }) {
  const setT = (id: string, patch: Partial<TripPlan['travelers'][number]>) =>
    update((p) => ({ ...p, travelers: p.travelers.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 17 }}>출장단 구성</h2>
        <p className="hint">신분과 직급·계급만 고르면 「공무원 여비 규정」 별표 1에 따라 여비 구분이 정해집니다. 이름·소속은 계획서에 표시할 때만 쓰는 선택 항목입니다.</p>
      </div>
      <div className="tbl-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>신분</th>
              <th>직급·계급</th>
              <th>여비 구분</th>
              <th>항공 좌석 기준</th>
              <th>이름(선택)</th>
              <th>소속(선택)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {plan.travelers.map((t, i) => {
              const cls = classOf(t.service, t.rank);
              return (
                <tr key={t.id}>
                  <td className="mono">{i + 1}</td>
                  <td>
                    <select
                      value={t.service}
                      aria-label={`${i + 1}번 신분`}
                      onChange={(e) => {
                        const s = e.target.value as ServiceType;
                        setT(t.id, { service: s, rank: s === '군인' ? '소령' : '6급' });
                      }}
                    >
                      <option>일반직</option>
                      <option>군인</option>
                    </select>
                  </td>
                  <td>
                    <select value={t.rank} aria-label={`${i + 1}번 직급·계급`} onChange={(e) => setT(t.id, { rank: e.target.value })}>
                      {RANKS[t.service].map((r) => <option key={r.rank}>{r.rank}</option>)}
                    </select>
                  </td>
                  <td><span className={`pill ${cls === '2' ? 'draft' : 'confirmed'}`}>{CLASS_LABEL[cls]}</span></td>
                  <td className="muted" style={{ fontSize: 12.5 }}>일반석(이코노미)</td>
                  <td><input type="text" value={t.name} placeholder={`출장자 ${i + 1}`} aria-label={`${i + 1}번 이름`} onChange={(e) => setT(t.id, { name: e.target.value })} /></td>
                  <td><input type="text" value={t.org} placeholder="예: ○○과" aria-label={`${i + 1}번 소속`} onChange={(e) => setT(t.id, { org: e.target.value })} /></td>
                  <td>
                    <button className="btn sm danger" disabled={plan.travelers.length <= 1} onClick={() => update((p) => ({ ...p, travelers: p.travelers.filter((x) => x.id !== t.id) }))}>삭제</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row">
        <button className="btn" onClick={() => update((p) => ({ ...p, travelers: [...p.travelers, { id: uid('tr'), name: '', org: '', service: '일반직', rank: '6급' }] }))}>+ 일반직 추가</button>
        <button className="btn" onClick={() => update((p) => ({ ...p, travelers: [...p.travelers, { id: uid('tr'), name: '', org: '', service: '군인', rank: '소령' }] }))}>+ 군인 추가</button>
        <span className="hint">총 {plan.travelers.length}명</span>
      </div>
      <label className="check">
        <input type="checkbox" checked={plan.budget.escortRule} onChange={(e) => update((p) => ({ ...p, budget: { ...p.budget, escortRule: e.target.checked } }))} />
        <span>
          동행 특례 적용: 같은 목적으로 동행하고 부득이한 경우 숙박비·식비를 상급자 구분으로 계산합니다(국외 항공운임은 제외).
        </span>
      </label>
      <label className="field">
        <span>출장 목적 메모(선택, 계획서 ‘출장 목적’에 추가)</span>
        <textarea rows={3} value={plan.purposeNote} onChange={(e) => update((p) => ({ ...p, purposeNote: e.target.value }))} placeholder="예: 대드론 체계 소요 검토를 위한 해외 업체 제품 성능 정보 수집" />
        <span className="hint">비공개 사업명이나 보안 사항은 적지 말고, 내려받은 HWPX에서 직접 보완하세요.</span>
      </label>
    </div>
  );
}
