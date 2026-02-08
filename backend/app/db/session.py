"""Async database session and engine."""

import ssl
from collections.abc import AsyncGenerator
from typing import AsyncContextManager
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings
from app.db.base import Base

# asyncpg does not accept these as connect() kwargs; strip from URL and handle ssl via connect_args
_ASYNCPG_STRIP_QUERY = (
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "channel_binding",  # psycopg/libpq only; asyncpg.connect() does not accept it
)


def _url_and_connect_args_for_asyncpg(url: str) -> tuple[str, dict[str, Any]]:
    """Remove sslmode, channel_binding (and similar) from URL; return clean URL and connect_args for asyncpg."""
    parsed = urlparse(url)
    if not parsed.query:
        return url, {}
    q = parse_qs(parsed.query, keep_blank_values=True)
    ssl_requested = "sslmode" in q
    for key in _ASYNCPG_STRIP_QUERY:
        q.pop(key, None)
    new_query = urlencode(q, doseq=True)
    clean = urlunparse(parsed._replace(query=new_query))
    connect_args: dict[str, Any] = {}
    if ssl_requested:
        ctx = ssl.create_default_context()
        if get_settings().database_ssl_no_verify:
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ctx
    return clean, connect_args


settings = get_settings()
_db_url, _connect_args = _url_and_connect_args_for_asyncpg(settings.database_url_asyncpg)
engine = create_async_engine(
    _db_url,
    echo=settings.debug,
    future=True,
    connect_args=_connect_args,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a single async session (for use outside Depends if needed)."""
    async with async_session_maker() as session:
        yield session


def get_session_context() -> AsyncContextManager[AsyncSession]:
    """Return a context manager for an async session."""
    return async_session_maker()
