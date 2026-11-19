// 도메인 타입. Supabase 연결 시에도 같은 구조를 jsonb로 저장한다.

export type ScheduleStatus = 'ok' | 'tent' | 'est';
export type Grade = '가' | '나' | '다' | '라';
/** 공무원 여비 규정 별표 1 여비 지급 구분 */
export type TravelClass = '1가' | '1나' | '1다' | '1라' | '2';
export type ServiceType = '일반직' | '군인';

export interface Trend { t: string; d: string }

/** 기업별 전시 정보: 과거 회차에 실제 내놓은 것과 다음 회차 예상 */
export interface FirmDetail {
  name: string;
  kr?: boolean; // 한국 기업
  past: string; // 과거 회차 전시 내용(연도 포함)
  expect?: string; // 다음 회차 예상 전시·확인 포인트
}

export interface Exhibition {
  id: string;
  name: string;
  ko: string;
  start: string; // YYYY-MM-DD
  end: string;
  status: ScheduleStatus;
  approx?: string;
  city: string;
  country: string;
  region: string;
  venue: string;
  cycle: string;
  domains: string[];
  scale: string;
  url: string;
  firms: string[];
  firmDetails?: FirmDetail[];
  kr: string[];
  trends: Trend[];
  intel: string[];
  note?: string;
}

export interface Traveler {
  id: string;
  name: string; // 선택
  org: string; // 선택
  service: ServiceType;
  rank: string; // 직급·계급
}

export interface FlightLeg {
  date: string; // 출발일(출발지 현지)
  dep: string; // HH:MM 출발지 현지
  arrDate: string; // 도착일(도착지 현지)
  arr: string; // HH:MM 도착지 현지
  flightNo: string;
  from: string; // 공항 코드
  to: string;
  carrier?: string; // 운항사 설명(대한항공, 환승 등)
  via?: string; // 직항/경유 설명
}

export type ItemKind = '이동' | '참관' | '미팅' | '방문' | '기타';

export interface ItineraryItem {
  id: string;
  date: string;
  time: string;
  kind: ItemKind;
  text: string;
  place: string;
}

export interface OtherCost { id: string; label: string; amountKRW: number }

export interface BudgetSettings {
  fxRate: number; // 원/달러
  fxNote: string; // 적용 기준(예: 2026-11-19 매매기준율)
  fareOverrides: Record<string, number>; // travelerId -> 원
  others: OtherCost[];
  includeReserve: boolean; // 숙박·식비 1/2 예비비
  escortRule: boolean; // 동행 시 상급자 등급(숙박·식비)
  dayOverrides: { travelDays?: number; mealDays?: number; nights?: number };
  /** 기내식 제공분 식비 감액(1식 = 1일 식비의 1/3). 없으면 true로 본다 */
  deductInflightMeals?: boolean;
  /** 기내식 횟수 직접 지정(없으면 항공편 기준표 값) */
  inflightMeals?: { out?: number; in?: number };
}

export interface TripPlan {
  id: string;
  exhibitionId: string;
  status: 'draft' | 'confirmed';
  version: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  title: string;
  purposeNote: string;
  travelers: Traveler[];
  visitDays: number;
  outbound: FlightLeg;
  inbound: FlightLeg;
  lodgingCity: string;
  gradeOverride: Grade | null;
  items: ItineraryItem[];
  budget: BudgetSettings;
  /** 확정 시점 스냅숏(이전 버전) */
  history: { version: number; confirmedAt: string; snapshot: string }[];
}
