// 대한항공(KE) 우선 항공편 기준표 — 이코노미 기준.
// 편명·시각은 2026년 운항 패턴을 참고한 "기준 시간표"이며 시즌별로 바뀐다. 예약 전 대한항공에서 확인하고
// 일정 수정 단계에서 실제 편명·시각으로 고쳐 쓴다. 요금은 왕복 일반석(유류할증료·세금 포함) 가정치.
// 실시간 조회는 항공 API 계약이 필요해 지금은 넣지 않았다(Supabase Edge Function 자리만 남김).

export interface FlightSeg {
  flightNo: string;
  dep: string; // 출발지 현지 HH:MM
  arr: string; // 도착지 현지 HH:MM
  arrOffsetDays: number; // 도착일 - 출발일
  via: string; // 표시용 경로 설명
}

export interface FlightOption {
  key: string;
  carrier: string; // 표시용 운항사 설명
  direct: boolean; // 대한항공(또는 KE 편명 공동운항) 직항 여부
  out: FlightSeg;
  in: FlightSeg;
  fareEconomyKRW: number;
  mealsOut: number; // 기내식 제공 횟수(가는 편, 경유 시 모든 구간 합)
  mealsIn: number;
  /** 운항 기간(MM-DD). 없으면 연중. from > to 이면 해를 넘기는 기간 */
  season?: { from: string; to: string };
  note?: string;
}

const seg = (flightNo: string, dep: string, arr: string, arrOffsetDays: number, via: string): FlightSeg => ({ flightNo, dep, arr, arrOffsetDays, via });

