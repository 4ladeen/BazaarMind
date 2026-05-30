"""BazaarMind — Banglish Language Processor
Handles Banglish↔Bangla translation, intent parsing, and cultural calibration.
"""
from __future__ import annotations
import re
from typing import Dict, List, Tuple, Optional


# ─── Banglish → Bangla Common Mappings ─────────────────

BANGLISH_VOCAB = {
    # Greetings
    "assalamualaikum": "আসসালামু আলাইকুম",
    "salam": "সালাম",
    "vai": "ভাই",
    "bhai": "ভাই",
    "apa": "আপা",
    "dada": "দাদা",

    # Commerce terms
    "dokan": "দোকান",
    "dokaan": "দোকান",
    "bazaar": "বাজার",
    "bazar": "বাজার",
    "dam": "দাম",
    "daam": "দাম",
    "sell": "বিক্রি",
    "bikri": "বিক্রি",
    "kena": "কেনা",
    "kinsi": "কিনছি",
    "mal": "মাল",
    "jinish": "জিনিস",
    "porimann": "পরিমাণ",
    "stock": "স্টক",
    "order": "অর্ডার",
    "profit": "লাভ",
    "labh": "লাভ",
    "loss": "লোকসান",
    "loksan": "লোকসান",
    "customer": "কাস্টমার",
    "kustomer": "কাস্টমার",
    "wholesale": "পাইকারি",
    "paikari": "পাইকারি",
    "retail": "খুচরা",
    "khuchra": "খুচরা",

    # Products
    "chal": "চাল",
    "rice": "চাল",
    "tel": "তেল",
    "oil": "তেল",
    "chini": "চিনি",
    "sugar": "চিনি",
    "dal": "ডাল",
    "lentil": "ডাল",
    "alu": "আলু",
    "potato": "আলু",
    "peyaj": "পেঁয়াজ",
    "onion": "পেঁয়াজ",
    "moshla": "মশলা",
    "masala": "মশলা",

    # Time
    "aj": "আজ",
    "aaj": "আজ",
    "kal": "কাল",
    "kaal": "কাল",
    "agami": "আগামী",
    "poroshu": "পরশু",
    "shoptah": "সপ্তাহ",
    "week": "সপ্তাহ",
    "mash": "মাস",
    "month": "মাস",

    # Questions
    "ki": "কি",
    "keno": "কেন",
    "kobe": "কবে",
    "koto": "কত",
    "kothay": "কোথায়",

    # Actions
    "rakhbo": "রাখবো",
    "korbo": "করবো",
    "chai": "চাই",
    "lagbe": "লাগবে",
    "hobe": "হবে",
    "bolun": "বলুন",
    "bolen": "বলেন",
    "janaben": "জানাবেন",
    "help": "সাহায্য",
    "shahajjo": "সাহায্য",
}

# ─── Intent Patterns ───────────────────────────────────

INTENT_PATTERNS = {
    "pricing_query": [
        r"dam\s+ki\s+rakh",
        r"price\s+ki",
        r"koto\s+dam",
        r"dam\s+koto",
        r"dam\s+barab",
        r"dam\s+komab",
        r"optimal\s+price",
        r"best\s+price",
        r"pricing",
        r"daam",
    ],
    "stock_update": [
        r"stock\s+ki",
        r"stock\s+update",
        r"mal\s+ase",
        r"mal\s+nai",
        r"inventory",
        r"stock\s+koto",
        r"restock",
        r"order\s+korbo",
    ],
    "demand_forecast": [
        r"ki\s+sell\s+hobe",
        r"ki\s+bikri\s+hobe",
        r"demand\s+ki",
        r"kal\s+ki\s+hobe",
        r"agami\s+week",
        r"forecast",
        r"prediction",
        r"koto\s+bikri",
        r"trend",
    ],
    "marketing": [
        r"marketing",
        r"advertis",
        r"social\s+media",
        r"facebook",
        r"post",
        r"caption",
        r"promote",
        r"ad\s+copy",
        r"campaign",
    ],
    "disruption_alert": [
        r"weather",
        r"bonna",  # flood
        r"gor[jz]on",  # storm
        r"hartal",
        r"bondho",
        r"band",
        r"delivery\s+problem",
        r"route\s+bondho",
        r"supply\s+chain",
        r"disruption",
    ],
    "complaint": [
        r"problem",
        r"somossa",
        r"shomoshsha",
        r"kaj\s+korche\s+na",
        r"error",
        r"bhul",
        r"wrong",
        r"complain",
        r"fix",
        r"help\s+koren",
    ],
}


