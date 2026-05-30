/**
 * BazaarMind API Client
 * Handles all communication with the FastAPI backend.
 * Falls back to built-in demo data when backend is unavailable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${path}:`, err.message);
    return null;
  }
}

// ─── Dashboard ───────────────────────────────────────

export async function fetchDashboardKPIs() {
  const data = await apiFetch("/api/dashboard/kpis");
  return data || {
    total_merchants: 24,
    active_merchants_today: 21,
    total_revenue_bdt: 4523890.50,
    avg_order_value_bdt: 856.30,
    total_products: 156,
    low_stock_alerts: 12,
    active_disruptions: 2,
    demand_accuracy_pct: 89.3,
    queries_today: 234,
    top_categories: [
      { name: "grocery", revenue: 1890450 },
      { name: "fmcg", revenue: 987320 },
      { name: "electronics", revenue: 654780 },
      { name: "pharmacy", revenue: 432110 },
      { name: "agriculture", revenue: 321980 },
    ],
  };
}

export async function fetchRevenueTimeseries(days = 30) {
  const data = await apiFetch(`/api/dashboard/revenue-timeseries?days=${days}`);
  if (data?.data) return data.data;

  // Generate demo time series
  const series = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const base = 120000 + Math.sin(i / 7 * Math.PI) * 30000;
    const noise = (Math.random() - 0.5) * 20000;
    const revenue = Math.max(50000, base + noise);
    series.push({
      date: d.toISOString().slice(0, 10),
      revenue: Math.round(revenue),
      transactions: Math.round(revenue / 800),
      avg_order_value: Math.round(700 + Math.random() * 400),
    });
  }
  return series;
}

export async function fetchInventoryAlerts() {
  const data = await apiFetch("/api/dashboard/inventory-alerts");
  if (data?.data) return data.data;

  return [
    { product_name: "Miniket Rice (25kg)", merchant_name: "Rahim General Store", current_stock: 3, min_threshold: 15, days_until_stockout: 0.8, urgency: "critical" },
    { product_name: "Soybean Oil (5L)", merchant_name: "Bismillah Grocery", current_stock: 5, min_threshold: 20, days_until_stockout: 1.2, urgency: "critical" },
    { product_name: "Paracetamol 500mg", merchant_name: "Hasan Pharmacy", current_stock: 8, min_threshold: 25, days_until_stockout: 2.5, urgency: "high" },
    { product_name: "Feature Phone", merchant_name: "Noor Electronics", current_stock: 2, min_threshold: 10, days_until_stockout: 3.1, urgency: "high" },
    { product_name: "Urea Fertilizer", merchant_name: "Kabir Agro", current_stock: 7, min_threshold: 15, days_until_stockout: 5.2, urgency: "moderate" },
  ];
}

// ─── Merchants ───────────────────────────────────────

export async function fetchMerchants(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await apiFetch(`/api/merchants?${query}`);
  if (data?.data) return data;

  return {
    data: [
      { id: "merchant-001", name: "Rahim General Store", phone: "+8801712345678", location: "Dhaka Bazar, Dhaka", division: "Dhaka", district: "Dhaka", tier: "established", categories: ["grocery", "fmcg"], monthly_revenue_bdt: 456000, is_active: true, total_transactions: 2340 },
      { id: "merchant-002", name: "Karim Traders", phone: "+8801823456789", location: "Chittagong Market", division: "Chittagong", district: "Chittagong", tier: "premium", categories: ["electronics", "hardware"], monthly_revenue_bdt: 1230000, is_active: true, total_transactions: 4560 },
      { id: "merchant-003", name: "Noor Electronics", phone: "+8801934567890", location: "Rajshahi", division: "Rajshahi", district: "Rajshahi", tier: "growing", categories: ["electronics"], monthly_revenue_bdt: 189000, is_active: true, total_transactions: 890 },
      { id: "merchant-004", name: "Fatema Fashion House", phone: "+8801645678901", location: "Khulna", division: "Khulna", district: "Khulna", tier: "starter", categories: ["clothing", "cosmetics"], monthly_revenue_bdt: 67000, is_active: true, total_transactions: 340 },
      { id: "merchant-005", name: "Hasan Pharmacy", phone: "+8801556789012", location: "Sylhet", division: "Sylhet", district: "Sylhet", tier: "established", categories: ["pharmacy"], monthly_revenue_bdt: 345000, is_active: true, total_transactions: 1890 },
      { id: "merchant-006", name: "Bismillah Grocery", phone: "+8801367890123", location: "Barisal", division: "Barisal", district: "Barisal", tier: "growing", categories: ["grocery"], monthly_revenue_bdt: 123000, is_active: true, total_transactions: 1230 },
    ],
    total: 24,
  };
}

export async function fetchMerchant(id) {
  return await apiFetch(`/api/merchants/${id}`);
}

// ─── Forecasts ───────────────────────────────────────

export async function fetchForecasts(merchantId, daysAhead = 7) {
  const data = await apiFetch(`/api/forecasts/${merchantId}?days_ahead=${daysAhead}`);
  if (data?.forecasts) return data;

  // Demo forecasts
  const products = ["Miniket Rice", "Soybean Oil", "Sugar", "Lentils", "Onion"];
  const forecasts = [];
  const today = new Date();
  for (const prod of products) {
    for (let d = 1; d <= daysAhead; d++) {
      const fDate = new Date(today.getTime() + d * 86400000);
      const demand = 15 + Math.random() * 40;
      forecasts.push({
        product_name: prod,
        forecast_date: fDate.toISOString().slice(0, 10),
        predicted_demand: Math.round(demand * 10) / 10,
        confidence_lower: Math.round(demand * 0.7 * 10) / 10,
        confidence_upper: Math.round(demand * 1.3 * 10) / 10,
        trend: ["rising", "stable", "declining"][Math.floor(Math.random() * 3)],
        seasonality_factor: Math.round((0.8 + Math.random() * 0.6) * 100) / 100,
      });
    }
  }
  return { forecasts, summary: { total_products: 5, rising_trends: 2, declining_trends: 1 } };
}

export async function fetchPriceElasticity(merchantId) {
  const data = await apiFetch(`/api/forecasts/${merchantId}/price-elasticity`);
  if (data?.elasticities) return data;

  return {
    elasticities: [
      { product_name: "Miniket Rice (25kg)", current_price: 1450, optimal_price: 1520, cogs_floor: 1200, elasticity_coefficient: -1.2, expected_revenue_change_pct: 8.5, recommendation: "✅ Price is well-positioned." },
      { product_name: "Soybean Oil (5L)", current_price: 820, optimal_price: 790, cogs_floor: 680, elasticity_coefficient: -2.1, expected_revenue_change_pct: -3.2, recommendation: "📉 Highly price-sensitive." },
      { product_name: "Sugar (5kg)", current_price: 560, optimal_price: 580, cogs_floor: 450, elasticity_coefficient: -0.8, expected_revenue_change_pct: 4.1, recommendation: "💰 Room for slight increase." },
      { product_name: "Onion (1kg)", current_price: 85, optimal_price: 78, cogs_floor: 60, elasticity_coefficient: -1.9, expected_revenue_change_pct: -2.5, recommendation: "📉 Price-sensitive commodity." },
      { product_name: "Lentils (1kg)", current_price: 145, optimal_price: 155, cogs_floor: 110, elasticity_coefficient: -0.6, expected_revenue_change_pct: 6.8, recommendation: "💰 Strong margin available." },
    ],
    summary: { avg_elasticity: -1.32, products_overpriced: 2, products_underpriced: 3 },
  };
}

export async function fetchSeasonality(category) {
  const params = category ? `?category=${category}` : "";
  return await apiFetch(`/api/forecasts/seasonality/indices${params}`);
}

// ─── Signals ─────────────────────────────────────────

export async function fetchSignalsOverview() {
  const data = await apiFetch("/api/signals/overview");
  if (data) return data;

  return {
    weather: {
      disruptions: [
        { region: "Chittagong", event_type: "heavy_rain", severity: "moderate", supply_chain_impact_score: 5.8, recommended_actions: ["Stock extra days of essentials", "Use alternative routes"] },
        { region: "Sylhet", event_type: "flood", severity: "high", supply_chain_impact_score: 7.2, recommended_actions: ["Avoid river routes", "Contact backup suppliers"] },
      ],
      critical_alerts: 1,
      overall_risk_level: "moderate",
    },
    political: {
      events: [
        { event_type: "national_holiday", region: "Nationwide", disruption_probability: 0.9, market_closure_expected: true },
      ],
    },
    mfs_payday: {
      nearest_payday: { provider: "bKash", days_away: 3, expected_spike: 32.5 },
    },
    cod_failure: {
      summary: { avg_failure_rate: 18.3, worst_region: "Rangpur", worst_rate: 31.2 },
    },
  };
}

// ─── Chat ────────────────────────────────────────────

export async function sendChatMessage(message, conversationId = null, merchantId = "merchant-001") {
  const data = await apiFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      merchant_id: merchantId,
    }),
  });

  if (data) return data;

  // Demo fallback
  const intents = {
    "dam": "pricing_query",
    "price": "pricing_query",
    "sell": "demand_forecast",
    "bikri": "demand_forecast",
    "stock": "stock_update",
    "weather": "disruption_alert",
    "hartal": "disruption_alert",
    "marketing": "marketing",
    "facebook": "marketing",
  };

  let intent = "general";
  const lower = message.toLowerCase();
  for (const [key, val] of Object.entries(intents)) {
    if (lower.includes(key)) { intent = val; break; }
  }

  const responses = {
    pricing_query: "📊 **Price Analysis:**\n\nApnar Miniket Rice er current price: **৳1,450**\nOptimal price recommendation: **৳1,520**\n\n✅ Price is well-positioned. 4.8% margin improvement possible!\n\n💡 Ei price e apnar profit maximize hobe insha'Allah!",
    demand_forecast: "📈 **Demand Forecast:**\n\nMiniket Rice — agami 7 din:\n• Predicted demand: **42.3 units**\n• Trend: **Rising** 📈\n• Seasonality factor: 1.15\n\nFactors:\n• Wedding season approaching\n• Weekend boost expected\n\n💡 Stock ready rakhle valo bikri hobe!",
    stock_update: "📦 **Inventory Status:**\n\nTotal products: **12**\nLow stock alerts: **3** ⚠️\n\n⚠️ Low stock:\n• Miniket Rice: **3** remaining (min: 15)\n• Soybean Oil: **5** remaining (min: 20)\n• Paracetamol: **8** remaining (min: 25)",
    disruption_alert: "🟡 **Disruption Alert:**\n\nType: **Heavy Rain**\nSeverity: **MODERATE**\nRegion: Chittagong\n\nRecommended:\n• Stock 3-5 extra days\n• Switch to alternative routes\n• Alert customers about delays\n\n🤲 Savdhane thakben!",
    marketing: "📱 **Social Media Post Ready!**\n\n---\n🔥 Rahim General Store er special offer!\n\n✅ Fresh Miniket Rice, Soybean Oil, Premium Sugar\n💰 Best price guarantee!\n📞 Order korun ekhoni!\n🚚 Free delivery available\n\n#BazaarMind #BestDeals\n---",
    general: "আসসালামু আলাইকুম ভাই! 🙏\n\nApni ki jante chacchen bolun:\n\n📊 Price suggestion → 'dam ki rakhbo?'\n📈 Demand forecast → 'kal ki sell hobe?'\n📦 Stock check → 'stock koto ase?'\n⚠️ Disruptions → 'weather ki hobe?'\n📱 Marketing → 'Facebook post banao'",
  };

  return {
    conversation_id: conversationId || "demo-conv-001",
    response: responses[intent] || responses.general,
    intent,
    confidence: 0.85,
    suggestions: ["dam ki rakhbo?", "kal ki sell hobe?", "stock update den"],
  };
}
