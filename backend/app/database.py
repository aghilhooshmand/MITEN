from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Add columns introduced after the first create_all()."""
    inspector = inspect(engine)
    if "technologies" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("technologies")}
    if "list_index" not in cols:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE technologies "
                    "ADD COLUMN list_index INT NOT NULL DEFAULT 0"
                )
            )
    if "companies" in inspector.get_table_names():
        company_cols = {c["name"] for c in inspector.get_columns("companies")}
        with engine.begin() as conn:
            if "market_cap" not in company_cols:
                conn.execute(text("ALTER TABLE companies ADD COLUMN market_cap DOUBLE NULL"))
            if "market_cap_as_of" not in company_cols:
                conn.execute(
                    text("ALTER TABLE companies ADD COLUMN market_cap_as_of DATE NULL")
                )
