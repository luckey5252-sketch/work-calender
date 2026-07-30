# 컨텍스트 노트 — 결정과 근거

작업 중 내린 결정을 계속 추가한다.

## 기술 결정

- **프레임워크: 바닐라 JS, 빌드 없음** — 사용자 선택(2026-06-25). MVP가 단일 사용자·localStorage 범위라 충분. 의존성·빌드 도구 없이 브라우저에서 바로 실행.
- **date-fns를 임포트맵으로 로드** — CLAUDE.md "직접 Date 연산 금지"를 지키면서 빌드도 안 쓰기 위해, `index.html`에 `importmap`으로 `date-fns` → esm.sh CDN 매핑. 같은 `import { } from 'date-fns'` 구문이 node에서는 `node_modules`로 해석되므로, 날짜 경계 테스트를 node로 돌릴 수 있다. (계산 로직과 런타임이 같은 코드 → 테스트가 실제 코드를 검증)
- **모듈 4분할** — storage / calendar(순수) / render / main. CLAUDE.md "상태·UI 로직과 렌더링 분리", "날짜 계산은 순수 함수로 빼고 테스트".

## 데이터 모델

- CLAUDE.md "일정 데이터 모델" 그대로. 참석자 색은 `isHead` 플래그로만 판단(이름 매칭 금지).
- **priority 필드 추가** — MVP에 "마감·우선순위 표시"가 있으나 모델에 priority가 없어서 `priority: 'high' | 'normal'` 추가. 색 외에 라벨/굵기로도 표시.

## 디자인 결정

- **테마: 데스크 플래너** — 책상 위 다이어리 질감. 크림+세리프+테라코타 클리셰 회피.
- **팔레트 (명명된 hex, 의미 인코딩)**
  - `--paper #F5F4EF` 책상면, `--ink #23231F` 본문, `--ink-soft #6B6B63` 보조, `--line #E2E0D9` 격자선
  - 카테고리(절제, 항상 라벨 병행): 회의 `#3A6EA5`, 마감 `#C2410C`(경고색), 외근 `#2F7D5B`, 개인 `#6D5BA6`
  - `--accent #2B5FB3` 구조색 — 오늘/본부장 신호
- **시그니처 = 오늘 날짜** — 오늘 칸 숫자를 ink 채움 블록에 종이색으로 반전. 대담함은 여기 한 곳만.
- **변경 표시** — 색이 아니라 카드 왼쪽 굵은 ink 바 + 작은 "신규"/"수정" 태그. `createdAt==updatedAt`로 신규/수정 구분. 렌더 시점에 updatedAt에서 파생, 1분 타이머로 갱신.
- **타이포** — 날짜 숫자(라틴)는 Space Grotesk로 주인공. 한글 본문은 Pretendard.

## CLAUDE.md ↔ 기존 DESIGN.md 충돌 재조정 (2026-06-25)

- 사용자 선택: **CLAUDE.md 전체 반영 + 기존 DESIGN.md 시각 언어 재사용.**
- 기존 DESIGN.md는 과거 사용자 요청으로 카테고리·우선순위를 빼고, 변경 표시도 "신규만"이었다. CLAUDE.md MVP는 카테고리·우선순위·"신규+수정"을 요구한다. CLAUDE.md를 정답으로 삼아 되살렸다.
- **재조정 방식** — DESIGN.md의 규율(잉크블루 시그니처, 본부장=head-blue, 오늘=잉크블록, 굵은 제목은 본부장 전용)을 깨지 않게.
  - 카테고리 색은 **절제된 채도**로 추가(외근 `#3f6b52`, 개인 `#6f6285`). 회의=기본 중립(ink-soft), 마감=경고색(warn). 항상 2글자 라벨 병행 → 색 단독 의존 안 함.
  - 본부장(head-blue)이 카테고리 색을 덮어쓴다 → "강조는 본부장 우선" 유지.
  - 우선순위는 색을 새로 안 쓰고 **채운 잉크 태그**("우선")로 — 아웃라인 태그(카테고리·본부장)와 모양으로 구분.
  - 변경 표시는 신규/수정 둘 다 accent 인셋 바 + 배지("신규"/"수정"), `createdAt==updatedAt`로 구분.
- 구현 결과 기존 `js/`는 제거하고 `src/`(storage/calendar/render/main)로 재작성. 렌더와 상태를 분리(render는 DOM만, main은 이벤트 위임).

## date-fns 동봉 (esm.sh 런타임 의존 제거, 2026-06-25)

- 증상: 사용자 브라우저에서 localhost:8000 빈 화면.
- 원인 후보: (1) esm.sh CDN이 사용자 네트워크/프록시에서 차단, (2) 옛 index.html(삭제된 js/app.js 참조) 브라우저 캐시.
- 조치: date-fns@3.6.0 자체완결 번들을 `vendor/date-fns.js`(71KB)로 동봉하고, 임포트맵을 `./vendor/date-fns.js`로 변경. 이제 네트워크 없이 동작 → (1) 제거. 캐시는 강력 새로고침으로 해결.
- 검증: headless Edge `--dump-dom`으로 실제 렌더 확인 — `.month-grid` 생성, 상단 "2026년 6월" 표시, 날짜 셀 정상. main.js가 브라우저에서 정상 실행됨을 확인.
- 테스트(node)는 여전히 `node_modules`의 date-fns로 돌아 같은 specifier 양쪽 해석을 유지. `vendor/date-fns.js`는 서드파티 번들이라 헤더 주석을 달지 않는다.

