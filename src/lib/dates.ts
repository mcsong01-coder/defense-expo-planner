/** 날짜는 모두 'YYYY-MM-DD' 문자열로 다루고, 시간대 영향을 받지 않도록 UTC로만 계산한다. */
const DAY = 86_400_000;

export function toUTC(d: string): number {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd);
}
export function fromUTC(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}
export function addDays(d: string, n: number): string {
  return fromUTC(toUTC(d) + n * DAY);
}
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}
export function minutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}
export function rangeDates(a: string, b: string): string[] {
  const out: string[] = [];
  for (let d = a; toUTC(d) <= toUTC(b); d = addDays(d, 1)) out.push(d);
  return out;
}
const WD = ['일', '월', '화', '수', '목', '금', '토'];
export function weekday(d: string): string {
  return WD[new Date(toUTC(d)).getUTCDay()];
}
export function fmtKDate(d: string): string {
  const [, m, dd] = d.split('-');
  return `${Number(m)}. ${Number(dd)}.(${weekday(d)})`;
}
export function fmtDot(d: string): string {
  return d.replace(/-/g, '. ') + '.';
}
export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
/** ISO 시각을 사용자 현지 시각 'YYYY-MM-DD HH:MM'으로 */
export function fmtLocalStamp(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
