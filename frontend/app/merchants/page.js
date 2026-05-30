"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchMerchants } from "../lib/api";

const tierColors = { starter: "badge-blue", growing: "badge-amber", established: "badge-emerald", premium: "badge-purple" };
const tierIcons = { starter: "🌱", growing: "📈", established: "⭐", premium: "💎" };

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const data = await fetchMerchants();
      setMerchants(data?.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = merchants.filter((m) => {
    if (filter !== "all" && m.tier !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.division.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const divisions = [...new Set(merchants.map((m) => m.division))];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">🏪 Merchant Directory</h1>
        <p className="page-subtitle">{merchants.length} merchants across Bangladesh</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search merchants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "10px 16px",
            color: "var(--text-primary)",
            fontSize: 14,
            width: 280,
            fontFamily: "inherit",
            outline: "none",
          }}
          id="merchant-search"
        />
        <div className="tabs" style={{ width: "fit-content" }}>
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          {["starter", "growing", "established", "premium"].map((t) => (
            <button key={t} className={`tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
              {tierIcons[t]} {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        {divisions.slice(0, 6).map((div) => {
          const count = merchants.filter((m) => m.division === div).length;
          return (
            <div key={div} style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{count}</span> in {div}
            </div>
          );
        })}
      </div>

      {/* Merchant Grid */}
      {loading ? (
        <div className="merchant-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : (
        <div className="merchant-grid">
          {filtered.map((m, i) => (
            <div key={m.id || i} className="merchant-card fade-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div className="merchant-avatar">
                  {m.name?.charAt(0) || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>📍 {m.location || m.division}</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${tierColors[m.tier] || "badge-blue"}`}>
                      {tierIcons[m.tier]} {m.tier}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: 8, background: "var(--bg-glass)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Revenue/mo</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>৳{((m.monthly_revenue_bdt || 0) / 1000).toFixed(0)}K</div>
                </div>
                <div style={{ padding: 8, background: "var(--bg-glass)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Transactions</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{(m.total_transactions || 0).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(m.categories || []).map((c, j) => (
                  <span key={j} className="badge badge-purple" style={{ fontSize: 10 }}>{c}</span>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`signal-dot ${m.is_active ? "green" : "red"}`} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {m.is_active ? "Active" : "Inactive"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                  📞 {m.phone?.slice(-4) || "****"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16 }}>No merchants found matching your criteria</div>
        </div>
      )}
    </DashboardLayout>
  );
}
