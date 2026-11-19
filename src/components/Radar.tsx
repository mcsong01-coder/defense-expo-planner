import { useEffect, useMemo, useState } from 'react';
import { DATA_CHECKED_AT, DOMAINS, EXHIBITIONS, REGIONS, STATUS_LABEL, TAGS } from '../data/exhibitions';
import { diffDays, todayISO } from '../lib/dates';
import type { Exhibition } from '../types';
import ExhibitionDetail from './ExhibitionDetail';
import { keywordHits, loadKeywords, parseKeywords, saveKeywords } from '../lib/interests';

type SetState = Set<string>;
const toggle = (s: SetState, v: string) => {
  const n = new Set(s);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};
const fmt = (s: string) => s.slice(5).replace('-', '.');

export default function Radar({ onPlan }: { onPlan: (id: string) => void }) {
  const today = todayISO();
  const [q, setQ] = useState('');
  const [year, setYear] = useState<SetState>(new Set());
  const [domain, setDomain] = useState<SetState>(new Set());
  const [region, setRegion] = useState<SetState>(new Set());
  const [status, setStatus] = useState<SetState>(new Set());
  const [tags, setTags] = useState<SetState>(new Set());
  const [kws, setKwsState] = useState<string[]>(loadKeywords);
  const [kwInput, setKwInput] = useState('');
  const setKws = (next: string[]) => {
    setKwsState(next);
    saveKeywords(next);
  };
  const addKeywords = () => {
    const add = parseKeywords(kwInput).filter((k) => !kws.some((x) => x.toLowerCase() === k.toLowerCase()));
    if (add.length) setKws([...kws, ...add]);
    setKwInput('');
  };
  const upcoming = EXHIBITIONS.filter((e) => e.end >= today).sort((a, b) => a.start.localeCompare(b.start));
  const [sel, setSel] = useState<string>(upcoming[0]?.id ?? EXHIBITIONS[0].id);

  const score = (e: Exhibition) => e.trends.filter((t) => tags.has(t.t)).length + keywordHits(e, kws).length;
  const interestOn = tags.size > 0 || kws.length > 0;
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const l = EXHIBITIONS.filter((e) => {
      if (year.size && !year.has(e.start.slice(0, 4))) return false;
      if (domain.size && !e.domains.some((d) => domain.has(d))) return false;
      if (region.size && !region.has(e.region)) return false;
      if (status.size && !status.has(e.status)) return false;
      if (interestOn && score(e) === 0) return false;
      if (qq) {
        const hay = [e.name, e.ko, e.city, e.country, e.venue, ...e.firms, ...(e.firmDetails ?? []).map((f) => `${f.name} ${f.past} ${f.expect ?? ''}`), ...e.kr, ...e.trends.map((t) => TAGS[t.t] + ' ' + t.d)].join(' ').toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
    if (interestOn) return l.sort((a, b) => score(b) - score(a) || a.start.localeCompare(b.start));
    return l.sort((a, b) => a.start.localeCompare(b.start));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, year, domain, region, status, tags, kws]);

  const radar = Object.keys(TAGS)
    .map((k) => [k, list.filter((e) => e.trends.some((t) => t.t === k)).length] as const)
    .sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...radar.map((r) => r[1]));
  const groups = useMemo(() => {
    const g: Record<string, Exhibition[]> = {};
    list.forEach((e) => (g[e.start.slice(0, 7)] ??= []).push(e));
    return Object.entries(g);
  }, [list]);
  useEffect(() => {
    // 필터·관심 분야로 목록이 바뀌어 선택한 전시회가 빠지면 첫 결과를 보여 준다
    if (list.length && !list.some((e) => e.id === sel)) setSel(list[0].id);
  }, [list, sel]);
  const selected = EXHIBITIONS.find((e) => e.id === sel);
  const next = upcoming.find((e) => e.start >= today);

  const chipRow = (items: [string, string][], set: SetState, setter: (s: SetState) => void, count: (v: string) => number) => (
    <div className="chips">
      {items.map(([v, l]) => (
        <button key={v} className="chip" aria-pressed={set.has(v)} onClick={() => setter(toggle(set, v))}>
          {l}
          <span className="n">{count(v)}</span>
        </button>
      ))}
    </div>
  );

  const card = (e: Exhibition) => {
    const dd = diffDays(today, e.start);
    const ended = e.end < today;
    const sc = score(e);
    const hits = keywordHits(e, kws);
    return (
      <button key={e.id} className="ev" aria-current={sel === e.id} onClick={() => setSel(e.id)}>
        <span className={`stripe ${e.status === 'ok' ? '' : e.status}`} />
        <span className="when">
          <span className="d">{e.approx ?? `${fmt(e.start)}–${fmt(e.end)}`}</span>
          <span className="dd">{ended ? '종료' : dd <= 0 ? '진행 중' : `D-${dd}`}</span>
        </span>
        <span className="body">
          <span className="name">
            {e.name}
            <small>{e.ko}</small>
          </span>
          <span className="meta">
            {e.city}, {e.country} · {e.domains.join(' / ')} · {e.cycle}
          </span>
          <span className="chips">
            {e.trends.map((t) => (
              <span key={t.t} className={`tag ${tags.has(t.t) ? 'hit' : ''}`}>{TAGS[t.t]}</span>
            ))}
            {hits.map((k) => (
              <span key={'kw-' + k} className="tag hit">#{k}</span>
            ))}
          </span>
        </span>
        <span className="side">
          <span className={`pill ${e.status}`}>{STATUS_LABEL[e.status]}</span>
          {sc > 0 && <span className="mono" style={{ color: 'var(--accent)', fontSize: 12 }}>관심 {sc}개 일치</span>}
        </span>
      </button>
    );
  };

  return (
    <div className="radar-layout">
      <aside className="filters">
        <div className="card pad stack">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="전시회·도시·기업 검색" aria-label="검색" />
          {next && (
            <p className="hint">
              다음 전시회: <b>{next.name}</b> · D-{diffDays(today, next.start)}
            </p>
          )}
        </div>
        <div className="card pad stack">
          <h2>연도</h2>
          {chipRow([['2026', '2026'], ['2027', '2027'], ['2028', '2028']], year, setYear, (v) => EXHIBITIONS.filter((e) => e.start.startsWith(v)).length)}
          <h2>분야</h2>
          {chipRow(DOMAINS.map((d) => [d, d]), domain, setDomain, (v) => EXHIBITIONS.filter((e) => e.domains.includes(v)).length)}
          <h2>지역</h2>
          {chipRow(REGIONS.map((d) => [d, d]), region, setRegion, (v) => EXHIBITIONS.filter((e) => e.region === v).length)}
          <h2>일정 상태</h2>
          {chipRow(Object.entries(STATUS_LABEL), status, setStatus, (v) => EXHIBITIONS.filter((e) => e.status === v).length)}
          <button
            className="btn sm"
            onClick={() => {
              setQ(''); setYear(new Set()); setDomain(new Set()); setRegion(new Set()); setStatus(new Set()); setTags(new Set()); setKws([]);
            }}
          >
            필터 초기화
          </button>
        </div>
        <div className="card pad stack">
          <h2>내 관심 분야 직접 입력</h2>
          <form
            className="row"
            style={{ flexWrap: 'nowrap' }}
            onSubmit={(ev) => {
              ev.preventDefault();
              addKeywords();
            }}
          >
            <input
              id="interest-input"
              type="text"
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              placeholder="예: 잠수함, 레이더, 위성통신"
              aria-label="관심 분야 키워드"
              style={{ flex: 1 }}
            />
            <button className="btn primary" type="submit" disabled={!kwInput.trim()}>추가</button>
          </form>
          {kws.length > 0 ? (
            <div className="chips">
              {kws.map((k) => {
                const n = list.filter((e) => keywordHits(e, [k]).length).length;
                return (
                  <span key={k} className="chip kw" title={`${k}: 현재 목록 ${n}개 전시회에서 언급`}>
                    {k}
                    <span className="n">{n}</span>
                    <button type="button" className="x" aria-label={`${k} 삭제`} onClick={() => setKws(kws.filter((x) => x !== k))}>×</button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="hint">쉼표로 여러 개를 한 번에 넣을 수 있습니다. 전시회 소개·참가기업·기술동향·확보 정보에 나오는 전시회를 찾아 일치순으로 정렬합니다. 입력한 키워드는 이 브라우저에 저장됩니다.</p>
          )}
          {kws.some((k) => !EXHIBITIONS.some((e) => keywordHits(e, [k]).length)) && (
            <p className="hint">숫자 0인 키워드는 아직 어느 전시회 설명에도 없는 말입니다. 비슷한 다른 표현(예: ‘UUV’ 대신 ‘무인잠수정’)도 넣어 보세요.</p>
          )}
        </div>
        <div className="card pad stack">
          <h2>관심 기술로 추천받기</h2>
          <p className="hint">고른 기술을 많이 다룰 전시회부터 정렬합니다.</p>
          <div>
            {radar.map(([k, n]) => (
              <button key={k} className="rbar" aria-pressed={tags.has(k)} onClick={() => setTags(toggle(tags, k))}>
                <span className="lbl">{TAGS[k]}</span>
                <span className="track"><span className="fill" style={{ width: `${(n / max) * 100}%` }} /></span>
                <span className="num">{n}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="stack" aria-label="전시회 목록">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15 }}>{interestOn ? '관심 분야 일치순' : '전시회 목록 (월별)'}</h2>
          <span className="hint">{list.length}개 · 일정 확인 기준일 {DATA_CHECKED_AT}</span>
        </div>
        {!list.length && <div className="card empty">조건에 맞는 전시회가 없습니다. 필터를 줄여 보세요.</div>}
        {interestOn
          ? <div className="month-group">{list.map(card)}</div>
          : groups.map(([k, evs]) => (
              <div className="month-group" key={k}>
                <h3>{k.replace('-', '. ')}월</h3>
                {evs.map(card)}
              </div>
            ))}
      </section>

      <section className="card detail" aria-live="polite">
        {selected ? <ExhibitionDetail ex={selected} tags={tags} keywords={kws} onPlan={onPlan} /> : <div className="empty">전시회를 고르세요.</div>}
      </section>
    </div>
  );
}