export const FLIGHT_OPTIONS: Record<string, FlightOption[]> = {
  LHR: [{ key: 'KE-LHR', carrier: '대한항공', direct: true, out: seg('KE907', '13:20', '18:20', 0, '직항'), in: seg('KE908', '21:00', '19:00', 1, '직항'), fareEconomyKRW: 1_950_000, mealsOut: 2, mealsIn: 2 }],
  CDG: [{ key: 'KE-CDG', carrier: '대한항공', direct: true, out: seg('KE901', '13:00', '18:50', 0, '직항'), in: seg('KE902', '21:00', '18:10', 1, '직항'), fareEconomyKRW: 1_950_000, mealsOut: 2, mealsIn: 2 }],
  FRA: [{ key: 'KE-FRA', carrier: '대한항공', direct: true, out: seg('KE905', '13:00', '18:40', 0, '직항'), in: seg('KE906', '20:40', '18:30', 1, '직항'), fareEconomyKRW: 1_900_000, mealsOut: 2, mealsIn: 2 }],
  IST: [{ key: 'KE-IST', carrier: '대한항공', direct: true, out: seg('KE955', '13:45', '20:40', 0, '직항'), in: seg('KE956', '22:50', '15:40', 1, '직항'), fareEconomyKRW: 1_550_000, mealsOut: 2, mealsIn: 2 }],
  KRK: [{ key: 'KE-FRA-KRK', carrier: '대한항공 + 루프트한자(환승)', direct: false, out: seg('KE905+LH', '13:00', '22:30', 0, '프랑크푸르트 1회 경유'), in: seg('LH+KE906', '13:30', '18:30', 1, '프랑크푸르트 1회 경유'), fareEconomyKRW: 2_000_000, mealsOut: 3, mealsIn: 3, note: '타사 직항 대안: LOT 폴란드항공 인천–바르샤바 직항' }],
  DXB: [{ key: 'KE-DXB', carrier: '대한항공', direct: true, out: seg('KE951', '13:00', '18:50', 0, '직항'), in: seg('KE952', '21:10', '10:55', 1, '직항'), fareEconomyKRW: 1_400_000, mealsOut: 2, mealsIn: 2, note: '심야 대안: KE5951(에미레이트 운항 공동운항) 23:55 출발' }],
  RUH: [{ key: 'KE-DXB-RUH', carrier: '대한항공 + 제휴사(환승)', direct: false, out: seg('KE951+EK', '13:00', '23:30', 0, '두바이 1회 경유'), in: seg('EK+KE952', '15:30', '10:55', 1, '두바이 1회 경유'), fareEconomyKRW: 1_650_000, mealsOut: 3, mealsIn: 3, note: '대한항공 리야드 정기 직항 없음 — 운항 여부 예약 전 확인' }],
  DOH: [{ key: 'KE-DXB-DOH', carrier: '대한항공 + 제휴사(환승)', direct: false, out: seg('KE951+EK', '13:00', '22:40', 0, '두바이 1회 경유'), in: seg('EK+KE952', '17:30', '10:55', 1, '두바이 1회 경유'), fareEconomyKRW: 1_600_000, mealsOut: 3, mealsIn: 3, note: '타사 직항 대안: 카타르항공 인천–도하' }],
  AQJ: [{ key: 'KE-DXB-AQJ', carrier: '대한항공 + 제휴사(환승)', direct: false, out: seg('KE951+제휴', '13:00', '23:55', 0, '두바이 경유 암만·아카바'), in: seg('제휴+KE952', '13:00', '10:55', 1, '두바이 경유'), fareEconomyKRW: 1_900_000, mealsOut: 3, mealsIn: 3 }],
  DEL: [{ key: 'KE-DEL', carrier: '대한항공', direct: true, out: seg('KE481', '20:00', '00:40', 1, '직항'), in: seg('KE482', '02:10', '13:00', 0, '직항'), fareEconomyKRW: 1_150_000, mealsOut: 1, mealsIn: 1 }],
  BLR: [{ key: 'KE-DEL-BLR', carrier: '대한항공 + 인도 국내선', direct: false, out: seg('KE481+국내선', '20:00', '09:30', 1, '델리 경유'), in: seg('국내선+KE482', '20:00', '13:00', 1, '델리 경유'), fareEconomyKRW: 1_350_000, mealsOut: 2, mealsIn: 2, note: '싱가포르 경유도 가능' }],
  NRT: [{ key: 'KE-NRT', carrier: '대한항공', direct: true, out: seg('KE703', '09:00', '11:25', 0, '직항'), in: seg('KE704', '13:00', '15:40', 0, '직항'), fareEconomyKRW: 450_000, mealsOut: 1, mealsIn: 1 }],
  SIN: [{ key: 'KE-SIN', carrier: '대한항공', direct: true, out: seg('KE645', '14:35', '20:20', 0, '직항'), in: seg('KE646', '22:40', '06:10', 1, '직항'), fareEconomyKRW: 750_000, mealsOut: 1, mealsIn: 1 }],
  CGK: [{ key: 'KE-CGK', carrier: '대한항공', direct: true, out: seg('KE627', '15:15', '20:20', 0, '직항'), in: seg('KE628', '22:10', '07:20', 1, '직항'), fareEconomyKRW: 800_000, mealsOut: 1, mealsIn: 1 }],
  BKK: [{ key: 'KE-BKK', carrier: '대한항공', direct: true, out: seg('KE651', '18:05', '21:55', 0, '직항'), in: seg('KE652', '23:20', '06:50', 1, '직항'), fareEconomyKRW: 650_000, mealsOut: 1, mealsIn: 1 }],
  KUL: [{ key: 'KE-KUL', carrier: '대한항공', direct: true, out: seg('KE671', '16:25', '22:05', 0, '직항'), in: seg('KE672', '23:35', '07:20', 1, '직항'), fareEconomyKRW: 700_000, mealsOut: 1, mealsIn: 1 }],
  LGK: [{ key: 'KE-KUL-LGK', carrier: '대한항공 + 말레이시아 국내선', direct: false, out: seg('KE671+국내선', '16:25', '10:30', 1, '쿠알라룸푸르 경유(1박 또는 익일 연결)'), in: seg('국내선+KE672', '19:30', '07:20', 1, '쿠알라룸푸르 경유'), fareEconomyKRW: 900_000, mealsOut: 1, mealsIn: 1 }],
  SYD: [{ key: 'KE-SYD', carrier: '대한항공', direct: true, out: seg('KE401', '19:00', '07:00', 1, '직항'), in: seg('KE402', '09:00', '17:40', 0, '직항'), fareEconomyKRW: 1_450_000, mealsOut: 2, mealsIn: 2 }],
  MEL: [
    { key: 'KE-MEL', carrier: '대한항공(동계 계절편)', direct: true, out: seg('KE(계절편)', '19:30', '08:00', 1, '직항'), in: seg('KE(계절편)', '10:00', '18:30', 0, '직항'), fareEconomyKRW: 1_500_000, mealsOut: 2, mealsIn: 2, season: { from: '12-18', to: '03-14' }, note: '주 3회 운항 — 요일 확인 필요' },
    { key: 'KE-SYD-MEL', carrier: '대한항공 + 호주 국내선', direct: false, out: seg('KE401+국내선', '19:00', '10:30', 1, '시드니 경유'), in: seg('국내선+KE402', '06:30', '17:40', 0, '시드니 경유'), fareEconomyKRW: 1_600_000, mealsOut: 2, mealsIn: 2 },
  ],
  IAD: [{ key: 'KE-IAD', carrier: '대한항공', direct: true, out: seg('KE093', '10:20', '10:30', 0, '직항'), in: seg('KE094', '12:30', '16:10', 1, '직항'), fareEconomyKRW: 2_000_000, mealsOut: 2, mealsIn: 2 }],
  JFK: [{ key: 'KE-JFK', carrier: '대한항공', direct: true, out: seg('KE081', '10:00', '10:30', 0, '직항'), in: seg('KE082', '13:00', '16:50', 1, '직항'), fareEconomyKRW: 1_950_000, mealsOut: 2, mealsIn: 2 }],
  LAS: [{ key: 'KE-LAS', carrier: '대한항공', direct: true, out: seg('KE005', '21:00', '15:10', 0, '직항'), in: seg('KE006', '00:30', '07:00', 1, '직항'), fareEconomyKRW: 1_650_000, mealsOut: 2, mealsIn: 2, note: '하계(3/29~)는 도착 16:20' }],
  ATL: [{ key: 'KE-ATL', carrier: '대한항공', direct: true, out: seg('KE035', '09:50', '09:40', 0, '직항'), in: seg('KE036', '12:40', '17:20', 1, '직항'), fareEconomyKRW: 2_050_000, mealsOut: 2, mealsIn: 2 }],
  MCO: [{ key: 'KE-ATL-MCO', carrier: '대한항공 + 델타(조인트벤처 환승)', direct: false, out: seg('KE035+DL', '09:50', '13:30', 0, '애틀랜타 1회 경유'), in: seg('DL+KE036', '08:30', '17:20', 1, '애틀랜타 1회 경유'), fareEconomyKRW: 2_250_000, mealsOut: 2, mealsIn: 2 }],
  TPA: [{ key: 'KE-ATL-TPA', carrier: '대한항공 + 델타(조인트벤처 환승)', direct: false, out: seg('KE035+DL', '09:50', '13:40', 0, '애틀랜타 1회 경유'), in: seg('DL+KE036', '08:30', '17:20', 1, '애틀랜타 1회 경유'), fareEconomyKRW: 2_250_000, mealsOut: 2, mealsIn: 2 }],
  PHL: [{ key: 'KE-JFK-PHL', carrier: '대한항공(뉴욕 직항) + 철도', direct: true, out: seg('KE081', '10:00', '10:30', 0, '뉴욕 JFK 직항 후 암트랙 약 1.5시간'), in: seg('KE082', '13:00', '16:50', 1, '뉴욕 JFK 직항'), fareEconomyKRW: 1_950_000, mealsOut: 2, mealsIn: 2, note: '도착 공항은 뉴욕 JFK' }],
  GIG: [{ key: 'KE-ATL-GIG', carrier: '대한항공 + 델타·라탐(환승)', direct: false, out: seg('KE035+DL', '09:50', '09:30', 1, '애틀랜타 경유'), in: seg('DL+KE036', '22:00', '17:20', 2, '애틀랜타 경유'), fareEconomyKRW: 3_200_000, mealsOut: 4, mealsIn: 4 }],
  GRU: [{ key: 'KE-ATL-GRU', carrier: '대한항공 + 델타(환승)', direct: false, out: seg('KE035+DL', '09:50', '08:30', 1, '애틀랜타 경유'), in: seg('DL+KE036', '22:30', '17:20', 2, '애틀랜타 경유'), fareEconomyKRW: 3_100_000, mealsOut: 4, mealsIn: 4 }],
  SCL: [{ key: 'KE-ATL-SCL', carrier: '대한항공 + 델타(환승)', direct: false, out: seg('KE035+DL', '09:50', '08:00', 1, '애틀랜타 경유'), in: seg('DL+KE036', '21:30', '17:20', 2, '애틀랜타 경유'), fareEconomyKRW: 3_300_000, mealsOut: 4, mealsIn: 4 }],
  JNB: [{ key: 'KE-DXB-JNB', carrier: '대한항공 + 에미레이트(환승)', direct: false, out: seg('KE951+EK', '13:00', '07:00', 1, '두바이 경유'), in: seg('EK+KE952', '13:30', '10:55', 1, '두바이 경유'), fareEconomyKRW: 2_300_000, mealsOut: 4, mealsIn: 4 }],
};

function inSeason(date: string, s?: { from: string; to: string }) {
  if (!s) return true;
  const md = date.slice(5);
  return s.from <= s.to ? md >= s.from && md <= s.to : md >= s.from || md <= s.to;
}

/** 날짜에 운항하는 대한항공 우선 옵션. 직항 → 경유 순으로 첫 번째를 고른다. */
export function flightFor(airport: string, date: string): FlightOption | undefined {
  const opts = FLIGHT_OPTIONS[airport] ?? [];
  const ok = opts.filter((o) => inSeason(date, o.season));
  return ok.find((o) => o.direct) ?? ok[0] ?? opts[0];
}

export const FARE_NOTE =
  '대한항공 우선·직항 우선, 왕복 일반석(이코노미) 가정치. 편명·시각은 기준 시간표이며 예약 전 대한항공에서 확인하세요. 2026.12.17부터 아시아나 운항편도 대한항공 편명으로 바뀝니다.';