## 2단계 승격 — 백엔드 로그인 + 기능변경 (2026-07-09)

사용자 요청 5종. 로그인은 CLAUDE.md "나중에" 목록이지만 사용자가 명시적으로 2단계 승격을 선택 → 진행.

### 결정 (사용자 확인)
- **스택 = Python FastAPI + SQLite.** 사용자 Python 익숙(dev-server.py), CLAUDE.md SQLite 권장, 옆 프로젝트도 FastAPI.
- **읽기 공개 / 편집 로그인.** GET은 인증 불필요, POST/PATCH/DELETE만 세션 필요. 요청 "권한 있는 사람만 생성·수정"에 부합.

### 백엔드 설계
- **비밀번호 해시 = stdlib `hashlib.pbkdf2_hmac`** (외부 의존 회피). bcrypt/passlib는 컴파일 휠 필요라 안 씀. 형식 `pbkdf2_sha256$iter$salt$hash`.
- **세션 = Starlette SessionMiddleware** (서명 쿠키, itsdangerous). 유일한 신규 pip 의존.
- **환경변수로 비밀 주입**(CLAUDE.md "URL·키 하드코딩 금지"): `CAL_SECRET`(세션서명), `CAL_ADMIN_USER`/`CAL_ADMIN_PASS`(시드 관리자), `CAL_DB`(SQLite 경로). 미설정 시 dev 기본값 + stderr 경고.
- **스키마**: events(id, title, start, end, all_day, location, department, category, priority, attendees=JSON, created_at, updated_at), users(username, pw_hash). 참석자는 JSON 컬럼(CLAUDE.md "처음엔 JSON").
- **id·created_at·updated_at은 서버가 채움**(클라 시계 불신). 시간 UTC 저장.
- **FastAPI가 프론트 정적파일도 mount** → 동일출처라 CORS 없음. API_BASE=''.

### 프론트 storage → API 전환
- 기존 storage는 **동기**(render가 list()를 동기 호출). fetch는 비동기 → 충돌.
- 해결: **인메모리 캐시 + `sync()`**. `list()/get()`은 캐시에서 동기 반환(render 무변경). `sync()`(async)가 서버에서 로드해 캐시 갱신. create/update/remove는 async(await fetch 후 sync). main은 로드/변이 후 `await storage.sync()` → render.
- CLAUDE.md "storage 시그니처 유지"는 방향성. 변이 메서드의 async화는 백엔드 전환상 불가피 — 시그니처(이름/인자)는 유지.

### 공휴일
- **하드코딩 표**(src/holidays.js). 음력(설날·추석·부처님오신날)은 계산 불가라 연도별 명시. 2025–2027 + 대체공휴일. 오프라인 원칙(vendor 동봉과 동일 기조)상 API 안 씀. 표시 전용·클라이언트.

### 분류 변경
- 회의/마감/외근/개인 → **회의/출장/기타**. 마감 카테고리 제거(마감성은 priority "우선" 태그로 유지). 색 매핑: 회의=중립, 출장=cat-field(초록 재사용), 기타=cat-personal(보라 재사용) — 신규 CSS·데드 CSS 최소화.

### 칩 색 기준 변경: 분류색 → 참석자(본부장) (2026-07-09)
- 사용자 요청: 본부장 참석 일정 = 강한 파랑, 그 외 = 회색계열.
- 이전엔 분류(출장=초록, 기타=보라)가 칩 색을 정했으나, 이제 **색은 '본부장 참석' 여부만 인코딩**.
  - `.chip.is-head` = 강한 파랑(head-blue 18% 틴트 + 파란 굵은 제목 + 4px 강조선).
  - 그 외 = 기본 회색(ink-soft).
- 분류는 색을 빼고 **라벨(.chip-cat) 텍스트로만** 구분(색각 접근성 유지). `.chip.cat-*` 색 규칙 제거.
  render 는 여전히 cat-* 클래스를 붙이지만(스모크 테스트 호환) 색은 없음. `--cat-field/--cat-personal` 변수는 미사용.
- 주보기 2줄: 칩을 `flex-wrap`으로 두고 `.chip-title { flex: 1 0 100% }` → 시간·태그는 첫 줄, 제목은 아래 줄에서 최대 2줄. headless 실측 titleLines=2 확인.

### 사용자 계정 관리 (여러 명 등록, 2026-07-09)
- 사용자 선택: 관리자가 사용자를 추가·삭제하는 기능.
- **역할 = is_admin 플래그**(users 테이블). 시드 관리자만 is_admin=1. 일반 사용자는 일정 편집 가능, 사용자 관리는 불가.
- **잠금 방지**: 자기 자신 삭제 400, 마지막 관리자 삭제 400. 중복 아이디 409.
- `require_admin` 의존성으로 서버가 권한 강제. `/auth/me`·`/auth/login` 응답에 isAdmin 포함 → 프론트는 관리자에게만 "사용자 관리" 버튼 노출(방어는 서버가).
- 기존 DB 호환: init_db 에서 is_admin 컬럼 없으면 ALTER TABLE ADD.
- 미구현(요청 없음): 사용자 본인 비밀번호 변경. 필요 시 추가.

## 웹 배포 준비 (2026-07-11)

