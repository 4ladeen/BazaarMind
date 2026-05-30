"""BazaarMind — Demo Data Service
Generates realistic synthetic data for the Bangladeshi merchant ecosystem.
Used when DEMO_MODE=true or when no database is connected.
"""
from __future__ import annotations
import random
import math
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from backend.models.schemas import (
    Merchant, Product, Transaction, DemandForecast, PriceElasticity,
    SeasonalityIndex, MFSPaydayCycle, WeatherDisruption, PoliticalEvent,
    CODFailureMatrix, DashboardKPIs, RevenueTimeSeries, InventoryAlert,
    MerchantTier, ProductCategory, DisruptionSeverity, SignalType
)

# ─── Bangladeshi Regional Data ────────────────────────

DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh"]
DISTRICTS = {
    "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj", "Munshiganj"],
    "Chittagong": ["Chittagong", "Cox's Bazar", "Comilla", "Noakhali", "Feni"],
    "Rajshahi": ["Rajshahi", "Bogra", "Pabna", "Natore", "Sirajganj"],
    "Khulna": ["Khulna", "Jessore", "Satkhira", "Bagerhat", "Kushtia"],
    "Sylhet": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
    "Barisal": ["Barisal", "Patuakhali", "Bhola", "Jhalokati"],
    "Rangpur": ["Rangpur", "Dinajpur", "Thakurgaon", "Nilphamari", "Kurigram"],
    "Mymensingh": ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
}

MERCHANT_NAMES = [
    "Rahim General Store", "Karim Traders", "Noor Electronics", "Fatema Fashion House",
    "Hasan Pharmacy", "Bismillah Grocery", "Al-Amin Hardware", "Jahanara Cosmetics",
    "Kabir Agro Supplies", "Shanti Store", "Maa Grocery", "Dhaka Traders Hub",
    "Chittagong Fresh Mart", "Rajshahi Harvest", "Khulna Fish Market",
    "Sylhet Tea Corner", "Rangpur Rice Depot", "Barisal Spice World",
    "Gazipur Mobile Zone", "Comilla Sweet Shop", "Bogra Dairy Farm",
    "Jessore Jute Works", "Cox's Bazar Dry Fish", "Tangail Saree House",
]

