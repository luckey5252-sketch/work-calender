# 실 Postgres(Supabase) 라이브 스모크 — DATABASE_URL 을 주면 실제 DB로 CRUD·인증·계정관리 검증
# 실행(프로젝트 루트에서):
#   DATABASE_URL='postgresql://postgres:<pw>@<host>:5432/postgres' python -m backend.smoke_pg
# test_api.py 와 같은 체크를 SQLite 대신 실 Postgres 로 돌린다. 끝나면 테스트 데이터를 지워
# 배포용으로 빈 users/events 를 남긴다(실 배포의 init_db 가 진짜 관리자를 다시 시드).

import os
import sys

# 시드 관리자·세션 키는 스모크 전용 값으로(끝에 정리한다). import 전에 잡아야 config 가 읽는다.
os.environ.setdefault("CAL_ADMIN_USER", "tester")
os.environ.setdefault("CAL_ADMIN_PASS", "pw123")
os.environ.setdefault("CAL_SECRET", "smoke-secret")

from fastapi.testclient import TestClient  # noqa: E402

from backend import config, db  # noqa: E402
from backend.main import app  # noqa: E402

ADMIN = config.ADMIN_USER
ADMIN_PW = config.ADMIN_PASS

SAMPLE = {
    "title": "SMOKE 주간 회의",
    "time": {"start": "2026-07-10T01:00:00+00:00", "end": None, "allDay": False},
    "category": "회의",
    "priority": "high",
    "location": "3층 회의실",
    "department": "기획",
    "headAttending": True,
    "attendees": [{"name": "이대리"}],
}

_passed = 0


def check(name, cond):
    global _passed
    assert cond, f"실패: {name}"
    print(f"  ok  {name}")
    _passed += 1


def cleanup():
    """스모크가 만든 행을 지운다(실 배포가 깨끗한 DB에서 시작하도록)."""
    with db.connect() as conn:
        conn.execute("DELETE FROM events WHERE title = ?", (SAMPLE["title"],))
        conn.execute("DELETE FROM users WHERE username IN (?, ?)", (ADMIN, "editor"))


def run():
    # 이 스모크는 빈(신규) DB 를 전제한다 — 관리자 삭제 규칙 검증이 tester 가 유일 관리자임에 기댄다.
    db.init_db()  # 스키마 보장 + 비어있으면 시드 관리자(tester) 생성
    # 이전 실패 잔여물만 정리(관리자는 유지 — 방금 시드했을 수 있음).
    with db.connect() as conn:
        conn.execute("DELETE FROM events WHERE title = ?", (SAMPLE["title"],))
        conn.execute("DELETE FROM users WHERE username = ?", ("editor",))
    with TestClient(app) as c:  # startup 이 init_db 재호출(멱등)
        check("공개로 목록 읽기(빈 목록 아님도 허용)", isinstance(c.get("/events").json(), list))

        r = c.post("/events", json=SAMPLE)
        check("미로그인 생성은 401", r.status_code == 401)

        r = c.post("/auth/login", json={"username": ADMIN, "password": "nope"})
        check("틀린 비밀번호는 401", r.status_code == 401)

        r = c.post("/auth/login", json={"username": ADMIN, "password": ADMIN_PW})
        check("로그인 성공", r.status_code == 200 and r.json()["user"] == ADMIN)
        check("me 가 로그인 사용자를 반환", c.get("/auth/me").json()["user"] == ADMIN)

        r = c.post("/events", json=SAMPLE)
        body = r.json()
        check("로그인 후 생성은 201", r.status_code == 201)
        check("서버가 id 를 채운다", bool(body.get("id")))
        check("생성 시 createdAt==updatedAt", body["createdAt"] == body["updatedAt"])
        check("headAttending 보존", body["headAttending"] is True)
        check("참석자 이름 보존", body["attendees"][0]["name"] == "이대리")
        check("allDay 불리언 보존", body["time"]["allDay"] is False)
        ev_id = body["id"]

        r = c.get(f"/events/{ev_id}")
        check("단건 조회 성공", r.status_code == 200 and r.json()["id"] == ev_id)

        patched = {**SAMPLE, "title": SAMPLE["title"]}  # 제목 유지(정리 필터 일관)
        patched["location"] = "본관 대회의실"
        r = c.patch(f"/events/{ev_id}", json=patched)
        pb = r.json()
        check("수정은 200", r.status_code == 200)
        check("수정 후 장소 반영", pb["location"] == "본관 대회의실")
        check("수정은 createdAt 유지", pb["createdAt"] == body["createdAt"])
        check("수정은 updatedAt 갱신", pb["updatedAt"] >= body["updatedAt"])

        c.post("/auth/logout")
        check("로그아웃 후 삭제는 401", c.delete(f"/events/{ev_id}").status_code == 401)

        c.post("/auth/login", json={"username": ADMIN, "password": ADMIN_PW})
        check("삭제는 204", c.delete(f"/events/{ev_id}").status_code == 204)
        check("삭제 후 단건은 404", c.get(f"/events/{ev_id}").status_code == 404)

        # ---- 사용자 관리(관리자 전용) ----
        check("시드 계정은 관리자", c.get("/auth/me").json()["isAdmin"] is True)
        check("관리자는 사용자 목록 조회",
              any(u["username"] == ADMIN for u in c.get("/users").json()))

        r = c.post("/users", json={"username": "editor", "password": "pw", "isAdmin": False})
        check("사용자 추가는 201", r.status_code == 201)
        check("중복 아이디는 409",
              c.post("/users", json={"username": "editor", "password": "pw"}).status_code == 409)

        c.post("/auth/login", json={"username": "editor", "password": "pw"})
        check("일반 사용자는 관리자 아님", c.get("/auth/me").json()["isAdmin"] is False)
        check("비관리자 사용자목록은 403", c.get("/users").status_code == 403)

        c.post("/auth/login", json={"username": ADMIN, "password": ADMIN_PW})
        check("자기 자신 삭제는 400", c.delete(f"/users/{ADMIN}").status_code == 400)
        check("일반 사용자 삭제는 204", c.delete("/users/editor").status_code == 204)
        check("마지막 관리자 삭제는 400", c.delete(f"/users/{ADMIN}").status_code == 400)

    print(f"\n{_passed} passed (실 Postgres)")


if __name__ == "__main__":
    # DATABASE_URL 이 없으면 이 스크립트는 의미가 없다(그냥 test_api.py 를 쓰라).
    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL 미설정 - Supabase 연결 문자열을 주고 실행하라.", file=sys.stderr)
        print("예: DATABASE_URL='postgresql://postgres:<pw>@<host>:5432/postgres' "
              "python -m backend.smoke_pg", file=sys.stderr)
        sys.exit(2)
    try:
        run()
    finally:
        cleanup()
        # 출력의 em-dash 는 Windows cp949 콘솔에서 UnicodeEncodeError 를 낸다(하이픈 사용).
        print("정리 완료 - users/events 의 스모크 데이터 삭제(배포 시 실 관리자 재시드).")