- **HTTPS 세션 쿠키**: `CAL_HTTPS=1` 이면 SessionMiddleware `https_only=True`(Secure 쿠키). 로컬 http 개발은 기본 꺼짐(안 그러면 http에서 세션 안 붙음). config.SESSION_HTTPS_ONLY.
- **render.yaml 블루프린트**: 0.0.0.0 바인딩·no reload·CAL_SECRET generateValue·관리자/DATABASE_URL sync:false(대시보드 입력).
- 프론트 파일은 FastAPI가 서빙하므로 별도 정적 호스트 불필요(동일 출처 유지).

## Supabase 전환 — B안 (2026-07-11)

- **사용자 요청**: Supabase로 무료 백엔드. A(풀 Supabase, 프론트→직접, RLS, 이메일 로그인, Edge Function 계정관리) vs B(Supabase는 DB만, FastAPI 유지) 제시 → **사용자 B 선택.**
- **B 근거**: 아이디 로그인·관리자 계정관리·기존 테스트를 전부 살림. 변경 폭 최소. DB가 원격이 되어 FastAPI가 무상태화 → Render **무료** 플랜으로 충분(지난 유료 이유였던 영구 디스크 불필요).
- **이중 백엔드**: config.DATABASE_URL 있으면 Postgres, 없으면 SQLite. 로컬 개발·테스트는 SQLite로 오프라인 유지, 운영만 Supabase.
- **쿼리 한 벌 유지**: main.py SQL은 sqlite 스타일(`?`/`:name`) 그대로. db.py `_PgAdapter`가 Postgres일 때만 `%s`/`%(name)s`로 번역(dict면 named, 아니면 positional). 우리 SQL엔 `%` 리터럴 없어 이스케이프 불필요.
- **`end` 예약어**: Postgres에서 `end`는 예약어라 스키마·INSERT·UPDATE에서 `"end"`로 인용. SQLite도 따옴표 식별자를 허용해 양쪽 동작. (컬럼명 변경 대신 인용 선택 — 수술적.)
- **psycopg 옵션**: `prepare_threshold=None`(Supabase 트랜잭션 풀러 호환), `row_factory=dict_row`(sqlite3.Row와 동일하게 `row["col"]` 접근). import는 connect() 안에서 지연(SQLite만 쓰면 psycopg 불필요).
- **검증 상태**: SQLite 회귀 백엔드 28 통과(무변경 확인). 앱 실행 쿼리 19개 어댑터 번역 잔여 placeholder 0·"end" 인용 확인.
- **스모크 스크립트 재작성 (2026-07-15)**: `backend/smoke_pg.py`(scratchpad 아닌 backend/ 에 둠 — test_api.py 와 동일 위치라 찾기·커밋 쉬움). DATABASE_URL 있으면 실 PG 로 27체크(공개읽기·미로그인401·로그인·CRUD·타임스탬프·계정관리 규칙), 끝나면 정리(events 스모크행+editor+tester 삭제)해 배포용 빈 DB 남김. `run()`/`cleanup()` 을 import 가능하게 두고 DATABASE_URL 가드는 `__main__` 안으로 → SQLite 임시 DB 드라이런으로 로직 27체크 통과 확인(실 PG 없이 로직 오류 선제거). 어댑터 경로(?→%s) 는 실행 시 검증됨. psycopg 3.3.4 로컬 설치 확인 → 연결문자열만 있으면 즉시 실행.
- **전제**: 빈(신규) Supabase 를 전제한다. "마지막 관리자 삭제 400" 검증이 tester 가 유일 관리자임에 기대므로, 이미 관리자가 있는 DB 에선 그 체크가 안 맞는다(배포 전 스모크 용도).

## 실 Postgres 라이브 검증 완료 (2026-07-17)

- **결과**: 실 Supabase(서울 ap-northeast-2)로 `python -m backend.smoke_pg` → **27 passed**. B안(저장소만 PG 전환)의 마지막 미검증 항목이 닫혔다. SQLite 드라이런에서 증명 못 하던 부분 — `_PgAdapter` 의 `?`→`%s` 번역, `"end"` 예약어 인용, psycopg 연결 옵션 — 이 실 PG 에서 동작함을 확인.
- **연결 경로**: Session pooler(`aws-1-ap-northeast-2.pooler.supabase.com:5432`, user=`postgres.<ref>`). 사용자가 처음 준 Direct connection(`db.<ref>.supabase.co`)은 무료 플랜에서 IPv6 전용이라 IPv4 환경에서 실패 가능 → pooler 권장. `prepare_threshold=None` 이 pooler 호환을 이미 잡아둔 상태였다.
- **정리 확인**: 스모크 후 `events` 0행 / `users` 0행을 DB 직접 조회로 확인. 스키마만 남은 배포용 빈 DB(실 배포의 init_db 가 진짜 관리자를 시드).
- **em-dash 버그**: 마지막 `print` 의 `—`(U+2014)가 Windows cp949 콘솔에서 UnicodeEncodeError → 27 체크가 모두 통과했는데도 exit 1. `cleanup()` 은 `finally` 안에서 print 보다 먼저 돌아 정리 자체는 영향 없었다. 출력 문자열의 em-dash 만 하이픈으로 교체(주석·문서의 em-dash 는 유지 — 콘솔로 안 나간다). 수정 후 exit 0 재확인.
- **주의**: 스모크는 `events`/`users` 를 지운다. 운영 데이터가 들어간 뒤에는 절대 실행 금지 — 배포 전 빈 DB 전용이다.
- **보안**: 검증에 쓴 DB 비밀번호가 대화 기록에 남았다. 배포 전 Supabase Settings→Database 에서 교체 권고(교체해도 코드 변경 없음 — DATABASE_URL 은 env). → **사용자가 교체 완료(2026-07-17).** 이후 연결문자열은 대화에 남기지 않고 Render 대시보드에 직접 입력한다(그래서 지금은 우리가 실 PG 로 재검증 불가 — 필요하면 사용자에게 요청).

