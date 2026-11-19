import JSZip from 'jszip';
import { HWPX_PARTS } from './templateParts';
import type { Exhibition, TripPlan } from '../../types';
import { computeBudget, krw, usd } from '../budget';
import { fmtDot, fmtKDate, rangeDates } from '../dates';
import { TAGS, STATUS_LABEL, firmNames } from '../../data/exhibitions';
import { RULE_VERSION } from '../../data/travelRules';
import { accessFor } from '../itinerary';

// 스타일 ID (templateParts.ts 주석 참고)
const CH = { title: 7, h1: 8, body: 9, small: 10, th: 11, td: 12 } as const;
const PA = { center: 20, heading: 21, body: 22, plain: 0 } as const;
const BF = { head: 3, cell: 4 } as const;
const TEXT_WIDTH = 42520; // A4, 좌우 여백 30mm 기준 본문 폭(HWPUNIT)

let pid = 1000;
const nextId = () => String(pid++);

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function para(text: string, ch: number = CH.body, pa: number = PA.body): string {
  return `<hp:p id="${nextId()}" paraPrIDRef="${pa}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${ch}">${text ? `<hp:t>${esc(text)}</hp:t>` : '<hp:t/>'}</hp:run></hp:p>`;
}

function cellParas(text: string, ch: number): string {
  return text
    .split('\n')
    .map((line) => `<hp:p paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0" id="${nextId()}"><hp:run charPrIDRef="${ch}">${line ? `<hp:t>${esc(line)}</hp:t>` : '<hp:t/>'}</hp:run></hp:p>`)
    .join('');
}

/** rows[0]은 머리행. widths는 비율(합계 무관). */
function table(rows: string[][], widths: number[], opts: { headerCol?: boolean } = {}): string {
  const total = widths.reduce((a, b) => a + b, 0);
  const w = widths.map((x) => Math.floor((x / total) * TEXT_WIDTH));
  w[w.length - 1] += TEXT_WIDTH - w.reduce((a, b) => a + b, 0);
  const rowH = 282;
  const trs = rows
    .map((r, ri) => {
      const tcs = r
        .map((c, ci) => {
          const isHead = ri === 0 || (opts.headerCol && ci === 0);
          const bf = isHead ? BF.head : BF.cell;
          const ch = isHead ? CH.th : CH.td;
          return `<hp:tc name="" header="${ri === 0 ? 1 : 0}" hasMargin="0" protect="0" editable="0" dirty="1" borderFillIDRef="${bf}"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${cellParas(c, ch)}</hp:subList><hp:cellAddr colAddr="${ci}" rowAddr="${ri}"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="${w[ci]}" height="${rowH}"/><hp:cellMargin left="510" right="510" top="141" bottom="141"/></hp:tc>`;
        })
        .join('');
      return `<hp:tr>${tcs}</hp:tr>`;
    })
    .join('');
  const tbl = `<hp:tbl id="${nextId()}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${rows.length}" colCnt="${widths.length}" cellSpacing="0" borderFillIDRef="${BF.cell}" noAdjust="0"><hp:sz width="${TEXT_WIDTH}" widthRelTo="ABSOLUTE" height="${rowH * rows.length}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="510" right="510" top="141" bottom="141"/>${trs}</hp:tbl>`;
  return `<hp:p id="${nextId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0">${tbl}</hp:run></hp:p>`;
}

const heading = (t: string) => para(t, CH.h1, PA.heading);
const bullet = (t: string) => para(`  ○ ${t}`);
const gap = () => para('', CH.body, PA.plain);

