import type { Grade, ServiceType, TravelClass } from '../types';

/**
 * 공무원 여비 규정 기준표.
 * - 단가: 별표 4 국외 여비 지급표 (2021. 5. 25. 개정), 단위 미화 $
 * - 구분: 별표 1 여비 지급 구분표 (2022. 5. 9. 개정)
 * 규정이 바뀌면 이 파일(또는 Supabase travel_rate_tables)만 새 버전으로 교체한다.
 */
export const RULE_VERSION = {
  id: 'kr-gov-2021-05-25',
  label: '공무원 여비 규정 별표 4(2021. 5. 25. 개정) · 별표 1(2022. 5. 9. 개정)',
  source: 'https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=160162327&bylClsCd=110201',
};

export interface Rate { daily: number; lodgingCap: number; meal: number }

export const RATES: Record<TravelClass, Record<Grade, Rate>> = {
  '1가': { 가: { daily: 60, lodgingCap: 471, meal: 186 }, 나: { daily: 60, lodgingCap: 422, meal: 136 }, 다: { daily: 60, lodgingCap: 271, meal: 102 }, 라: { daily: 60, lodgingCap: 216, meal: 85 } },
  '1나': { 가: { daily: 50, lodgingCap: 389, meal: 160 }, 나: { daily: 50, lodgingCap: 289, meal: 117 }, 다: { daily: 50, lodgingCap: 215, meal: 87 }, 라: { daily: 50, lodgingCap: 161, meal: 73 } },
  '1다': { 가: { daily: 40, lodgingCap: 282, meal: 133 }, 나: { daily: 40, lodgingCap: 207, meal: 99 }, 다: { daily: 40, lodgingCap: 162, meal: 72 }, 라: { daily: 40, lodgingCap: 108, meal: 61 } },
  '1라': { 가: { daily: 35, lodgingCap: 223, meal: 107 }, 나: { daily: 35, lodgingCap: 160, meal: 78 }, 다: { daily: 35, lodgingCap: 130, meal: 58 }, 라: { daily: 35, lodgingCap: 85, meal: 49 } },
  '2': { 가: { daily: 30, lodgingCap: 176, meal: 81 }, 나: { daily: 30, lodgingCap: 137, meal: 59 }, 다: { daily: 30, lodgingCap: 106, meal: 44 }, 라: { daily: 30, lodgingCap: 81, meal: 37 } },
};

export const CLASS_LABEL: Record<TravelClass, string> = {
  '1가': '제1호 가목', '1나': '제1호 나목', '1다': '제1호 다목', '1라': '제1호 라목', '2': '제2호',
};

/** 상급 순서(작을수록 상급) — 동행 특례 판단용 */
export const CLASS_ORDER: TravelClass[] = ['1가', '1나', '1다', '1라', '2'];

/** 국외 항공 좌석 기준(별표 3). 제1호 라목 이상은 중간석, 제2호는 2등석으로 예산을 잡는다. */
export function seatFor(c: TravelClass): 'business' | 'economy' {
  return c === '2' ? 'economy' : 'business';
}
export const SEAT_LABEL = { business: '중간석(비즈니스)', economy: '2등석(이코노미)' } as const;

export const RANKS: Record<ServiceType, { rank: string; cls: TravelClass }[]> = {
  일반직: [
    { rank: '1급', cls: '1다' },
    { rank: '고위공무원단 가등급', cls: '1다' },
    { rank: '고위공무원단 나등급', cls: '1라' },
    { rank: '2급(국장급)', cls: '1라' },
    { rank: '3급(국장급)', cls: '1라' },
    { rank: '2급(과장급)', cls: '2' },
    { rank: '3급(과장급)', cls: '2' },
    { rank: '4급', cls: '2' },
    { rank: '5급', cls: '2' },
    { rank: '6급', cls: '2' },
    { rank: '7급', cls: '2' },
    { rank: '8급', cls: '2' },
    { rank: '9급', cls: '2' },
  ],
  군인: [
    { rank: '대장', cls: '1가' },
    { rank: '중장', cls: '1나' },
    { rank: '소장', cls: '1다' },
    { rank: '준장', cls: '1다' },
    { rank: '대령', cls: '1라' },
    { rank: '중령', cls: '1라' },
    { rank: '소령', cls: '2' },
    { rank: '대위', cls: '2' },
    { rank: '중위', cls: '2' },
    { rank: '소위', cls: '2' },
    { rank: '준위', cls: '2' },
    { rank: '원사', cls: '2' },
    { rank: '상사', cls: '2' },
    { rank: '중사', cls: '2' },
    { rank: '하사', cls: '2' },
    { rank: '병장', cls: '2' },
    { rank: '상병', cls: '2' },
    { rank: '일병', cls: '2' },
    { rank: '이병', cls: '2' },
  ],
};

export function classOf(service: ServiceType, rank: string): TravelClass {
  return RANKS[service].find((r) => r.rank === rank)?.cls ?? '2';
}

/** 별표 4 비고 2: 도시를 먼저 보고, 없으면 국가 등급 */
const GRADE_CITIES: Record<string, Grade> = {
  도쿄: '가', 뉴욕: '가', 런던: '가', 로스앤젤레스: '가', 모스크바: '가', 샌프란시스코: '가',
  '워싱턴 D.C.': '가', 파리: '가', 홍콩: '가', 제네바: '가', 싱가포르: '가',
};
const GRADE_COUNTRIES: Record<string, Grade> = {
  미국: '나', 캐나다: '나', 멕시코: '나', 일본: '나', 인도: '나', 호주: '나', 대만: '나',
  영국: '나', 프랑스: '나', 독일: '나', 이탈리아: '나', 스페인: '나', 네덜란드: '나', 벨기에: '나', 스웨덴: '나', 노르웨이: '나', 덴마크: '나', 핀란드: '나', 스위스: '나', 오스트리아: '나', 그리스: '나',
  UAE: '나', 사우디아라비아: '나', 카타르: '나', 쿠웨이트: '나', 바레인: '나', 오만: '나', 이스라엘: '나', 이집트: '나', 남아공: '나',
  튀르키예: '다', 폴란드: '다', 체코: '다', 루마니아: '다', 말레이시아: '다', 인도네시아: '다', 태국: '다', 중국: '다', 뉴질랜드: '다', 브라질: '다', 칠레: '다', 아르헨티나: '다',
  베트남: '라', 필리핀: '라', 몽골: '라', 콜롬비아: '라', 페루: '라',
};

export function gradeFor(city: string, country: string): Grade {
  return GRADE_CITIES[city] ?? GRADE_COUNTRIES[country] ?? '다';
}
export const GRADE_CITY_LIST = Object.keys(GRADE_CITIES);
