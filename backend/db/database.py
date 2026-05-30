"""BazaarMind — Database Configuration & Connection"""
from __future__ import annotations
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, JSON,
    ForeignKey, Date, Enum as SAEnum, Index
)
from sqlalchemy.sql import func
import uuid


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://bazaarmind:bazaarmind@localhost:5432/bazaarmind"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


def generate_uuid():
    return str(uuid.uuid4())


# ─── ORM Models ───────────────────────────────────────

class MerchantDB(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    location = Column(String(300), nullable=False)
    division = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    tier = Column(String(20), default="starter")
    categories = Column(JSON, default=list)
    monthly_revenue_bdt = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    whatsapp_verified = Column(Boolean, default=False)
    total_transactions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ProductDB(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=generate_uuid)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    name = Column(String(300), nullable=False)
    name_bn = Column(String(300))
    category = Column(String(50), nullable=False)
    unit = Column(String(50), default="piece")
    cogs = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    stock_quantity = Column(Float, default=0)
    min_stock_threshold = Column(Float, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_restocked = Column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_products_merchant", "merchant_id"),
        Index("ix_products_category", "category"),
    )


class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="cash")
    date = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_transactions_merchant", "merchant_id"),
        Index("ix_transactions_date", "date"),
    )


class EmbeddingDB(Base):
    __tablename__ = "embeddings"

    id = Column(String, primary_key=True, default=generate_uuid)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False)  # product, transaction, document
    source_id = Column(String)
    metadata_ = Column("metadata", JSON, default=dict)
    embedding_vector = Column(JSON)  # Stored as JSON array for portability
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_embeddings_type", "content_type"),
    )


class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    messages = Column(JSON, default=list)
    intent_history = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SignalDB(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True, default=generate_uuid)
    signal_type = Column(String(50), nullable=False)
    region = Column(String(100), nullable=False)
    division = Column(String(100))
    severity = Column(String(20), default="low")
    data = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_signals_type_region", "signal_type", "region"),
    )


# ─── Session Helper ───────────────────────────────────

@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose engine"""
    await engine.dispose()
