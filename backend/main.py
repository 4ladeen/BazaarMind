"""
BazaarMind — FastAPI Application
Full implementation with SQLite persistence, real Claude chat,
merchant CRUD, WhatsApp webhook, and n8n integration endpoints.
"""
from __future__ import annotations
import os
import sys
from contextlib import asynccontextmanager
from datetime import date
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.demo_data import demo_data
from backend.ai.orchestrator import orchestrator
from backend.mcp_servers.forecast_server import forecast_mcp
from backend.mcp_servers.signals_server import signals_mcp
from backend.models.schemas import (
    ChatRequest, ChatResponse, MerchantCreate, ProductCreate,
)
from backend.db import sqlite_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 BazaarMind API starting up...")
    # Init SQLite (creates tables if missing)
    sqlite_db.init_db()
    # Init demo data (in-memory for forecasts/signals)
    demo_data.initialize()
    print(f"✅ Demo data: {len(demo_data._merchants)} merchants | SQLite: {sqlite_db.DB_PATH}")
    yield
    print("👋 BazaarMind shutting down...")


app = FastAPI(
    title="BazaarMind API",
    description="AI-driven predictive commerce for Bangladeshi merchants",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "BazaarMind API",
        "version": "2.0.0",
        "status": "operational",
        "claude_enabled": bool(os.getenv("ANTHROPIC_API_KEY")),
        "whatsapp_enabled": bool(os.getenv("TWILIO_ACCOUNT_SID")),
        "db": sqlite_db.DB_PATH,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": date.today().isoformat()}


# ─── Dashboard ────────────────────────────────────────────

@app.get("/api/dashboard/kpis")
async def get_dashboard_kpis():
    """Real KPIs from SQLite + demo data fallback."""
    db_kpis = sqlite_db.get_dashboard_kpis()
    # If no real data yet, supplement with demo data
    if db_kpis["total_merchants"] == 0:
        demo_kpis = demo_data.get_dashboard_kpis()
        return demo_kpis
    return db_kpis


@app.get("/api/dashboard/revenue-timeseries")
async def get_revenue_timeseries(days: int = Query(default=30, ge=1, le=365)):
    real = sqlite_db.get_revenue_timeseries(days)
    if real:
        return {"data": real}
    # Fall back to demo
    series = demo_data.get_revenue_timeseries(days)
    return {"data": [s.model_dump() for s in series]}


@app.get("/api/dashboard/inventory-alerts")
async def get_inventory_alerts():
    real = sqlite_db.get_low_stock_products()
    if real:
        alerts = []
        for p in real:
            stock = p["stock_quantity"]
            threshold = p["min_stock_threshold"]
            days_left = (stock / max(1, threshold / 7))
            urgency = "critical" if days_left < 1 else "high" if days_left < 3 else "moderate"
            alerts.append({
                "product_name": p["name"],
                "merchant_name": p.get("merchant_name", "Unknown"),
                "current_stock": stock,
                "min_threshold": threshold,
                "days_until_stockout": round(days_left, 1),
                "urgency": urgency,
            })
        return {"data": alerts, "total": len(alerts)}
    demo_alerts = demo_data.get_inventory_alerts()
    return {"data": [a.model_dump() for a in demo_alerts], "total": len(demo_alerts)}


# ─── Merchant APIs ────────────────────────────────────────

@app.get("/api/merchants")
async def list_merchants(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    division: Optional[str] = None,
    tier: Optional[str] = None,
):
    # Try SQLite first
    db_merchants = sqlite_db.list_merchants(limit, offset, division, tier)
    db_total = sqlite_db.count_merchants(division, tier)

    if db_merchants:
        return {"data": db_merchants, "total": db_total, "limit": limit, "offset": offset, "source": "db"}

    # Fall back to demo
    merchants = demo_data.get_merchants(limit=200)
    if division:
        merchants = [m for m in merchants if m.division.lower() == division.lower()]
    if tier:
        merchants = [m for m in merchants if m.tier.value == tier]
    total = len(merchants)
    merchants = merchants[offset:offset + limit]
    return {"data": [m.model_dump() for m in merchants], "total": total, "source": "demo"}


@app.post("/api/merchants", status_code=201)
async def create_merchant(data: MerchantCreate):
    """Create a new merchant in SQLite."""
    # Check if phone already exists
    existing = sqlite_db.get_merchant_by_phone(data.phone)
    if existing:
        raise HTTPException(status_code=409, detail="Phone number already registered")

    merchant = sqlite_db.create_merchant(data.model_dump())
    return {"merchant": merchant, "message": "Merchant created successfully"}


@app.get("/api/merchants/{merchant_id}")
async def get_merchant(merchant_id: str):
    # Try SQLite
    merchant = sqlite_db.get_merchant(merchant_id)
    if merchant:
        products = sqlite_db.get_merchant_products(merchant_id)
        transactions = sqlite_db.get_merchant_transactions(merchant_id, days=30)
        return {
            "merchant": merchant,
            "products": products,
            "recent_transactions": len(transactions),
            "revenue_30d": round(sum(t["total_amount"] for t in transactions), 2),
            "source": "db",
        }
    # Fall back to demo
    m = demo_data.get_merchant(merchant_id)
    if not m:
        raise HTTPException(status_code=404, detail="Merchant not found")
    products = demo_data.get_products(merchant_id)
    transactions = demo_data.get_transactions(merchant_id, days=30)
    return {
        "merchant": m.model_dump(),
        "products": [p.model_dump() for p in products],
        "recent_transactions": len(transactions),
        "revenue_30d": round(sum(t.total_amount for t in transactions), 2),
        "source": "demo",
    }


@app.put("/api/merchants/{merchant_id}")
async def update_merchant(merchant_id: str, data: dict):
    merchant = sqlite_db.update_merchant(merchant_id, data)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return {"merchant": merchant}


@app.get("/api/merchants/{merchant_id}/products")
async def get_merchant_products(merchant_id: str):
    db_products = sqlite_db.get_merchant_products(merchant_id)
    if db_products:
        return {"data": db_products, "total": len(db_products)}
    products = demo_data.get_products(merchant_id)
    return {"data": [p.model_dump() for p in products], "total": len(products)}


@app.post("/api/merchants/{merchant_id}/products", status_code=201)
async def add_product(merchant_id: str, data: ProductCreate):
    """Add a product for a merchant."""
    # Validate COGS floor
    if data.selling_price < data.cogs:
        raise HTTPException(status_code=400, detail="selling_price must be >= cogs")
    product = sqlite_db.create_product(merchant_id, data.model_dump())
    return {"product": product}


@app.get("/api/merchants/{merchant_id}/transactions")
async def get_merchant_transactions(
    merchant_id: str,
    days: int = Query(default=30, ge=1, le=365),
):
    db_txns = sqlite_db.get_merchant_transactions(merchant_id, days)
    if db_txns:
        return {"data": db_txns, "total": len(db_txns), "period_days": days}
    transactions = demo_data.get_transactions(merchant_id, days)
    return {"data": [t.model_dump() for t in transactions[:100]], "total": len(transactions)}


@app.post("/api/merchants/{merchant_id}/transactions", status_code=201)
async def create_transaction(merchant_id: str, data: dict):
    """Record a new transaction (decrements product stock automatically)."""
    required = ["quantity", "unit_price", "total_amount"]
    for field in required:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")
    txn = sqlite_db.create_transaction(merchant_id, data)
    return {"transaction": txn}


# ─── Merchant Onboarding ──────────────────────────────────

class OnboardingRequest(BaseModel):
    name: str
    phone: str
    location: str
    division: str
    district: str
    categories: List[str] = []
    tier: str = "starter"


@app.post("/api/onboarding")
async def onboard_merchant(data: OnboardingRequest):
    """
    Complete merchant onboarding flow:
    1. Create merchant in SQLite
    2. Send WhatsApp welcome message (if Twilio configured)
    3. Return merchant ID + next steps
    """
    # Check duplicate
    existing = sqlite_db.get_merchant_by_phone(data.phone)
    if existing:
        return {
            "status": "existing",
            "merchant": existing,
            "message": "Apnar account already ache! Welcome back.",
        }

    # Create merchant
    merchant = sqlite_db.create_merchant({
        "name": data.name,
        "phone": data.phone,
        "location": data.location,
        "division": data.division,
        "district": data.district,
        "categories": data.categories,
        "tier": data.tier,
        "monthly_revenue_bdt": 0,
    })

    # Send WhatsApp welcome (if configured)
    whatsapp_sent = False
    if os.getenv("TWILIO_ACCOUNT_SID"):
        whatsapp_sent = await _send_whatsapp_welcome(data.phone, data.name, merchant["id"])

    return {
        "status": "created",
        "merchant": merchant,
        "whatsapp_sent": whatsapp_sent,
        "message": f"Welcome to BazaarMind, {data.name}! Apnar merchant ID: {merchant['id']}",
        "next_steps": [
            "Add your products via /api/merchants/{id}/products",
            "Start chatting at /chat",
            "WhatsApp: Send a message to get AI advice",
        ],
    }


# ─── Forecast APIs ────────────────────────────────────────

@app.get("/api/forecasts/{merchant_id}")
async def get_forecasts(
    merchant_id: str,
    days_ahead: int = Query(default=7, ge=1, le=30),
):
    return await forecast_mcp.get_demand_forecast(merchant_id, days_ahead)


@app.get("/api/forecasts/{merchant_id}/price-elasticity")
async def get_price_elasticity(merchant_id: str):
    return await forecast_mcp.calculate_price_elasticity(merchant_id)


@app.get("/api/forecasts/seasonality/indices")
async def get_seasonality(
    category: Optional[str] = None,
    month: Optional[int] = Query(default=None, ge=1, le=12),
):
    return await forecast_mcp.get_seasonality_index(category, month)


# ─── Signal APIs ──────────────────────────────────────────

@app.get("/api/signals/overview")
async def get_signals_overview():
    weather = await signals_mcp.get_regional_weather_disruption()
    political = await signals_mcp.get_political_event_status()
    mfs = await signals_mcp.get_mfs_payday_cycle()
    cod = await signals_mcp.get_cod_failure_matrix()
    return {
        "weather": weather,
        "political": political,
        "mfs_payday": mfs,
        "cod_failure": cod,
        "overall_risk_level": weather.get("overall_risk_level", "low"),
        "critical_alerts": weather.get("critical_alerts", 0),
    }


@app.get("/api/signals/weather")
async def get_weather(region: Optional[str] = None):
    return await signals_mcp.get_regional_weather_disruption(region)


@app.get("/api/signals/political")
async def get_political(region: Optional[str] = None):
    return await signals_mcp.get_political_event_status(region)


@app.get("/api/signals/mfs-payday")
async def get_mfs_payday(region: Optional[str] = None, provider: Optional[str] = None):
    return await signals_mcp.get_mfs_payday_cycle(region, provider)


@app.get("/api/signals/cod-failure")
async def get_cod_failures(region: Optional[str] = None):
    return await signals_mcp.get_cod_failure_matrix(region)


# ─── Chat APIs ────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        return await orchestrator.process_message(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@app.get("/api/chat/conversations")
async def list_conversations(merchant_id: Optional[str] = None):
    # From SQLite
    db_convs = sqlite_db.list_conversations(merchant_id)
    if db_convs:
        return {"data": db_convs, "total": len(db_convs)}
    # From in-memory
    convs = []
    for cid, conv in orchestrator.conversations.items():
        convs.append({
            "id": conv.id,
            "merchant_id": conv.merchant_id,
            "message_count": len(conv.messages),
            "created_at": conv.created_at.isoformat(),
        })
    return {"data": convs, "total": len(convs)}


@app.get("/api/chat/{conversation_id}")
async def get_conversation(conversation_id: str):
    msgs = sqlite_db.get_conversation_messages(conversation_id)
    if msgs:
        return {"id": conversation_id, "messages": msgs}
    conv = orchestrator.conversations.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"id": conv.id, "messages": conv.messages}


