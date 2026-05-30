"""BazaarMind — Pydantic Schemas & Data Models"""
from __future__ import annotations
from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
import uuid


# ─── Enums ─────────────────────────────────────────────

class MerchantTier(str, Enum):
    STARTER = "starter"
    GROWING = "growing"
    ESTABLISHED = "established"
    PREMIUM = "premium"


class IntentType(str, Enum):
    PRICING_QUERY = "pricing_query"
    STOCK_UPDATE = "stock_update"
    DEMAND_FORECAST = "demand_forecast"
    MARKETING = "marketing"
    DISRUPTION_ALERT = "disruption_alert"
    COMPLAINT = "complaint"
    GENERAL = "general"


class SignalType(str, Enum):
    WEATHER = "weather"
    POLITICAL = "political"
    MFS_PAYDAY = "mfs_payday"
    COD_FAILURE = "cod_failure"
    FESTIVAL = "festival"


class DisruptionSeverity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class ProductCategory(str, Enum):
    GROCERY = "grocery"
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    PHARMACY = "pharmacy"
    AGRICULTURE = "agriculture"
    FMCG = "fmcg"
    HARDWARE = "hardware"
    COSMETICS = "cosmetics"


# ─── Merchant Models ───────────────────────────────────

class MerchantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., pattern=r"^\+?880\d{10}$")
    location: str = Field(..., max_length=300)
    division: str = Field(..., max_length=100)
    district: str = Field(..., max_length=100)
    tier: MerchantTier = MerchantTier.STARTER
    categories: List[ProductCategory] = Field(default_factory=list)
    monthly_revenue_bdt: float = Field(default=0, ge=0)


class MerchantCreate(MerchantBase):
    pass


class Merchant(MerchantBase):
    model_config = ConfigDict(from_attributes=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    whatsapp_verified: bool = False
    total_transactions: int = 0


# ─── Product Models ────────────────────────────────────

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    name_bn: Optional[str] = None
    category: ProductCategory
    unit: str = Field(default="piece", max_length=50)
    cogs: float = Field(..., ge=0, description="Cost of goods sold (BDT)")
    selling_price: float = Field(..., ge=0, description="Current selling price (BDT)")
    stock_quantity: float = Field(default=0, ge=0)
    min_stock_threshold: float = Field(default=10, ge=0)

    @field_validator("selling_price")
    @classmethod
    def price_above_cogs(cls, v, info):
        """CRITICAL: Enforce hardcoded COGS minimum — no pricing below cost"""
        cogs = info.data.get("cogs", 0)
        if v < cogs:
            raise ValueError(
                f"Selling price ({v} BDT) cannot be below COGS ({cogs} BDT). "
                "This constraint is non-negotiable."
            )
        return v


class ProductCreate(ProductBase):
    merchant_id: str


class Product(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    merchant_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_restocked: Optional[datetime] = None


# ─── Transaction Models ────────────────────────────────

class TransactionBase(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    total_amount: float = Field(..., ge=0)
    payment_method: str = Field(default="cash", max_length=50)


import datetime as dt

class Transaction(TransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    merchant_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    date: dt.date = Field(default_factory=dt.date.today)


# ─── Forecast Models ───────────────────────────────────

class DemandForecast(BaseModel):
    product_id: str
    product_name: str
    forecast_date: date
    predicted_demand: float = Field(..., ge=0)
    confidence_lower: float = Field(..., ge=0)
    confidence_upper: float = Field(..., ge=0)
    seasonality_factor: float = Field(default=1.0, ge=0, le=3.0)
    trend: str = Field(default="stable")  # rising, stable, declining
    factors: List[str] = Field(default_factory=list)


class PriceElasticity(BaseModel):
    product_id: str
    product_name: str
    current_price: float = Field(..., ge=0)
    optimal_price: float = Field(..., ge=0)
    cogs_floor: float = Field(..., ge=0, description="Absolute minimum price")
    elasticity_coefficient: float
    expected_demand_change_pct: float
    expected_revenue_change_pct: float
    recommendation: str

    @field_validator("optimal_price")
    @classmethod
    def optimal_above_cogs(cls, v, info):
        cogs_floor = info.data.get("cogs_floor", 0)
        if v < cogs_floor:
            raise ValueError(
                f"Optimal price cannot be below COGS floor ({cogs_floor} BDT)"
            )
        return v


class SeasonalityIndex(BaseModel):
    product_id: str
    product_name: str
    category: ProductCategory
    month: int = Field(..., ge=1, le=12)
    index_value: float = Field(..., ge=0, le=3.0)
    peak_reason: Optional[str] = None
    historical_avg_demand: float = Field(default=0, ge=0)


# ─── Signal Models ─────────────────────────────────────

class MFSPaydayCycle(BaseModel):
    provider: str  # bKash, Nagad, Rocket
    next_payday: date
    days_until_payday: int
    expected_liquidity_spike_pct: float
    region: str
    historical_spend_increase: float


class WeatherDisruption(BaseModel):
    region: str
    division: str
    event_type: str  # cyclone, flood, heavy_rain, heat_wave
    severity: DisruptionSeverity
    start_date: date
    expected_end_date: date
    supply_chain_impact_score: float = Field(..., ge=0, le=10)
    affected_routes: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)


class PoliticalEvent(BaseModel):
    event_type: str  # hartal, election, protest, national_holiday
    region: str
    start_date: date
    end_date: Optional[date] = None
    disruption_probability: float = Field(..., ge=0, le=1)
    market_closure_expected: bool = False
    recommended_stock_buffer_days: int = Field(default=0, ge=0)


class CODFailureMatrix(BaseModel):
    region: str
    division: str
    failure_rate_pct: float = Field(..., ge=0, le=100)
    avg_return_cost_bdt: float = Field(default=0, ge=0)
    top_failure_reasons: List[str] = Field(default_factory=list)
    recommendation: str


# ─── Chat / WhatsApp Models ───────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant|system)$")
    content: str = Field(..., min_length=1)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    merchant_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    intent: IntentType
    confidence: float = Field(..., ge=0, le=1)
    data: Optional[Dict[str, Any]] = None
    suggestions: List[str] = Field(default_factory=list)


# ─── Dashboard / Analytics Models ──────────────────────

class DashboardKPIs(BaseModel):
    total_merchants: int = 0
    active_merchants_today: int = 0
    total_revenue_bdt: float = 0
    avg_order_value_bdt: float = 0
    total_products: int = 0
    low_stock_alerts: int = 0
    active_disruptions: int = 0
    demand_accuracy_pct: float = 0
    queries_today: int = 0
    top_categories: List[Dict[str, Any]] = Field(default_factory=list)


class RevenueTimeSeries(BaseModel):
    date: str
    revenue: float
    transactions: int
    avg_order_value: float


class InventoryAlert(BaseModel):
    product_id: str
    product_name: str
    merchant_id: str
    merchant_name: str
    current_stock: float
    min_threshold: float
    days_until_stockout: float
    urgency: DisruptionSeverity
