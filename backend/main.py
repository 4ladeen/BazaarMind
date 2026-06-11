"""BazaarMind — FastAPI Application
Main application entry point with all API routes, middleware, and lifecycle management.
"""
from __future__ import annotations
import os
import sys
from contextlib import asynccontextmanager
from datetime import date
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db import sqlite_db
from backend.services.demo_data import demo_data
from backend.ai.orchestrator import orchestrator
from backend.mcp_servers.forecast_server import forecast_mcp
from backend.mcp_servers.signals_server import signals_mcp
from backend.models.schemas import (
    ChatRequest, ChatResponse, DashboardKPIs,
    Merchant, Product, MerchantCreate, ProductCreate,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle"""
    # Startup
    print("🚀 BazaarMind API starting up...")
    demo_data.initialize()
    print(f"✅ Demo data initialized: {len(demo_data._merchants)} merchants loaded")
    yield
    # Shutdown
    print("👋 BazaarMind API shutting down...")


app = FastAPI(
    title="BazaarMind API",
    description="AI-driven predictive commerce platform for Bangladeshi merchants",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health & Info ─────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "BazaarMind API",
        "version": "1.0.0",
        "status": "operational",
        "mode": "demo" if os.getenv("DEMO_MODE", "true").lower() == "true" else "production",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": date.today().isoformat()}


# ─── Dashboard APIs ───────────────────────────────────

@app.get("/api/dashboard/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis():
    """Get all key performance indicators for the main dashboard"""
    return demo_data.get_dashboard_kpis()


@app.get("/api/dashboard/revenue-timeseries")
async def get_revenue_timeseries(days: int = Query(default=30, ge=1, le=365)):
    """Get revenue time series data"""
    series = demo_data.get_revenue_timeseries(days)
    return {"data": [s.model_dump() for s in series]}


@app.get("/api/dashboard/inventory-alerts")
async def get_inventory_alerts():
    """Get inventory alerts for low-stock products"""
    alerts = demo_data.get_inventory_alerts()
    return {"data": [a.model_dump() for a in alerts], "total": len(alerts)}


# ─── Merchant APIs ────────────────────────────────────

@app.get("/api/merchants")
async def list_merchants(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    division: Optional[str] = None,
    tier: Optional[str] = None,
):
    """List all merchants with optional filtering"""
    merchants = demo_data.get_merchants(limit=200)

    if division:
        merchants = [m for m in merchants if m.division.lower() == division.lower()]
    if tier:
        merchants = [m for m in merchants if m.tier.value == tier]

    total = len(merchants)
    merchants = merchants[offset:offset + limit]

    return {
        "data": [m.model_dump() for m in merchants],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/merchants/{merchant_id}")
async def get_merchant(merchant_id: str):
    """Get a single merchant by ID"""
    merchant = demo_data.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    products = demo_data.get_products(merchant_id)
    transactions = demo_data.get_transactions(merchant_id, days=30)

    return {
        "merchant": merchant.model_dump(),
        "products": [p.model_dump() for p in products],
        "recent_transactions": len(transactions),
        "revenue_30d": round(sum(t.total_amount for t in transactions), 2),
    }


@app.get("/api/merchants/{merchant_id}/products")
async def get_merchant_products(merchant_id: str):
    """Get all products for a merchant"""
    products = demo_data.get_products(merchant_id)
    return {"data": [p.model_dump() for p in products], "total": len(products)}


@app.get("/api/merchants/{merchant_id}/transactions")
async def get_merchant_transactions(
    merchant_id: str,
    days: int = Query(default=30, ge=1, le=365),
):
    """Get transactions for a merchant"""
    transactions = demo_data.get_transactions(merchant_id, days)
    return {
        "data": [t.model_dump() for t in transactions[:100]],
        "total": len(transactions),
        "period_days": days,
    }

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

# ─── Forecast APIs ────────────────────────────────────

@app.get("/api/forecasts/{merchant_id}")
async def get_forecasts(
    merchant_id: str,
    days_ahead: int = Query(default=7, ge=1, le=30),
):
    """Get demand forecasts for a merchant's products"""
    result = await forecast_mcp.get_demand_forecast(merchant_id, days_ahead)
    return result


@app.get("/api/forecasts/{merchant_id}/price-elasticity")
async def get_price_elasticity(merchant_id: str):
    """Get price elasticity analysis for a merchant's products"""
    result = await forecast_mcp.calculate_price_elasticity(merchant_id)
    return result


@app.get("/api/forecasts/seasonality/indices")
async def get_seasonality(
    category: Optional[str] = None,
    month: Optional[int] = Query(default=None, ge=1, le=12),
):
    """Get seasonality indices for product categories"""
    result = await forecast_mcp.get_seasonality_index(category, month)
    return result


# ─── Signal APIs ──────────────────────────────────────

@app.get("/api/signals/mfs-payday")
async def get_mfs_payday(
    region: Optional[str] = None,
    provider: Optional[str] = None,
):
    """Get MFS payday cycle data"""
    result = await signals_mcp.get_mfs_payday_cycle(region, provider)
    return result


@app.get("/api/signals/weather")
async def get_weather_disruptions(region: Optional[str] = None):
    """Get weather disruption alerts"""
    result = await signals_mcp.get_regional_weather_disruption(region)
    return result


@app.get("/api/signals/political")
async def get_political_events(region: Optional[str] = None):
    """Get political event statuses"""
    result = await signals_mcp.get_political_event_status(region)
    return result


@app.get("/api/signals/cod-failure")
async def get_cod_failures(region: Optional[str] = None):
    """Get COD failure matrix"""
    result = await signals_mcp.get_cod_failure_matrix(region)
    return result


@app.get("/api/signals/overview")
async def get_signals_overview():
    """Get a combined overview of all active signals"""
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


# ─── Chat / WhatsApp APIs ────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message through the AI orchestrator"""
    try:
        response = await orchestrator.process_message(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")


@app.get("/api/chat/conversations")
async def list_conversations():
    """List active conversations"""
    convs = []
    for conv_id, conv in orchestrator.conversations.items():
        convs.append({
            "id": conv.id,
            "merchant_id": conv.merchant_id,
            "message_count": len(conv.messages),
            "last_intent": conv.intent_history[-1] if conv.intent_history else None,
            "created_at": conv.created_at.isoformat(),
        })
    return {"data": convs, "total": len(convs)}


@app.get("/api/chat/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a conversation by ID"""
    conv = orchestrator.conversations.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "id": conv.id,
        "merchant_id": conv.merchant_id,
        "messages": conv.messages,
        "intent_history": conv.intent_history,
    }


# ─── MCP Tool APIs ───────────────────────────────────

@app.get("/api/mcp/tools")
async def list_mcp_tools():
    """List all available MCP tools"""
    return {
        "servers": [
            {
                "name": forecast_mcp.name,
                "tools": forecast_mcp.get_tool_schemas(),
            },
            {
                "name": signals_mcp.name,
                "tools": signals_mcp.get_tool_schemas(),
            },
        ]
    }


class MCPToolCall(BaseModel):
    server: str
    tool: str
    params: dict = {}


@app.post("/api/mcp/call")
async def call_mcp_tool(request: MCPToolCall):
    """Call an MCP tool directly"""
    servers = {
        forecast_mcp.name: forecast_mcp,
        signals_mcp.name: signals_mcp,
    }

    server = servers.get(request.server)
    if not server:
        raise HTTPException(status_code=404, detail=f"MCP server '{request.server}' not found")

    result = await server.call_tool(request.tool, request.params)
    return result


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


# ─── Error Handlers ───────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"error": "Resource not found"})


@app.exception_handler(500)
async def server_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


# ─── Frontend Serving ─────────────────────────────────

# Serve the static Next.js frontend if it exists
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "out")
if os.path.exists(frontend_path):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    app.mount("/_next", StaticFiles(directory=os.path.join(frontend_path, "_next")), name="next_static")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve static files if they exist
        path = os.path.join(frontend_path, full_path)
        if os.path.isfile(path):
            return FileResponse(path)
        # Check if html version exists (for Next.js export)
        html_path = f"{path}.html"
        if os.path.isfile(html_path):
            return FileResponse(html_path)
        # Fallback to index.html for SPA routing
        return FileResponse(os.path.join(frontend_path, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