## 호스팅 재검토 — Vercel 검토 후 Render 유지 (2026-07-17)

- **사용자 요청**: "vercel 로 무료 배포". 검토 결과 **부적합 — Vercel Hobby(무료)는 상업적 사용 금지**. fair use 규정상 "프로젝트 제작에 관여한 누구든 금전적 이득을 목적으로 하는 배포(**유급 직원이 코드를 작성한 경우 포함**)"가 상업적 사용이라, 결제·광고가 없어도 **회사 업무용이면 위반**. 이 프로젝트는 CLAUDE.md 첫 줄부터 "업무용 달력" → Pro($20/월) 필요 → "무료" 요구와 모순. (개인 전용으로만 쓰면 Hobby 가능.)
- **기술적으로도 변경 폭이 컸다**(참고): Vercel 은 엔트리를 루트/`src`/`app`/`api` 에서 찾아 `backend/main.py` 는 `pyproject.toml` 의 `[tool.vercel] entrypoint` 필요. 정적은 `public/**` 에 둬야 하고 공식 문서가 `app.mount(...)` 를 쓰지 말라고 명시 → main.py 의 StaticFiles 마운트 제거 + 프론트 재배치. 서버리스라 Supabase **Transaction pooler(6543)** 필요(다만 `prepare_threshold=None` 덕에 코드 변경은 없었을 것).
- **다른 무료 후보 조사(2026-07 기준)**: Fly.io·Railway·Koyeb **무료 티어 전부 폐지**(옛 블로그가 아직 무료라고 해서 주의). 실질 대안은 Google Cloud Run(Always Free 월 200만 요청, 상업적 사용 명시 허용, 콜드스타트 수 초로 Render 보다 빠름 — 대신 카드 등록·Dockerfile 필요, 무료 티어 리전이 미국 한정이라는 정보 있으나 공식 확인 못 함)과 Oracle Cloud(진짜 VM·휴면 없음·운영 부담 큼).
- **결정: Render 무료 유지.** 코드 변경 0(render.yaml 이미 있음), 약관 무관, 카드 불필요. 유일한 단점은 휴면 후 첫 요청 30~60초. **거슬리면 Cloud Run 으로 이전**(코드가 거의 그대로라 이전 비용 낮음) — 이게 다음 후보다.

## Render 배포 진행 상황 (2026-07-17, 미완)

- **코드 준비 완료·실측**: render.yaml 의 startCommand 를 그대로 로컬 실행해 검증 — 공개읽기 200, 정적(`/`, `/src/main.js`, `/vendor/date-fns.js`) 200, 미로그인 POST 401, `CAL_ADMIN_USER/PASS` 시드 관리자 로그인 성공, `CAL_HTTPS=1` → `secure; httponly; samesite=lax`. `FRONTEND_DIR = Path(__file__).resolve().parent.parent` 이 절대경로라 Render 의 cwd 와 무관.
- **자동화 불가**: Render CLI 없음 + `RENDER_API_KEY` 미설정 → 대시보드 조작은 사용자가 브라우저로. (원한다면 API 키를 만들어 주면 이후는 자동화 가능.)
- **막힌 지점**: New→Blueprint 가 "No repositories found" + 하단 "An error occurred". GitHub 연결 자체는 되어 있다(우측 라벨이 `Connect account +` → `Configure account` 로 바뀐 것이 근거). 따라서 원인은 연결이 아니라 **Render GitHub App 의 repository access 미부여**(설치 시 select repositories 에서 체크 누락, 혹은 저장소 주인 `luckey5252-sketch` 가 아닌 다른 계정에 설치).
- **다음 조치**: https://github.com/settings/installations → Render → Configure → Repository access 에 `work-calender` 추가 → Render 새로고침. 우회로는 공개 URL 직접 입력(저장소가 public 임을 비인증 ls-remote 로 확인) — 자동 재배포만 포기하면 즉시 배포 가능.
- **gh CLI 토큰 만료**: `gh auth status` 가 keyring 토큰 invalid. 다만 git push 는 별도 자격증명으로 성공했다. gh 를 쓸 일이 생기면 `gh auth refresh -h github.com` 필요.

## Render 배포 완료 (2026-07-17)

**결과**: https://work-calendar-c62u.onrender.com 라이브. 서비스명 `work-calendar` 이지만 `work-calendar.onrender.com` 은 **남이 선점**(Express 앱)이라 Render 가 `-c62u` 접미사를 붙였다. 배포 주소를 추측하지 말 것.

