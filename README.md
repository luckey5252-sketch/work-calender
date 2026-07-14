# 업무 달력

웹으로 보는 업무용 달력. 월/주 보기, 일정 CRUD, 분류(회의·출장·기타), 마감·우선순위,
참석자(본부장 강조), 변경 표시(24h), 한국 공휴일, 로그인(읽기 공개·편집 제한).

## 구조

- `index.html`, `css/`, `src/`, `vendor/` — 프론트(바닐라 JS, 빌드 없음)
- `backend/` — FastAPI + SQLite. 일정 REST API + 세션 로그인 + 프론트 정적 서빙
- `test/` — 프론트 테스트(node), `backend/test_api.py` — 백엔드 테스트

읽기(GET)는 공개, 생성·수정·삭제(POST/PATCH/DELETE)는 로그인 필요.
`createdAt`/`updatedAt`은 서버가 채운다(변경 표시의 근거).

**계정**은 관리자가 관리한다. 관리자로 로그인하면 오른쪽 위 "사용자 관리"에서 사용자를
추가·삭제한다(일반/관리자 지정 가능). 일반 사용자는 일정 편집만, 계정 관리는 관리자만.
자기 자신·마지막 관리자는 삭제할 수 없다.

## 실행

백엔드가 프론트까지 같이 서빙하므로 서버 하나만 띄우면 된다.

```
python -m pip install -r backend/requirements.txt   # 최초 1회
npm run serve                                        # http://127.0.0.1:8000
```

브라우저에서 http://127.0.0.1:8000 접속. 오른쪽 위 "로그인"으로 편집 권한을 얻는다.

## 환경변수 (비밀은 코드에 두지 않는다)

| 변수 | 용도 | 미설정 시 |
|------|------|-----------|
| `CAL_SECRET` | 세션 쿠키 서명 키 | 개발용 기본값(경고) |
| `CAL_ADMIN_USER` / `CAL_ADMIN_PASS` | 최초 시드 관리자 계정 | `admin` / `admin`(경고) |
| `DATABASE_URL` | Supabase(Postgres) 연결 문자열. 설정 시 SQLite 대신 사용 | 미설정 → 로컬 SQLite |
| `CAL_DB` | SQLite 파일 경로(`DATABASE_URL` 없을 때만) | `backend/calendar.db` |
| `CAL_HTTPS` | `1`이면 세션 쿠키에 Secure 플래그(HTTPS 뒤 운영용) | 꺼짐(로컬 http 개발) |

저장은 **`DATABASE_URL`이 있으면 Supabase(Postgres), 없으면 로컬 SQLite**로 자동 분기한다.
쿼리는 한 벌만 두고(Postgres일 때 얇은 어댑터가 `?`/`:name`을 `%s`/`%(name)s`로 번역),
로컬 개발·테스트는 SQLite로 오프라인 유지, 운영만 Supabase로 간다.

운영에서는 `CAL_SECRET`과 관리자 계정을 반드시 환경변수로 지정한다.

## 배포 (Render, 웹 공개)

다른 사람도 웹에서 쓰려면 인터넷에서 닿는 곳에 올리고 HTTPS를 써야 한다(로그인이
비밀번호·세션 쿠키를 주고받으므로 평문 HTTP 공개는 금지). **DB는 Supabase(무료 Postgres),
앱은 Render(무료)** 조합으로 $0 배포한다. 저장소에 `render.yaml` 블루프린트가 있다.

**1) Supabase — DB 준비**

1. supabase.com 에서 프로젝트 생성(무료). 리전은 사용자와 가까운 곳.
2. Project Settings → Database → **Connection string** 복사. 앱은 상시 서버라
   **Direct connection** 또는 **Session pooler** 문자열을 쓴다(트랜잭션 풀러도 동작하도록
   코드가 프리페어를 끈다). `[YOUR-PASSWORD]` 자리를 실제 DB 비밀번호로 바꾼다.
   - 표(`events`/`users`)와 시드 관리자는 앱이 처음 뜰 때 **자동 생성**된다.

**2) 앱을 git 저장소로** — 이 폴더를 GitHub에 올린다(아래 "저장소로 만들기").

**3) Render — 앱 배포**

1. Render 대시보드 → **New › Blueprint** → 저장소 연결 → `render.yaml` 인식.
2. 배포 전 **환경변수를 직접 입력**한다(블루프린트가 값 없이 자리만 잡아둠).
   - `DATABASE_URL` — 위 Supabase 연결 문자열.
   - `CAL_ADMIN_USER`, `CAL_ADMIN_PASS` — 실제 관리자 계정(admin/admin 금지).
   - `CAL_SECRET`은 Render가 자동 생성, `CAL_HTTPS=1`은 블루프린트가 설정.
3. 배포되면 `https://<이름>.onrender.com` 에서 접속. 첫 로그인은 위 관리자 계정으로,
   이후 "사용자 관리"에서 팀원 계정을 추가한다.

**무료 티어 주의** — Render free 는 미접속 시 서버가 잠들어 첫 요청이 느리다(수십 초).
Supabase free 프로젝트는 7일 미접속 시 일시정지된다(데이터는 보존, 접속하면 깨어남).
상시 빠른 응답이 필요하면 유료 플랜으로 올린다(`render.yaml`의 `plan: free` → `starter`).

### 저장소로 만들기 (최초 1회)

이 폴더는 아직 독립 git 저장소가 아니다. Render 연결 전에 만든다.

```
git init
git add -A          # .gitignore 가 calendar.db·node_modules 제외
git commit -m "chore: 배포 준비 (Render 블루프린트)"
# GitHub 에 빈 저장소를 만든 뒤:
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

## 테스트

```
npm test                    # 프론트: 날짜계산·렌더·공휴일 (31)
python -m backend.test_api  # 백엔드: 읽기공개/쓰기로그인/타임스탬프·계정관리 (28)
```

## 한계

- 공휴일은 2025–2030 하드코딩 표(음력·대체공휴일 포함). 그 밖 연도는 표시 없음.
- 동시 편집은 `updatedAt` 기준 마지막-쓰기-우선(충돌 머지 없음).