# ─── WhatsApp Webhook (Twilio) ────────────────────────────

@app.post("/api/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Twilio WhatsApp webhook endpoint.
    Twilio sends form-encoded POST when a message arrives.
    We process it through the AI orchestrator and reply.
    """
    form = await request.form()
    incoming_msg = form.get("Body", "").strip()
    from_number = form.get("From", "")  # e.g. "whatsapp:+8801712345678"
    phone = from_number.replace("whatsapp:", "")

    if not incoming_msg:
        return JSONResponse({"status": "empty"})

    # Find or create merchant by phone
    merchant = sqlite_db.get_merchant_by_phone(phone)
    if not merchant:
        # Auto-register unknown number as starter merchant
        merchant = sqlite_db.create_merchant({
            "name": f"Merchant {phone[-4:]}",
            "phone": phone,
            "location": "Bangladesh",
            "division": "Dhaka",
            "district": "Dhaka",
            "categories": ["grocery"],
            "tier": "starter",
        })
        # Send onboarding message
        welcome = (
            f"আসসালামু আলাইকুম! 🙏\n"
            f"BazaarMind e welcome! Apnar account create hoyeche.\n"
            f"Merchant ID: {merchant['id']}\n\n"
            f"Ki help lagbe? Bolun!"
        )
        await _send_whatsapp(phone, welcome)
        return JSONResponse({"status": "registered", "merchant_id": merchant["id"]})

    # Process through AI
    chat_request = ChatRequest(
        message=incoming_msg,
        merchant_id=merchant["id"],
        conversation_id=f"wa-{merchant['id']}",  # Persistent per merchant
    )
    response = await orchestrator.process_message(chat_request)

    # Send reply via Twilio
    await _send_whatsapp(phone, response.response)

    return JSONResponse({"status": "ok", "intent": response.intent})


# ─── n8n Integration Endpoints ────────────────────────────

@app.get("/api/n8n/low-stock-alerts")
async def n8n_low_stock():
    """
    n8n polls this endpoint to check for low stock.
    Returns merchants with products below minimum threshold.
    """
    alerts = sqlite_db.get_low_stock_products()
    if not alerts:
        # Use demo data
        demo_alerts = demo_data.get_inventory_alerts()
        return {
            "alerts": [
                {
                    "merchant_id": "merchant-001",
                    "merchant_name": a.merchant_name,
                    "product_name": a.product_name,
                    "current_stock": a.current_stock,
                    "min_threshold": a.min_stock_threshold,
                    "urgency": a.urgency,
                }
                for a in demo_alerts
            ],
            "total": len(demo_alerts),
            "timestamp": date.today().isoformat(),
        }
    return {"alerts": alerts, "total": len(alerts), "timestamp": date.today().isoformat()}


@app.get("/api/n8n/daily-report/{merchant_id}")
async def n8n_daily_report(merchant_id: str):
    """
    n8n calls this each morning to get report data.
    Returns structured data for WhatsApp daily report message.
    """
    # Get transactions from yesterday + today
    db_txns = sqlite_db.get_merchant_transactions(merchant_id, days=1)
    demo_txns = demo_data.get_transactions(merchant_id, days=1) if not db_txns else []

    revenue_today = sum(t["total_amount"] for t in db_txns) if db_txns else sum(t.total_amount for t in demo_txns)

    # Get forecasts
    fc = demo_data.get_demand_forecasts(merchant_id, days_ahead=1)
    top_forecast = fc[0] if fc else None

    # Low stock
    low_stock = sqlite_db.get_low_stock_products(merchant_id)
    if not low_stock:
        prods = demo_data.get_products(merchant_id)
        low_stock_names = [p.name for p in prods if p.stock_quantity < p.min_stock_threshold][:3]
    else:
        low_stock_names = [p["name"] for p in low_stock[:3]]

    merchant = sqlite_db.get_merchant(merchant_id) or {}
    name = merchant.get("name", "Merchant")

    report = {
        "merchant_id": merchant_id,
        "merchant_name": name,
        "date": date.today().isoformat(),
        "revenue_today_bdt": round(revenue_today, 0),
        "transaction_count": len(db_txns) or len(demo_txns),
        "top_forecast": {
            "product": top_forecast.product_name if top_forecast else "N/A",
            "predicted_units": top_forecast.predicted_demand if top_forecast else 0,
            "trend": top_forecast.trend if top_forecast else "stable",
        } if top_forecast else None,
        "low_stock_items": low_stock_names,
        "whatsapp_message": _format_daily_report(name, revenue_today, low_stock_names, top_forecast),
    }
    return report


@app.post("/api/n8n/send-alert")
async def n8n_send_alert(data: dict):
    """
    n8n calls this to send a WhatsApp alert to a merchant.
    Body: { "phone": "+880...", "message": "..." }
    """
    phone = data.get("phone")
    message = data.get("message")
    if not phone or not message:
        raise HTTPException(status_code=400, detail="phone and message required")
    sent = await _send_whatsapp(phone, message)
    return {"sent": sent, "phone": phone}


# ─── Twilio Helpers ───────────────────────────────────────

async def _send_whatsapp(to_number: str, message: str) -> bool:
    """Send WhatsApp message via Twilio REST API."""
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    if not sid or not token:
        print(f"[WhatsApp MOCK] To: {to_number}\n{message}")
        return False

    to = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number

    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                auth=(sid, token),
                data={
                    "From": from_number,
                    "To": to,
                    "Body": message,
                },
            )
            resp.raise_for_status()
            return True
    except Exception as e:
        print(f"WhatsApp send error: {e}")
        return False


async def _send_whatsapp_welcome(phone: str, name: str, merchant_id: str) -> bool:
    msg = (
        f"আসসালামু আলাইকুম {name} ভাই! 🙏\n\n"
        f"BazaarMind e welcome! 🎉\n"
        f"Apnar merchant ID: {merchant_id}\n\n"
        f"Ekhon theke AI advice paben:\n"
        f"📊 'dam ki rakhbo?' → Price advice\n"
        f"📈 'kal ki sell hobe?' → Demand forecast\n"
        f"📦 'stock koto ase?' → Inventory check\n\n"
        f"Insha'Allah apnar business grow korbe! 💪"
    )
    return await _send_whatsapp(phone, msg)


def _format_daily_report(name: str, revenue: float, low_stock: List[str], forecast) -> str:
    name_short = name.split()[0] if name else "ভাই"
    msg = (
        f"🌅 Good morning {name_short} ভাই!\n\n"
        f"📊 **Aajker BazaarMind Report**\n\n"
        f"💰 Revenue today: ৳{revenue:,.0f}\n"
    )
    if forecast:
        trend_emoji = "📈" if forecast.trend == "rising" else "📉" if forecast.trend == "declining" else "➡️"
        msg += f"{trend_emoji} Hot product: {forecast.product_name} ({forecast.trend})\n"
    if low_stock:
        msg += f"\n⚠️ Restock needed:\n" + "\n".join(f"  • {item}" for item in low_stock)
    msg += "\n\nShubho din hok! 🤲"
    return msg


# ─── Error Handlers ───────────────────────────────────────

@app.exception_handler(404)
async def not_found(request, exc):
    return JSONResponse(status_code=404, content={"error": "Not found"})


@app.exception_handler(500)
async def server_error(request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


# ─── Static Frontend ──────────────────────────────────────

frontend_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "out"
)
if os.path.exists(frontend_path):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    next_static = os.path.join(frontend_path, "_next")
    if os.path.exists(next_static):
        app.mount("/_next", StaticFiles(directory=next_static), name="next_static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = os.path.join(frontend_path, full_path)
        if os.path.isfile(path):
            return FileResponse(path)
        html_path = f"{path}.html"
        if os.path.isfile(html_path):
            return FileResponse(html_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
