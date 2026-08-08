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
- [x] `render.yaml` 하드닝 완료 (2026-07-25) — `CAL_REQUIRE_ENV=1`(리터럴이라 Apply 에서 안 빠짐) 이면 `config.py` 가 필수 비밀(DATABASE_URL·CAL_SECRET·CAL_ADMIN_*) 누락 시 import 시점에 RuntimeError → uvicorn exit 1 로 **배포가 눈에 띄게 실패**(fail-open→fail-closed). 3시나리오 실측(dev 폴백 / 운영 완전 / 운영 누락→uvicorn exit 1). 백엔드 29 회귀 통과.

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

---

# M. 재배포 (2026-07-26 — **미확인, 내일 대시보드 확인**)

- [x] `git push origin main` (`2d54310..8cf27e1`) — 6커밋(하드닝 8cf27e1 + 3차기능 16f03b5 + 문서 4). fast-forward, divergence 없음. Render blueprint `calenderforus` 가 자동 배포 트리거됨.
- [x] **배포 완료 확인 (2026-08-07)** — 아래 N 절 참조. 당시엔 미확인이었다. push 후 라이브 `GET /events` 가 **HTTP 000(무응답) 지속**(45s timeout ×9회 + 30s 스냅샷). 콜드스타트/배포중 재시작으로 보이나 대시보드 없이는 확정 불가. **내일 Render Events 탭에서 `Deploy live` 여부 먼저 확인**(사고 2 교훈: 실패해도 옛 인스턴스가 200 을 서빙하니 화면만 믿지 말 것).
- [x] **배포 완료 감지법**: `curl -s https://work-calendar-c62u.onrender.com/events` → 응답 JSON 첫 일정에 **`headAttending` 키가 있으면 새 코드 + 마이그레이션 라이브**(옛 인스턴스면 키 없음). 없으면 아직 옛 코드.
- [x] **배포 후 검증** (2026-08-07 완료, N 절): 미로그인 `POST /events` 401 / `admin/admin` 로그인 401 / 공개 `GET /events` 200 / 정적 200. 사용자 브라우저로 본부장 참석 일정 추가 → 파랑 칩·주간뷰 부서 줄·수정 배지 앰버 눈으로 확인.
- [ ] **하드닝 반영 확인**: `CAL_REQUIRE_ENV=1` 은 render.yaml 리터럴이라 blueprint sync 때 붙는다. Render 가 git push 만으로 새 env 를 자동 반영 안 하면 대시보드 **Manual Sync** 또는 Environment 에 직접 추가 필요. **안 붙어도 사이트는 정상**(실비밀이 이미 있음) — 하드닝만 미적용.
- [x] ⚠ HTTP 000 원인 규명 (2026-07-29) — 후보 (a)(b)(c) 전부 아님. **Supabase 무료 프로젝트가 7일 무활동으로 자동 일시정지**돼 startup 의 `init_db()` 가 연결에 실패했다. Events=`Exited with status 3`(startup 예외, import 예외면 1), 로그=`FATAL: (ENOTFOUND) tenant/user postgres.<ref> not found`. 사용자명에 `.<ref>` 가 붙어 있어 07-17 사고와 구분됨 — 인증 이전 단계라 비밀번호 문제도 아니다. 상세는 context-notes.md.
- [x] ⚠⚠ **정정 (2026-07-30) — 정지가 아니라 프로젝트 소멸.** Supabase 계정에 프로젝트가 없다. ref `ysvqawnyyrqenbmzikpm` 로 확인 — `<ref>.supabase.co`·`db.<ref>.supabase.co` 둘 다 **NXDOMAIN**(대조군 `supabase.com`·pooler 는 정상 해석). 정지 프로젝트는 호스트가 남으므로 삭제 확정. `(ENOTFOUND) tenant/user ... not found` 는 정지·삭제가 동일해 구분 불가였다 — **DNS 존재 여부로 가른다.**
- [x] **복구 = 새 Supabase 프로젝트** (사용자 선택). 일정 4건·계정은 백업 없어 소실. 코드 변경 0, `DATABASE_URL` 만 교체. **2026-08-07 사용자가 배포 완료.**
  - [x] Supabase New project — 리전 `Northeast Asia (Seoul)`, DB 비밀번호 저장
  - [x] Connect → **Session pooler**(5432) 문자열을 **복사 아이콘으로** 복사(드래그하면 `.<ref>` 유실 — 07-17 사고)
  - [x] Render → `work-calendar` → Environment → `DATABASE_URL` 교체(+ `CAL_SECRET`·`CAL_ADMIN_USER`·`CAL_ADMIN_PASS`·`CAL_REQUIRE_ENV=1` 존재 확인)
  - [x] Manual Deploy → Deploy latest commit → Events 탭 **`Deploy live`** 확인(화면 200 을 믿지 말 것 — 사고 2)
  - [x] 기동 성공 후 Supabase SQL Editor 에서 `events`·`users` **RLS 켜기** — 2026-08-07 사용자가 켬. 켠 뒤 `GET /events` 가 3건을 그대로 반환 = 소유자 연결이 RLS 를 우회함을 확인(**RLS 가 막으면 에러가 아니라 조용히 0건이 나오므로 건수 확인이 곧 검증이다**).
  - [x] 라이브 검증 — `GET /events` 200 + `headAttending` 키 / 미로그인 POST 401 / `admin/admin` 401 / 정적 200
  - [x] 사용자 브라우저로 일정 재입력 — 3건(북울산 현장점검·월간회의·경부고속 공정회의). PG 경로 `headAttending` 왕복·담당부서 보존 확인.