class BanglishProcessor:
    """Processes Banglish text for intent classification and translation"""

    def __init__(self):
        self.vocab = BANGLISH_VOCAB
        self.intent_patterns = INTENT_PATTERNS

    def classify_intent(self, text: str) -> Tuple[str, float]:
        """Classify the intent of a Banglish message"""
        text_lower = text.lower().strip()
        scores: Dict[str, float] = {}

        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                matches = re.findall(pattern, text_lower)
                score += len(matches)
            if score > 0:
                scores[intent] = score

        if not scores:
            return "general", 0.5

        best_intent = max(scores, key=scores.get)
        total = sum(scores.values())
        confidence = min(0.95, scores[best_intent] / total * 0.8 + 0.2)

        return best_intent, round(confidence, 2)

    def normalize_query(self, text: str) -> str:
        """Normalize Banglish query by translating known words to standard Bangla"""
        words = text.lower().split()
        normalized = []

        for word in words:
            clean_word = re.sub(r'[?!.,;:]', '', word)
            if clean_word in self.vocab:
                normalized.append(self.vocab[clean_word])
            else:
                normalized.append(word)

        return " ".join(normalized)

    def extract_product_mentions(self, text: str) -> List[str]:
        """Extract product names mentioned in Banglish text"""
        text_lower = text.lower()
        products = []
        product_words = {
            "chal": "rice", "tel": "oil", "chini": "sugar",
            "dal": "lentils", "alu": "potato", "peyaj": "onion",
            "moshla": "masala", "rice": "rice", "oil": "oil",
            "sugar": "sugar", "phone": "phone", "charger": "charger",
            "medicine": "medicine", "oshudh": "medicine",
            "fertilizer": "fertilizer", "shar": "fertilizer",
            "soap": "soap", "saree": "saree", "lungi": "lungi",
        }

        for banglish, english in product_words.items():
            if banglish in text_lower:
                products.append(english)

        return list(set(products))

    def extract_time_reference(self, text: str) -> Optional[str]:
        """Extract time reference from Banglish text"""
        text_lower = text.lower()
        time_mappings = {
            "aj": "today", "aaj": "today",
            "kal": "tomorrow", "kaal": "tomorrow",
            "poroshu": "day_after_tomorrow",
            "next week": "next_week", "agami shoptah": "next_week",
            "next month": "next_month", "agami mash": "next_month",
            "ekhon": "now",
        }

        for banglish, ref in time_mappings.items():
            if banglish in text_lower:
                return ref
        return None

    def generate_culturally_calibrated_response(
        self, intent: str, data: dict, merchant_name: str = "ভাই"
    ) -> str:
        """Generate a culturally appropriate Banglish response"""

        greeting = f"আসসালামু আলাইকুম {merchant_name}! 🙏\n\n"

        if intent == "pricing_query":
            product = data.get("product_name", "product")
            optimal = data.get("optimal_price", 0)
            current = data.get("current_price", 0)
            return (
                f"{greeting}"
                f"📊 **{product}** er price analysis:\n\n"
                f"Apnar current price: **৳{current}**\n"
                f"Optimal price recommendation: **৳{optimal}**\n\n"
                f"{data.get('recommendation', '')}\n\n"
                f"💡 Ei price e apnar profit maximize hobe insha'Allah!"
            )

        elif intent == "demand_forecast":
            product = data.get("product_name", "product")
            demand = data.get("predicted_demand", 0)
            trend = data.get("trend", "stable")
            trend_emoji = {"rising": "📈", "stable": "➡️", "declining": "📉"}.get(trend, "➡️")
            return (
                f"{greeting}"
                f"{trend_emoji} **{product}** er demand forecast:\n\n"
                f"Agami 7 diner predicted demand: **{demand} units**\n"
                f"Trend: **{trend}**\n\n"
                f"Factors:\n" +
                "\n".join(f"  • {f}" for f in data.get("factors", [])) +
                f"\n\n💡 Eto stock ready rakhle kal theke valo bikri hobe!"
            )

        elif intent == "stock_update":
            return (
                f"{greeting}"
                f"📦 Apnar inventory status:\n\n"
                f"Total products: **{data.get('total_products', 0)}**\n"
                f"Low stock alerts: **{data.get('low_stock', 0)}** ⚠️\n\n"
                f"Ki stock order korte chan? Amake bolun!"
            )

        elif intent == "disruption_alert":
            event = data.get("event_type", "disruption")
            severity = data.get("severity", "moderate")
            sev_emoji = {"low": "🟢", "moderate": "🟡", "high": "🟠", "critical": "🔴"}.get(severity, "⚠️")
            return (
                f"{greeting}"
                f"{sev_emoji} **Disruption Alert:**\n\n"
                f"Type: **{event}**\n"
                f"Severity: **{severity.upper()}**\n\n"
                f"Recommended actions:\n" +
                "\n".join(f"  • {a}" for a in data.get("recommended_actions", [])) +
                f"\n\n🤲 Allah apnader safe rakhuk. Savdhane thakben!"
            )

        elif intent == "marketing":
            return (
                f"{greeting}"
                f"📱 Social media post ready!\n\n"
                f"---\n"
                f"{data.get('caption', 'Apnar dokan er jonno best deals!')}\n"
                f"---\n\n"
                f"Ei post ta Facebook/WhatsApp status e dite paren! 🎯"
            )

        else:
            return (
                f"{greeting}"
                f"Apni ki jante chacchen bolun:\n\n"
                f"📊 Price suggestion → 'dam ki rakhbo?'\n"
                f"📈 Demand forecast → 'kal ki sell hobe?'\n"
                f"📦 Stock check → 'stock koto ase?'\n"
                f"⚠️ Disruption alerts → 'weather ki hobe?'\n"
                f"📱 Marketing copy → 'Facebook post banao'\n\n"
                f"Apnar je kono proshno te ami achi! 😊"
            )


# Global singleton
banglish_processor = BanglishProcessor()
