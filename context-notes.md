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
