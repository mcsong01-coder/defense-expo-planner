# 방산 전시회 출장 플래너

해외 방산·총기·특수작전·군경 치안 전시회(2026.11~2028.12, 58건) 일정·참가기업·예상 기술동향을 조회하고, 「공무원 여비 규정」(일반직 공무원·군인)에 따라 출장 일정과 여비 예산을 산출해 **HWPX 공무국외출장 계획서**를 내려받는 웹 앱입니다.

- 이메일 로그인은 Supabase Auth의 일회용 링크로 처리합니다.
- 로그인한 출장안은 Supabase 계정에 저장되어 여러 기기에서 동기화됩니다.
- 로그인 전 출장안은 해당 브라우저에 저장됩니다. 로그인 후 ‘내 출장안’에서 계정으로 복사할 수 있습니다.
- 민감정보(여권번호, 생년월일, 주민등록번호, 연락처, 카드정보)는 입력란 자체가 없습니다.

## 기능

| 단계 | 내용 |
| --- | --- |
| 전시회 레이더 | 전시회 필터·검색, 관심 기술 추천, 상세(참가기업·기술동향·확보 정보) |
| 1. 출장단 구성 | 신분(일반직/군인)과 직급·계급 선택, 여비 구분 자동 결정. 이름·소속은 선택 |
| 2. 항공편·일정 제안 | 노선 템플릿 기반 일정안 비교 |
| 3. 일정 직접 수정 | 편명·시각·날짜, 숙박 도시·등급, 일자별 활동 편집 및 모순 경고 |
| 4. 여비 예산 | 항공료·일비·식비·숙박비·예비비·기타 경비, 환율, 일수 조정 |
| 5. 확정·HWPX | 확정 시 버전 고정, HWPX 계획서 생성(브라우저에서 생성) |

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 여비·일정·HWPX 로직 테스트
npm run build      # dist/ (Vercel 배포용)
npm run build:single  # dist-single/index.html 한 파일
```

Node 20 이상.

## 폴더 구조

```
src/
  data/            전시회, 여비 기준표, 노선 템플릿
  lib/             일정·여비 계산 및 HWPX 생성
  repo/            localStorage 및 Supabase 저장소
  components/      레이더, 내 출장안, 단계별 플래너
supabase/migrations/0001_init.sql   Supabase 테이블·RLS
vercel.json                         Vercel 빌드 설정
.env.example                        환경변수 예시
```

## Supabase와 Vercel 설정

1. Supabase SQL Editor에서 `supabase/migrations/0001_init.sql`을 실행합니다. 출장안 테이블은 RLS 정책으로 로그인 사용자 본인의 행만 접근합니다.
2. Supabase Authentication → URL Configuration에서 Site URL을 배포 주소로, Redirect URLs에 `https://defense-expo-planner.vercel.app/**`을 추가합니다. 로컬 개발에는 `http://localhost:5173/**`을 추가합니다.
3. Vercel 프로젝트 환경변수에 아래 항목을 설정하고 Production 환경을 선택합니다.

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase publishable key>
```

4. Vercel에서 재배포합니다. Supabase publishable key만 사용하고 secret key는 프런트엔드 환경변수에 넣지 마세요.

Supabase Auth의 기본 이메일 발신 서비스를 사용합니다. 전달 안정성이 필요하면 SMTP 제공자를 설정하세요.

## 계산 기준과 한계

- 여비 단가: 공무원 여비 규정 별표 4(2021. 5. 25. 개정), 구분: 별표 1(2022. 5. 9. 개정). 규정이 바뀌면 `src/data/travelRules.ts`를 갱신하세요.
- 숙박비는 상한액으로 예산을 잡습니다(실제는 상한 내 실비 정산).
- 항공 시각·운임과 환율 기본값은 가정치입니다. 실제 일정과 견적으로 고쳐 쓰세요.
- 기관 배포 전 HWPX 문서를 한/글에서 열어 표·글꼴을 확인하세요.