- [x] 재발 방지 — 외부 크론 **넣지 않기로 결정**(사용자, 2026-07-30). 7일 이상 안 쓰면 다시 정지·소멸 가능함을 알린 뒤의 선택. 정기 사용이 방지책.

---

# N. 복구 완료 — 라이브 부활 (2026-08-07)

사용자가 새 Supabase 프로젝트를 만들고 Render `DATABASE_URL` 을 교체해 배포했다. 코드 변경 0건.

## 재개 시점 실측 (배포 전)
- [x] 라이브 `GET /events` → **HTTP 000** (60s 무응답, TCP 는 0.15s 에 붙음 = Render 엣지 생존, 업스트림 없음). 07-26 이후 동일.
- [x] `ysvqawnyyrqenbmzikpm.supabase.co` → **NXDOMAIN 유지**(대조군 pooler 는 정상 해석) = 옛 프로젝트 소멸 확정 재확인.
- [x] 프론트 35 통과 / 백엔드 29 통과 — 코드 쪽은 처음부터 문제 없었음.

## 배포 후 검증 (전부 통과)
- [x] `GET /events` → **200**, 1.5s, `[]` (새 DB라 비어 있음)
- [x] 미로그인 `POST /events` → **401**
- [x] `admin/admin` 로그인 → **401** — 시드 관리자가 dev 기본값이 아니라 실제 `CAL_ADMIN_*` 로 만들어졌다는 뜻(사고 1 재발 아님)
- [x] 정적 6종(`/`, `/index.html`, `/css/styles.css`, `/src/main.js`, `/src/render.js`, `/vendor/date-fns.js`) → 전부 **200**
- [x] **새 코드(16f03b5) 라이브 확인** — `/events` 가 비어 데이터로 확인 불가 → **서빙 중인 소스에서 직접 grep**: `render.js` 의 `headAttending`·`chip-dept`, `main.js` 의 `syncHeadAttending`, `index.html` 의 `attendee-field`, `styles.css` 의 `is-edited` 모두 존재.
- [x] 스키마 — 서버 기동 성공 = startup `init_db()` 통과 = `events`·`users` 가 `head_attending` 포함 새 스키마로 생성됨.

## 남은 것
- [ ] **RLS 켜기** (Supabase SQL Editor). 테이블이 이제 있으니 바로 가능. 안 하면 anon 키만으로 로그인 없이 일정·계정 테이블을 읽고 지울 수 있다.
      `alter table public.events enable row level security;`
      `alter table public.users enable row level security;`
      정책은 만들지 않는다(앱은 소유자 연결이라 RLS 우회, 공개 REST 만 차단).
- [ ] 브라우저로 일정 재입력 — 본부장 **참석** 1건 + **미참석**+담당부서 1건.
- [x] **PG 경로 `headAttending` 왕복 검증 완료** — 참석 2건·미참석 1건이 그대로 왕복. 수정 경로도 확인(북울산 건은 `updatedAt` > `createdAt`). 참석자는 새 모델(`{name}` 만, `isHead` 없음).

---

# O. 모바일 반응형 — 주 보기 3일 (2026-08-07)

사용자 요청: "스마트폰으로 보니 화면짜임새가 이상하다, 삼일 일정이 한 화면에 보이도록".

## 실측한 문제 (390px 폭, 라이브)
- [x] **주 보기가 하루 반만 보였다** — `grid-auto-columns: 78%`. 옆 날짜가 잘려서 걸쳐 있었다.
- [x] **일정 없는 날도 세로로 긴 빈 상자** — `.week-col { min-height: 380px }` 고정.
- [x] **상단 바 버튼 글씨가 두 줄로 깨졌다** — "일정 더 / 하기", "로그 / 아웃", "사용자 / 관리".
- [ ] **월 보기 칩에 제목이 안 보인다** — 칸이 55px라 `신규`·`수정` 배지만 뜬다. **이번 범위 밖 — 미해결.**

