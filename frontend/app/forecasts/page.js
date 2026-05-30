"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchForecasts } from "../lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e"];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
      <div style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function ForecastsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [daysAhead, setDaysAhead] = useState(7);

  useEffect(() => {
    async function load() {
      const d = await fetchForecasts("merchant-001", daysAhead);
      setData(d);
      setLoading(false);
    }
    load();
  }, [daysAhead]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-header"><h1 className="page-title">📈 Demand Forecasts</h1></div>
        <div className="skeleton" style={{ height: 400 }} />
      </DashboardLayout>
    );
  }

  const forecasts = data?.forecasts || [];

  // Group by product
  const productMap = {};
  forecasts.forEach((f) => {
    if (!productMap[f.product_name]) productMap[f.product_name] = [];
    productMap[f.product_name].push(f);
  });
  const products = Object.keys(productMap);
  const activeProduct = selectedProduct || products[0];
  const productForecasts = productMap[activeProduct] || [];

  // Chart data for selected product
  const chartData = productForecasts.map((f) => ({
    date: f.forecast_date?.slice(5) || "",
    demand: f.predicted_demand,
    lower: f.confidence_lower,
    upper: f.confidence_upper,
  }));

  // Summary data for all products (latest forecast per product)
  const summaryData = products.map((p) => {
    const latest = productMap[p][0];
    return {
      name: p.split("(")[0].trim(),
      fullName: p,
      demand: latest?.predicted_demand || 0,
      trend: latest?.trend || "stable",
      seasonality: latest?.seasonality_factor || 1,
    };
  });

  const trendIcons = { rising: "📈", stable: "➡️", declining: "📉" };
  const trendColors = { rising: "var(--accent-emerald)", stable: "var(--accent-blue)", declining: "var(--accent-rose)" };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title">📈 Demand Forecasts</h1>
            <p className="page-subtitle">ML-powered demand predictions for the next {daysAhead} days</p>
          </div>
          <div className="tabs" style={{ width: "fit-content" }}>
            {[7, 14, 30].map((d) => (
              <button key={d} className={`tab ${daysAhead === d ? "active" : ""}`} onClick={() => { setDaysAhead(d); setLoading(true); }}>
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card emerald fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Products Forecasted</span><span className="kpi-icon">📊</span></div>
          <div className="kpi-value">{products.length}</div>
        </div>
        <div className="kpi-card blue fade-in" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Rising Trends</span><span className="kpi-icon">📈</span></div>
          <div className="kpi-value">{data?.summary?.rising_trends || summaryData.filter((s) => s.trend === "rising").length}</div>
        </div>
        <div className="kpi-card rose fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Declining Trends</span><span className="kpi-icon">📉</span></div>
          <div className="kpi-value">{data?.summary?.declining_trends || summaryData.filter((s) => s.trend === "declining").length}</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Main Forecast Chart */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <div className="chart-title">
            📊 {activeProduct} — {daysAhead}-Day Forecast
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#confidenceGrad)" name="Upper Bound" />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="rgba(59,130,246,0.05)" name="Lower Bound" />
              <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} name="Predicted Demand" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product Selector */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="chart-title">🏷️ Products</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {summaryData.map((s, i) => (
              <div
                key={i}
                onClick={() => setSelectedProduct(s.fullName)}
                style={{
                  padding: 12,
                  background: activeProduct === s.fullName ? "var(--bg-glass-hover)" : "var(--bg-glass)",
                  borderRadius: "var(--radius-sm)",
                  border: activeProduct === s.fullName ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 16 }}>{trendIcons[s.trend]}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Demand: <strong style={{ color: trendColors[s.trend] }}>{s.demand}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Season: {s.seasonality}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasonality Factors */}
      <div className="glass-card fade-in" style={{ marginTop: 20, animationDelay: "0.5s", opacity: 0 }}>
        <div className="chart-title">🗓️ Seasonal Factors (Bangladesh)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 8 }}>
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => {
            const factors = [1.0, 0.95, 1.0, 1.15, 1.1, 1.2, 1.3, 1.1, 1.0, 1.25, 1.3, 1.2];
            const f = factors[i];
            const isHigh = f > 1.15;
            const isCurrent = new Date().getMonth() === i;
            return (
              <div
                key={i}
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderRadius: "var(--radius-sm)",
                  background: isCurrent ? "rgba(16, 185, 129, 0.15)" : "var(--bg-glass)",
                  border: isCurrent ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{m}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: isHigh ? "var(--accent-emerald)" : "var(--text-secondary)" }}>
                  {f}x
                </div>
                {isCurrent && <div style={{ fontSize: 9, color: "var(--accent-emerald)", marginTop: 2 }}>NOW</div>}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