PRODUCTS_BY_CATEGORY = {
    ProductCategory.GROCERY: [
        {"name": "Miniket Rice (25kg)", "name_bn": "মিনিকেট চাল (২৫কেজি)", "unit": "bag", "cogs": 1200, "price": 1450},
        {"name": "Soybean Oil (5L)", "name_bn": "সয়াবিন তেল (৫লি)", "unit": "bottle", "cogs": 680, "price": 820},
        {"name": "Sugar (5kg)", "name_bn": "চিনি (৫কেজি)", "unit": "bag", "cogs": 450, "price": 560},
        {"name": "Salt (1kg)", "name_bn": "লবণ (১কেজি)", "unit": "packet", "cogs": 25, "price": 40},
        {"name": "Lentils - Masoor (1kg)", "name_bn": "মসুর ডাল (১কেজি)", "unit": "kg", "cogs": 110, "price": 145},
        {"name": "Onion (1kg)", "name_bn": "পেঁয়াজ (১কেজি)", "unit": "kg", "cogs": 60, "price": 85},
        {"name": "Potato (1kg)", "name_bn": "আলু (১কেজি)", "unit": "kg", "cogs": 25, "price": 40},
        {"name": "Flour - Atta (2kg)", "name_bn": "আটা (২কেজি)", "unit": "bag", "cogs": 85, "price": 110},
    ],
    ProductCategory.ELECTRONICS: [
        {"name": "Feature Phone", "name_bn": "ফিচার ফোন", "unit": "piece", "cogs": 800, "price": 1200},
        {"name": "Phone Charger", "name_bn": "ফোন চার্জার", "unit": "piece", "cogs": 80, "price": 150},
        {"name": "Earphones", "name_bn": "ইয়ারফোন", "unit": "piece", "cogs": 50, "price": 120},
        {"name": "LED Bulb 12W", "name_bn": "এলইডি বাল্ব ১২ওয়াট", "unit": "piece", "cogs": 45, "price": 80},
        {"name": "Extension Board", "name_bn": "এক্সটেনশন বোর্ড", "unit": "piece", "cogs": 180, "price": 300},
    ],
    ProductCategory.FMCG: [
        {"name": "Radhuni Masala Set", "name_bn": "রাঁধুনি মশলা সেট", "unit": "pack", "cogs": 120, "price": 165},
        {"name": "Pran Juice (1L)", "name_bn": "প্রাণ জুস (১লি)", "unit": "bottle", "cogs": 60, "price": 85},
        {"name": "ACI Pure Turmeric", "name_bn": "এসিআই হলুদ", "unit": "pack", "cogs": 35, "price": 55},
        {"name": "Fresh Toilet Tissue", "name_bn": "ফ্রেশ টয়লেট টিস্যু", "unit": "roll", "cogs": 45, "price": 65},
        {"name": "Lux Soap", "name_bn": "লাক্স সাবান", "unit": "piece", "cogs": 30, "price": 50},
    ],
    ProductCategory.PHARMACY: [
        {"name": "Paracetamol 500mg (10 tab)", "name_bn": "প্যারাসিটামল", "unit": "strip", "cogs": 8, "price": 15},
        {"name": "Antacid Syrup", "name_bn": "এন্টাসিড সিরাপ", "unit": "bottle", "cogs": 45, "price": 70},
        {"name": "Vitamin C", "name_bn": "ভিটামিন সি", "unit": "strip", "cogs": 15, "price": 30},
        {"name": "ORS Saline", "name_bn": "ওআরএস স্যালাইন", "unit": "packet", "cogs": 5, "price": 12},
    ],
    ProductCategory.AGRICULTURE: [
        {"name": "Urea Fertilizer (50kg)", "name_bn": "ইউরিয়া সার (৫০কেজি)", "unit": "bag", "cogs": 1100, "price": 1350},
        {"name": "DAP Fertilizer (50kg)", "name_bn": "ডিএপি সার (৫০কেজি)", "unit": "bag", "cogs": 2200, "price": 2600},
        {"name": "Pesticide Spray (1L)", "name_bn": "কীটনাশক স্প্রে", "unit": "bottle", "cogs": 350, "price": 480},
        {"name": "Hybrid Rice Seeds (1kg)", "name_bn": "হাইব্রিড ধানের বীজ", "unit": "kg", "cogs": 250, "price": 380},
    ],
    ProductCategory.CLOTHING: [
        {"name": "Lungi (Cotton)", "name_bn": "লুঙ্গি (সুতি)", "unit": "piece", "cogs": 200, "price": 350},
        {"name": "Saree (Jamdani)", "name_bn": "শাড়ি (জামদানি)", "unit": "piece", "cogs": 800, "price": 1500},
        {"name": "T-Shirt (Men)", "name_bn": "টি-শার্ট (পুরুষ)", "unit": "piece", "cogs": 150, "price": 280},
    ],
}

# Bangla month names for seasonality
BANGLA_MONTHS = [
    "Boishakh", "Joishtho", "Asharh", "Srabon",
    "Bhadro", "Ashwin", "Kartik", "Aghrahayan",
    "Poush", "Magh", "Falgun", "Choitro"
]

# Seasonal patterns for Bangladesh
SEASONAL_EVENTS = {
    1: ["Winter ending", "Poush Mela"],
    2: ["Ekushey February", "Spring season starts"],
    3: ["Independence Day preparations", "Falgun festival"],
    4: ["Pohela Boishakh (Bangla New Year)", "Summer begins"],
    5: ["Monsoon approaching", "Joishtho heat"],
    6: ["Monsoon season starts", "Flood risk increases"],
    7: ["Peak monsoon", "Heavy rainfall"],
    8: ["Monsoon continues", "School reopening"],
    9: ["Monsoon ending", "Durga Puja preparations"],
    10: ["Festival season peak", "Eid preparations possible"],
    11: ["Winter approaching", "Wedding season starts"],
    12: ["Victory Day", "Winter peak", "Wedding season"],
}