## 확정된 설계 (사용자 선택)
- **주 보기 유지 + 컬럼 폭 1/3** — 한 화면에 3일, 옆으로 밀면 나머지 4일. 3일 전용 뷰로 교체하는 안은 탈락(주 개념이 사라지고 render·calendar·main 을 다 손대야 함).
- **오늘이 보이도록 자동 가로 이동** — 금요일에 열어도 월·화·수(빈 칸)가 아니라 오늘이 보인다.

## 구현
- [x] `css/styles.css` — `.week-grid` 에 `--week-gap: 6px` 변수화(모바일 폭 계산에 필요)
- [x] `css/styles.css` `@media (max-width: 760px)` — `grid-auto-columns: calc((100% - 2 * var(--week-gap)) / 3)`, `overscroll-behavior-x: contain`, `.week-col` min-height 380→250, head·events·chip 안쪽 여백 축소
- [x] `css/styles.css` 상단 바 — `.app-bar button { white-space: nowrap }` + `.bar-end` 줄바꿈 허용·`flex-shrink: 0`·gap 8px, `#add { margin-left: auto }`, ghost/seg 좌우 여백 축소
- [x] `src/main.js` — `scrollWeekToSelected()` 추가, `render()` 끝에서 호출

## 검증 (390px iframe 실측)
- [x] 컬럼 116px × 3 + gap 6px × 2 = 360px, 화면 폭 359px — **세 칸이 정확히 맞는다**(잘림 없음)
- [x] 오늘(금 7)이 가운데에 오도록 자동 이동 — `scrollLeft` 365
- [x] `›` 로 다음 주 → 오늘이 그 주에 없으니 월 10부터 시작(의도한 폴백)
- [x] 상단 바 — 글씨 깨짐 없음. 폭이 모자라 `일정 더하기`가 둘째 줄로 넘어가지만 잘리지 않는다.
- [x] **`.view-toggle` 이 `overflow: hidden` 이라 눌리면 '주'가 잘려 사라지는 것을 발견** — `nowrap` 을 넣자 드러났다. `flex-shrink: 0` 으로 막았다.
- [x] 넓은 화면(1536px) 7칸 그대로 — 회귀 없음
- [x] 모바일 월 보기 회귀 없음(원래 문제는 그대로)
- [x] 프론트 35 통과 / 백엔드 29 통과

---

# P. 모바일 월 보기 — 제목 + 시작시간만 (2026-08-07)

사용자 지시: "월보기에서는 제목과 시작시간만 표시". 폰에서만 적용하고 넓은 화면 월 보기는 그대로 둔다.

## 왜 이렇게밖에 안 되나
- 폰 폭 390px에 7칸 → 한 칸이 **48px**. 배지·분류·본부장 라벨이 제목 자리를 전부 먹어 **지금까지 `신규`·`수정` 배지만 보였다.**
- 라벨을 다 빼고 여백을 짜내도 제목은 한 줄 4자, 두 줄 8자가 한계다. 물리적 제약이지 설정 문제가 아니다.

## 구현
- [x] `src/render.js` — `startTimeLabel()`(끝시간 없이 시작시간만, 종일은 "종일") + `chip()` 에 `showStartTime` 옵션, `dayCell` 에서만 켠다
- [x] `css/styles.css` — `.chip-start` 기본 `display: none`(넓은 화면은 기존 `.chip-time` 이 범위까지 표시)
- [x] `css/styles.css` `@media (max-width: 760px)` — 월 보기 칩에서 배지·분류·본부장·우선 숨김, `.chip-start`+`.chip-title`(2줄)만 남김
- [x] `.month-grid` 행 높이 `minmax(78px, 1fr)` → `minmax(84px, auto)` — 1fr 이면 빈 주까지 가장 바쁜 주 높이로 늘어난다
- [x] 폭 짜내기 — `.cal-root` 좌우 14→8px, 그리드 gap 4→3px, `.day` 좌우 4→2px, 칩 좌우 4→3px
- [x] 테스트 4건 추가(시작시간 라벨 형식·종일·월 칩에 있음·주 칩에 없음·월 렌더 반영)

## 검증 (390px 실측)
- [x] 제목이 보인다 — `09:30 / 경부고속 공…`, `12:00 / 북울산 현장…`, `종일 / 하계 휴가`
- [x] 월 보기 전체 높이 **1095px → 614px**(빈 주 84px, 바쁜 주 179px)
- [x] 칸 폭 48px, 제목 폭 35px — 두 줄 8자
- [x] 넓은 화면(1536px) 월 보기 회귀 없음 — 배지·분류·본부장·시간 범위 그대로, `.chip-start` 는 `display:none`
- [x] 프론트 40 통과(10+19+11) / 백엔드 29 통과

