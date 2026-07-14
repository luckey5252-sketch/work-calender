# FastAPI 앱 — 일정 CRUD(읽기 공개/쓰기 로그인) + 세션 인증 + 프론트 정적 서빙

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware

from . import config, db
from .security import hash_password, verify_password

FRONTEND_DIR = Path(__file__).resolve().parent.parent


# ---- 입력 모델 --------------------------------------------------------------
class Attendee(BaseModel):
    name: str
    isHead: bool = False


class EventTime(BaseModel):
    start: str
    end: str | None = None
    allDay: bool = False


class EventIn(BaseModel):
    title: str
    time: EventTime
    location: str = ""
    department: str = ""
    category: str = ""
    priority: str = "normal"
    attendees: list[Attendee] = Field(default_factory=list)


class Login(BaseModel):
    username: str
    password: str


class UserIn(BaseModel):
    username: str
    password: str
    isAdmin: bool = False


# ---- 앱 ---------------------------------------------------------------------
app = FastAPI(title="업무 달력 API")
app.add_middleware(
    SessionMiddleware,
    secret_key=config.SECRET,
    same_site="lax",
    https_only=config.SESSION_HTTPS_ONLY,  # 운영 HTTPS 에서 Secure 쿠키
)


@app.on_event("startup")
def _startup():
    db.init_db()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_user(request: Request) -> str:
    """로그인 세션이 없으면 401. 쓰기 라우트의 게이트."""
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return user


def is_admin(username: str) -> bool:
    with db.connect() as conn:
        row = conn.execute(
            "SELECT is_admin FROM users WHERE username = ?", (username,)
        ).fetchone()
    return bool(row and row["is_admin"])


def require_admin(request: Request) -> str:
    """관리자 세션이 아니면 403. 사용자 관리 라우트의 게이트."""
    user = require_user(request)
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


# ---- 인증 -------------------------------------------------------------------
@app.post("/auth/login")
def login(body: Login, request: Request):
    with db.connect() as conn:
        row = conn.execute(
            "SELECT pw_hash FROM users WHERE username = ?", (body.username,)
        ).fetchone()
    if not row or not verify_password(body.password, row["pw_hash"]):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    request.session["user"] = body.username
    return {"user": body.username, "isAdmin": is_admin(body.username)}


@app.post("/auth/logout")
def logout(request: Request):
    request.session.pop("user", None)
    return {"user": None}


@app.get("/auth/me")
def me(request: Request):
    user = request.session.get("user")
    return {"user": user, "isAdmin": is_admin(user) if user else False}


# ---- 사용자 관리 (관리자 전용) ---------------------------------------------
@app.get("/users")
def list_users(request: Request, admin: str = Depends(require_admin)):
    with db.connect() as conn:
        rows = conn.execute(
            "SELECT username, is_admin FROM users ORDER BY username"
        ).fetchall()
    return [{"username": r["username"], "isAdmin": bool(r["is_admin"])} for r in rows]


@app.post("/users", status_code=201)
def create_user(body: UserIn, request: Request, admin: str = Depends(require_admin)):
    username = body.username.strip()
    if not username or not body.password:
        raise HTTPException(status_code=400, detail="아이디와 비밀번호를 입력하세요.")
    with db.connect() as conn:
        dup = conn.execute(
            "SELECT 1 FROM users WHERE username = ?", (username,)
        ).fetchone()
        if dup:
            raise HTTPException(status_code=409, detail="이미 있는 아이디입니다.")
        conn.execute(
            "INSERT INTO users (username, pw_hash, is_admin) VALUES (?, ?, ?)",
            (username, hash_password(body.password), 1 if body.isAdmin else 0),
        )
    return {"username": username, "isAdmin": body.isAdmin}


@app.delete("/users/{username}", status_code=204)
def delete_user(username: str, request: Request, admin: str = Depends(require_admin)):
    if username == admin:
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다.")
    with db.connect() as conn:
        target = conn.execute(
            "SELECT is_admin FROM users WHERE username = ?", (username,)
        ).fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        # 마지막 관리자를 지워 잠기는 상황을 막는다.
        if target["is_admin"]:
            n = conn.execute("SELECT COUNT(*) AS n FROM users WHERE is_admin = 1").fetchone()["n"]
            if n <= 1:
                raise HTTPException(status_code=400, detail="마지막 관리자는 삭제할 수 없습니다.")
        conn.execute("DELETE FROM users WHERE username = ?", (username,))
    return JSONResponse(status_code=204, content=None)


# ---- 일정 CRUD --------------------------------------------------------------
@app.get("/events")
def list_events():
    with db.connect() as conn:
        rows = conn.execute("SELECT * FROM events ORDER BY start").fetchall()
    return [db.row_to_event(r) for r in rows]


@app.get("/events/{event_id}")
def get_event(event_id: str):
    with db.connect() as conn:
        row = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    return db.row_to_event(row)


def _write_fields(ev: EventIn):
    return {
        "title": ev.title,
        "start": ev.time.start,
        "end": ev.time.end,
        "all_day": 1 if ev.time.allDay else 0,
        "location": ev.location,
        "department": ev.department,
        "category": ev.category,
        "priority": ev.priority,
        "attendees": json.dumps([a.model_dump() for a in ev.attendees], ensure_ascii=False),
    }


@app.post("/events", status_code=201)
def create_event(ev: EventIn, request: Request, user: str = Depends(require_user)):
    ts = now_iso()  # created/updated 는 서버가 채운다(클라 시계 불신)
    f = _write_fields(ev)
    new_id = uuid.uuid4().hex
    with db.connect() as conn:
        conn.execute(
            """INSERT INTO events
               (id, title, start, "end", all_day, location, department, category,
                priority, attendees, created_at, updated_at)
               VALUES (:id, :title, :start, :end, :all_day, :location, :department,
                :category, :priority, :attendees, :created_at, :updated_at)""",
            {**f, "id": new_id, "created_at": ts, "updated_at": ts},
        )
        row = conn.execute("SELECT * FROM events WHERE id = ?", (new_id,)).fetchone()
    return db.row_to_event(row)


@app.patch("/events/{event_id}")
def update_event(
    event_id: str, ev: EventIn, request: Request, user: str = Depends(require_user)
):
    f = _write_fields(ev)
    with db.connect() as conn:
        exists = conn.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
        conn.execute(
            """UPDATE events SET title=:title, start=:start, "end"=:end, all_day=:all_day,
               location=:location, department=:department, category=:category,
               priority=:priority, attendees=:attendees, updated_at=:updated_at
               WHERE id=:id""",
            {**f, "id": event_id, "updated_at": now_iso()},  # updated_at 서버 갱신
        )
        row = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    return db.row_to_event(row)


@app.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: str, request: Request, user: str = Depends(require_user)):
    with db.connect() as conn:
        cur = conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    return JSONResponse(status_code=204, content=None)


# ---- 프론트 정적 서빙 (API 라우트 뒤에 마운트 → API 우선) -------------------
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
