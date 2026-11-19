# 방산 전시회 출장 플래너

해외 방산·총기·특수작전·군경 치안 전시회 일정·참가기업·예상 기술동향을 조회하고, 공무원 여비 규정에 따라 출장 일정과 예산을 산출해 HWPX 계획서를 내려받는 웹 앱입니다.

- 이메일 로그인은 Supabase Auth의 일회용 링크로 처리합니다.
- 로그인한 출장안은 Supabase 계정에 저장되어 여러 기기에서 동기화됩니다.
- 로그인 전 출장안은 해당 브라우저에 남습니다. 로그인 후 내 출장안에서 계정으로 복사할 수 있습니다.
- 여권번호, 생년월일, 주민등록번호, 연락처, 카드정보를 입력하지 않습니다.

## 로컬 실행

```bash
npm install
npm run dev
npm run build
```

Node 20 이상.

## Supabase와 Vercel 설정

1. Supabase SQL Editor에서 `supabase/migrations/0001_init.sql`을 실행합니다. 출장안 테이블은 RLS 정책으로 로그인 사용자 본인의 행만 접근합니다.
2. Supabase Authentication → URL Configuration의 Site URL을 배포 주소로 설정하고, Redirect URLs에 `https://defense-expo-planner.vercel.app/**`을 추가합니다. 로컬 개발에는 `http://localhost:5173/**`도 추가합니다.
3. Vercel 프로젝트의 환경변수에 다음 값을 설정하고 Production, Preview, Development 환경을 선택합니다.

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase publishable key>
```

4. Vercel에서 재배포합니다. Supabase의 publishable key만 사용하고 secret key는 프런트엔드에 넣지 마세요.

이메일은 Supabase 기본 발신 설정을 사용합니다. 전달 안정성이 필요하면 Supabase Auth에 SMTP 제공자를 설정하세요.