### "No repositories found" 의 진짜 원인 — 계정 2개
- 앞선 추정(GitHub App 권한 미부여)은 **틀렸다.** 실제로는 사용자에게 GitHub 계정이 2개 있고 **저장소가 없는 쪽 계정에 Render 가 붙어 있었다.**
- **Render 의 Connect GitHub 는 계정을 묻지 않고 브라우저의 활성 GitHub 세션을 그대로 쓴다.** 두 계정에 동시 로그인돼 있으면 GitHub 가 말없이 하나를 넘긴다 → 몇 번을 눌러도 같은 계정만 붙는다. Render 계정 1개 : GitHub 신원 1개.
- 재연결이 필요하면 **시크릿 창에서 원하는 계정으로만 로그인한 뒤** 연결해야 한다.

### 사고 1 — 공개 URL 에 `admin/admin` 노출
- Blueprint Apply 에서 `sync: false` env(`DATABASE_URL`/`CAL_ADMIN_USER`/`CAL_ADMIN_PASS`) 입력을 건너뛰면 **셋 다 없는 채로 배포가 성공한다.** `config.py` 는 stderr 경고만 남기고 기본값 폴백 → 공개 주소에서 `admin/admin` 관리자 로그인이 가능했다(외부 probe 로 확인: `{"user":"admin","isAdmin":true}`).
- 동시에 `DATABASE_URL` 부재 → **휘발성 SQLite** 로 동작. 재시작마다 데이터 소실인데 화면상 정상이라 알아채기 어렵다.
- **둘 다 fail-open 이다.** 배포 성공 화면만으로는 구분 불가. 실피해는 없었다(데이터 0건, URL 미공개).
- **시드 규칙 주의**: `db.py:85-98` 은 `users` 가 **비어있을 때만** 시드한다. 이미 `admin` 이 생긴 뒤엔 `CAL_ADMIN_*` 를 넣어도 재시드되지 않는다. 이번엔 낡은 admin 이 휘발성 SQLite 에만 있어서 재배포로 함께 사라져 운이 좋았다. Supabase 에 들어간 뒤였다면 `DELETE FROM users;` + 재시작이 필요했다.

### 사고 2 — 배포 2회 실패, 그런데 사이트는 200
- `Exited with status 3` = uvicorn 이 startup 이벤트 예외로 죽을 때의 코드. `main.py:63` 의 `@app.on_event("startup")` → `init_db()` → DB 연결 실패였다.
- **Render 는 새 배포가 실패하면 옛 인스턴스를 계속 서빙한다.** 그래서 밖에서 보면 200 이고 `admin/admin` 도 그대로 열려 있어, "고쳤는데 왜 그대로지?" 로 헤맸다. **배포 후 검증은 Events 탭의 `Deploy live` 확인이 먼저다.**
- 원인은 `DATABASE_URL` 사용자명의 `.<ref>` 누락. Supabase Connect 화면의 입력칸이 가로로 잘려 있어 드래그 복사 시 유실되기 쉽다 → **복사 아이콘을 쓸 것.**

### 진단 함정 — Supavisor 의 오해 부르는 에러
- `.<ref>` 없는 사용자명 → `FATAL: password authentication failed for user "postgres"`. **비밀번호 문제로 오독하기 쉽다**(실제로 한 번 오진했다).
- 실측으로 구분법을 확정: 형식은 맞고 ref 만 가짜면 → `FATAL: (ENOTFOUND) tenant/user postgres.<ref> not found`. 즉 **pooler 는 받은 사용자명을 그대로 에러에 되돌려준다.** 따라서 **로그의 사용자명이 `postgres` 면 `.<ref>` 누락이 확정**이고, `postgres.<ref>` 로 찍히면 그때가 진짜 비밀번호/ref 문제다.
- 이 구분법이 없으면 비밀번호만 계속 바꾸며 헤맨다.

### 얻은 것
- `backend/config.py` 의 DATABASE_URL 주석이 `postgres:<pw>@<host>` 라 **정확히 이 실수를 유도했다** → pooler 형식으로 정정하고 함정 두 개(ref 누락·Direct IPv6)를 주석에 남겼다.
- 진단 도구를 scratchpad 에 만들어 썼다(`check_db_url.py`): 연결문자열의 사용자명 형식·호스트 종류·자리표시자 잔존·URL 인코딩 필요 문자를 검사하고 실제 연결까지 시도한다. **비밀번호는 길이만 출력**해 대화에 노출되지 않는다. Render 배포는 왕복 2분이라, 이런 건 로컬에서 5초에 거르는 게 맞다. (일회성이라 커밋 안 함. 필요하면 backend/ 로 승격.)
- **em-dash 버그를 또 냈다.** `smoke_pg.py` 에서 겪고 이 문서에 적어놨는데도 반복 → cp949 콘솔은 U+2014 를 인코딩 못 해 `UnicodeEncodeError`. **콘솔로 나가는 문자열엔 em-dash 를 쓰지 말 것**(주석·문서는 무방).

### Supabase RLS 켬 (2026-07-17)

