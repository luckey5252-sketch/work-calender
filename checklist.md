# 체크리스트 — 업무용 달력 MVP

## 기반
- [x] 프로젝트 구조 잡기 (index.html, css/, src/, test/)
- [x] package.json (type=module, date-fns, 테스트 스크립트)
- [x] date-fns 임포트맵 + node 양쪽에서 해석되게

## 핵심 모듈
- [x] storage.js — localStorage 격리, 인터페이스(list/get/create/update/remove)
- [x] calendar.js — 순수 날짜 계산(월 그리드, 주 그리드, 이동)
- [x] render.js — DOM 렌더링
- [x] main.js — 상태·이벤트 배선

## 기능 (MVP)
- [x] 월/주 보기 전환
- [x] 일정 추가
- [x] 일정 수정
- [x] 일정 삭제
- [x] 카테고리/색상 (회의·마감·외근·개인)
- [x] 마감·우선순위 표시
- [x] 참석자 (본부장 파랑+굵게+라벨)
- [x] 변경 표시 (24h, updatedAt 파생, 신규/수정 구분)

## 품질
- [x] 반응형 (모바일) — 기존 CSS 미디어쿼리 재사용
- [x] 키보드 포커스 보이기, 화살표 키 날짜 이동
- [x] 색만으로 카테고리 구분 안 함 (라벨 병행)
- [x] 빈 화면·에러 문구

## 검증
- [x] 날짜 경계 테스트 (월말, 윤년, 주 시작) 통과 — 10/10
- [x] src 모듈 문법 검사(node --check) 통과
- [x] 정적 서버로 모든 자산 200 확인
- [x] 브라우저 실제 렌더 확인 — headless Chrome로 http 렌더 검증(2026-07-08): 월 그리드 35셀(7×5), 요일 헤더 7, "2026년 7월" 표시, day/daynum/day-events 정상 생성

---

# 2차 — 2단계 백엔드 + 로그인 + 기능변경 (2026-07-09~)

요청: 기본 주보기 · 분류(회의·출장·기타) · 주보기 2줄 · 백엔드 로그인(읽기공개/쓰기로그인) · 한국 공휴일.
결정: 스택 = Python FastAPI + SQLite. 읽기 공개, 편집만 로그인.

## A. 백엔드 (FastAPI + SQLite)
- [x] backend/config.py — env 설정(DB경로, 세션시크릿, 시드 관리자)
- [x] backend/security.py — pbkdf2 해시/검증(stdlib, 외부의존 없음)
- [x] backend/db.py — SQLite 스키마(events, users) + init/시드
- [x] backend/main.py — FastAPI 라우트(events CRUD, auth), SessionMiddleware, 정적 mount
- [x] backend/requirements.txt
- [x] createdAt/updatedAt 서버가 채움, UTC 저장, 참석자 JSON 컬럼
- [x] 읽기 공개 / 쓰기 로그인 게이트(POST/PATCH/DELETE 401)

## B. 프론트 storage→API + 로그인
- [x] src/config.js — API_BASE(하드코딩 금지, 기본 동일출처)
- [x] src/api.js — 공통 fetch 래퍼(에러/상태 정규화)
- [x] src/storage.js — fetch 기반, 캐시+sync()로 render 동기 유지
- [x] src/auth.js — login/logout/me + user 상태
- [x] 로그인 다이얼로그(index.html) + 편집 액션 게이트(비로그인=보기전용)

## C. 기능 변경
- [x] 기본 주보기 (state.view='week', 토글 aria-selected)
- [x] 분류 회의/출장/기타 (index.html select + render CAT_CLASS)
- [x] 주보기 일정 제목 2줄 (CSS line-clamp)
- [x] 한국 공휴일 표시 (src/holidays.js 하드코딩표 2025–2027, 대체공휴일 포함)

## D. 검증
- [x] backend TestClient: 공개 GET / 미로그인 POST=401 / 로그인 후 쓰기 / updatedAt 서버설정 — 18 passed
- [x] 프론트 node 테스트 + 공휴일 테스트 통과 — 27 passed(10+10+7)
- [x] 서버 실행 + headless 렌더 확인 — 기본 주보기·게스트 로그인버튼·일정칩·공휴일(광복절/대체) 확인
- [x] 실행 스크립트·README·.gitignore 갱신(npm run serve → uvicorn)

