"""BazaarMind — AI Orchestrator
Multi-agent supervisor that routes merchant intents to specialized agents.
Operates in demo mode with synthetic AI responses when API keys are not configured.
"""
from __future__ import annotations
import os
import uuid
import random
from datetime import datetime
from typing import Dict, Any, List, Optional

from backend.ai.banglish_processor import banglish_processor
from backend.services.demo_data import demo_data
from backend.models.schemas import (
    ChatRequest, ChatResponse, IntentType,
    DemandForecast, PriceElasticity
)


class ConversationState:
    """Maintains stateful conversational memory"""
    def __init__(self, conversation_id: str, merchant_id: Optional[str] = None):
        self.id = conversation_id
        self.merchant_id = merchant_id or "merchant-001"
        self.messages: List[Dict[str, Any]] = []
        self.intent_history: List[str] = []
        self.context: Dict[str, Any] = {}
        self.created_at = datetime.utcnow()

    def add_message(self, role: str, content: str, metadata: Dict = None):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        })

    def get_recent_context(self, n: int = 5) -> str:
        recent = self.messages[-n:]
        return "\n".join(f"{m['role']}: {m['content']}" for m in recent)


class AIOrchestrator:
    """
    Multi-agent supervisor implementing the BazaarMind reasoning topology.

    In demo mode: Uses pattern matching + synthetic data for responses.
    In production: Routes to Claude (strategic), Gemini Flash-Lite (extraction),
                   Groq/Llama 3.3 (classification), and Ollama (edge inference).
    """

    def __init__(self):
        self.demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
        self.conversations: Dict[str, ConversationState] = {}

        # Check for API keys
        self.has_claude = bool(os.getenv("ANTHROPIC_API_KEY"))
        self.has_gemini = bool(os.getenv("GEMINI_API_KEY"))
        self.has_groq = bool(os.getenv("GROQ_API_KEY"))
        self.has_ollama = self._check_ollama()

    def _check_ollama(self) -> bool:
        """Check if Ollama is available for edge inference"""
        try:
            import httpx
            response = httpx.get(
                f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/tags",
                timeout=2.0
            )
            return response.status_code == 200
        except Exception:
            return False

    def get_or_create_conversation(
        self, conversation_id: Optional[str] = None,
        merchant_id: Optional[str] = None
    ) -> ConversationState:
        """Get existing conversation or create new one"""
        if conversation_id and conversation_id in self.conversations:
            return self.conversations[conversation_id]

        conv_id = conversation_id or str(uuid.uuid4())
        conv = ConversationState(conv_id, merchant_id)
        self.conversations[conv_id] = conv
        return conv

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """
        Main entry point — processes a merchant message through the multi-agent pipeline:

        1. Intent Classification (Groq/Llama 3.3 or pattern matching)
        2. Query Normalization (Banglish → Bangla)
        3. Agent Routing (to specialized handler)
        4. Response Generation (Claude or synthetic)
        5. Cultural Calibration (Banglish output)
        """

        # Get/create conversation state
        conv = self.get_or_create_conversation(
            request.conversation_id, request.merchant_id
        )
        conv.add_message("user", request.message)

        # Step 1: Intent Classification
        intent_str, confidence = banglish_processor.classify_intent(request.message)
        intent = IntentType(intent_str) if intent_str in IntentType.__members__.values() else IntentType.GENERAL

        conv.intent_history.append(intent_str)

        # Step 2: Extract context
        products = banglish_processor.extract_product_mentions(request.message)
        time_ref = banglish_processor.extract_time_reference(request.message)
        normalized = banglish_processor.normalize_query(request.message)

        # Step 3: Route to specialized agent
        merchant_id = conv.merchant_id
        merchant = demo_data.get_merchant(merchant_id)
        merchant_name = merchant.name if merchant else "ভাই"

        response_data = {}
        suggestions = []

        if intent == IntentType.PRICING_QUERY:
            response_text, response_data, suggestions = await self._handle_pricing(
                merchant_id, products, merchant_name
            )
        elif intent == IntentType.DEMAND_FORECAST:
            response_text, response_data, suggestions = await self._handle_forecast(
                merchant_id, products, merchant_name
            )
        elif intent == IntentType.STOCK_UPDATE:
            response_text, response_data, suggestions = await self._handle_stock(
                merchant_id, merchant_name
            )
        elif intent == IntentType.DISRUPTION_ALERT:
            response_text, response_data, suggestions = await self._handle_disruption(
                merchant_id, merchant_name
            )
        elif intent == IntentType.MARKETING:
            response_text, response_data, suggestions = await self._handle_marketing(
                merchant_id, products, merchant_name
            )
        elif intent == IntentType.COMPLAINT:
            response_text, response_data, suggestions = await self._handle_complaint(
                merchant_name
            )
        else:
            response_text = banglish_processor.generate_culturally_calibrated_response(
                "general", {}, merchant_name
            )
            suggestions = [
                "dam ki rakhbo? (Price advice)",
                "kal ki sell hobe? (Demand forecast)",
                "stock update den (Inventory check)",
            ]

        # Store assistant response
        conv.add_message("assistant", response_text, {"intent": intent_str, "confidence": confidence})

        return ChatResponse(
            conversation_id=conv.id,
            response=response_text,
            intent=intent,
            confidence=confidence,
            data=response_data,
            suggestions=suggestions,
        )

    # ─── Specialized Agent Handlers ────────────────────

    async def _handle_pricing(
        self, merchant_id: str, products: List[str], merchant_name: str
    ) -> tuple:
        """Price elasticity & optimization agent"""
        elasticities = demo_data.get_price_elasticity(merchant_id)

        if elasticities:
            # Pick the most relevant or first
            el = elasticities[0]
            data = {
                "product_name": el.product_name,
                "current_price": el.current_price,
                "optimal_price": el.optimal_price,
                "cogs_floor": el.cogs_floor,
                "elasticity": el.elasticity_coefficient,
                "recommendation": el.recommendation,
                "revenue_change": el.expected_revenue_change_pct,
            }
            response = banglish_processor.generate_culturally_calibrated_response(
                "pricing_query", data, merchant_name
            )

            # Add other products as data
            all_data = {"primary": data, "all_products": [e.model_dump() for e in elasticities[:5]]}

            return response, all_data, [
                "Arekta product er dam jante chai",
                "Ei dam e koto bikri hobe?",
                "Wholesale dam ki rakhbo?",
            ]
        else:
            return (
                f"আসসালামু আলাইকুম {merchant_name}! 🙏\n\n"
                "Apnar product list e kono product pai nai. "
                "Please product add korun first!",
                {},
                ["Stock update den", "Product add korun"]
            )

    async def _handle_forecast(
        self, merchant_id: str, products: List[str], merchant_name: str
    ) -> tuple:
        """Demand forecasting agent"""
        forecasts = demo_data.get_demand_forecasts(merchant_id, days_ahead=7)

        if forecasts:
            fc = forecasts[0]
            data = {
                "product_name": fc.product_name,
                "predicted_demand": fc.predicted_demand,
                "trend": fc.trend,
                "seasonality": fc.seasonality_factor,
                "factors": fc.factors,
                "confidence_range": f"{fc.confidence_lower}-{fc.confidence_upper}",
            }
            response = banglish_processor.generate_culturally_calibrated_response(
                "demand_forecast", data, merchant_name
            )

            all_data = {
                "primary": data,
                "all_forecasts": [f.model_dump() for f in forecasts[:10]],
            }

            return response, all_data, [
                "Arekta product er forecast chai",
                "Monthly forecast dekhao",
                "Seasonal trend ki?",
            ]
        else:
            return (
                f"আসসালামু আলাইকুম {merchant_name}! 🙏\n\nForecast data ready hocche...",
                {},
                ["Stock update den"]
            )

    async def _handle_stock(self, merchant_id: str, merchant_name: str) -> tuple:
        """Inventory management agent"""
        products = demo_data.get_products(merchant_id)
        low_stock = [p for p in products if p.stock_quantity < p.min_stock_threshold]

        data = {
            "total_products": len(products),
            "low_stock": len(low_stock),
            "low_stock_items": [
                {"name": p.name, "stock": p.stock_quantity, "threshold": p.min_stock_threshold}
                for p in low_stock[:5]
            ],
        }

        response = banglish_processor.generate_culturally_calibrated_response(
            "stock_update", data, merchant_name
        )

        if low_stock:
            response += "\n\n⚠️ **Low stock items:**\n"
            for item in data["low_stock_items"]:
                response += f"  • {item['name']}: **{item['stock']}** remaining (min: {item['threshold']})\n"

        return response, data, [
            "Restock order korte chai",
            "Ki ki lagbe? List den",
            "Stock value koto?",
        ]

    async def _handle_disruption(self, merchant_id: str, merchant_name: str) -> tuple:
        """Disruption monitoring & alert agent"""
        merchant = demo_data.get_merchant(merchant_id)
        region = merchant.division if merchant else "Dhaka"

        weather = demo_data.get_weather_disruptions(region)
        political = demo_data.get_political_events(region)

        if weather:
            w = weather[0]
            data = {
                "event_type": w.event_type,
                "severity": w.severity.value,
                "region": w.region,
                "impact_score": w.supply_chain_impact_score,
                "recommended_actions": w.recommended_actions,
                "affected_routes": w.affected_routes,
            }
            response = banglish_processor.generate_culturally_calibrated_response(
                "disruption_alert", data, merchant_name
            )
        else:
            response = (
                f"আসসালামু আলাইকুম {merchant_name}! 🙏\n\n"
                f"🟢 Alhamdulillah, {region} region e ekhon kono disruption nai!\n"
                "Supply chain normal ache."
            )
            data = {"status": "clear", "region": region}

        all_data = {
            **data,
            "weather_alerts": [w.model_dump() for w in weather] if weather else [],
            "political_events": [p.model_dump() for p in political] if political else [],
        }

        return response, all_data, [
            "Delivery route change korte hobe?",
            "Alternative supplier ache?",
            "Insurance claim korbo",
        ]

    async def _handle_marketing(
        self, merchant_id: str, products: List[str], merchant_name: str
    ) -> tuple:
        """Marketing & creative content agent"""
        merchant = demo_data.get_merchant(merchant_id)
        prods = demo_data.get_products(merchant_id)[:3]

        product_list = ", ".join(p.name for p in prods) if prods else "best products"

        captions = [
            f"🔥 {merchant.name if merchant else 'Amar Dokan'} er special offer!\n\n"
            f"✅ {product_list}\n"
            f"💰 Best price guarantee!\n"
            f"📞 Order korun ekhoni!\n"
            f"🚚 Free delivery available\n\n"
            f"#BazaarMind #BestDeals #Bangladesh",

            f"আজকের বিশেষ offer! 🎉\n\n"
            f"🏪 {merchant.name if merchant else 'Amar Dokan'}\n"
            f"📦 Fresh stock just arrived!\n"
            f"⭐ Quality guaranteed\n"
            f"📱 WhatsApp e order korun\n\n"
            f"#LocalBusiness #ShopLocal",

            f"Eid er preparation shuru hoye geche! 🌙\n\n"
            f"🛒 {product_list} — sob kichui paben!\n"
            f"💯 Original products only\n"
            f"🤝 Trust er dokan\n"
            f"📞 Call korun: {merchant.phone if merchant else '+880...'}\n\n"
            f"#EidShopping #BangladeshBusiness",
        ]

        caption = random.choice(captions)
        data = {"caption": caption, "platform": "Facebook/WhatsApp"}

        response = banglish_processor.generate_culturally_calibrated_response(
            "marketing", data, merchant_name
        )

        return response, data, [
            "Arekta version banao",
            "Instagram er jonno adjust koro",
            "Eid special post chai",
        ]

    async def _handle_complaint(self, merchant_name: str) -> tuple:
        """Complaint handling agent"""
        response = (
            f"আসসালামু আলাইকুম {merchant_name}! 🙏\n\n"
            "Apnar somossa ta amake bolun. Ami help korte chai.\n\n"
            "Common solutions:\n"
            "  ✅ Price calculation issue → 'Dam thik koro'\n"
            "  ✅ Stock mismatch → 'Stock update koro'\n"
            "  ✅ Delivery problem → 'Delivery status ki?'\n"
            "  ✅ Technical issue → 'System reset koro'\n\n"
            "Ki problem hocche specifically? 🤔"
        )

        return response, {"type": "complaint_handler"}, [
            "Price issue ache",
            "Delivery problem",
            "System kaje na",
        ]


# Global singleton
orchestrator = AIOrchestrator()
