import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool as pg_pool

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "jesus")
DB_PASSWORD = os.getenv("DB_PASSWORD", "2025")
DB_NAME = os.getenv("DB_NAME", "bodegas")

_pool: pg_pool.SimpleConnectionPool | None = None


def get_pool() -> pg_pool.SimpleConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        _pool = pg_pool.SimpleConnectionPool(
            minconn=1,
            maxconn=20,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
        )
    return _pool


def get_conn():
    """Get a connection from the pool."""
    return get_pool().getconn()


def put_conn(conn):
    """Return a connection to the pool."""
    get_pool().putconn(conn)


def query(sql: str, params: tuple = ()):
    """Execute a query and return rows as dicts."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            if cur.description:
                return cur.fetchall()
            return []
    finally:
        put_conn(conn)


def query_one(sql: str, params: tuple = ()):
    """Execute a query and return one row as dict."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            if cur.description:
                return cur.fetchone()
            return None
    finally:
        put_conn(conn)


def execute(sql: str, params: tuple = ()):
    """Execute a write query (INSERT/UPDATE/DELETE) and return the row if RETURNING."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            conn.commit()
            if cur.description:
                return cur.fetchone()
            return None
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)
