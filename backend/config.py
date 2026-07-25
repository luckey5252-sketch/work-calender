# 백엔드 설정을 환경변수에서 읽는 모듈 (비밀·경로를 코드에 하드코딩하지 않는다)

import os
import sys
from pathlib import Path


def _truthy(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on")


# 운영 모드 게이트(fail-open → fail-closed). CAL_REQUIRE_ENV=1 이면 필수 비밀이 없을 때
# 기본값으로 조용히 뜨는 대신 기동을 실패시킨다. render.yaml 은 이 값을 리터럴로 박아
# Blueprint Apply 에서 빠지지 않게 한다 — sync:false 인 DATABASE_URL/CAL_ADMIN_* 를
# 건너뛰면 여기서 걸려, 공개 URL 에 admin/admin·휘발성 SQLite 로 뜨던 사고를 막는다.
REQUIRE_ENV = _truthy("CAL_REQUIRE_ENV")
_missing = []

# SQLite 파일 경로. 기본은 backend/ 옆의 calendar.db.
DB_PATH = os.environ.get("CAL_DB", str(Path(__file__).resolve().parent / "calendar.db"))

# Supabase(또는 임의 Postgres) 연결 문자열. 설정되면 SQLite 대신 Postgres 를 쓴다.
# Supabase 대시보드 Connect > Session pooler 의 문자열을 그대로 쓴다(손으로 조립하지 말 것).
# 예: postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres
# 사용자 이름의 `.<ref>` 는 pooler 가 프로젝트를 식별하는 값이라 빠뜨리면 인증이 거부된다
# (에러는 password authentication failed 로 나와 비밀번호 문제처럼 보인다).
# Direct connection(db.<ref>.supabase.co)은 IPv6 전용이라 IPv4 호스트에서 실패한다.
# 운영에서 없으면 휘발성 SQLite 로 떠 데이터가 재시작마다 사라지므로 필수로 강제한다.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL and REQUIRE_ENV:
    _missing.append("DATABASE_URL")

# 세션 쿠키 서명 키. 운영에서는 반드시 CAL_SECRET 로 주입한다.
SECRET = os.environ.get("CAL_SECRET")
if not SECRET:
    if REQUIRE_ENV:
        _missing.append("CAL_SECRET")
    else:
        SECRET = "dev-insecure-secret-change-me"
        print("[config] CAL_SECRET 미설정 → 개발용 기본 키 사용(운영 금지)", file=sys.stderr)

# HTTPS 뒤(운영)에서는 세션 쿠키에 Secure 플래그를 켠다. CAL_HTTPS=1 로 활성화.
# 로컬 http 개발에선 꺼둬야 세션이 유지된다(기본 꺼짐).
SESSION_HTTPS_ONLY = _truthy("CAL_HTTPS")

# 최초 실행 시 users 가 비어있으면 만들 시드 관리자 계정.
ADMIN_USER = os.environ.get("CAL_ADMIN_USER")
ADMIN_PASS = os.environ.get("CAL_ADMIN_PASS")
if not ADMIN_USER or not ADMIN_PASS:
    if REQUIRE_ENV:
        if not ADMIN_USER:
            _missing.append("CAL_ADMIN_USER")
        if not ADMIN_PASS:
            _missing.append("CAL_ADMIN_PASS")
    else:
        ADMIN_USER = ADMIN_USER or "admin"
        ADMIN_PASS = ADMIN_PASS or "admin"
        print(
            "[config] CAL_ADMIN_USER/CAL_ADMIN_PASS 미설정 → 기본 admin/admin 로 시드"
            "(운영 금지, 로그인 후 변경 권장)",
            file=sys.stderr,
        )

# 운영 모드인데 필수 비밀이 빠졌으면 여기서 기동을 세운다(import 시점 → uvicorn 이 비정상 종료).
if _missing:
    raise RuntimeError(
        "운영 모드(CAL_REQUIRE_ENV=1)인데 필수 환경변수가 없습니다: "
        + ", ".join(_missing)
        + ". Render 대시보드 Environment 에 값을 넣고 재배포하세요."
    )