- **문제**: `events`·`users` 의 RLS 가 `Disabled` 였다. Supabase 는 프로젝트마다 PostgREST(`https://<ref>.supabase.co/rest/v1/`)를 자동 노출하고, `public` 스키마에 `postgres` 역할로 만든 테이블에는 기본 권한(`ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO anon, authenticated`)이 자동으로 붙는다. 우리는 psycopg 로 직접 DDL 을 실행했으므로 해당된다.
- **위험**: anon 키 보유자가 **FastAPI 의 인증을 통째로 우회**해 테이블을 직접 읽고 쓸 수 있다. `users` 에는 pw_hash 가 있고 `events` 는 삭제 가능. anon 키는 원래 프론트에 박아두는 **공개용 키**라 비밀 유지를 전제하면 안 된다. (B안은 Supabase 를 DB 로만 쓰므로 PostgREST 는 쓰지 않는데, 자동으로 열려 있는 게 함정.)
- **조치**: 정책 없이 RLS 만 켰다. `alter table public.events enable row level security;` / 같은 것을 `users` 에도.
- **앱이 안 깨지는 이유**: 테이블 소유자(`postgres`)는 RLS 를 우회한다(`FORCE ROW LEVEL SECURITY` 를 걸지 않는 한). 우리 연결이 그 역할이다. 정책이 없으면 `anon`/`authenticated` 는 전부 거부.
- **실측**: 켠 뒤 `GET /events` 3건 유지·`GET /events/:id` 200·미로그인 POST 401. 읽기 경로는 확인됨. **쓰기 경로(로그인 후 생성)는 관리자 비밀번호가 없어 외부 검증 불가 → 사용자 브라우저 확인에 의존.**
- **교훈**: Supabase 를 "그냥 Postgres" 로 쓸 때도 **PostgREST 노출은 기본값으로 켜져 있다.** DB 로만 쓰는 구조라도 RLS 는 켜두는 게 맞다.

### render.yaml 하드닝 완료 (2026-07-25 — 사고 1 근본 원인 차단)
- **fail-open → fail-closed**: `config.py` 에 운영 게이트 `CAL_REQUIRE_ENV` 추가. 켜지면 필수 비밀(`DATABASE_URL`·`CAL_SECRET`·`CAL_ADMIN_USER`·`CAL_ADMIN_PASS`)이 없을 때 기본값으로 폴백하지 않고 import 시점에 `RuntimeError` 를 던진다 → uvicorn 이 exit 1 → Render 가 배포 실패로 표시(`admin/admin`·휘발성 SQLite 로 조용히 뜨던 사고 1 차단).
- **왜 CAL_HTTPS 대신 전용 플래그**: 검토 때는 CAL_HTTPS 재사용을 떠올렸으나, "Secure 쿠키"와 "필수 비밀 강제"는 의미가 다르다(로컬에서 Secure 쿠키만 테스트하려다 모든 비밀을 강제당하는 결합 회피). 전용 `CAL_REQUIRE_ENV` 로 분리.
- **왜 리터럴 값**: render.yaml 에 `value: "1"` 리터럴로 박는다. `sync: false` 였다면 사고 1 처럼 Apply 에서 건너뛰어져 게이트 자체가 안 켜졌을 것 — 게이트는 절대 빠지면 안 되므로 리터럴이어야 한다.
- **왜 import 시점 raise**: `config.py` 는 `main.py` 가 import 하는 첫 모듈이라 app 이 만들어지기 전에 죽는다 → uvicorn 이 startup 이벤트까지 못 가고 즉시 비정상 종료. (startup 예외는 exit 3, import 예외는 exit 1 — 둘 다 Render 는 실패로 본다.)
- **테스트 영향 없음**: test_api·smoke_pg 는 `CAL_REQUIRE_ENV` 를 안 켜므로 dev 모드(기본값 폴백) 유지. 3시나리오 실측: dev 폴백 정상 / 운영+필수전부 정상 / 운영+누락 → 네 변수 나열하며 uvicorn exit 1.

## 재배포 (2026-07-26 — 미확인 상태로 중단)

- **한 것**: `git push origin main` (`2d54310..8cf27e1`, 6커밋 fast-forward). Render blueprint `calenderforus` 가 auto-deploy 로 붙어 있어 push 가 배포를 트리거한다(별도 대시보드 조작 없이).
- **막힌 지점**: push 직후부터 라이브 `GET /events` 가 **HTTP 000(무응답)** 만 반환(curl 45s ×9 + 30s 스냅샷, ~5분간). 서비스가 배포 재시작 중이거나 free 콜드스타트로 추정하나, **Render 대시보드 접근이 없어(RENDER_API_KEY·CLI 없음) 확정 불가.** 사용자가 "내일 재개" 요청 → 폴링 중단하고 저장.
- **배포 완료 감지법(재개 시)**: `GET /events` 응답 첫 일정에 `headAttending` 키가 있으면 새 코드+마이그레이션 라이브(옛 인스턴스면 키 없음). 이게 사고 2("실패해도 옛 인스턴스가 200") 를 우회하는 코드-레벨 신호라 화면 200 보다 믿을 만하다.
- **주의(사고 2 재현 가능)**: HTTP 000 이 계속이면 배포 실패일 수 있다. 반드시 Render **Events 탭 `Deploy live`** 를 먼저 보고, 실패면 로그로 원인 구분 — 특히 CAL_REQUIRE_ENV 가 붙었는데 blueprint sync 가 sync:false 비밀을 안 넘겼다면 우리가 넣은 fail-closed 가 의도대로 exit 1 낸 것일 수 있다(그 경우 대시보드에서 DATABASE_URL·CAL_ADMIN_* 재확인).
- **자동화 한계 반복**: Render 는 여전히 대시보드 수동 조작 의존. API 키를 주면 배포 상태 폴링·로그 확인까지 자동화 가능(이전 노트에도 같은 언급).
- **경고**: 이제 운영 데이터가 있다. `backend/smoke_pg.py` 를 이 DB 에 절대 실행하지 말 것(events/users 를 지운다).
- 쓰기 경로는 확인됨 — 사용자가 브라우저로 일정을 추가해 4건이 됐다(RLS 켠 뒤에도 정상).

