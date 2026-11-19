import raw from './exhibitions.json';
import type { Exhibition } from '../types';

/** 전시회 기본 데이터(정적). Supabase 연결 후에는 exhibitions 테이블에서 같은 형태로 읽는다. */
export const DATA_CHECKED_AT = '2026-11-19';
export const TAGS: Record<string, string> = raw.TAGS;
export const DOMAINS: string[] = raw.DOMAINS;
export const REGIONS: string[] = raw.REGIONS;
export const STATUS_LABEL: Record<string, string> = raw.STATUS;
export const EXHIBITIONS: Exhibition[] = raw.EVENTS as Exhibition[];

/** 기업명 목록: 기업별 상세가 있으면 그 순서를 따른다 */
export function firmNames(ex: Exhibition): string[] {
  return ex.firmDetails?.length ? ex.firmDetails.map((f) => f.name) : ex.firms;
}

export function findExhibition(id: string): Exhibition | undefined {
  return EXHIBITIONS.find((e) => e.id === id);
}
