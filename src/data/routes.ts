/**
 * 노선 템플릿(1단계 항공 데이터).
 * 출발·도착 시각과 소요시간은 지역별 대표 패턴을 단순화한 '예시'이며 실제 운항편이 아니다.
 * 2단계에서 항공 데이터 어댑터(스케줄·운임 API)로 교체한다. 운임은 예산 초안용 가정치.
 */

export interface LegPattern {
  dep: string; // 출발지 현지 시각
  arr: string; // 도착지 현지 시각
  arrOffsetDays: number; // 출발일 대비 도착일
  via: string; // '직항' | '1회 경유' 등
}

export interface RouteTemplate {
  key: string;
  label: string;
  outbound: LegPattern; // 인천 → 현지
  inbound: LegPattern; // 현지 → 인천
  fareEconomyKRW: number;
  fareBusinessKRW: number;
}

export const ROUTE_TEMPLATES: Record<string, RouteTemplate> = {
  europeWest: { key: 'europeWest', label: '서유럽', outbound: { dep: '11:00', arr: '17:30', arrOffsetDays: 0, via: '직항' }, inbound: { dep: '20:30', arr: '18:30', arrOffsetDays: 1, via: '직항' }, fareEconomyKRW: 2_000_000, fareBusinessKRW: 6_500_000 },
  europeEast: { key: 'europeEast', label: '동유럽', outbound: { dep: '10:30', arr: '16:30', arrOffsetDays: 0, via: '직항' }, inbound: { dep: '18:30', arr: '13:00', arrOffsetDays: 1, via: '직항' }, fareEconomyKRW: 1_800_000, fareBusinessKRW: 5_500_000 },
  turkey: { key: 'turkey', label: '튀르키예', outbound: { dep: '11:30', arr: '18:30', arrOffsetDays: 0, via: '직항' }, inbound: { dep: '19:00', arr: '11:30', arrOffsetDays: 1, via: '직항' }, fareEconomyKRW: 1_600_000, fareBusinessKRW: 5_000_000 },
  middleEast: { key: 'middleEast', label: '중동', outbound: { dep: '23:50', arr: '04:40', arrOffsetDays: 1, via: '직항' }, inbound: { dep: '21:00', arr: '11:30', arrOffsetDays: 1, via: '직항' }, fareEconomyKRW: 1_500_000, fareBusinessKRW: 5_000_000 },
  india: { key: 'india', label: '인도', outbound: { dep: '18:00', arr: '23:30', arrOffsetDays: 0, via: '1회 경유' }, inbound: { dep: '01:30', arr: '13:30', arrOffsetDays: 0, via: '1회 경유' }, fareEconomyKRW: 1_200_000, fareBusinessKRW: 4_000_000 },
  japan: { key: 'japan', label: '일본', outbound: { dep: '09:00', arr: '11:30', arrOffsetDays: 0, via: '직항' }, inbound: { dep: '18:00', arr: '20:40', arrOffsetDays: 0, via: '직항' }, fareEconomyKRW: 500_000, fareBusinessKRW: 1_500_000 },
  seAsia: { key: 'seAsia', label: '동남아', outbound: { dep: '16:30', arr: '22:00', arrOffsetDays: 0, via: '직항' }, inbound: { dep: '23:30', arr: '07:00', arrOffsetDays: 1, via: '직항' }, fareEconomyKRW: 800_000, fareBusinessKRW: 2_800_000 },
  oceania: { key: 'oceania', label: '호주', outbound: { dep: '19:00', arr: '07:30', arrOffsetDays: 1, via: '직항' }, inbound: { dep: '09:30', arr: '18:00', arrOffsetDays: 0, via: '직항' }, fareEconomyKRW: 1_800_000, fareBusinessKRW: 6_000_000 },
  usEast: { key: 'usEast', label: '미국 동부', outbound: { dep: '10:00', arr: '10:30', arrOffsetDays: 0, via: '직항' }, inbound: { dep: '13:00', arr: '16:30', arrOffsetDays: 1, via: '직항' }, fareEconomyKRW: 2_200_000, fareBusinessKRW: 7_500_000 },
  usWest: { key: 'usWest', label: '미국 서부', outbound: { dep: '19:30', arr: '14:30', arrOffsetDays: 0, via: '직항(계절편) 또는 1회 경유' }, inbound: { dep: '11:30', arr: '17:30', arrOffsetDays: 1, via: '직항(계절편) 또는 1회 경유' }, fareEconomyKRW: 1_900_000, fareBusinessKRW: 6_500_000 },
  usSouth: { key: 'usSouth', label: '미국 남동부', outbound: { dep: '10:00', arr: '15:30', arrOffsetDays: 0, via: '1회 경유' }, inbound: { dep: '08:00', arr: '17:30', arrOffsetDays: 1, via: '1회 경유' }, fareEconomyKRW: 2_300_000, fareBusinessKRW: 7_500_000 },
  latam: { key: 'latam', label: '남미', outbound: { dep: '18:00', arr: '10:00', arrOffsetDays: 1, via: '1회 경유' }, inbound: { dep: '22:00', arr: '05:00', arrOffsetDays: 2, via: '1회 경유' }, fareEconomyKRW: 3_500_000, fareBusinessKRW: 10_000_000 },
  africa: { key: 'africa', label: '남아프리카', outbound: { dep: '23:00', arr: '12:00', arrOffsetDays: 1, via: '1회 경유' }, inbound: { dep: '18:00', arr: '18:00', arrOffsetDays: 1, via: '1회 경유' }, fareEconomyKRW: 2_500_000, fareBusinessKRW: 8_000_000 },
};

