# 백엔드 API 스모크 테스트 — 읽기공개/쓰기로그인, 서버가 채우는 타임스탬프 검증
# 실행: python -m backend.test_api  (프로젝트 루트에서)

import os
import tempfile

# import 전에 환경을 잡는다(config 가 import 시점에 env 를 읽음). 임시 DB 로 격리.
os.environ["CAL_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["CAL_ADMIN_USER"] = "tester"
os.environ["CAL_ADMIN_PASS"] = "pw123"
os.environ["CAL_SECRET"] = "test-secret"

from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app  # noqa: E402

SAMPLE = {
    "title": "주간 회의",
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


def run():
    with TestClient(app) as c:
        check("빈 목록은 공개로 읽힌다", c.get("/events").json() == [])

        r = c.post("/events", json=SAMPLE)
        check("미로그인 생성은 401", r.status_code == 401)

        r = c.post("/auth/login", json={"username": "tester", "password": "nope"})
        check("틀린 비밀번호는 401", r.status_code == 401)

        r = c.post("/auth/login", json={"username": "tester", "password": "pw123"})
        check("로그인 성공", r.status_code == 200 and r.json()["user"] == "tester")

        check("me 가 로그인 사용자를 반환", c.get("/auth/me").json()["user"] == "tester")

        r = c.post("/events", json=SAMPLE)
        body = r.json()
        check("로그인 후 생성은 201", r.status_code == 201)
        check("서버가 id 를 채운다", bool(body.get("id")))
        check("생성 시 createdAt==updatedAt", body["createdAt"] == body["updatedAt"])
        check("headAttending 보존", body["headAttending"] is True)
        check("참석자 이름 보존", body["attendees"][0]["name"] == "이대리")
        check("allDay 불리언 보존", body["time"]["allDay"] is False)
        ev_id = body["id"]

        # 수정 시 updatedAt 은 서버가 갱신(createdAt 유지)
        patched = {**SAMPLE, "title": "주간 회의(수정)"}
        r = c.patch(f"/events/{ev_id}", json=patched)
        pb = r.json()
        check("수정은 200", r.status_code == 200)
        check("수정 후 제목 반영", pb["title"] == "주간 회의(수정)")
        check("수정은 createdAt 유지", pb["createdAt"] == body["createdAt"])
        check("수정은 updatedAt 갱신", pb["updatedAt"] >= body["updatedAt"])

        check("목록에 1건", len(c.get("/events").json()) == 1)

        # 로그아웃 후 쓰기는 다시 막힌다
        c.post("/auth/logout")
        check("로그아웃 후 삭제는 401", c.delete(f"/events/{ev_id}").status_code == 401)

        # 다시 로그인해 삭제
        c.post("/auth/login", json={"username": "tester", "password": "pw123"})
        check("삭제는 204", c.delete(f"/events/{ev_id}").status_code == 204)
        check("삭제 후 빈 목록", c.get("/events").json() == [])

        # ---- 사용자 관리(관리자 전용) ----
        check("시드 계정은 관리자", c.get("/auth/me").json()["isAdmin"] is True)
        users = c.get("/users").json()
        check("관리자는 사용자 목록 조회", any(u["username"] == "tester" for u in users))

        r = c.post("/users", json={"username": "editor", "password": "pw", "isAdmin": False})
        check("사용자 추가는 201", r.status_code == 201)
        r = c.post("/users", json={"username": "editor", "password": "pw"})
        check("중복 아이디는 409", r.status_code == 409)

        # 비관리자로 전환 → 관리 라우트 차단, 일정 편집은 허용
        c.post("/auth/login", json={"username": "editor", "password": "pw"})
        check("일반 사용자는 관리자 아님", c.get("/auth/me").json()["isAdmin"] is False)
        check("비관리자 사용자목록은 403", c.get("/users").status_code == 403)
        check("비관리자 사용자추가는 403",
              c.post("/users", json={"username": "x", "password": "y"}).status_code == 403)

        # 관리자 복귀 → 삭제 규칙
        c.post("/auth/login", json={"username": "tester", "password": "pw123"})
        check("자기 자신 삭제는 400", c.delete("/users/tester").status_code == 400)
        check("일반 사용자 삭제는 204", c.delete("/users/editor").status_code == 204)
        check("마지막 관리자 삭제는 400", c.delete("/users/tester").status_code == 400)

    print(f"\n{_passed} passed")


if __name__ == "__main__":
    run()