## E. 사용자 계정 관리 (여러 명 등록)
- [x] users.is_admin 컬럼 + 기존 DB 마이그레이션(ALTER), 시드관리자 is_admin=1
- [x] require_admin 의존성, /auth/me·/auth/login 에 isAdmin 포함
- [x] GET/POST/DELETE /users (관리자 전용), 자기·마지막관리자 삭제 방지, 중복 409
- [x] 프론트: auth.isAdmin, src/users.js, 사용자 관리 다이얼로그(추가/삭제), 관리자만 노출
- [x] backend TestClient: 비관리자 /users 403, 추가/삭제/중복/마지막관리자 보호 — 28 passed
- [x] 서버 e2e(로그인 isAdmin·목록·추가201·마지막관리자400·삭제204) + headless 게스트 로드 확인

## F. 마감 조정 (2026-07-09)
- [x] 칩 색 기준을 분류 → **본부장 참석 여부**로: 본부장=강한 파랑, 그 외=연한 회색 (headless 실측 검증)
- [x] 주보기 제목 2줄(flex-wrap + title flex 1 0 100%) — headless titleLines=2 확인
- [x] 분류(회의/출장/기타)는 색 제거, 라벨로만 구분
- [x] "색이 같다" 문의 → 원인은 사용자 일정에 본부장 체크 없음(로직 정상). 데모 2건 넣어 검증 후 삭제
- [x] CLAUDE.md 현재 상태로 갱신(백엔드 승격·분류·칩색·스택·범위)

## G. 공휴일 연도 확장 (2026-07-11)
- [x] src/holidays.js 표를 2028–2030으로 확장(음력 설날·부처님·추석 + 대체공휴일). HOLIDAY_YEARS=[2025,2030], 헤더 주석 갱신.
- [x] 출처(kholidayz.com) 교차검증 — 2030 설날 전날(2/2)·추석 9/11·9/13 누락을 잡아 3일 연휴 재구성. 대체 개수 확인(2028 1·2029 3·2030 2).
- [x] 요일·대체규칙 정합성 node 스크립트로 검증. 신규 테스트 4건 추가 → 프론트 전체 31 통과(10+10+11).

## H. 웹 배포 준비 — Render (2026-07-11)
- [x] CAL_HTTPS env → SessionMiddleware https_only(운영 HTTPS Secure 쿠키). 로컬 http 개발은 기본 꺼짐 유지.
- [x] render.yaml 블루프린트(0.0.0.0 바인딩·no reload·CAL_SECRET 자동생성·영구 디스크 /var/data·관리자 계정 sync:false).
- [x] README 배포 섹션(Render 절차·git 저장소화·free 플랜 디스크/휴면 한계·CAL_HTTPS 표) + 공휴일 2025–2030·테스트 수치 정정.
- [x] 검증: CAL_HTTPS=1 → set-cookie 에 secure·httponly·samesite=lax 확인. 미설정 → secure 없음(로컬 유지). 백엔드 28 통과.

## I. Supabase(Postgres) 저장소 전환 — B안 (2026-07-11)
- [x] 결정: 프론트·FastAPI·인증·계정관리 그대로, 저장소만 SQLite→Supabase Postgres. DATABASE_URL 있으면 PG, 없으면 SQLite(이중).
- [x] config.py DATABASE_URL. db.py 얇은 어댑터(_PgAdapter)로 ?/:name → %s/%(name)s 번역 → main.py 쿼리 무변경. "end"는 PG 예약어라 인용(양쪽 호환).
- [x] main.py INSERT/UPDATE end 컬럼 "end" 인용. requirements.txt psycopg[binary]. render.yaml free 플랜(디스크 불필요)+DATABASE_URL. README Supabase 절차·env표.
- [x] 검증: SQLite 회귀 백엔드 28 통과(기존동작 무변경). 전체 19개 쿼리 어댑터 번역 잔여 placeholder 0·"end" 인용 확인.
- [x] 스모크 스크립트 `backend/smoke_pg.py` 작성 — DATABASE_URL 주면 실 PG로 CRUD·인증·계정관리 27체크. 끝나면 테스트 데이터 정리(배포용 빈 DB). SQLite 드라이런으로 로직 27체크 통과 검증. psycopg 3.3.4 로컬 설치 확인.
- [x] **실 Postgres 라이브 검증 완료 (2026-07-17)** — 실 Supabase(서울 ap-northeast-2, Session pooler)로 `python -m backend.smoke_pg` → **27 passed**. 어댑터(?→%s)·`"end"` 인용이 실 PG에서 동작 확인. 정리 후 events 0행·users 0행(배포용 빈 DB) 직접 조회로 확인.
- [x] smoke_pg 출력의 em-dash → 하이픈. cp949 콘솔에서 마지막 print 가 UnicodeEncodeError → 27 통과인데 exit 1 로 보이던 문제(검증 로직 무관). 수정 후 exit 0 재확인.

