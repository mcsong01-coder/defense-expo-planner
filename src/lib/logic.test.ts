import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { findExhibition } from '../data/exhibitions';
import { classOf, gradeFor } from '../data/travelRules';
import { computeBudget } from './budget';
import { autoDays, propose, validate } from './itinerary';
import { createPlan } from './plan';
import { generateHwpx } from './hwpx/generate';

const dsei = findExhibition('dsei27')!;

describe('여비 구분과 등급', () => {
  it('직급·계급 매핑', () => {
    expect(classOf('일반직', '6급')).toBe('2');
    expect(classOf('일반직', '고위공무원단 나등급')).toBe('1라');
    expect(classOf('군인', '소령')).toBe('2');
    expect(classOf('군인', '대령')).toBe('1라');
    expect(classOf('군인', '준장')).toBe('1다');
  });
  it('도시 우선, 국가 다음', () => {
    expect(gradeFor('런던', '영국')).toBe('가');
    expect(gradeFor('판버러', '영국')).toBe('나');
    expect(gradeFor('키엘체', '폴란드')).toBe('다');
  });
});

describe('기획서 4.4 계산 예시 재현 (DSEI 2027, 제2호 2명, 7일·5박)', () => {
  it('체재비 $3,314, 총 864만 원 (기내식 감액 미적용 기준)', () => {
    const plan = createPlan(dsei);
    plan.travelers = [
      { id: 'a', name: '', org: '', service: '일반직', rank: '6급' },
      { id: 'b', name: '', org: '', service: '군인', rank: '소령' },
    ];
    plan.outbound = { ...plan.outbound, date: '2027-09-06', arrDate: '2027-09-06' };
    plan.inbound = { ...plan.inbound, date: '2027-09-11', arrDate: '2027-09-12' };
    plan.budget = { ...plan.budget, deductInflightMeals: false };
    expect(autoDays(plan)).toEqual({ travelDays: 7, mealDays: 7, nights: 5 });
    const b = computeBudget(plan, dsei);
    expect(b.grade).toBe('가');
    expect(b.totalUSD).toBe(3314);
    expect(Math.round(b.totalKRW)).toBe(3314 * 1400 + b.totalFareKRW);
  });
  it('기내식 감액 기본 적용 시 체재비가 줄어든다', () => {
    const plan = createPlan(dsei);
    plan.travelers = [
      { id: 'a', name: '', org: '', service: '일반직', rank: '6급' },
      { id: 'b', name: '', org: '', service: '군인', rank: '소령' },
    ];
    plan.outbound = { ...plan.outbound, date: '2027-09-06', arrDate: '2027-09-06' };
    plan.inbound = { ...plan.inbound, date: '2027-09-11', arrDate: '2027-09-12' };
    const b = computeBudget(plan, dsei);
    expect(b.inflight.deduct).toBe(true);
    expect(b.totalUSD).toBeLessThan(3314);
  });
  it('동행 특례: 숙박·식비만 상급자 기준', () => {
    const plan = createPlan(dsei);
    plan.travelers = [
      { id: 'a', name: '', org: '', service: '군인', rank: '대령' },
      { id: 'b', name: '', org: '', service: '군인', rank: '소령' },
    ];
    plan.budget.escortRule = true;
    const b = computeBudget(plan, dsei);
    expect(b.rows[1].stayCls).toBe('1라');
    expect(b.rows[1].cls).toBe('2');
  });
});

describe('일정 제안', () => {
  it('첫 참관일 전날 도착, 마지막 참관일 다음 날 귀국', () => {
    const p = propose(dsei, 2);
    expect(p.visitDates).toEqual(['2027-09-07', '2027-09-08']);
    expect(p.outbound.arrDate).toBe('2027-09-06');
    // 폐장 17:00 + 이동 1.5h + 여유 3h = 21:30 > 20:30 출발편 → 다음 날 귀국
    expect(p.inbound.date).toBe('2027-09-09');
    const plan = createPlan(dsei);
    expect(validate(plan, dsei)).toEqual([]);
  });
  it('파리 에어쇼는 무역일(14~17일)만 제안', () => {
    const p = propose(findExhibition('pas27')!, 10);
    expect(p.visitDates[p.visitDates.length - 1]).toBe('2027-06-17');
  });
});

describe('HWPX 생성', () => {
  it('패키지 파일 구성', async () => {
    const plan = createPlan(dsei);
    plan.travelers.push({ id: 'x', name: '홍길동', org: '국방기술품질원', service: '군인', rank: '소령' });
    const zip = await generateHwpx(plan, dsei, '2026-11-19');
    const names = Object.keys(zip.files);
    expect(names[0]).toBe('mimetype');
    expect(names).toContain('Contents/section0.xml');
    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    mkdirSync('test-output', { recursive: true });
    writeFileSync('test-output/sample.hwpx', buf);
  });
});

import { keywordHits, parseKeywords } from './interests';
import { EXHIBITIONS } from '../data/exhibitions';
describe('관심 분야 직접 입력', () => {
  it('쉼표로 나누고 띄어쓰기·가운뎃점을 무시해 찾는다', () => {
    expect(parseKeywords('잠수함, 대 드론 ,')).toEqual(['잠수함', '대 드론']);
    const hits = EXHIBITIONS.filter((e) => keywordHits(e, ['잠수함']).length);
    expect(hits.length).toBeGreaterThan(0);
    expect(keywordHits(findExhibition('idex27')!, ['대 드론'])).toEqual(['대 드론']);
  });
});

describe('전시회 범위 확대', () => {
  it('총기·특수작전·치안 분야 포함, 모든 전시회에 이동 정보 존재', async () => {
    const { EXHIBITIONS, DOMAINS } = await import('../data/exhibitions');
    const { VENUE_ACCESS } = await import('../data/routes');
    for (const d of ['총기·사격', '특수작전', '보안·경찰']) {
      expect(DOMAINS).toContain(d);
      expect(EXHIBITIONS.filter((e) => e.domains.includes(d)).length).toBeGreaterThan(3);
    }
    const missing = EXHIBITIONS.filter((e) => !VENUE_ACCESS[e.id]).map((e) => e.id);
    expect(missing).toEqual([]);
    const shot = EXHIBITIONS.find((e) => e.id === 'shot27')!;
    expect(shot.start).toBe('2027-01-19');
  });
});
