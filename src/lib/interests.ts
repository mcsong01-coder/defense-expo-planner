import type { Exhibition } from '../types';
import { TAGS } from '../data/exhibitions';

/** 사용자가 직접 입력한 관심 분야 키워드. 브라우저에 저장(Supabase 연결 시 사용자 설정으로 옮길 자리). */
const KEY = 'dexpo.interests.v1';

export function loadKeywords(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveKeywords(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 저장 불가 환경: 이번 화면에서만 유지 */
  }
}

/** 쉼표·줄바꿈으로 여러 개를 한 번에 입력할 수 있다. */
export function parseKeywords(input: string): string[] {
  return input
    .split(/[,，\n]/)
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => s.length >= 1 && s.length <= 30);
}

const norm = (s: string) => s.toLowerCase().replace(/[\s·・\-_/]+/g, '');

const hayCache = new Map<string, string>();
function haystack(e: Exhibition): string {
  let h = hayCache.get(e.id);
  if (!h) {
    h = norm(
      [
        e.name, e.ko, e.city, e.country, e.venue, e.scale, ...e.domains, ...e.firms, ...(e.firmDetails ?? []).flatMap((f) => [f.name, f.past, f.expect ?? '']), ...e.kr, ...e.intel,
        ...e.trends.map((t) => `${TAGS[t.t] ?? ''} ${t.d}`), e.note ?? '',
      ].join(' '),
    );
    hayCache.set(e.id, h);
  }
  return h;
}

/** 전시회 소개·참가기업·기술동향·확보 정보에 키워드가 나오면 일치로 본다(띄어쓰기·가운뎃점 무시). */
export function keywordHits(e: Exhibition, keywords: string[]): string[] {
  const h = haystack(e);
  return keywords.filter((k) => {
    const n = norm(k);
    return n.length > 0 && h.includes(n);
  });
}
