import { useEffect, useState } from 'react';
import type { TripRepository } from '../repo';
import type { TripPlan } from '../types';
import { findExhibition } from '../data/exhibitions';
import { computeBudget, krw } from '../lib/budget';
import { fmtDot } from '../lib/dates';

export default function MyTrips({ repo, onOpen, onNew }: { repo: TripRepository; onOpen: (id: string) => void; onNew: () => void }) {
  const [list, setList] = useState<TripPlan[] | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const load = () => repo.list().then(setList);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo]);

  return (
    <div className="stack" style={{ maxWidth: 960 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20 }}>내 출장안</h1>
        <button className="btn primary" onClick={onNew}>전시회 고르러 가기</button>
      </div>
      <p className="hint">출장안은 {repo.kind === 'supabase' ? 'Supabase 계정' : '이 브라우저'}에 저장됩니다. 이름·소속 외의 개인정보는 받지 않습니다.</p>
      {list === null && <div className="card empty">불러오는 중…</div>}
      {list?.length === 0 && (
        <div className="card empty">
          아직 출장안이 없습니다. 전시회 레이더에서 전시회를 고르고 ‘출장 계획 만들기’를 누르세요.
        </div>
      )}
      {list?.map((p) => {
        const ex = findExhibition(p.exhibitionId);
        if (!ex) return null;
        const b = computeBudget(p, ex);
        return (
          <div className="card trip-row" key={p.id}>
            <div className="stack" style={{ gap: 4 }}>
              <div className="row">
                <span className={`pill ${p.status}`}>{p.status === 'confirmed' ? '확정' : '작성 중'}</span>
                <b>{p.title}</b>
                <span className="hint">v{p.version}</span>
              </div>
              <span className="hint">
                {fmtDot(p.outbound.date)} ~ {fmtDot(p.inbound.arrDate)} · {p.travelers.length}명 · 예산 {krw(b.totalKRW)}
              </span>
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => onOpen(p.id)}>열기</button>
              {confirmDel === p.id ? (
                <>
                  <button className="btn danger" onClick={async () => { await repo.remove(p.id); setConfirmDel(null); load(); }}>삭제 확인</button>
                  <button className="btn" onClick={() => setConfirmDel(null)}>취소</button>
                </>
              ) : (
                <button className="btn danger" onClick={() => setConfirmDel(p.id)}>삭제</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
