import type { TripPlan } from '../types';
import type { TripRepository } from './index';

const KEY = 'dexpo.trips.v1';

/** 브라우저 저장소 구현. 저장이 막힌 환경(사생활 보호 모드 등)에서는 메모리에만 보관한다. */
export class LocalTripRepository implements TripRepository {
  readonly kind = 'local' as const;
  private memory: TripPlan[] = [];

  private read(): TripPlan[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as TripPlan[];
    } catch {
      /* 저장소 사용 불가 */
    }
    return this.memory;
  }

  private write(list: TripPlan[]) {
    this.memory = list;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* 메모리에만 유지 */
    }
  }

  async list() {
    return this.read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async get(id: string) {
    return this.read().find((p) => p.id === id) ?? null;
  }
  async save(plan: TripPlan) {
    const next = { ...plan, updatedAt: new Date().toISOString() };
    const list = this.read().filter((p) => p.id !== plan.id);
    this.write([next, ...list]);
    return next;
  }
  async remove(id: string) {
    this.write(this.read().filter((p) => p.id !== id));
  }
}