export interface VenueAccess {
  route: keyof typeof ROUTE_TEMPLATES;
  airport: string; // 도착 공항 코드
  airportName: string;
  transferH: number; // 공항 → 숙소·전시장 이동(시간)
  lodgingCity: string; // 여비 등급 판단 도시
  lodgingCountry: string;
  tradeEnd?: string; // 무역일 마지막 날(일반 공개일 제외)
  accessNote?: string;
}

export const VENUE_ACCESS: Record<string, VenueAccess> = {
  iitsec26: { route: 'usSouth', airport: 'MCO', airportName: '올랜도', transferH: 1, lodgingCity: '올랜도', lodgingCountry: '미국' },
  idex27: { route: 'middleEast', airport: 'DXB', airportName: '두바이(대한항공 직항)', transferH: 2, accessNote: '두바이 도착 후 아부다비까지 차량 약 1.5~2시간', lodgingCity: '아부다비', lodgingCountry: 'UAE' },
  aeroindia27: { route: 'india', airport: 'BLR', airportName: '벵갈루루', transferH: 1.5, lodgingCity: '벵갈루루', lodgingCountry: '인도' },
  avalon27: { route: 'oceania', airport: 'MEL', airportName: '멜버른', transferH: 1.5, lodgingCity: '질롱', lodgingCountry: '호주', tradeEnd: '2027-02-26' },
  sas27: { route: 'usEast', airport: 'IAD', airportName: '워싱턴 덜레스', transferH: 1.5, lodgingCity: '내셔널하버', lodgingCountry: '미국', accessNote: '전시장은 메릴랜드주. 워싱턴 D.C.에 숙박하면 가등급 적용 여부를 회계 담당과 확인' },
  laad27: { route: 'latam', airport: 'GIG', airportName: '리우데자네이루', transferH: 1, lodgingCity: '리우데자네이루', lodgingCountry: '브라질' },
  lima27: { route: 'seAsia', airport: 'LGK', airportName: '랑카위(쿠알라룸푸르 경유)', transferH: 3, lodgingCity: '랑카위', lodgingCountry: '말레이시아', accessNote: '쿠알라룸푸르에서 국내선 환승' },
  dseij27: { route: 'japan', airport: 'NRT', airportName: '나리타', transferH: 1, lodgingCity: '지바', lodgingCountry: '일본', accessNote: '도쿄 시내에 숙박하면 가등급 적용 여부 확인' },
  idef27: { route: 'turkey', airport: 'IST', airportName: '이스탄불', transferH: 1, lodgingCity: '이스탄불', lodgingCountry: '튀르키예' },
  imdex27: { route: 'seAsia', airport: 'SIN', airportName: '싱가포르 창이', transferH: 0.5, lodgingCity: '싱가포르', lodgingCountry: '싱가포르' },
  indodef27: { route: 'seAsia', airport: 'CGK', airportName: '자카르타', transferH: 1, lodgingCity: '탕그랑', lodgingCountry: '인도네시아' },
  pas27: { route: 'europeWest', airport: 'CDG', airportName: '파리 샤를드골', transferH: 1, lodgingCity: '파리', lodgingCountry: '프랑스', tradeEnd: '2027-06-17' },
  mspo27: { route: 'europeEast', airport: 'KRK', airportName: '크라쿠프(또는 바르샤바)', transferH: 2.5, lodgingCity: '키엘체', lodgingCountry: '폴란드', accessNote: '공항에서 육로 이동' },
  dsei27: { route: 'europeWest', airport: 'LHR', airportName: '런던 히스로', transferH: 1.5, lodgingCity: '런던', lodgingCountry: '영국' },
  ausa27: { route: 'usEast', airport: 'IAD', airportName: '워싱턴 덜레스', transferH: 1, lodgingCity: '워싱턴 D.C.', lodgingCountry: '미국' },
  indopac27: { route: 'oceania', airport: 'SYD', airportName: '시드니', transferH: 1, lodgingCity: '시드니', lodgingCountry: '호주' },
  dst27: { route: 'seAsia', airport: 'BKK', airportName: '방콕', transferH: 1.5, lodgingCity: '방콕', lodgingCountry: '태국' },
  dubai27: { route: 'middleEast', airport: 'DXB', airportName: '두바이', transferH: 1, lodgingCity: '두바이', lodgingCountry: 'UAE' },
  milipol27: { route: 'europeWest', airport: 'CDG', airportName: '파리 샤를드골', transferH: 1, lodgingCity: '파리', lodgingCountry: '프랑스' },
  iitsec27: { route: 'usSouth', airport: 'MCO', airportName: '올랜도', transferH: 1, lodgingCity: '올랜도', lodgingCountry: '미국' },
  wds28: { route: 'middleEast', airport: 'RUH', airportName: '리야드', transferH: 1, lodgingCity: '리야드', lodgingCountry: '사우디아라비아' },
  sgas28: { route: 'seAsia', airport: 'SIN', airportName: '싱가포르 창이', transferH: 0.5, lodgingCity: '싱가포르', lodgingCountry: '싱가포르', tradeEnd: '2028-02-18' },
  dimdex28: { route: 'middleEast', airport: 'DOH', airportName: '도하', transferH: 1, lodgingCity: '도하', lodgingCountry: '카타르' },
  sas28: { route: 'usEast', airport: 'IAD', airportName: '워싱턴 덜레스', transferH: 1.5, lodgingCity: '내셔널하버', lodgingCountry: '미국', accessNote: '전시장은 메릴랜드주. 워싱턴 D.C. 숙박 시 등급 확인' },
  fidae28: { route: 'latam', airport: 'SCL', airportName: '산티아고', transferH: 1, lodgingCity: '산티아고', lodgingCountry: '칠레' },
  dsa28: { route: 'seAsia', airport: 'KUL', airportName: '쿠알라룸푸르', transferH: 1.5, lodgingCity: '쿠알라룸푸르', lodgingCountry: '말레이시아' },
  ila28: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 4.5, accessNote: '프랑크푸르트에서 독일 국내선 또는 ICE(약 4시간)로 베를린 이동', lodgingCity: '베를린', lodgingCountry: '독일', tradeEnd: '2028-05-19' },
  eurosatory28: { route: 'europeWest', airport: 'CDG', airportName: '파리 샤를드골', transferH: 1, lodgingCity: '파리', lodgingCountry: '프랑스' },
  fia28: { route: 'europeWest', airport: 'LHR', airportName: '런던 히스로', transferH: 1.5, lodgingCity: '판버러', lodgingCountry: '영국', accessNote: '런던에 숙박하면 가등급 적용 여부 확인' },
  mspo28: { route: 'europeEast', airport: 'KRK', airportName: '크라쿠프(또는 바르샤바)', transferH: 2.5, lodgingCity: '키엘체', lodgingCountry: '폴란드' },
  aad28: { route: 'africa', airport: 'JNB', airportName: '요하네스버그', transferH: 1, lodgingCity: '프리토리아', lodgingCountry: '남아공', tradeEnd: '2028-09-29' },
  landforces28: { route: 'oceania', airport: 'MEL', airportName: '멜버른', transferH: 1, lodgingCity: '멜버른', lodgingCountry: '호주' },
  ausa28: { route: 'usEast', airport: 'IAD', airportName: '워싱턴 덜레스', transferH: 1, lodgingCity: '워싱턴 D.C.', lodgingCountry: '미국' },
  euronaval28: { route: 'europeWest', airport: 'CDG', airportName: '파리 샤를드골', transferH: 1, lodgingCity: '파리', lodgingCountry: '프랑스' },
  iitsec28: { route: 'usSouth', airport: 'MCO', airportName: '올랜도', transferH: 1, lodgingCity: '올랜도', lodgingCountry: '미국' },
  intersec27: { route: 'middleEast', airport: 'DXB', airportName: '두바이', transferH: 0.5, lodgingCity: '두바이', lodgingCountry: 'UAE' },
  shot27: { route: 'usWest', airport: 'LAS', airportName: '라스베이거스', transferH: 0.5, lodgingCity: '라스베이거스', lodgingCountry: '미국' },
  enforcetac27: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 3, lodgingCity: '뉘른베르크', lodgingCountry: '독일', accessNote: '프랑크푸르트 공항역에서 ICE로 뉘른베르크까지 약 2시간 30분' },
  iwa27: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 3, lodgingCity: '뉘른베르크', lodgingCountry: '독일', accessNote: '프랑크푸르트 공항역에서 ICE로 뉘른베르크까지 약 2시간 30분. Enforce Tac와 묶어 참관 검토' },
  milipolindia27: { route: 'india', airport: 'DEL', airportName: '델리', transferH: 1, lodgingCity: '뉴델리', lodgingCountry: '인도' },
  secpol27: { route: 'europeWest', airport: 'LHR', airportName: '런던 히스로', transferH: 1.5, lodgingCity: '판버러', lodgingCountry: '영국', accessNote: '런던에 숙박하면 가등급 적용 여부 확인' },
  mdm27: { route: 'usEast', airport: 'IAD', airportName: '워싱턴 덜레스', transferH: 1, lodgingCity: '워싱턴 D.C.', lodgingCountry: '미국' },
  gpecdigital27: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 4, lodgingCity: '라이프치히', lodgingCountry: '독일', accessNote: '프랑크푸르트에서 ICE로 라이프치히까지 약 3시간 30분' },
  sofweek27: { route: 'usSouth', airport: 'TPA', airportName: '탬파', transferH: 0.5, lodgingCity: '탬파', lodgingCountry: '미국' },
  iacp27: { route: 'usEast', airport: 'PHL', airportName: '필라델피아(뉴욕 도착 후 이동 가능)', transferH: 1, lodgingCity: '필라델피아', lodgingCountry: '미국' },
  ise27: { route: 'europeWest', airport: 'LHR', airportName: '런던 히스로', transferH: 1, lodgingCity: '런던', lodgingCountry: '영국' },
  intersec28: { route: 'middleEast', airport: 'DXB', airportName: '두바이', transferH: 0.5, lodgingCity: '두바이', lodgingCountry: 'UAE' },
  shot28: { route: 'usWest', airport: 'LAS', airportName: '라스베이거스', transferH: 0.5, lodgingCity: '라스베이거스', lodgingCountry: '미국' },
  enforcetac28: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 3, lodgingCity: '뉘른베르크', lodgingCountry: '독일', accessNote: '프랑크푸르트 공항역에서 ICE로 뉘른베르크까지 약 2시간 30분' },
  iwa28: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 3, lodgingCity: '뉘른베르크', lodgingCountry: '독일', accessNote: '프랑크푸르트 공항역에서 ICE로 뉘른베르크까지 약 2시간 30분' },
  secpol28: { route: 'europeWest', airport: 'LHR', airportName: '런던 히스로', transferH: 1.5, lodgingCity: '판버러', lodgingCountry: '영국' },
  laadsec28: { route: 'latam', airport: 'GRU', airportName: '상파울루 과룰류스', transferH: 1.5, lodgingCity: '상파울루', lodgingCountry: '브라질' },
  mtx28: { route: 'seAsia', airport: 'SIN', airportName: '싱가포르 창이', transferH: 0.5, lodgingCity: '싱가포르', lodgingCountry: '싱가포르' },
  sofweek28: { route: 'usSouth', airport: 'TPA', airportName: '탬파', transferH: 0.5, lodgingCity: '탬파', lodgingCountry: '미국' },
  gpec28: { route: 'europeWest', airport: 'FRA', airportName: '프랑크푸르트(대한항공 직항)', transferH: 4, lodgingCity: '라이프치히', lodgingCountry: '독일', accessNote: '프랑크푸르트에서 ICE로 라이프치히까지 약 3시간 30분' },
  iacp28: { route: 'usSouth', airport: 'MCO', airportName: '올랜도', transferH: 1, lodgingCity: '올랜도', lodgingCountry: '미국' },
  sofex28: { route: 'middleEast', airport: 'AQJ', airportName: '아카바(암만 경유)', transferH: 1, lodgingCity: '아카바', lodgingCountry: '요르단', accessNote: '중동 허브 경유 후 암만→아카바 국내선 또는 육로(약 4시간)' },
  milipolqatar28: { route: 'middleEast', airport: 'DOH', airportName: '도하 하마드', transferH: 0.5, lodgingCity: '도하', lodgingCountry: '카타르' },
};