## J. Render 배포 실행 (2026-07-17, **진행 중**)

- [x] 호스팅 재검토 — 사용자가 Vercel 무료 요청 → **Vercel Hobby 는 상업적 사용 금지**(fair use: 유급 직원이 만든 업무용 배포 포함) → "업무용 달력"과 충돌. Fly.io·Railway·Koyeb 무료 티어는 2026 기준 폐지 확인. Render 무료 유지 결정(코드 변경 0·약관 무관·카드 불필요).
- [x] GitHub 푸시 — `luckey5252-sketch/work-calender` main = dd52da5. 공개 저장소(비인증 ls-remote 확인). `.db`·`.env` 미커밋 확인.
- [x] render.yaml startCommand 로컬 실측 — `GET /events` 200 / `GET /` 200 / `/src/main.js`·`/vendor/date-fns.js` 200 / 미로그인 POST 401 / `CAL_ADMIN_*` 시드 관리자 로그인 성공 / `CAL_HTTPS=1` → 쿠키 `secure; httponly; samesite=lax`. FRONTEND_DIR 이 절대경로라 cwd 무관 확인.
- [x] **Render Blueprint 연결 완료.** "No repositories found" 의 진짜 원인은 권한 미부여가 아니라 **GitHub 계정 2개 중 저장소가 없는 쪽에 Render 가 붙어 있던 것**(Render 는 브라우저의 활성 GitHub 세션을 그대로 씀). 사용자가 해결 → blueprint `calenderforus` 가 `luckey5252-sketch/work-calender` main 에 연결됨.
- [x] env 3개 입력 → **첫 Apply 때 건너뛰어 배포가 기본값으로 뜸**(아래 사고 기록). 이후 입력 완료.
- [x] 배포 후 라이브 검증 — `admin/admin` 401 거부 / 미로그인 POST·`/users` 401 / 공개 `GET /events` 200 / 정적(`/`, `/src/main.js`, `/vendor/date-fns.js`, `/css/styles.css`) 200. URL = https://work-calendar-c62u.onrender.com (`work-calendar.onrender.com` 은 남의 앱이 선점).
- [x] Supabase 적재 확인 — Table Editor 에 `events` 3행 / `users` 1행. 공개 API 로도 3건 조회됨(휘발성 SQLite 아님 **확증**).
- [x] **Supabase RLS 켬** — `events`·`users` 가 RLS Disabled 라 PostgREST(anon 키)로 FastAPI 인증을 우회할 수 있었다. 정책 없이 RLS 만 켜서 anon 차단(소유자 `postgres` 는 우회하므로 앱 무영향). 켠 뒤 실측: 읽기 3건 유지·`/events/:id` 200·미로그인 POST 401.
- [x] 브라우저 최종 확인 — 사용자가 실제로 일정을 추가해 라이브 일정 3건→4건(`tbm`). **RLS 켠 뒤에도 쓰기 정상** 확인됨.