## 배포 중단 원인 = Supabase 무료 자동 일시정지 (2026-07-29 진단 확정)

- **증상**: 2026-07-26 push 이후 라이브가 계속 HTTP 000(무응답). 3일 뒤에도 동일.
- **HTTP 000 의 해석**: TCP 33ms·TLS 89ms 는 정상인데 그 뒤 120초 무응답 → Render 엣지는 살아 있고 **업스트림(uvicorn)이 없다.** 콜드스타트라면 50~60초 안에 응답하거나 502 를 준다. 무응답 지속 = 기동 실패로 봐야 한다.
- **Events 탭**: `Exited with status 3` 반복. **exit 3 = startup 이벤트 예외**(`main.py:63` → `init_db()`), **exit 1 = import 예외**(config 게이트). 따라서 `CAL_REQUIRE_ENV` 하드닝은 범인이 아니다 — 오히려 config import 가 통과했다는 건 **필수 env 가 전부 들어있다**는 뜻이고, `DATABASE_URL` 이 없었다면 SQLite 로 기동에 성공했을 테니 PG 경로에서 죽은 것이 확정된다.
- **로그**: `psycopg.OperationalError: FATAL: (ENOTFOUND) tenant/user postgres.<ref> not found`.
  - 사용자명에 `.<ref>` 가 **붙어 있다** → 2026-07-17 의 `.<ref>` 누락 사고와 다르다(그땐 `for user "postgres"`). 우리가 실측으로 세운 구분법이 그대로 작동했다.
  - 인증 이전 단계라 **비밀번호 문제가 아니다.** Supavisor 가 그 테넌트를 모른다는 뜻.
- **원인**: **Supabase 무료 프로젝트는 7일 무활동 시 자동 일시정지**되고, 정지되면 pooler 테넌트 등록이 빠져 위 에러가 난다. 마지막 DB 트래픽이 2026-07-17(브라우저로 일정 추가)이고 Render 무료는 15분이면 휴면이라 그 뒤 DB 를 안 건드렸다 → 07-24 경 정지 → 07-26 push 시점엔 이미 죽어 있었다.
- **두 무료 티어가 맞물려 자멸하는 구조다.** Render 휴면(15분) → DB 무활동 → Supabase 정지(7일) → 다음 기동 시 startup 실패. 아무도 안 쓰면 스스로 죽는다.
- **조치**: Supabase 대시보드에서 Restore → Render Manual Deploy. 정지 중에도 데이터는 보존된다.
- **재발 방지 후보(미결정)**: 주 1회 이상 `GET /events` 를 때리는 외부 크론(예: GitHub Actions 스케줄, 공개 저장소는 무료). 요청 하나가 Render 를 깨우고 DB 를 건드려 양쪽 타이머를 동시에 리셋한다. Render 무료는 월 750 인스턴스-시간이라 상시 기동은 한도에 닿지만, 하루 1회 핑은 무시할 수준.

## Supabase 프로젝트 소멸 확인 — 07-29 진단 정정 (2026-07-30)

- **사실**: 사용자 Supabase 계정에 프로젝트가 없다. ref `ysvqawnyyrqenbmzikpm`(Render 의 `DATABASE_URL` 사용자명에서 확보, 소문자 20자 형식 정상)로 외부 확인 — `<ref>.supabase.co` 와 `db.<ref>.supabase.co` 둘 다 **NXDOMAIN**. 대조군(`supabase.com`, `aws-1-ap-northeast-2.pooler.supabase.com`)은 정상 해석되니 DNS 경로 문제가 아니다.
- **정정**: 07-29 에 "7일 무활동 자동 일시정지"로 닫았으나, **정지가 아니라 소멸**이다. 정지된 프로젝트는 호스트명이 남아 paused 응답을 주는데 여긴 이름 자체가 없다. `(ENOTFOUND) tenant/user postgres.<ref> not found` 는 **정지와 삭제가 같은 모양**이라 그 로그만으로는 구분이 안 됐다 — pooler 에러로 정지를 확정하지 말 것. **DNS 존재 여부가 둘을 가르는 신호다.**
- **잃은 것**: 라이브 일정 4건 + 사용자 계정. 백업 없음. 스키마·코드는 저장소에 있어 재생성 가능.
- **복구 방향(사용자 선택)**: 새 Supabase 프로젝트 → Render `DATABASE_URL` 만 교체. 코드 변경 0.
- **keep-alive 크론은 넣지 않기로**(사용자 선택). 7일 무활동이면 다시 정지될 수 있고, 이번처럼 그 뒤 소멸할 수도 있다는 점을 알린 뒤의 결정이다. 정기 사용이 재발 방지책.

## 3차 기능 보완 — 설계 중 (2026-07-17, 내일 재개)

`superpowers:brainstorming` 진행 중. **설계 승인 전이라 코드 변경 없음**(스킬의 HARD-GATE).