export function buildSectionXml(plan: TripPlan, ex: Exhibition, generatedAt: string): string {
  pid = 1000;
  const b = computeBudget(plan, ex);
  const acc = accessFor(ex);
  const names = plan.travelers.map((t, i) => `${t.name.trim() || `출장자 ${i + 1}`} (${t.org.trim() ? t.org.trim() + ' · ' : ''}${t.service} ${t.rank})`);
  const out: string[] = [];

  out.push(para('공무국외출장 계획서', CH.title, PA.center));
  out.push(para(`${plan.title} · 버전 ${plan.version} · 작성 ${generatedAt}`, CH.small, PA.center));
  out.push(gap());

  out.push(heading('1. 출장 개요'));
  out.push(
    table(
      [
        ['구분', '내용'],
        ['출장명', plan.title],
        ['출장 기간', `${fmtDot(plan.outbound.date)} ~ ${fmtDot(plan.inbound.arrDate)} (${b.days.travelDays}일, 현지 숙박 ${b.days.nights}박)`],
        ['출장지', `${ex.country} ${acc.lodgingCity} (${ex.venue})`],
        ['출장 인원', `${plan.travelers.length}명`],
        ['출장자', names.join('\n') || '(입력 필요)'],
        ['출장 근거', '(사업명·예산 과목 기재)'],
      ],
      [1, 4],
      { headerCol: true },
    ),
  );
  out.push(gap());

  out.push(heading('2. 출장 목적 및 필요성'));
  out.push(bullet(`${ex.name}(${ex.ko}) 참관을 통한 최신 국방·방산·치안 기술동향 파악`));
  out.push(bullet(`주요 확인 분야: ${ex.trends.map((t) => TAGS[t.t] ?? t.t).join(', ')}`));
  if (plan.purposeNote.trim()) plan.purposeNote.trim().split('\n').forEach((l) => out.push(bullet(l)));
  out.push(gap());

  out.push(heading('3. 전시회 개요'));
  out.push(
    table(
      [
        ['항목', '내용'],
        ['전시회', `${ex.name} (${ex.ko})`],
        ['일정', `${fmtDot(ex.start)} ~ ${fmtDot(ex.end)} (${STATUS_LABEL[ex.status] ?? ex.status}${ex.approx ? ', ' + ex.approx : ''})`],
        ['장소', `${ex.venue}, ${ex.city}(${ex.country})`],
        ['규모·주기', `${ex.scale} / ${ex.cycle}`],
        ['주요 참가기업(과거 회차 기준)', firmNames(ex).join(', ')],
        ['한국 기업', ex.kr.join(', ')],
        ['공식 사이트', ex.url],
      ],
      [1.3, 4],
      { headerCol: true },
    ),
  );
  if (ex.firmDetails?.length) {
    out.push(para('주요 기업별 과거 전시 내용과 확인 포인트', CH.small));
    const fr: string[][] = [['기업', '과거 회차 전시', '이번 회차 확인 포인트']];
    ex.firmDetails.forEach((f) => fr.push([f.name + (f.kr ? ' (한국)' : ''), f.past, f.expect ?? '']));
    out.push(table(fr, [1.2, 2.6, 2.2]));
  }
  out.push(gap());

  out.push(heading('4. 세부 일정'));
  const rows: string[][] = [['일자', '시간', '구분', '내용', '장소']];
  for (const d of rangeDates(plan.outbound.date, plan.inbound.arrDate)) {
    const its = plan.items.filter((i) => i.date === d);
    if (!its.length) rows.push([fmtKDate(d), '', '', '', '']);
    its.forEach((i, k) => rows.push([k === 0 ? fmtKDate(d) : '', i.time, i.kind, i.text, i.place]));
  }
  out.push(table(rows, [1.2, 0.8, 0.7, 4, 1.6]));
  out.push(para(`항공(${plan.outbound.carrier ?? '항공사 미정'}, 일반석): 출국 ${plan.outbound.flightNo || '(편명 미정)'} ${plan.outbound.from}→${plan.outbound.to} ${fmtDot(plan.outbound.date)} ${plan.outbound.dep} / 귀국 ${plan.inbound.flightNo || '(편명 미정)'} ${plan.inbound.from}→${plan.inbound.to} ${fmtDot(plan.inbound.date)} ${plan.inbound.dep}`, CH.small));
  out.push(gap());

  out.push(heading('5. 주요 확인사항'));
  ex.trends.forEach((t) => out.push(bullet(`[${TAGS[t.t] ?? t.t}] ${t.d}`)));
  out.push(para('  ※ 참관 시 확보할 정보', CH.body));
  ex.intel.forEach((t) => out.push(bullet(t)));
  out.push(gap());

  out.push(heading('6. 소요 예산'));
  const brow: string[][] = [['출장자', '직급·계급(구분)', '항공료', '일비', '식비', '숙박비(상한)', '소계']];
  b.rows.forEach((r) =>
    brow.push([
      r.label,
      `${r.rank}\n(${r.clsLabel})`,
      krw(r.fareKRW),
      usd(r.dailyUSD),
      usd(r.mealUSD),
      usd(r.lodgingUSD) + (r.reserveUSD ? `\n예비 ${usd(r.reserveUSD)}` : ''),
      krw(r.totalKRW),
    ]),
  );
  brow.push(['합계', '', krw(b.totalFareKRW), '', '', `체재비 ${usd(b.totalUSD)}`, krw(b.totalKRW - b.othersKRW)]);
  out.push(table(brow, [1.2, 1.6, 1.2, 0.8, 0.8, 1.2, 1.3]));
  if (plan.budget.others.length) {
    out.push(table([['기타 경비', '금액'], ...plan.budget.others.map((o) => [o.label, krw(o.amountKRW)])], [3, 1]));
  }
  out.push(para(`총 소요예산: ${krw(b.totalKRW)} (적용 환율 ${b.fxRate.toLocaleString('ko-KR')}원/$, ${plan.budget.fxNote})`, CH.h1, PA.body));
  out.push(para('  ※ 산출 근거', CH.body));
  out.push(bullet(`여비 등급: ${b.grade}등급(${acc.lodgingCity}) · 여행일수 ${b.days.travelDays}일, 식비 일수 ${b.days.mealDays}일, 숙박 ${b.days.nights}박`));
  b.rows.forEach((r) => out.push(bullet(`${r.label}: ${r.basis}, 항공 ${r.seat} ${krw(r.fareKRW)}`)));
  out.push(bullet(`적용 기준: ${RULE_VERSION.label}`));
  if (b.inflight.deduct && b.inflight.total) out.push(bullet(`기내식 제공(가는 편 ${b.inflight.out}식, 오는 편 ${b.inflight.in}식)분은 1식당 1일 식비의 1/3을 감액했습니다.`));
  out.push(bullet('숙박비는 상한액 범위에서 실비 정산하며, 위 금액은 예산 추정치입니다. 항공료는 견적 확정 시 수정합니다.'));

  return HWPX_PARTS.sectionOpen + HWPX_PARTS.sectionFirstPara + out.join('') + '</hs:sec>';
}

