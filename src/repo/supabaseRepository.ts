import type { SupabaseClient } from '@supabase/supabase-js';
import type { TripPlan } from '../types';
import type { TripRepository } from './index';

/**
 * Supabase 구현(아직 사용하지 않음).
 * 테이블 스키마: supabase/migrations/0001_init.sql
 * 로그인한 사용자의 출장안만 읽고 쓰도록 RLS가 걸려 있다. 로그인 전이면 오류를 던져 브라우저 저장소로 돌아간다.
 */
export class SupabaseTripRepository implements TripRepository {
  readonly kind = 'supabase' as const;
  private sb: SupabaseClient;
  private constructor(sb: SupabaseClient) {
    this.sb = sb;
  }

  static async create(url: string, anonKey: string) {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, anonKey);
    const { data } = await sb.auth.getSession();
    if (!data.session) throw new Error('로그인 세션 없음');
    return new SupabaseTripRepository(sb);
  }

  async list() {
    const { data, error } = await this.sb.from('trip_plans').select('data').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => r.data as TripPlan);
  }
  async get(id: string) {
    const { data, error } = await this.sb.from('trip_plans').select('data').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data?.data as TripPlan) ?? null;
  }
  async save(plan: TripPlan) {
    const next = { ...plan, updatedAt: new Date().toISOString() };
    const { error } = await this.sb.from('trip_plans').upsert({
      id: next.id,
      exhibition_id: next.exhibitionId,
      status: next.status,
      version: next.version,
      data: next,
      updated_at: next.updatedAt,
    });
    if (error) throw error;
    return next;
  }
  async remove(id: string) {
    const { error } = await this.sb.from('trip_plans').delete().eq('id', id);
    if (error) throw error;
  }
}