### "본부장 체크가 파랑으로 반영 안 됨" — 오진했던 것을 바로잡음
- 2026-07-09 에 같은 문의를 **"사용자가 체크를 안 했다(로직 정상)"** 로 닫았다. **그게 오진이었다.**
- 이번엔 층을 하나씩 실측으로 배제했다: 백엔드 왕복(TestClient) `isHead: True` 보존 → 정상. `render.js:53,56` 클래스 부착 → 정상. `css/styles.css:273` `.chip.is-head` → 정상. 남은 건 데이터뿐이었고, 라이브 4건 전부 `attendees=[]` 였다.
- **원인은 `main.js:373` 의 `.filter((a) => a.name)`** — 이름이 빈 참석자를 **경고 없이 버린다.** 본부장 체크만 하고 이름을 안 적으면 그 참석자가 사라지고 `attendees=[]` 가 된다. 칩 색은 `isHead` 에서 파생되니 파랑이 될 수 없다.
- **교훈 둘.** (1) 같은 문의가 두 번 오면 사용자 실수가 아니라 **설계 결함 신호**다. (2) "로직은 정상"이라는 결론은 **각 층을 실측으로 배제한 뒤**에만 내릴 것 — 코드를 읽고 맞아 보인다고 닫으면 안 된다. 이번에도 코드는 전부 "맞아 보였다".
- 조용한 유실(silent drop)이 근본 문제다. 사용자 입력을 버릴 거면 최소한 알려야 한다.

### 사용자가 택한 방향 — 본부장을 일정 속성으로
- 사용자 결정: **`본부장 참석 / 미참석` 2택을 일정 단위로** 두고, **미참석일 때만 참석자 이름을 입력**한다.
- **A안 채택(사용자 확인)**: 참석을 고르면 **참석자 입력칸을 감춘다.** "본부장 참석 회의야말로 명단이 필요하지 않냐"고 반문했으나 사용자는 필요 없다고 확인.
- 이는 CLAUDE.md 데이터 모델(`Attendee { name, isHead }`)과 **"칩 색은 isHead 로 판단한다"** 서술을 바꾸는 변경이다 → 구현 시 CLAUDE.md 도 함께 갱신해야 한다.
- 사용자의 멘탈 모델이 원래 이랬던 것으로 보인다. "본부장 참석"을 **사람 목록의 속성이 아니라 일정의 속성**으로 여겼고, 그래서 이름 없이 체크만 했다. 모델이 사용자 머릿속과 어긋나 있던 게 진짜 원인이고, `.filter` 는 그 어긋남을 조용히 삼킨 장치였다.

### '수정' 배지 노랑
- 사용자 스크린샷으로 확정: 칩 안의 **작은 `수정` 박스 배경을 노랑으로 채운다**(테두리형 아님). **신규 배지는 파란 테두리 유지.**
- 팔레트 제약: 형광 노랑은 CLAUDE.md 금지 클리셰이고, 크림 배경(`#F5F4EF`)에서 밝은 노랑은 글씨가 안 읽힌다 → **채도를 낮춘 앰버**로 잡는다.

### 열린 질문 (재개 지점)
- **주간뷰 담당부서 위치**: ① 태그 자리 vs ② 제목 아래 별도 줄. **제안 = ②** — 실데이터 부서명(`안전총괄`, `안전총괄부`)이 길어 ①은 좁은 주간 칸에서 시간이 밀린다. `chip()` 이 월/주 공용(`render.js:48`)이라 주간뷰에만 나오게 옵션 인자가 필요하다.

## 3차 기능 구현 완료 (2026-07-25)

- **주간뷰 부서 = ② 제목 아래 별도 줄** 확정(사용자). `chip(ev, nowMs, { showDepartment })` 옵션으로 주간뷰만 `chip-dept`(flex 1 0 100% → 제목 아래 줄, 작게·흐리게)를 붙인다. 월 보기는 옵션 미전달이라 부서 안 보임.
- **모델 = 이벤트 속성 `headAttending: boolean`.** `Attendee.isHead` 를 없애고 본부장 참석을 일정 단위로 올렸다. 근거는 오진 기록(위) — 사용자 멘탈 모델이 "본부장 참석"을 사람 목록 속성이 아니라 일정 속성으로 봤고, `.filter((a)=>a.name)` 이 이름 없는 본부장 체크를 조용히 삼켰다. 칩 색·`.chip.is-head`·상세 상단 `본부장 참석` 라벨 모두 `headAttending` 에서 파생.
- **폼 A안**: `참석/미참석` 라디오. 참석이면 `#attendee-field` 를 `hidden`(참석자 명단 불필요). 미참석이면 참석자 이름만 입력(체크박스 없음). `readForm` 은 참석 시 `attendees=[]`.
- **DB 마이그레이션**: events 에 `head_attending INTEGER NOT NULL DEFAULT 0` 컬럼. 기존 배포 DB 는 init_db 가 채운다 — PG=`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, SQLite=PRAGMA 확인 후 ADD. 기존 행은 0(미참석)으로 읽혀 무손실. SQLite 경로는 옛 스키마+옛 행으로 실측 검증. PG 경로는 배포 startup 에서 실행(로컬 미검증 — 표준 idempotent DDL).
- **수정 배지 = 채운 앰버**(`--amber #cf8a1e`, 진한 갈색 글씨 `#2c2205`). 형광 노랑 클리셰 회피 + 크림 배경 가독. 신규는 파란 테두리 유지. `.chip-badge.is-edited` 로 구분(신규엔 안 붙음).
- **저장 JSON 호환**: 옛 attendees 행에 남은 `isHead` 키는 무해(모델이 무시). row_to_event 는 그대로 반환.
