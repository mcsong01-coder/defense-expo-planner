import { useCallback, useEffect, useState } from 'react';
import Radar from './components/Radar';
import MyTrips from './components/MyTrips';
import Planner from './components/planner/Planner';
import { getRepository, type TripRepository } from './repo';
import { findExhibition } from './data/exhibitions';
import { createPlan } from './lib/plan';

/** 해시 라우팅: #radar, #trips, #plan-<출장안 id> (정적 호스팅·미리보기 어디서나 동작) */
function readRoute(): { name: 'radar' | 'trips' | 'plan'; id?: string } {
  const h = location.hash.replace(/^#/, '');
  if (h.startsWith('plan-')) return { name: 'plan', id: h.slice(5) };
  if (h === 'trips') return { name: 'trips' };
  return { name: 'radar' };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [repo, setRepo] = useState<TripRepository | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    getRepository().then(setRepo);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (hash: string) => {
    location.hash = hash;
    window.scrollTo(0, 0);
  };

  const startPlan = useCallback(
    async (exhibitionId: string) => {
      const ex = findExhibition(exhibitionId);
      if (!ex || !repo) return;
      const saved = await repo.save(createPlan(ex));
      go(`plan-${saved.id}`);
    },
    [repo],
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <span className="brand">
            방산·특수분야 전시회 출장 플래너<small>방산·총기·특수작전·치안 2027–2028</small>
          </span>
          <nav className="nav" aria-label="주요 메뉴">
            <a href="#radar" aria-current={route.name === 'radar' ? 'page' : undefined}>전시회 레이더</a>
            <a href="#trips" aria-current={route.name !== 'radar' ? 'page' : undefined}>내 출장안</a>
          </nav>
          <span className="store-pill" title="저장 위치">
            {repo?.kind === 'supabase' ? '저장: Supabase' : '저장: 이 브라우저'}
          </span>
        </div>
      </header>
      <main className="page">
        {route.name === 'radar' && <Radar onPlan={startPlan} />}
        {route.name === 'trips' && repo && <MyTrips repo={repo} onOpen={(id) => go(`plan-${id}`)} onNew={() => go('radar')} />}
        {route.name === 'plan' && repo && route.id && (
          <Planner key={route.id} repo={repo} planId={route.id} notify={setToast} onBack={() => go('trips')} />
        )}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