class DemoDataService:
    """Generates and manages realistic demo data for BazaarMind"""

    def __init__(self):
        self._merchants: List[Merchant] = []
        self._products: Dict[str, List[Product]] = {}
        self._transactions: List[Transaction] = []
        self._initialized = False

    def initialize(self):
        """Generate all demo data"""
        if self._initialized:
            return

        random.seed(42)  # Reproducible data
        self._generate_merchants()
        self._generate_products()
        self._generate_transactions()
        self._initialized = True

    def _generate_merchants(self):
        """Generate 24 demo merchants across Bangladesh"""
        for i, name in enumerate(MERCHANT_NAMES):
            division = DIVISIONS[i % len(DIVISIONS)]
            district = random.choice(DISTRICTS[division])
            categories = random.sample(
                list(ProductCategory),
                k=random.randint(1, 3)
            )
            tier = random.choice(list(MerchantTier))

            revenue_by_tier = {
                MerchantTier.STARTER: random.uniform(20000, 80000),
                MerchantTier.GROWING: random.uniform(80000, 250000),
                MerchantTier.ESTABLISHED: random.uniform(250000, 800000),
                MerchantTier.PREMIUM: random.uniform(800000, 3000000),
            }

            merchant = Merchant(
                id=f"merchant-{i+1:03d}",
                name=name,
                phone=f"+8801{random.randint(300000000, 999999999)}",
                location=f"{district} Bazar, {district}",
                division=division,
                district=district,
                tier=tier,
                categories=[c.value for c in categories],
                monthly_revenue_bdt=round(revenue_by_tier[tier], 2),
                is_active=random.random() > 0.1,
                whatsapp_verified=random.random() > 0.3,
                total_transactions=random.randint(50, 5000),
            )
            self._merchants.append(merchant)

    def _generate_products(self):
        """Generate products for each merchant"""
        for merchant in self._merchants:
            merchant_products = []
            for cat_str in merchant.categories:
                cat = ProductCategory(cat_str)
                if cat in PRODUCTS_BY_CATEGORY:
                    for j, prod_data in enumerate(PRODUCTS_BY_CATEGORY[cat]):
                        price_variance = random.uniform(0.9, 1.15)
                        stock = random.uniform(0, 200)
                        product = Product(
                            id=f"prod-{merchant.id}-{cat.value}-{j:02d}",
                            merchant_id=merchant.id,
                            name=prod_data["name"],
                            name_bn=prod_data.get("name_bn"),
                            category=cat,
                            unit=prod_data["unit"],
                            cogs=prod_data["cogs"],
                            selling_price=round(prod_data["price"] * price_variance, 2),
                            stock_quantity=round(stock, 1),
                            min_stock_threshold=random.uniform(5, 30),
                        )
                        merchant_products.append(product)
            self._products[merchant.id] = merchant_products

    def _generate_transactions(self):
        """Generate 90 days of transaction history"""
        today = date.today()
        for merchant in self._merchants:
            products = self._products.get(merchant.id, [])
            if not products:
                continue
            daily_tx_count = max(1, merchant.total_transactions // 90)
            for day_offset in range(90):
                tx_date = today - timedelta(days=day_offset)
                # Weekday effect
                day_multiplier = 1.2 if tx_date.weekday() in [4, 5] else 1.0  # Thu/Fri higher in BD
                num_txs = max(1, int(daily_tx_count * day_multiplier * random.uniform(0.5, 1.5)))
                for _ in range(min(num_txs, 10)):  # Cap for performance
                    prod = random.choice(products)
                    qty = round(random.uniform(1, 20), 1)
                    tx = Transaction(
                        id=f"tx-{merchant.id}-{day_offset}-{random.randint(1000,9999)}",
                        merchant_id=merchant.id,
                        product_id=prod.id,
                        quantity=qty,
                        unit_price=prod.selling_price,
                        total_amount=round(qty * prod.selling_price, 2),
                        payment_method=random.choice(["cash", "bkash", "nagad", "cash", "cash"]),
                        date=tx_date,
                    )
                    self._transactions.append(tx)

    # ─── Data Access Methods ───────────────────────────

    def get_merchants(self, limit: int = 50, offset: int = 0) -> List[Merchant]:
        self.initialize()
        return self._merchants[offset:offset + limit]

    def get_merchant(self, merchant_id: str) -> Optional[Merchant]:
        self.initialize()
        return next((m for m in self._merchants if m.id == merchant_id), None)

    def get_products(self, merchant_id: str) -> List[Product]:
        self.initialize()
        return self._products.get(merchant_id, [])

    def get_all_products(self) -> List[Product]:
        self.initialize()
        all_prods = []
        for prods in self._products.values():
            all_prods.extend(prods)
        return all_prods

    def get_transactions(
        self, merchant_id: Optional[str] = None,
        days: int = 30
    ) -> List[Transaction]:
        self.initialize()
        cutoff = date.today() - timedelta(days=days)
        txs = self._transactions
        if merchant_id:
            txs = [t for t in txs if t.merchant_id == merchant_id]
        return [t for t in txs if t.date >= cutoff]

    # ─── Forecast Methods ──────────────────────────────

    def get_demand_forecasts(
        self, merchant_id: str, days_ahead: int = 7
    ) -> List[DemandForecast]:
        self.initialize()
        products = self._products.get(merchant_id, [])
        forecasts = []
        today = date.today()

        for product in products[:10]:  # Top 10 products
            base_demand = random.uniform(5, 50)
            month = today.month
            # Seasonal adjustment
            seasonal_factor = self._get_seasonal_factor(product.category, month)

            for d in range(days_ahead):
                forecast_date = today + timedelta(days=d + 1)
                noise = random.gauss(1, 0.1)
                day_demand = base_demand * seasonal_factor * noise

                # Weekend boost
                if forecast_date.weekday() in [4, 5]:
                    day_demand *= 1.25

                forecasts.append(DemandForecast(
                    product_id=product.id,
                    product_name=product.name,
                    forecast_date=forecast_date,
                    predicted_demand=round(max(0, day_demand), 1),
                    confidence_lower=round(max(0, day_demand * 0.7), 1),
                    confidence_upper=round(day_demand * 1.3, 1),
                    seasonality_factor=round(seasonal_factor, 2),
                    trend=random.choice(["rising", "stable", "stable", "declining"]),
                    factors=self._get_demand_factors(product.category, month),
                ))
        return forecasts

    def get_price_elasticity(self, merchant_id: str) -> List[PriceElasticity]:
        self.initialize()
        products = self._products.get(merchant_id, [])
        elasticities = []

        for product in products[:10]:
            margin_pct = (product.selling_price - product.cogs) / product.cogs
            # Higher margins = more room for price optimization
            elasticity = random.uniform(-2.5, -0.3)
            optimal_delta = random.uniform(-0.1, 0.15)
            optimal_price = max(
                product.cogs * 1.05,  # At least 5% margin
                product.selling_price * (1 + optimal_delta)
            )

            elasticities.append(PriceElasticity(
                product_id=product.id,
                product_name=product.name,
                current_price=product.selling_price,
                optimal_price=round(optimal_price, 2),
                cogs_floor=product.cogs,
                elasticity_coefficient=round(elasticity, 3),
                expected_demand_change_pct=round(optimal_delta * elasticity * 100, 1),
                expected_revenue_change_pct=round(random.uniform(-5, 15), 1),
                recommendation=self._get_price_recommendation(margin_pct, elasticity),
            ))
        return elasticities

    def get_seasonality_indices(self, category: Optional[str] = None) -> List[SeasonalityIndex]:
        indices = []
        categories = [ProductCategory(category)] if category else list(ProductCategory)

        for cat in categories:
            for month in range(1, 13):
                factor = self._get_seasonal_factor(cat, month)
                peak_reason = None
                if factor > 1.2:
                    peak_reason = ", ".join(SEASONAL_EVENTS.get(month, []))

                indices.append(SeasonalityIndex(
                    product_id="aggregate",
                    product_name=f"{cat.value} (Aggregate)",
                    category=cat,
                    month=month,
                    index_value=round(factor, 2),
                    peak_reason=peak_reason,
                    historical_avg_demand=round(random.uniform(100, 500) * factor, 0),
                ))
        return indices

    # ─── Signal Methods ────────────────────────────────

    def get_mfs_payday_cycles(self, region: Optional[str] = None) -> List[MFSPaydayCycle]:
        today = date.today()
        cycles = []
        regions = [region] if region else DIVISIONS[:4]

        for reg in regions:
            for provider in ["bKash", "Nagad", "Rocket"]:
                # Salary cycles: 1st, 10th, 25th of month
                payday_days = [1, 10, 25]
                next_payday = None
                for pd_day in sorted(payday_days):
                    try:
                        candidate = today.replace(day=pd_day)
                        if candidate > today:
                            next_payday = candidate
                            break
                    except ValueError:
                        continue
                if not next_payday:
                    next_payday = (today.replace(day=1) + timedelta(days=32)).replace(day=1)

                cycles.append(MFSPaydayCycle(
                    provider=provider,
                    next_payday=next_payday,
                    days_until_payday=(next_payday - today).days,
                    expected_liquidity_spike_pct=round(random.uniform(15, 45), 1),
                    region=reg,
                    historical_spend_increase=round(random.uniform(20, 60), 1),
                ))
        return cycles

    def get_weather_disruptions(self, region: Optional[str] = None) -> List[WeatherDisruption]:
        today = date.today()
        month = today.month
        disruptions = []
        regions = [region] if region else random.sample(DIVISIONS, 3)

        # Monsoon season disruptions (June-September)
        weather_events = []
        if month in [6, 7, 8, 9]:
            weather_events = [
                ("heavy_rain", DisruptionSeverity.MODERATE),
                ("flood", DisruptionSeverity.HIGH),
            ]
        elif month in [4, 5]:
            weather_events = [
                ("heat_wave", DisruptionSeverity.MODERATE),
                ("nor_wester", DisruptionSeverity.LOW),
            ]
        elif month in [10, 11]:
            weather_events = [
                ("cyclone", DisruptionSeverity.HIGH),
            ]
        else:
            weather_events = [
                ("cold_wave", DisruptionSeverity.LOW),
            ]

        for reg in regions:
            event_type, severity = random.choice(weather_events) if weather_events else ("clear", DisruptionSeverity.LOW)
            disruptions.append(WeatherDisruption(
                region=reg,
                division=reg,
                event_type=event_type,
                severity=severity,
                start_date=today - timedelta(days=random.randint(0, 2)),
                expected_end_date=today + timedelta(days=random.randint(1, 7)),
                supply_chain_impact_score=round(random.uniform(2, 8), 1),
                affected_routes=[
                    f"{reg}-Dhaka Highway",
                    f"{reg} River Route",
                    f"Local {reg} Distribution"
                ],
                recommended_actions=[
                    "Stock 3-5 extra days of essential goods",
                    "Switch to alternative suppliers in unaffected areas",
                    "Increase prices 5-10% to account for higher transport costs",
                    "Alert customers about potential delivery delays",
                ],
            ))
        return disruptions

    def get_political_events(self, region: Optional[str] = None) -> List[PoliticalEvent]:
        today = date.today()
        events = []

        # Generate some realistic events
        event_templates = [
            {
                "event_type": "national_holiday",
                "start_date": today + timedelta(days=random.randint(5, 30)),
                "disruption_probability": 0.9,
                "market_closure_expected": True,
                "stock_buffer": 2,
            },
            {
                "event_type": "local_election",
                "start_date": today + timedelta(days=random.randint(15, 60)),
                "disruption_probability": 0.4,
                "market_closure_expected": False,
                "stock_buffer": 1,
            },
        ]

        regions = [region] if region else random.sample(DIVISIONS, 2)
        for reg in regions:
            template = random.choice(event_templates)
            events.append(PoliticalEvent(
                event_type=template["event_type"],
                region=reg,
                start_date=template["start_date"],
                end_date=template["start_date"] + timedelta(days=1),
                disruption_probability=template["disruption_probability"],
                market_closure_expected=template["market_closure_expected"],
                recommended_stock_buffer_days=template["stock_buffer"],
            ))
        return events

    def get_cod_failure_matrix(self, region: Optional[str] = None) -> List[CODFailureMatrix]:
        matrices = []
        regions = [region] if region else DIVISIONS

        for reg in regions:
            failure_rate = random.uniform(5, 35)
            matrices.append(CODFailureMatrix(
                region=reg,
                division=reg,
                failure_rate_pct=round(failure_rate, 1),
                avg_return_cost_bdt=round(random.uniform(50, 200), 0),
                top_failure_reasons=[
                    "Customer unavailable",
                    "Wrong address",
                    "Changed mind",
                    "Damaged packaging",
                    "Price dispute",
                ][:random.randint(2, 5)],
                recommendation=self._get_cod_recommendation(failure_rate),
            ))
        return matrices

    # ─── Dashboard KPIs ────────────────────────────────

    def get_dashboard_kpis(self) -> DashboardKPIs:
        self.initialize()
        all_products = self.get_all_products()
        recent_txs = self.get_transactions(days=1)
        low_stock = [p for p in all_products if p.stock_quantity < p.min_stock_threshold]
        disruptions = self.get_weather_disruptions()

        total_revenue = sum(t.total_amount for t in self.get_transactions(days=30))
        today_revenue = sum(t.total_amount for t in recent_txs)

        category_revenue = {}
        for tx in self.get_transactions(days=30):
            for prods in self._products.values():
                prod = next((p for p in prods if p.id == tx.product_id), None)
                if prod:
                    cat = prod.category if isinstance(prod.category, str) else prod.category.value
                    category_revenue[cat] = category_revenue.get(cat, 0) + tx.total_amount
                    break

        top_cats = sorted(category_revenue.items(), key=lambda x: x[1], reverse=True)[:5]

        return DashboardKPIs(
            total_merchants=len(self._merchants),
            active_merchants_today=len([m for m in self._merchants if m.is_active]),
            total_revenue_bdt=round(total_revenue, 2),
            avg_order_value_bdt=round(today_revenue / max(len(recent_txs), 1), 2),
            total_products=len(all_products),
            low_stock_alerts=len(low_stock),
            active_disruptions=len([d for d in disruptions if d.severity in [DisruptionSeverity.HIGH, DisruptionSeverity.CRITICAL]]),
            demand_accuracy_pct=round(random.uniform(78, 95), 1),
            queries_today=random.randint(50, 300),
            top_categories=[{"name": cat, "revenue": round(rev, 2)} for cat, rev in top_cats],
        )

    def get_revenue_timeseries(self, days: int = 30) -> List[RevenueTimeSeries]:
        self.initialize()
        today = date.today()
        series = []

        for d in range(days):
            tx_date = today - timedelta(days=days - d - 1)
            day_txs = [t for t in self._transactions if t.date == tx_date]
            revenue = sum(t.total_amount for t in day_txs)
            series.append(RevenueTimeSeries(
                date=tx_date.isoformat(),
                revenue=round(revenue, 2),
                transactions=len(day_txs),
                avg_order_value=round(revenue / max(len(day_txs), 1), 2),
            ))
        return series

    def get_inventory_alerts(self) -> List[InventoryAlert]:
        self.initialize()
        alerts = []
        for merchant in self._merchants:
            products = self._products.get(merchant.id, [])
            for prod in products:
                if prod.stock_quantity < prod.min_stock_threshold:
                    days_until_stockout = max(0, prod.stock_quantity / max(random.uniform(1, 10), 0.1))
                    urgency = DisruptionSeverity.CRITICAL if days_until_stockout < 1 else \
                              DisruptionSeverity.HIGH if days_until_stockout < 3 else \
                              DisruptionSeverity.MODERATE if days_until_stockout < 7 else \
                              DisruptionSeverity.LOW
                    alerts.append(InventoryAlert(
                        product_id=prod.id,
                        product_name=prod.name,
                        merchant_id=merchant.id,
                        merchant_name=merchant.name,
                        current_stock=prod.stock_quantity,
                        min_threshold=prod.min_stock_threshold,
                        days_until_stockout=round(days_until_stockout, 1),
                        urgency=urgency,
                    ))
        return sorted(alerts, key=lambda a: a.days_until_stockout)[:20]

    # ─── Helper Methods ───────────────────────────────

    @staticmethod
    def _get_seasonal_factor(category: ProductCategory, month: int) -> float:
        """Bangladesh-specific seasonal patterns"""
        patterns = {
            ProductCategory.GROCERY: [1.0, 0.95, 1.0, 1.15, 1.1, 1.2, 1.3, 1.1, 1.0, 1.25, 1.3, 1.2],
            ProductCategory.ELECTRONICS: [0.8, 0.9, 0.85, 1.0, 0.9, 0.7, 0.6, 0.9, 1.0, 1.3, 1.4, 1.2],
            ProductCategory.CLOTHING: [0.9, 0.8, 0.85, 1.4, 0.9, 0.7, 0.7, 0.8, 1.0, 1.5, 1.3, 1.1],
            ProductCategory.PHARMACY: [1.2, 1.0, 1.0, 1.0, 1.1, 1.3, 1.4, 1.2, 1.1, 1.0, 1.0, 1.1],
            ProductCategory.AGRICULTURE: [0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.3, 1.1, 0.9, 0.8, 0.7, 0.6],
            ProductCategory.FMCG: [1.0, 1.0, 1.0, 1.2, 1.1, 1.1, 1.0, 1.0, 1.0, 1.3, 1.2, 1.1],
            ProductCategory.HARDWARE: [0.9, 1.0, 1.1, 1.0, 0.8, 0.6, 0.5, 0.7, 1.0, 1.1, 1.2, 1.0],
            ProductCategory.COSMETICS: [0.9, 1.0, 1.1, 1.3, 1.0, 0.8, 0.8, 0.9, 1.0, 1.4, 1.3, 1.1],
        }
        if isinstance(category, str):
            category = ProductCategory(category)
        factors = patterns.get(category, [1.0] * 12)
        return factors[month - 1]

    @staticmethod
    def _get_demand_factors(category: ProductCategory, month: int) -> List[str]:
        factors = []
        events = SEASONAL_EVENTS.get(month, [])
        if events:
            factors.extend(events[:2])
        if month in [6, 7, 8]:
            factors.append("Monsoon season impact")
        if month in [10, 11, 12]:
            factors.append("Festival & wedding season")
        if month == 4:
            factors.append("Bangla New Year boost")
        return factors

    @staticmethod
    def _get_price_recommendation(margin_pct: float, elasticity: float) -> str:
        if margin_pct < 0.1:
            return "⚠️ Margin is very thin. Consider raising price by 5-10% or finding cheaper supplier."
        elif elasticity < -1.5:
            return "📉 Product is highly price-sensitive. Small price increases will significantly reduce demand. Keep current price."
        elif margin_pct > 0.4:
            return "💰 Strong margin. You can afford a 5% discount to boost volume during slow periods."
        else:
            return "✅ Price is well-positioned. Monitor competitor prices and adjust seasonally."

    @staticmethod
    def _get_cod_recommendation(failure_rate: float) -> str:
        if failure_rate > 25:
            return "🔴 High COD failure rate. Consider requiring 50% advance payment or offering bKash/Nagad discounts."
        elif failure_rate > 15:
            return "🟡 Moderate COD failures. Implement phone verification before dispatch."
        else:
            return "🟢 COD performance is acceptable. Continue monitoring."


# Global singleton
demo_data = DemoDataService()