### J-1. 배포 중 사고 기록 (재발 방지)
- [x] **공개 URL 에 `admin/admin` 관리자 노출** — Blueprint Apply 에서 `sync: false` env 3개를 건너뛰자 `config.py` 가 경고만 남기고 기본값으로 폴백(에러 없이 기동). 발견 후 env 주입으로 해소. 데이터 0건·URL 미공개 상태라 실피해 없음.
- [x] **배포 2회 실패(`Exited with status 3`)** — `DATABASE_URL` 사용자명에 `.<ref>` 누락. uvicorn 은 startup 예외 시 exit 3. Render 는 새 배포 실패 시 **옛 인스턴스를 계속 서빙** → 겉보기 200 이라 실패를 놓치기 쉬움.
- [x] **진단 함정**: Supavisor 는 `.<ref>` 없는 사용자명에 `password authentication failed for user "postgres"` 를 준다 → 비밀번호 문제로 오독하기 쉬움. 실측(가짜 ref → `(ENOTFOUND) tenant/user postgres.<ref> not found`)으로 **pooler 가 받은 사용자명을 그대로 되돌려준다**는 걸 확인해 구분. 로그의 사용자명이 `postgres` 면 `.<ref>` 누락이 확정.
- [x] `backend/config.py` DATABASE_URL 주석을 pooler 형식으로 정정 — 기존 예시가 `postgres:<pw>@<host>` 라 정확히 이 실수를 유도했다.
- [ ] `render.yaml` 하드닝 검토 — 필수 env 없으면 조용히 기본값으로 뜨지 말고 기동 실패시키기(사고의 근본 원인)

## 상태 (2026-07-17 갱신)
- 요청 기능 구현·검증 완료(프론트 31 / 백엔드 28 SQLite / 스모크 27 **실 Supabase**). Supabase 전환 **코드·라이브 검증 모두 완료**.
- **배포 완료 — https://work-calendar-c62u.onrender.com** (앱=Render 무료 blueprint `calenderforus`, DB=Supabase 서울 ap-northeast-2 Session pooler). 라이브 검증 통과(공개읽기 200 / 미로그인 쓰기 401 / `admin/admin` 401).
- 무료 플랜 특성: 15분 미접속 시 휴면 → 첫 요청 50~60초. 거슬리면 Cloud Run 이전 후보(코드 거의 그대로).
- 미결/다음: (1) **3차 기능 보완 설계**(아래 K, 내일 재개), (2) `render.yaml` 필수 env 하드닝, (3) 사용자 본인 비밀번호 변경(범위밖).
- 보안: 스모크에 쓴 Supabase DB 비밀번호 노출 → **사용자가 교체 완료(2026-07-17)**. 이후 연결문자열은 대화에 남기지 않고 Render 대시보드에 직접 입력하기로 함.
- 재개(로컬): `npm run serve` → http://127.0.0.1:8000 (admin/admin, SQLite).
- Supabase 재검증 시: `DATABASE_URL='postgresql://postgres.<ref>:<pw>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres' python -m backend.smoke_pg`. 빈 Supabase 전제(관리자 삭제 규칙 검증이 tester 유일 관리자에 기댐) — 운영 데이터가 들어간 뒤엔 돌리지 말 것(스모크가 events/users 를 지운다).


---

# K. 3차 기능 보완 (2026-07-17 설계 중 — **내일 재개**)

사용자 요청 3건. `superpowers:brainstorming` 진행 중 — **설계 승인 전이라 코드는 손대지 않았다.**

## 요청
1. 본부장 체크 시 칩이 파랑으로 안 바뀜 — **진단 완료**
2. 주간뷰에도 담당부서 표시
3. '수정' 배지를 노란색으로 채움

## 1번 진단 — 렌더 버그가 아니었다 (실측 완료)
- 백엔드 `isHead` 왕복 **정상** (TestClient 실측: POST→GET 에서 `isHead: True` 보존).
- `render.js:53,56` 은 `is-head` 클래스를 제대로 붙이고 `css/styles.css:273` `.chip.is-head` 규칙도 정상.
- **진짜 원인**: 라이브 일정 4건 전부 `attendees=[]`. `main.js:373` 의 `.filter((a) => a.name)` 이 **이름이 빈 참석자를 경고 없이 버린다** → 본부장만 체크하고 이름을 안 적으면 체크가 통째로 사라진다.
- 새 일정 폼은 참석자 줄이 **0개로 시작**(`main.js:221`) → `+ 참석자` 를 눌러야 체크박스가 생긴다.
- ⚠ 2026-07-09 에 같은 문의를 "체크 안 함(로직 정상)"으로 닫았는데 **그게 오진이었다.** 같은 문의가 재발하면 사용자 실수가 아니라 설계 결함 신호로 볼 것.

