# 방산 전시회 출장 플래너

해외 방산·총기·특수작전·군경 치안 전시회(2026.11~2028.12, 58건) 일정·참가기업·예상 기술동향을 조회하고, 「공무원 여비 규정」(일반직 공무원·군인)에 따라 출장 일정과 여비 예산을 산출해 **HWPX 공무국외출장 계획서**를 내려받는 웹 앱입니다.

- 지금은 **외부 서비스 연결 없이** 브라우저만으로 동작합니다(출장안은 브라우저 localStorage에 저장).
- GitHub · Vercel · Supabase는 아래 절차대로 나중에 붙이면 됩니다. 코드 변경 없이 환경변수만 바꾸면 저장 위치가 Supabase로 넘어가도록 저장소 계층을 나눠 두었습니다.

## 기능

| 단계 | 내용 |
| --- | --- |
| 전시회 레이더 | 35개 전시회 필터·검색, 관심 기술 추천, 상세(참가기업·기술동향·확보 정보) |
| 1. 출장단 구성 | 신분(일반직/군인)과 직급·계급만 선택 → 여비 구분(별표 1) 자동 결정. 이름·소속은 선택 |
| 2. 항공편·일정 제안 | 노선 템플릿으로 출국·귀국편 역산, 참관 일수·첫 참관일에 따라 일정안 비교 |
| 3. 일정 직접 수정 | 편명·시각·날짜, 숙박 도시·등급, 일자별 활동 편집. 모순 경고 |
| 4. 여비 예산 | 항공료·일비·식비·숙박비(상한)·예비비·기타 경비, 환율, 일수 수동 조정 |
| 5. 확정·HWPX | 확정 시 버전 고정, HWPX 계획서 생성(브라우저에서 생성, 서버 불필요) |

민감정보(여권번호, 생년월일, 주민등록번호, 연락처, 카드정보)는 입력란 자체가 없습니다.

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 여비·일정·HWPX 로직 테스트
npm run build      # dist/ (Vercel 배포용)
npm run build:single  # dist-single/index.html 한 파일(공유·미리보기용)
```

Node 20 이상.

## 폴더 구조

```
src/
  data/            전시회(exhibitions.json), 여비 기준표(travelRules.ts), 노선 템플릿(routes.ts)
  lib/             itinerary.ts(일정 산출·검증), budget.ts(여비 계산), plan.ts, dates.ts
  lib/hwpx/        HWPX 생성(JSZip). templateParts.ts는 python-hwpx로 만든 기본 양식
  repo/            저장소 인터페이스 + localStorage 구현 + Supabase 구현(대기)
  components/      화면(레이더, 내 출장안, 단계별 플래너)
supabase/migrations/0001_init.sql   Supabase 테이블·RLS
vercel.json                         Vercel 빌드 설정
.github/workflows/ci.yml            GitHub Actions(lint·test·build)
.env.example                        환경변수 예시
```

## 나중에 연결하기

### 1) GitHub

```bash
git init && git add . && git commit -m "init: 방산 전시회 출장 플래너"
git branch -M main
git remote add origin https://github.com/<계정>/defense-expo-planner.git
git push -u origin main
```

푸시하면 `.github/workflows/ci.yml`이 lint·테스트·빌드를 돌립니다.

### 2) Vercel

1. Vercel에서 **Add New → Project → GitHub 저장소 선택**
2. Framework는 Vite로 자동 인식, 설정은 `vercel.json`을 따릅니다(빌드 `npm run build`, 출력 `dist`).
3. 환경변수는 Supabase 연결 전까지 넣지 않아도 됩니다.

### 3) Supabase

1. 프로젝트 생성 후 **SQL Editor**에 `supabase/migrations/0001_init.sql`을 실행합니다.
2. Vercel(또는 `.env.local`)에 환경변수를 넣습니다.
   ```
   VITE_DATA_BACKEND=supabase
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
3. `trip_plans`는 RLS로 **로그인한 본인 것만** 읽고 씁니다. 로그인 화면(Supabase Auth 이메일 매직링크)을 붙이기 전에는 세션이 없어 자동으로 브라우저 저장소로 돌아갑니다(`src/repo/index.ts`).
4. 전시회·여비 기준표를 DB에서 관리하려면 `exhibitions`, `travel_rate_tables`에 `src/data`의 내용을 넣고, `src/data/exhibitions.ts`의 정적 import를 조회 함수로 바꾸면 됩니다.

## 계산 기준과 한계

- 여비 단가: 공무원 여비 규정 **별표 4(2021. 5. 25. 개정)**, 구분: **별표 1(2022. 5. 9. 개정)**. 규정이 바뀌면 `src/data/travelRules.ts`만 교체합니다. 배포 전 국가법령정보센터 원문과 다시 대조하세요(특히 군인 소령 이하=제2호).
- 숙박비는 상한액으로 예산을 잡습니다(실제는 상한 내 실비 정산).
- 항공 시각·운임은 지역별 **예시 패턴과 가정치**입니다. 실제 편명·시각·견적으로 고쳐 쓰세요. 2단계에서 항공 데이터 어댑터(스케줄·운임 API)로 교체할 자리입니다.
- 환율 기본값 1,400원/$는 가정치입니다.
- HWPX는 python-hwpx 검증을 통과했지만, 기관 배포 전 한/글에서 한 번 열어 표·글꼴을 확인하세요.
