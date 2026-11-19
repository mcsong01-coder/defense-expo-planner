import type { SupabaseClient } from '@supabase/supabase-js';
import type { TripPlan } from '../types';
import type { TripRepository } from './index';

/** Supabase storage; row-level security limits every query to the signed-in user. */
export class SupabaseTripRepository implements TripRepository {
  readonly kind = 'supabase' as const;
  private sb: SupabaseClient;

  constructor(sb: SupabaseClient) {
    this.sb = sb;
  }

  async list() {
    const { data, error } = await this.sb.from('trip_plans').select('data').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => row.data as TripPlan);
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
