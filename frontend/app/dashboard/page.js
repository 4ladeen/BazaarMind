"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchDashboardKPIs, fetchRevenueTimeseries, fetchInventoryAlerts } from "../lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4"];

function KPICard({ label, value, icon, color, change, delay }) {
  return (
    <div className={`kpi-card ${color} fade-in`} style={{ animationDelay: `${delay}s`, opacity: 0 }}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon">{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={`kpi-change ${change > 0 ? "positive" : "negative"}`}>
          {change > 0 ? "↑" : "↓"} {Math.abs(change)}% vs last week
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(17, 24, 39, 0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "12px 16px",
      fontSize: 13,
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [k, r, a] = await Promise.all([
        fetchDashboardKPIs(),
        fetchRevenueTimeseries(30),
        fetchInventoryAlerts(),
      ]);
      setKpis(k);
      setRevenue(r);
      setAlerts(a);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="kpi-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const formatBDT = (v) => `৳${(v / 1000).toFixed(0)}K`;
  const categoryData = kpis?.top_categories?.map((c) => ({
    name: c.name.charAt(0).toUpperCase() + c.name.slice(1),
    value: c.revenue,
  })) || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard</h1>
        <p className="page-subtitle">Real-time commerce intelligence for Bangladesh</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Total Merchants" value={kpis?.total_merchants} icon="🏪" color="emerald" change={12} delay={0.1} />
        <KPICard label="Active Today" value={kpis?.active_merchants_today} icon="✅" color="blue" change={5} delay={0.15} />
        <KPICard label="Revenue (30d)" value={`৳${((kpis?.total_revenue_bdt || 0) / 1000000).toFixed(1)}M`} icon="💰" color="amber" change={18} delay={0.2} />
        <KPICard label="Avg Order Value" value={`৳${Math.round(kpis?.avg_order_value_bdt || 0)}`} icon="📋" color="purple" change={-3} delay={0.25} />
        <KPICard label="Low Stock Alerts" value={kpis?.low_stock_alerts} icon="⚠️" color="rose" delay={0.3} />
        <KPICard label="Forecast Accuracy" value={`${kpis?.demand_accuracy_pct}%`} icon="🎯" color="cyan" change={2} delay={0.35} />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="chart-title">📈 Revenue Trend (30 Days)</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={formatBDT} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue (BDT)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.5s", opacity: 0 }}>
          <div className="chart-title">🏷️ Revenue by Category</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {categoryData.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions & Alerts */}
      <div className="charts-grid">
        {/* Transaction Volume */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.6s", opacity: 0 }}>
          <div className="chart-title">📊 Daily Transactions</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenue.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => v.slice(8)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transactions" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Alerts */}
        <div className="chart-container fade-in" style={{ animationDelay: "0.7s", opacity: 0 }}>
          <div className="chart-title">⚠️ Inventory Alerts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.slice(0, 5).map((alert, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--bg-glass)",
                  borderRadius: "var(--radius-sm)",
                  borderLeft: `3px solid ${
                    alert.urgency === "critical" ? "var(--accent-rose)" :
                    alert.urgency === "high" ? "var(--accent-amber)" :
                    "var(--accent-blue)"
                  }`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {alert.product_name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {alert.merchant_name} • {alert.current_stock} left
                  </div>
                </div>
                <span className={`badge ${
                  alert.urgency === "critical" ? "badge-rose" :
                  alert.urgency === "high" ? "badge-amber" :
                  "badge-blue"
                }`}>
                  {alert.urgency === "critical" ? "🔴" : alert.urgency === "high" ? "🟠" : "🟡"} {alert.days_until_stockout}d
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Signals */}
      <div className="glass-card fade-in" style={{ animationDelay: "0.8s", opacity: 0, marginTop: 20 }}>
        <div className="chart-title">🔔 Active Signals & Disruptions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ padding: 16, background: "rgba(245, 158, 11, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
            <div style={{ fontSize: 12, color: "var(--accent-amber)", fontWeight: 600, marginBottom: 4 }}>🌤️ WEATHER</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{kpis?.active_disruptions || 2} Active</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Moderate risk level</div>
          </div>
          <div style={{ padding: 16, background: "rgba(139, 92, 246, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(139, 92, 246, 0.15)" }}>
            <div style={{ fontSize: 12, color: "var(--accent-purple)", fontWeight: 600, marginBottom: 4 }}>📱 MFS PAYDAY</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>bKash in 3 days</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>+32.5% liquidity expected</div>
          </div>
          <div style={{ padding: 16, background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
            <div style={{ fontSize: 12, color: "var(--accent-emerald)", fontWeight: 600, marginBottom: 4 }}>🤖 AI QUERIES</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{kpis?.queries_today || 234} Today</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>↑ 15% vs yesterday</div>
          </div>
          <div style={{ padding: 16, background: "rgba(244, 63, 94, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(244, 63, 94, 0.15)" }}>
            <div style={{ fontSize: 12, color: "var(--accent-rose)", fontWeight: 600, marginBottom: 4 }}>📦 COD FAILURES</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>18.3% avg</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Rangpur highest: 31.2%</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
