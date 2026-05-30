"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchInventoryAlerts, fetchMerchants } from "../lib/api";

export default function InventoryPage() {
  const [alerts, setAlerts] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [view, setView] = useState("heatmap");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [a, m] = await Promise.all([fetchInventoryAlerts(), fetchMerchants()]);
      setAlerts(a);
      setMerchants(m?.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const stockItems = [
    { name: "Miniket Rice", stock: 3, max: 100, category: "grocery" },
    { name: "Soybean Oil", stock: 5, max: 50, category: "grocery" },
    { name: "Sugar 5kg", stock: 45, max: 80, category: "grocery" },
    { name: "Salt 1kg", stock: 120, max: 200, category: "grocery" },
    { name: "Lentils", stock: 8, max: 60, category: "grocery" },
    { name: "Onion", stock: 22, max: 100, category: "grocery" },
    { name: "Potato", stock: 65, max: 150, category: "grocery" },
    { name: "Feature Phone", stock: 2, max: 20, category: "electronics" },
    { name: "Phone Charger", stock: 35, max: 50, category: "electronics" },
    { name: "LED Bulb", stock: 48, max: 100, category: "electronics" },
    { name: "Paracetamol", stock: 8, max: 100, category: "pharmacy" },
    { name: "ORS Saline", stock: 150, max: 200, category: "pharmacy" },
    { name: "Urea Fertilizer", stock: 7, max: 30, category: "agriculture" },
    { name: "Lungi Cotton", stock: 25, max: 40, category: "clothing" },
    { name: "Radhuni Masala", stock: 42, max: 60, category: "fmcg" },
    { name: "Pran Juice", stock: 18, max: 50, category: "fmcg" },
  ];

  const getStockLevel = (stock, max) => {
    const pct = stock / max;
    if (pct < 0.1) return "critical";
    if (pct < 0.3) return "low";
    if (pct < 0.7) return "normal";
    return "high";
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">📦 Inventory Management</h1>
        <p className="page-subtitle">Track stock levels across all merchants</p>
      </div>

      {/* View Toggle */}
      <div className="tabs" style={{ width: "fit-content", marginBottom: 24 }}>
        <button className={`tab ${view === "heatmap" ? "active" : ""}`} onClick={() => setView("heatmap")}>🗺️ Heatmap</button>
        <button className={`tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>📋 List View</button>
        <button className={`tab ${view === "alerts" ? "active" : ""}`} onClick={() => setView("alerts")}>⚠️ Alerts ({alerts.length})</button>
      </div>

      {view === "heatmap" && (
        <div className="glass-card fade-in">
          <div className="chart-title">📊 Stock Level Heatmap</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { level: "critical", label: "Critical (<10%)", color: "var(--accent-rose)" },
              { level: "low", label: "Low (10-30%)", color: "var(--accent-amber)" },
              { level: "normal", label: "Normal (30-70%)", color: "var(--accent-emerald)" },
              { level: "high", label: "Well-stocked (>70%)", color: "var(--accent-blue)" },
            ].map((l) => (
              <span key={l.level} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
          <div className="heatmap-grid">
            {stockItems.map((item, i) => {
              const level = getStockLevel(item.stock, item.max);
              return (
                <div key={i} className={`heatmap-cell ${level}`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{item.stock}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>/ {item.max}</div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div
                      className={`progress-fill ${level === "critical" ? "rose" : level === "low" ? "amber" : level === "normal" ? "emerald" : "blue"}`}
                      style={{ width: `${(item.stock / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="glass-card fade-in">
          <div className="chart-title">📋 Full Inventory List</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Capacity</th>
                <th>Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map((item, i) => {
                const level = getStockLevel(item.stock, item.max);
                const pct = Math.round((item.stock / item.max) * 100);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</td>
                    <td><span className="badge badge-purple">{item.category}</span></td>
                    <td>{item.stock}</td>
                    <td>{item.max}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className={`progress-fill ${level === "critical" ? "rose" : level === "low" ? "amber" : "emerald"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${level === "critical" ? "badge-rose" : level === "low" ? "badge-amber" : "badge-emerald"}`}>
                        {level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "alerts" && (
        <div className="glass-card fade-in">
          <div className="chart-title">⚠️ Low Stock Alerts ({alerts.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alerts.map((alert, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 16,
                  background: "var(--bg-glass)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: `4px solid ${alert.urgency === "critical" ? "var(--accent-rose)" : alert.urgency === "high" ? "var(--accent-amber)" : "var(--accent-blue)"}`,
                }}
              >
                <div style={{ fontSize: 28 }}>
                  {alert.urgency === "critical" ? "🔴" : alert.urgency === "high" ? "🟠" : "🟡"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{alert.product_name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{alert.merchant_name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: alert.urgency === "critical" ? "var(--accent-rose)" : "var(--text-primary)" }}>
                    {alert.current_stock}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>of {alert.min_threshold} min</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`badge ${alert.urgency === "critical" ? "badge-rose" : "badge-amber"}`}>
                    {alert.days_until_stockout}d left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
