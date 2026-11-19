-- 방산 전시회 출장 플래너 초기 스키마 (Supabase / PostgreSQL)
-- 적용: Supabase 대시보드 SQL Editor에 붙여넣거나 `supabase db push`
-- 개인정보 원칙: 출장자는 직급·계급과 선택 입력(표시명·소속)만 저장한다. 여권번호 등 민감정보 컬럼은 만들지 않는다.

-- 1) 전시회 (관리자가 갱신, 누구나 읽기)
create table if not exists public.exhibitions (
  id          text primary key,              -- 예: 'dsei27'
  data        jsonb not null,                -- src/types.ts Exhibition 구조
  checked_at  date not null default current_date,
  updated_at  timestamptz not null default now()
);

-- 2) 여비 기준표 (규정 개정 시 새 버전 행 추가)
create table if not exists public.travel_rate_tables (
  version        text primary key,           -- 예: 'kr-gov-2021-05-25'
  label          text not null,
  effective_date date not null,
  data           jsonb not null,             -- RATES, RANKS, 도시·국가 등급
  source         text,
  created_at     timestamptz not null default now()
);

-- 3) 출장안 (로그인 사용자 본인 것만)
create table if not exists public.trip_plans (
  id             text primary key,           -- 앱에서 만든 id (trip-...)
  owner          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exhibition_id  text not null,
  status         text not null check (status in ('draft', 'confirmed')),
  version        int  not null default 1,
  data           jsonb not null,             -- src/types.ts TripPlan 구조
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists trip_plans_owner_idx on public.trip_plans (owner, updated_at desc);

-- RLS
alter table public.exhibitions enable row level security;
alter table public.travel_rate_tables enable row level security;
alter table public.trip_plans enable row level security;

create policy "exhibitions readable by anyone" on public.exhibitions for select using (true);
create policy "rate tables readable by anyone" on public.travel_rate_tables for select using (true);

create policy "own trips select" on public.trip_plans for select using (owner = auth.uid());
create policy "own trips insert" on public.trip_plans for insert with check (owner = auth.uid());
create policy "own trips update" on public.trip_plans for update using (owner = auth.uid()) with check (owner = auth.uid());
create policy "own trips delete" on public.trip_plans for delete using (owner = auth.uid());
