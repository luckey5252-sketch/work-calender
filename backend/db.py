# 저장(SQLite/Postgres)을 격리하는 모듈 (스키마·초기화·행↔일정 변환)
# config.DATABASE_URL 이 있으면 Supabase(Postgres), 없으면 로컬 SQLite.
# 쿼리는 sqlite 스타일(?/:name)로 쓰고, Postgres 일 때만 얇은 어댑터가 %s/%(name)s 로
# 번역한다 → main.py 쿼리를 그대로 둔다.

import json
import re
import sqlite3
from contextlib import contextmanager

from . import config
from .security import hash_password

# "end" 는 Postgres 예약어라 따옴표로 감싼다(SQLite 도 따옴표 식별자를 허용해 양쪽에서 동작).
SCHEMA_STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS events (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      start       TEXT NOT NULL,
      "end"       TEXT,
      all_day     INTEGER NOT NULL DEFAULT 0,
      location    TEXT,
      department  TEXT,
      category    TEXT,
      priority    TEXT,
      attendees   TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS users (
      username    TEXT PRIMARY KEY,
      pw_hash     TEXT NOT NULL,
      is_admin    INTEGER NOT NULL DEFAULT 0
    )""",
]

_NAMED = re.compile(r":(\w+)")


class _PgAdapter:
    """psycopg 연결을 sqlite3 스타일(execute(sql, params) with ?/:name)로 감싼다.
    dict 파라미터면 :name→%(name)s, 그 외엔 ?→%s 로 바꾼다(우리 SQL엔 % 리터럴 없음)."""

    def __init__(self, raw):
        self._raw = raw

    def execute(self, sql, params=()):
        if isinstance(params, dict):
            sql = _NAMED.sub(r"%(\1)s", sql)
        else:
            sql = sql.replace("?", "%s")
        cur = self._raw.cursor()
        cur.execute(sql, params)
        return cur

    def commit(self):
        self._raw.commit()

    def close(self):
        self._raw.close()


@contextmanager
def connect():
    if config.DATABASE_URL:
        import psycopg
        from psycopg.rows import dict_row

        # prepare_threshold=None: Supabase 트랜잭션 풀러와도 안전하게(서버 프리페어 비활성).
        raw = psycopg.connect(
            config.DATABASE_URL, row_factory=dict_row, prepare_threshold=None
        )
        conn = _PgAdapter(raw)
    else:
        conn = sqlite3.connect(config.DB_PATH)
        conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """스키마를 만들고, users 가 비어있으면 시드 관리자를 넣는다."""
    with connect() as conn:
        for stmt in SCHEMA_STATEMENTS:
            conn.execute(stmt)
        if not config.DATABASE_URL:
            # 예전 SQLite 스키마(is_admin 없음) 마이그레이션. Postgres 는 위 CREATE 로 이미 포함.
            cols = [r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
            if "is_admin" not in cols:
                conn.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
        count = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
        if count == 0:
            conn.execute(
                "INSERT INTO users (username, pw_hash, is_admin) VALUES (?, ?, 1)",
                (config.ADMIN_USER, hash_password(config.ADMIN_PASS)),
            )


def row_to_event(row) -> dict:
    """DB 행을 클라이언트 Event 모델(시간은 중첩 객체)로 변환한다."""
    return {
        "id": row["id"],
        "title": row["title"],
        "time": {
            "start": row["start"],
            "end": row["end"],
            "allDay": bool(row["all_day"]),
        },
        "location": row["location"] or "",
        "department": row["department"] or "",
        "category": row["category"] or "",
        "priority": row["priority"] or "normal",
        "attendees": json.loads(row["attendees"] or "[]"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }
