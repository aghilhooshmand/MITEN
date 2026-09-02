from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Index,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

VerificationStatus = Enum(
    "verified",
    "secondary",
    "partial",
    "gap",
    name="verification_status",
)

MappingConfidence = Enum(
    "direct",
    "exposed",
    name="mapping_confidence",
)


class YearMeta(Base):
    __tablename__ = "year_meta"

    year: Mapped[int] = mapped_column(Integer, primary_key=True)
    verification_status: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    ticker: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    prices: Mapped[list["BenchmarkPrice"]] = relationship(back_populates="benchmark")
    technologies: Mapped[list["Technology"]] = relationship(back_populates="benchmark")


class Technology(Base):
    __tablename__ = "technologies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False)
    mit_source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    published_on: Mapped[date] = mapped_column(Date, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False, default="other")
    list_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    default_benchmark_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("benchmarks.id"), nullable=True
    )

    benchmark: Mapped[Optional[Benchmark]] = relationship(back_populates="technologies")
    mappings: Mapped[list["TechnologyCompanyMap"]] = relationship(
        back_populates="technology"
    )
    scores: Mapped[list["TechnologyScore"]] = relationship(back_populates="technology")
    analogies: Mapped[list["TechnologyAnalogy"]] = relationship(
        back_populates="technology",
        foreign_keys="TechnologyAnalogy.technology_id",
    )


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    ticker: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(40), nullable=False, default="US")
    website: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    sector: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    is_public: Mapped[bool] = mapped_column(default=True)
    ipo_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    delisted_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    delisted_reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    country: Mapped[str] = mapped_column(String(8), nullable=False, default="US")
    market_cap: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    market_cap_as_of: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    mappings: Mapped[list["TechnologyCompanyMap"]] = relationship(
        back_populates="company"
    )
    prices: Mapped[list["StockPrice"]] = relationship(back_populates="company")


class TechnologyCompanyMap(Base):
    __tablename__ = "technology_company_map"
    __table_args__ = (
        UniqueConstraint("technology_id", "company_id", name="uq_tech_company"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    technology_id: Mapped[int] = mapped_column(ForeignKey("technologies.id"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    role_note: Mapped[str] = mapped_column(Text, nullable=False)
    mapping_confidence: Mapped[str] = mapped_column(String(20), nullable=False)
    added_by: Mapped[str] = mapped_column(String(80), nullable=False, default="seed-v1")
    added_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    technology: Mapped[Technology] = relationship(back_populates="mappings")
    company: Mapped[Company] = relationship(back_populates="mappings")


class StockPrice(Base):
    __tablename__ = "stock_prices"
    __table_args__ = (
        UniqueConstraint("company_id", "date", name="uq_company_date"),
        Index("ix_stock_prices_date", "date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    high: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    low: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    close: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    adj_close: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    volume: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    company: Mapped[Company] = relationship(back_populates="prices")


class BenchmarkPrice(Base):
    __tablename__ = "benchmark_prices"
    __table_args__ = (
        UniqueConstraint("benchmark_id", "date", name="uq_benchmark_date"),
        Index("ix_benchmark_prices_date", "date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    benchmark_id: Mapped[int] = mapped_column(ForeignKey("benchmarks.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    close: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    adj_close: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)

    benchmark: Mapped[Benchmark] = relationship(back_populates="prices")


class TechnologyScore(Base):
    __tablename__ = "technology_scores"
    __table_args__ = (
        UniqueConstraint("technology_id", "universe", name="uq_tech_universe"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    technology_id: Mapped[int] = mapped_column(ForeignKey("technologies.id"), nullable=False)
    universe: Mapped[str] = mapped_column(String(20), nullable=False, default="all")
    as_of: Mapped[date] = mapped_column(Date, nullable=False)
    n_companies: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    n_with_prices: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cohort_mean_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cohort_median_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mean_benchmark_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mean_excess_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    median_excess_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dispersion: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hit_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    window_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    window_short: Mapped[bool] = mapped_column(default=False)
    verdict: Mapped[str] = mapped_column(String(24), nullable=False, default="insufficient")
    prediction_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    details_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    technology: Mapped[Technology] = relationship(back_populates="scores")


class TechnologyAnalogy(Base):
    __tablename__ = "technology_analogies"
    __table_args__ = (
        UniqueConstraint(
            "technology_id", "analogous_technology_id", name="uq_tech_analogy"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    technology_id: Mapped[int] = mapped_column(ForeignKey("technologies.id"), nullable=False)
    analogous_technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id"), nullable=False
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)

    technology: Mapped[Technology] = relationship(
        back_populates="analogies",
        foreign_keys=[technology_id],
    )
    analogous: Mapped[Technology] = relationship(foreign_keys=[analogous_technology_id])
