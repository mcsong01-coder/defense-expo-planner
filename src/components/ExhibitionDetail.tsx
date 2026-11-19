import { STATUS_LABEL, TAGS } from '../data/exhibitions';
import { accessFor } from '../lib/itinerary';
import { gradeFor } from '../data/travelRules';
import type { Exhibition } from '../types';
import { keywordHits } from '../lib/interests';

export default function ExhibitionDetail({ ex, tags, keywords = [], onPlan }: { ex: Exhibition; tags: Set<string>; keywords?: string[]; onPlan: (id: string) => void }) {
  const acc = accessFor(ex);
  const hits = keywordHits(ex, keywords);
  return (
    <>
      <div className="d-head">
        <span className={`pill ${ex.status}`} style={{ justifySelf: 'start' }}>{STATUS_LABEL[ex.status]}</span>
        <h2>{ex.name}</h2>
        <div className="muted">{ex.ko}</div>
        <div className="row">
          <button className="btn accent" onClick={() => onPlan(ex.id)}>이 전시회로 출장 계획 만들기</button>
        </div>
      </div>
      <dl className="d-facts">
        <dt>일정</dt>
        <dd className="mono">{ex.approx ? `${ex.approx} (추정)` : `${ex.start.replace(/-/g, '.')} – ${ex.end.replace(/-/g, '.')}`}</dd>
        <dt>장소</dt>
        <dd>{ex.venue}, {ex.city} ({ex.country})</dd>
        <dt>도착 공항</dt>
        <dd>{acc.airportName} {acc.airport && `(${acc.airport})`}</dd>
        <dt>여비 등급</dt>
        <dd>{gradeFor(acc.lodgingCity, acc.lodgingCountry)}등급 ({acc.lodgingCity} 숙박 기준)</dd>
        <dt>주기·규모</dt>
        <dd>{ex.cycle} · {ex.scale}</dd>
        <dt>공식 사이트</dt>
        <dd><a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.url.replace('https://', '')}</a></dd>
      </dl>
      {keywords.length > 0 && (
        <div className="d-sec">
          <h3>내 관심 분야</h3>
          {hits.length ? (
            <div className="chips">{hits.map((k) => <span key={k} className="tag hit">#{k}</span>)}</div>
          ) : (
            <p className="hint">입력한 관심 분야({keywords.join(', ')})가 이 전시회 설명에는 나오지 않습니다.</p>
          )}
        </div>
      )}
      {ex.note && <div className="d-sec"><div className="note">{ex.note}</div></div>}
      <div className="d-sec">
        <h3>기업별 전시 내용 <span className="q">과거 회차 실적 · 이번 회차 예상</span></h3>
        {ex.firmDetails?.length ? (
          <div className="firm-list">
            {ex.firmDetails.map((f) => (
              <div key={f.name} className={`firm-card ${f.kr ? 'kr' : ''}`}>
                <div className="fc-name">{f.name}{f.kr && <span className="tag">한국</span>}</div>
                <div className="fc-row"><span className="fc-lb">과거 전시</span><p>{f.past}</p></div>
                {f.expect && <div className="fc-row"><span className="fc-lb exp">이번에 볼 것</span><p>{f.expect}</p></div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="firms">{ex.firms.map((f) => <span key={f} className="firm">{f}</span>)}</div>
        )}
        {ex.kr.length > 0 && <div className="firms" style={{ marginTop: 8 }}>{ex.kr.map((f) => <span key={f} className="firm kr">{f}</span>)}</div>}
      </div>
      <div className="d-sec">
        <h3>예상 기술동향 <span className="q">예측</span></h3>
        {ex.trends.map((t) => (
          <div className="trend" key={t.t}>
            <span className={`tag ${tags.has(t.t) ? 'hit' : ''}`}>{TAGS[t.t]}</span>
            <p>{t.d}</p>
          </div>
        ))}
      </div>
      <div className="d-sec">
        <h3>참관 시 확보할 정보</h3>
        <ul className="tight">{ex.intel.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
    </>
  );
}
