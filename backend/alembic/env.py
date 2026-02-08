"""Alembic environment - uses async engine and app config."""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import get_settings
from app.db.base import Base
from app.db.session import _url_and_connect_args_for_asyncpg
from app.models import *  # noqa: F401, F403 - register all models for autogenerate

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
# Force asyncpg URL; strip sslmode (asyncpg uses connect_args["ssl"] instead)
database_url = settings.database_url_asyncpg
database_url_clean, connect_args = _url_and_connect_args_for_asyncpg(database_url)
config.set_main_option("sqlalchemy.url", database_url_clean)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generate SQL only)."""
    url = database_url_clean
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine (asyncpg only)."""
    section = config.get_section(config.config_ini_section, {})
    section["sqlalchemy.url"] = database_url_clean
    if connect_args:
        section["sqlalchemy.connect_args"] = connect_args
    connectable = async_engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
