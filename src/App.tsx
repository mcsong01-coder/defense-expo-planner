import { useCallback, useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import Radar from './components/Radar';
import MyTrips from './components/MyTrips';
import Planner from './components/planner/Planner';
import type { TripRepository } from './repo';
import { LocalTripRepository } from './repo/localRepository';
import { SupabaseTripRepository } from './repo/supabaseRepository';
import { findExhibition } from './data/exhibitions';
import { createPlan } from './lib/plan';
import AuthControls from './components/AuthControls';

/** Hash routes work on static hosts and previews: #radar, #trips, #plan-<id>. */
function readRoute(): { name: 'radar' | 'trips' | 'plan'; id?: string } {
  const h = location.hash.replace(/^#/, '');
  if (h.startsWith('plan-')) return { name: 'plan', id: h.slice(5) };
  if (h === 'trips') return { name: 'trips' };
  return { name: 'radar' };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [repo, setRepo] = useState<TripRepository | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [localPlans, setLocalPlans] = useState<Awaited<ReturnType<LocalTripRepository['list']>>>([]);
  const [importMessage, setImportMessage] = useState('');
  const [toast, setToast] = useState('');
  const [localRepo] = useState(() => new LocalTripRepository());
  const [supabase] = useState<SupabaseClient | null>(() => {
    const { VITE_DATA_BACKEND, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
    if (VITE_DATA_BACKEND !== 'supabase' || !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) return null;
    try {
      return createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
    } catch (error) {
      console.error('Supabase configuration could not be loaded.', error);
      return null;
    }
  });

  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    let active = true;
    const loadLocalPlans = () => localRepo.list().then((plans) => { if (active) setLocalPlans(plans); });
    loadLocalPlans();

    if (!supabase) {
      setRepo(localRepo);
      return () => { active = false; window.removeEventListener('hashchange', on); };
    }

    const applySession = (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      setRepo(nextUser ? new SupabaseTripRepository(supabase) : localRepo);
      if (nextUser) loadLocalPlans();
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(session?.user ?? null));
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Could not read the current sign-in state.', error);
      applySession(data.session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener('hashchange', on);
    };
  }, [localRepo, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (hash: string) => {
    location.hash = hash;
    window.scrollTo(0, 0);
  };

  const startPlan = useCallback(async (exhibitionId: string) => {
    const ex = findExhibition(exhibitionId);
    if (!ex || !repo) return;
    const saved = await repo.save(createPlan(ex));
    go('plan-' + saved.id);
  }, [repo]);

  const importLocalPlans = useCallback(async () => {
    if (!repo || repo.kind !== 'supabase' || localPlans.length === 0) return;
    setImportMessage('출장안을 계정으로 복사하고 있습니다…');
    try {
      const cloudPlans = await repo.list();
      const cloudIds = new Set(cloudPlans.map((plan) => plan.id));
      const missing = localPlans.filter((plan) => !cloudIds.has(plan.id));
      for (const plan of missing) await repo.save(plan);
      const skipped = localPlans.length - missing.length;
      const skippedMessage = skipped ? ' · 같은 ID의 기존 계정 출장안 ' + skipped + '개는 유지했습니다' : '';
      setImportMessage(missing.length + '개를 계정에 복사했습니다' + skippedMessage + '. 브라우저 사본은 그대로 남아 있습니다.');
      setLocalPlans([]);
    } catch (error) {
      setImportMessage(error instanceof Error ? '복사하지 못했습니다: ' + error.message : '복사하지 못했습니다. 다시 시도해주세요.');
    }
  }, [localPlans, repo]);

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
            {repo?.kind === 'supabase' ? '저장: 계정 동기화' : '저장: 이 브라우저'}
          </span>
          <AuthControls client={supabase} user={user} />
        </div>
      </header>
      <main className="page">
        {route.name === 'radar' && <Radar onPlan={startPlan} />}
        {route.name === 'trips' && repo && <MyTrips
          repo={repo}
          onOpen={(id) => go('plan-' + id)}
          onNew={() => go('radar')}
          localPlanCount={localPlans.length}
          onImportLocal={importLocalPlans}
          importMessage={importMessage}
        />}
        {route.name === 'plan' && repo && route.id && (
          <Planner key={route.id} repo={repo} planId={route.id} notify={setToast} onBack={() => go('trips')} />
        )}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
