import type { TripPlan } from '../types';
import { LocalTripRepository } from './localRepository';

/**
 * 저장소 계층. 화면은 이 인터페이스만 사용한다.
 * - 지금: 브라우저 localStorage (로그인 없이 동작)
 * - 나중: VITE_DATA_BACKEND=supabase 와 Supabase 환경변수를 넣으면 SupabaseTripRepository 사용
 */
export interface TripRepository {
  readonly kind: 'local' | 'supabase';
  list(): Promise<TripPlan[]>;
  get(id: string): Promise<TripPlan | null>;
  save(plan: TripPlan): Promise<TripPlan>;
  remove(id: string): Promise<void>;
}

let instance: TripRepository | null = null;

export async function getRepository(): Promise<TripRepository> {
  if (instance) return instance;
  const env = import.meta.env;
  if (env.VITE_DATA_BACKEND === 'supabase' && env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    try {
      const { SupabaseTripRepository } = await import('./supabaseRepository');
      instance = await SupabaseTripRepository.create(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
      return instance;
    } catch (e) {
      console.warn('Supabase 연결 실패, 브라우저 저장소로 전환합니다.', e);
    }
  }
  instance = new LocalTripRepository();
  return instance;
}