export async function generateHwpx(plan: TripPlan, ex: Exhibition, generatedAt: string): Promise<JSZip> {
  const zip = new JSZip();
  const created = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  zip.file('mimetype', HWPX_PARTS.mimetype, { compression: 'STORE' });
  zip.file('version.xml', HWPX_PARTS.version);
  zip.file('Contents/header.xml', HWPX_PARTS.header);
  zip.file('Contents/section0.xml', buildSectionXml(plan, ex, generatedAt));
  zip.file('Preview/PrvText.txt', `공무국외출장 계획서 - ${plan.title}`);
  zip.file('settings.xml', HWPX_PARTS.settings);
  zip.file('META-INF/container.rdf', HWPX_PARTS.containerRdf);
  zip.file('Contents/content.hpf', HWPX_PARTS.contentHpf.replace(/\{\{CREATED\}\}/g, created).replace('{{TITLE}}', esc(plan.title)));
  zip.file('META-INF/container.xml', HWPX_PARTS.containerXml);
  zip.file('META-INF/manifest.xml', HWPX_PARTS.manifest);
  return zip;
}

export function hwpxFileName(plan: TripPlan, ex: Exhibition): string {
  const safe = ex.name.replace(/[^\p{L}\p{N}]+/gu, '');
  return `공무국외출장계획서_${safe}_${plan.outbound.date.replace(/-/g, '')}_v${plan.version}.hwpx`;
}

interface ClaudeDownloads { save(r: { filename: string; data: Blob }): Promise<{ status: string }> }
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

/** Claude 아티팩트 미리보기 안에서만 존재하는 저장 기능. 일반 배포 사이트에서는 null. */
export async function previewDownloads(): Promise<ClaudeDownloads | null> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (!host?.use) return null;
  try {
    return ((await host.use('downloads')) as ClaudeDownloads | null) ?? null;
  } catch {
    return null;
  }
}

/** 반환값: 'hwpx'(직접 내려받기) | 'zip'(미리보기: .hwpx를 zip에 담아 저장) */
export async function downloadHwpx(plan: TripPlan, ex: Exhibition, generatedAt: string): Promise<'hwpx' | 'zip'> {
  const zip = await generateHwpx(plan, ex, generatedAt);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/hwp+zip', compression: 'DEFLATE' });
  const preview = await previewDownloads();
  if (preview) {
    // 미리보기 저장 기능은 .hwpx 확장자를 받지 않아 zip으로 감싼다.
    const outer = new JSZip();
    outer.file(hwpxFileName(plan, ex), blob);
    const zblob = await outer.generateAsync({ type: 'blob', compression: 'STORE' });
    await preview.save({ filename: hwpxFileName(plan, ex).replace(/\.hwpx$/, '.zip'), data: zblob });
    return 'zip';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = hwpxFileName(plan, ex);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'hwpx';
}