## 확정된 결정
- **본부장을 참석자 명단에서 일정 속성으로 올린다** — 폼에 `본부장 ( )참석 ( )미참석` 선택.
- **A안 채택**: 참석을 고르면 **참석자 입력칸을 감춘다**(본부장 참석 일정엔 명단 불필요). 미참석이면 참석자 칸이 나타난다.
- **수정 배지 = 채움형 노랑** (사용자 스크린샷으로 확인 — 칩 안의 작은 `수정` 박스 배경을 노랑으로). **신규 배지는 파란 테두리 유지.**
  - 팔레트 주의: 형광 노랑은 CLAUDE.md 가 금지한 클리셰. 크림 배경(`#F5F4EF`)에서 가독성이 나오는 **절제된 앰버**로 잡을 것.

## 열린 질문 — **여기부터 재개**
- **주간뷰 담당부서 위치** — ① 태그 자리(`[수정][출장][안전총괄] 09:00`) vs ② 제목 아래 세 번째 줄(작게·흐리게). **제안 = ②** (실데이터 부서명이 `안전총괄`·`안전총괄부` 로 길어 ①은 좁은 주간 칸에서 첫 줄이 밀린다. 부서는 분류·시간과 성격도 다름.)

## 설계 확정 (2026-07-25 — 열린 질문 닫음)
- **주간뷰 부서 위치 = ② 제목 아래 별도 줄**(작게·흐리게). 사용자 확정.
- **모델 = Event 에 `headAttending: boolean` 추가**(일정 속성). `Attendee` 는 `{name}` 만. 칩 색은 `headAttending` 이 정한다.

---

# L. 3차 기능 구현 완료 (2026-07-25)

- [x] 백엔드 `backend/main.py` — `Attendee` isHead 제거, `EventIn.headAttending`, `_write_fields`·INSERT·UPDATE 에 `head_attending`
- [x] `backend/db.py` — 스키마 `head_attending` 컬럼 + init_db 마이그레이션(PG `ADD COLUMN IF NOT EXISTS` / SQLite PRAGMA 확인) + row_to_event
- [x] `src/render.js` — `chip()` hasHead←`headAttending`, 수정 배지 `is-edited` 클래스, 주간뷰 `showDepartment` 옵션 + `chip-dept` 줄
- [x] `src/main.js` — attendeeRow 이름만, `syncHeadAttending()`(참석 시 참석자칸 숨김), readForm `headAttending`, openForm 세팅, openDetail 이벤트속성
- [x] `index.html` — 본부장 `참석/미참석` 라디오 + `#attendee-field` + 힌트 갱신
- [x] `css/styles.css` — `--amber` + `.chip-badge.is-edited` 채움, `.chip-dept`, `.radio-row`, attendee-row 2열, 데드 규칙(`.att-head`·`.att-view li.is-head`) 정리
- [x] 테스트 — render.smoke(35), test_api·smoke_pg `headAttending` 왕복
- [x] `CLAUDE.md` 데이터 모델·칩색·참석자 서술 갱신

## 검증 (2026-07-25)
- [x] 프론트 35 통과(10+14+11 — 본부장=headAttending·부서 주간전용·수정배지 앰버 신규테스트 포함)
- [x] 백엔드 29 통과(SQLite 회귀 — `headAttending` 보존 체크 추가)
- [x] 실서버 HTTP 왕복 — 로그인→`headAttending:true` 생성→GET 에서 `headAttending=True`·부서 보존
- [x] **SQLite 마이그레이션 실측** — head_attending 없는 옛 DB + 옛 행에 init_db → 컬럼 무손실 추가, 옛 행 `headAttending=False`(미참석). **운영 Supabase 4건도 이렇게 넘어감**(PG 경로는 배포 시 startup init_db 가 `ADD COLUMN IF NOT EXISTS` 실행).
