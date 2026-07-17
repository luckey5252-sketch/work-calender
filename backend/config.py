# 백엔드 설정을 환경변수에서 읽는 모듈 (비밀·경로를 코드에 하드코딩하지 않는다)

import os
import sys
from pathlib import Path

# SQLite 파일 경로. 기본은 backend/ 옆의 calendar.db.
DB_PATH = os.environ.get("CAL_DB", str(Path(__file__).resolve().parent / "calendar.db"))

# Supabase(또는 임의 Postgres) 연결 문자열. 설정되면 SQLite 대신 Postgres 를 쓴다.
# Supabase 대시보드 Connect > Session pooler 의 문자열을 그대로 쓴다(손으로 조립하지 말 것).
# 예: postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres
# 사용자 이름의 `.<ref>` 는 pooler 가 프로젝트를 식별하는 값이라 빠뜨리면 인증이 거부된다
# (에러는 password authentication failed 로 나와 비밀번호 문제처럼 보인다).
# Direct connection(db.<ref>.supabase.co)은 IPv6 전용이라 IPv4 호스트에서 실패한다.
DATABASE_URL = os.environ.get("DATABASE_URL")

# 세션 쿠키 서명 키. 운영에서는 반드시 CAL_SECRET 로 주입한다.
SECRET = os.environ.get("CAL_SECRET")
if not SECRET:
    SECRET = "dev-insecure-secret-change-me"
    print("[config] CAL_SECRET 미설정 → 개발용 기본 키 사용(운영 금지)", file=sys.stderr)

# HTTPS 뒤(운영)에서는 세션 쿠키에 Secure 플래그를 켠다. CAL_HTTPS=1 로 활성화.
# 로컬 http 개발에선 꺼둬야 세션이 유지된다(기본 꺼짐).
SESSION_HTTPS_ONLY = os.environ.get("CAL_HTTPS", "").strip().lower() in ("1", "true", "yes", "on")

# 최초 실행 시 users 가 비어있으면 만들 시드 관리자 계정.
ADMIN_USER = os.environ.get("CAL_ADMIN_USER")
ADMIN_PASS = os.environ.get("CAL_ADMIN_PASS")
if not ADMIN_USER or not ADMIN_PASS:
    ADMIN_USER = ADMIN_USER or "admin"
    ADMIN_PASS = ADMIN_PASS or "admin"
    print(
        "[config] CAL_ADMIN_USER/CAL_ADMIN_PASS 미설정 → 기본 admin/admin 로 시드"
        "(운영 금지, 로그인 후 변경 권장)",
        file=sys.stderr,
    )
