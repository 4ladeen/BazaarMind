"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchPriceElasticity } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d?.product_name || d?.name}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--text-secondary)" }}>
          {p.name}: {typeof p.value === "number" ? (p.name.includes("৳") || p.name.includes("Price") ? `৳${p.value}` : p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    async function load() {
      const d = await fetchPriceElasticity("merchant-001");
      setData(d);
      if (d?.elasticities?.length) setSelectedProduct(d.elasticities[0]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-header"><h1 className="page-title">💰 Pricing & Elasticity</h1></div>
        <div className="skeleton" style={{ height: 400 }} />
      </DashboardLayout>
    );
  }

  const elasticities = data?.elasticities || [];
  const chartData = elasticities.map((e) => ({
    name: e.product_name.split("(")[0].trim(),
    product_name: e.product_name,
    current: e.current_price,
    optimal: e.optimal_price,
    cogs: e.cogs_floor,
    elasticity: Math.abs(e.elasticity_coefficient),
    revenue_change: e.expected_revenue_change_pct,
  }));

  // Generate elasticity curve data for selected product
  const generateCurveData = (product) => {
    if (!product) return [];
    const base = product.current_price;
    const el = product.elasticity_coefficient;
    const points = [];
    for (let pctChange = -30; pctChange <= 30; pctChange += 2) {
      const price = base * (1 + pctChange / 100);
      const demandChange = el * pctChange;
      const revenue = price * (100 + demandChange) / 100;
      const revenueNorm = (revenue / base) * 100;
      points.push({
        price: Math.round(price),
        demand: Math.round(100 + demandChange),
        revenue: Math.round(revenueNorm * 10) / 10,
        pctChange,
      });
    }
    return points;
  };

  const curveData = generateCurveData(selectedProduct);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">💰 Pricing & Elasticity</h1>
        <p className="page-subtitle">Dynamic price optimization with COGS protection</p>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card emerald fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Products Analyzed</span><span className="kpi-icon">📊</span></div>
          <div className="kpi-value">{elasticities.length}</div>
        </div>
        <div className="kpi-card blue fade-in" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Avg Elasticity</span><span className="kpi-icon">📉</span></div>
          <div className="kpi-value">{data?.summary?.avg_elasticity?.toFixed(2) || "-1.32"}</div>
        </div>
        <div className="kpi-card amber fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Overpriced</span><span className="kpi-icon">⬆️</span></div>
          <div className="kpi-value">{data?.summary?.products_overpriced || 2}</div>
        </div>
        <div className="kpi-card purple fade-in" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Underpriced</span><span className="kpi-icon">⬇️</span></div>
          <div className="kpi-value">{data?.summary?.products_underpriced || 3}</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Price Comparison Chart */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <div className="chart-title">📊 Current vs Optimal Pricing</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cogs" fill="rgba(244, 63, 94, 0.3)" name="COGS Floor" radius={[0, 4, 4, 0]} />
              <Bar dataKey="current" fill="#3b82f6" name="Current Price" radius={[0, 4, 4, 0]} />
              <Bar dataKey="optimal" fill="#10b981" name="Optimal Price" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Impact */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="chart-title">💰 Revenue Impact (%)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {elasticities.map((e, i) => {
              const isPositive = e.expected_revenue_change_pct > 0;
              return (
                <div
                  key={i}
                  style={{ cursor: "pointer", padding: 12, background: selectedProduct?.product_name === e.product_name ? "var(--bg-glass-hover)" : "var(--bg-glass)", borderRadius: "var(--radius-sm)", border: selectedProduct?.product_name === e.product_name ? "1px solid var(--accent-emerald)" : "1px solid transparent", transition: "all 0.2s" }}
                  onClick={() => setSelectedProduct(e)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{e.product_name.split("(")[0].trim()}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isPositive ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      {isPositive ? "+" : ""}{e.expected_revenue_change_pct}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${isPositive ? "emerald" : "rose"}`}
                      style={{ width: `${Math.min(Math.abs(e.expected_revenue_change_pct) * 5, 100)}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Elasticity: {e.elasticity_coefficient} | ৳{e.current_price} → ৳{e.optimal_price}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Elasticity Curve */}
      {selectedProduct && (
        <div className="glass-card fade-in" style={{ marginTop: 20 }}>
          <div className="chart-title">
            📈 Price-Demand Curve: {selectedProduct.product_name}
            <span className="badge badge-emerald" style={{ marginLeft: 12 }}>
              Elasticity: {selectedProduct.elasticity_coefficient}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="price" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `৳${v}`} label={{ value: "Price (BDT)", position: "insideBottom", offset: -5, fill: "#64748b" }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "Demand Index", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="demand" name="Demand Index">
                  {curveData.map((entry, i) => (
                    <Cell key={i} fill={entry.price <= selectedProduct.current_price ? "#3b82f6" : entry.price <= selectedProduct.optimal_price ? "#10b981" : "#f59e0b"} opacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Analysis</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ padding: 12, background: "rgba(59, 130, 246, 0.08)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--accent-blue)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Current Price</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>৳{selectedProduct.current_price}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--accent-emerald)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Optimal Price</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-emerald)" }}>৳{selectedProduct.optimal_price}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(244, 63, 94, 0.08)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--accent-rose)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>COGS Floor (Min)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-rose)" }}>৳{selectedProduct.cogs_floor}</div>
                </div>
                <div style={{ padding: 12, background: "var(--bg-glass)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {selectedProduct.recommendation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