## 남은 것 / 알아둘 것
- **변경 표시가 월 보기에서 라벨 없이 선(線)만 남는다.** CLAUDE.md 는 "색만 쓰지 말고 라벨 병행"을 요구하지만 48px에 `신규` 배지와 제목이 같이 못 들어간다. 주 보기와 상세에는 배지가 그대로 있다. **의도된 맞바꿈.**
- 본부장 참석은 라벨 대신 **파란 칩 + 굵은 파란 제목**으로 남는다(굵기가 비-색 단서 역할).
- 공휴일 이름은 여전히 잘린다(`광복절`→`광`). 이번 범위 밖.

## 복구 마감 (2026-08-07)

- [x] RLS 켬 — 남은 보안 항목 없음
- [x] 라이브 검증 — `GET /events` 200(3건) / 미로그인 POST 401 / `admin/admin` 401 / 정적 200
- [ ] **쓰기 경로 실측만 남음** — 로그인이 필요해 외부에서 확인 불가. 사용자가 브라우저로 일정 추가·수정해보면 끝.
- ⚠ **7일 무활동 타이머가 2026-08-07 부터 다시 돈다.** 크론을 안 넣기로 했으므로 주 1회 이상 접속이 유일한 방지책이다. 안 그러면 새 프로젝트도 정지·소멸 경로를 그대로 간다.

## 실기기 확인 (2026-08-07)

- [x] **사용자가 실제 스마트폰으로 확인 — "잘 나온다".** 주 보기 3일 배치와 월 보기 제목+시작시간이 실기기에서 의도대로 보인다. 390px iframe 미리보기가 실기기와 어긋나지 않았음이 확인됐다(다음에도 이 방법을 믿고 쓸 수 있다).
- [ ] 쓰기 경로 실측 — 로그인이 필요해 외부 검증 불가. 브라우저에서 일정 추가·수정 한 번이면 닫힌다.

## 주 보기 재배치 — 상단 날짜 스트립 + 하단 하루 상세 (2026-08-08)

요청: 주 보기를 "위에 일자, 아래에 그 날 세부일정" 으로. 상세는 **시간순 목록**(타임라인 아님), 폰·데스크톱 **공통** 적용 — 둘 다 사용자가 직접 고름.

- [x] `render.js` — `renderWeek()` 를 `.week-strip`(7일) + `.day-panel`(선택일 상세)로 교체
- [x] `render.js` — `chip()` 에 `showLocation` 옵션 (하단 상세는 넓으니 장소까지 보인다)
- [x] `main.js` — 스트립 클릭 = 날짜 고르기(폼 안 열림). 월 보기 셀은 기존대로 폼
- [x] `main.js` — 주 이동(‹ ›) 시 선택일도 같이 옮긴다(안 그러면 하단이 안 보이는 날을 표시)
- [x] `main.js` — `scrollWeekToSelected()` 제거(가로 스크롤 구조가 사라짐)
- [x] `main.js` — 주 보기 ↑↓ 를 ±1일 → ±7일로(가로 한 줄이라 상하는 주 이동이 맞다)
- [x] `styles.css` — `.week-grid`/`.week-col` 계열 교체 + 모바일 3일 스크롤 블록 제거
- [x] `test/render.smoke.mjs` — `.week-grid` 검사 교체 + 스트립·상세 테스트 보강
- [x] `npm test` 통과

## 검증 (2026-08-08)
- [x] 프론트 **47 통과**(10 + 26 + 11). 주 보기 스모크가 19 → 26 으로 늘었다
- [x] 390px 실측 — 한 칸 50.1px, 요일/날짜/점 다 들어감. 칩은 시간·분류·제목·`장소 · 부서` 3줄
- [x] 1536px 실측 — 칩이 한 줄(높이 33px). 왼쪽 시간·제목, 오른쪽 끝 장소·부서
- [x] 오늘(잉크 블록)과 고른 날(액센트 테두리)이 겹쳐도 둘 다 읽힌다
- [x] 공휴일 — 8/15 숫자 `#b4452f` + 상세 제목 옆 `광복절`
- [x] 토 `#3f6691` / 일 `#b4452f`
- [x] 주 이동 시 고른 날이 같은 요일로 따라감(8/8 토 → 7/11 토)
- [x] 월 보기 회귀 없음 — 42칸, 그리드 614px, `chip-start` 6개(직전 기록과 같은 수치)
