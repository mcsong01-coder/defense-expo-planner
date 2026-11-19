import type { TripPlan } from '../types';

/** Storage interface used by the planner screens. */
export interface TripRepository {
  readonly kind: 'local' | 'supabase';
  list(): Promise<TripPlan[]>;
  get(id: string): Promise<TripPlan | null>;
  save(plan: TripPlan): Promise<TripPlan>;
  remove(id: string): Promise<void>;
}
