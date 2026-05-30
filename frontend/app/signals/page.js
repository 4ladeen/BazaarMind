"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchSignalsOverview } from "../lib/api";

export default function SignalsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function load() {
      const d = await fetchSignalsOverview();
      setData(d);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-header"><h1 className="page-title">🔔 Signal Monitor</h1></div>
        <div className="kpi-grid">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}</div>
      </DashboardLayout>
    );
  }

  const weather = data?.weather?.disruptions || [];
  const political = data?.political?.events || [];
  const mfs = data?.mfs_payday;
  const cod = data?.cod_failure;

  const severityColors = {
    low: { bg: "rgba(16, 185, 129, 0.1)", border: "var(--accent-emerald)", text: "var(--accent-emerald)", icon: "🟢" },
    moderate: { bg: "rgba(245, 158, 11, 0.1)", border: "var(--accent-amber)", text: "var(--accent-amber)", icon: "🟡" },
    high: { bg: "rgba(244, 63, 94, 0.1)", border: "var(--accent-rose)", text: "var(--accent-rose)", icon: "🟠" },
    critical: { bg: "rgba(244, 63, 94, 0.2)", border: "var(--accent-rose)", text: "var(--accent-rose)", icon: "🔴" },
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">🔔 Signal Monitor</h1>
        <p className="page-subtitle">Hyper-local disruption tracking for Bangladesh commerce</p>
      </div>

      {/* Signal Overview Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card amber fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Weather Alerts</span><span className="kpi-icon">🌤️</span></div>
          <div className="kpi-value">{weather.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Risk: <span style={{ color: "var(--accent-amber)", fontWeight: 600 }}>{data?.weather?.overall_risk_level || "moderate"}</span>
          </div>
        </div>
        <div className="kpi-card purple fade-in" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">MFS Payday</span><span className="kpi-icon">📱</span></div>
          <div className="kpi-value">{mfs?.nearest_payday?.days_away || 3}d</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {mfs?.nearest_payday?.provider || "bKash"} — +{mfs?.nearest_payday?.expected_spike || 32.5}% liquidity
          </div>
        </div>
        <div className="kpi-card blue fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">Political Events</span><span className="kpi-icon">🏛️</span></div>
          <div className="kpi-value">{political.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {political.filter((e) => e.market_closure_expected).length} market closures expected
          </div>
        </div>
        <div className="kpi-card rose fade-in" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <div className="kpi-header"><span className="kpi-label">COD Failure Rate</span><span className="kpi-icon">📦</span></div>
          <div className="kpi-value">{cod?.summary?.avg_failure_rate || 18.3}%</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Worst: {cod?.summary?.worst_region || "Rangpur"} ({cod?.summary?.worst_rate || 31.2}%)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ width: "fit-content", marginBottom: 24 }}>
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>🌐 Overview</button>
        <button className={`tab ${activeTab === "weather" ? "active" : ""}`} onClick={() => setActiveTab("weather")}>🌤️ Weather</button>
        <button className={`tab ${activeTab === "mfs" ? "active" : ""}`} onClick={() => setActiveTab("mfs")}>📱 MFS Payday</button>
        <button className={`tab ${activeTab === "political" ? "active" : ""}`} onClick={() => setActiveTab("political")}>🏛️ Political</button>
        <button className={`tab ${activeTab === "cod" ? "active" : ""}`} onClick={() => setActiveTab("cod")}>📦 COD</button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="signal-matrix fade-in">
          {/* Weather */}
          {weather.map((w, i) => (
            <div key={`w-${i}`} className="signal-card" style={{ borderLeft: `4px solid ${severityColors[w.severity]?.border || "var(--accent-amber)"}` }}>
              <div className="signal-card-header">
                <span className="signal-type" style={{ color: severityColors[w.severity]?.text }}>
                  {severityColors[w.severity]?.icon} Weather — {w.event_type}
                </span>
                <span className={`badge ${w.severity === "high" || w.severity === "critical" ? "badge-rose" : "badge-amber"}`}>
                  {w.severity}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{w.region}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                Impact Score: <strong>{w.supply_chain_impact_score}/10</strong>
              </div>
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div className={`progress-fill ${w.supply_chain_impact_score > 6 ? "rose" : "amber"}`} style={{ width: `${w.supply_chain_impact_score * 10}%` }} />
              </div>
              {w.recommended_actions && (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {w.recommended_actions.slice(0, 2).map((a, j) => (
                    <div key={j} style={{ marginBottom: 2 }}>• {a}</div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* MFS */}
          <div className="signal-card" style={{ borderLeft: "4px solid var(--accent-purple)" }}>
            <div className="signal-card-header">
              <span className="signal-type" style={{ color: "var(--accent-purple)" }}>📱 MFS Payday Cycle</span>
              <span className="badge badge-purple">Upcoming</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {mfs?.nearest_payday?.provider || "bKash"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {mfs?.nearest_payday?.days_away || 3} days until payday
            </div>
            <div style={{ fontSize: 13, color: "var(--accent-emerald)", fontWeight: 600, marginTop: 8 }}>
              📈 Expected +{mfs?.nearest_payday?.expected_spike || 32.5}% liquidity spike
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
              💡 Stock up on high-demand items before the payday rush!
            </div>
          </div>

          {/* Political */}
          {political.map((p, i) => (
            <div key={`p-${i}`} className="signal-card" style={{ borderLeft: "4px solid var(--accent-blue)" }}>
              <div className="signal-card-header">
                <span className="signal-type" style={{ color: "var(--accent-blue)" }}>🏛️ {p.event_type?.replace("_", " ")}</span>
                <span className={`badge ${p.market_closure_expected ? "badge-rose" : "badge-blue"}`}>
                  {p.market_closure_expected ? "Market Closed" : "Active"}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.region}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Disruption probability: <strong>{Math.round(p.disruption_probability * 100)}%</strong>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Stock buffer: {p.recommended_stock_buffer_days || 0} extra days recommended
              </div>
            </div>
          ))}

          {/* COD */}
          <div className="signal-card" style={{ borderLeft: "4px solid var(--accent-rose)" }}>
            <div className="signal-card-header">
              <span className="signal-type" style={{ color: "var(--accent-rose)" }}>📦 COD Failure Analysis</span>
              <span className="badge badge-rose">{cod?.summary?.avg_failure_rate || 18.3}% avg</span>
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Worst performing: <strong>{cod?.summary?.worst_region || "Rangpur"}</strong> ({cod?.summary?.worst_rate || 31.2}%)
            </div>
            <div className="progress-bar" style={{ marginBottom: 8 }}>
              <div className="progress-fill rose" style={{ width: `${cod?.summary?.worst_rate || 31.2}%` }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              💡 Consider requiring 50% advance for high-risk regions
            </div>
          </div>
        </div>
      )}

      {/* Weather Detail Tab */}
      {activeTab === "weather" && (
        <div className="glass-card fade-in">
          <div className="chart-title">🌤️ Regional Weather Disruptions</div>
          {weather.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              🟢 No active weather disruptions. Supply chains operating normally.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {weather.map((w, i) => (
                <div key={i} style={{ padding: 20, background: severityColors[w.severity]?.bg, borderRadius: "var(--radius-md)", border: `1px solid ${severityColors[w.severity]?.border}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                      {severityColors[w.severity]?.icon} {w.event_type?.replace("_", " ")} — {w.region}
                    </h3>
                    <span className={`badge ${w.severity === "high" ? "badge-rose" : "badge-amber"}`} style={{ fontSize: 13 }}>
                      {w.severity.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Impact Score</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{w.supply_chain_impact_score}/10</div>
                      <div className="progress-bar" style={{ marginTop: 4 }}>
                        <div className={`progress-fill ${w.supply_chain_impact_score > 6 ? "rose" : "amber"}`} style={{ width: `${w.supply_chain_impact_score * 10}%` }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Affected Routes</div>
                      {(w.affected_routes || []).map((r, j) => (
                        <div key={j} style={{ fontSize: 13, marginBottom: 2 }}>🚚 {r}</div>
                      ))}
                    </div>
                  </div>
                  {w.recommended_actions && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Recommended Actions:</div>
                      {w.recommended_actions.map((a, j) => (
                        <div key={j} style={{ fontSize: 13, marginBottom: 4, paddingLeft: 8 }}>✅ {a}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MFS Tab */}
      {activeTab === "mfs" && (
        <div className="glass-card fade-in">
          <div className="chart-title">📱 Mobile Financial Service Payday Cycles</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {["bKash", "Nagad", "Rocket"].map((provider, i) => (
              <div key={i} style={{ padding: 20, background: "var(--bg-glass)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{provider}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Next Payday</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-purple)" }}>{2 + i} days</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Liquidity Spike</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-emerald)" }}>+{25 + i * 5}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Spend Increase</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-amber)" }}>+{35 + i * 8}%</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill purple" style={{ width: `${100 - (2 + i) * 10}%` }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  💡 Stock up on FMCG and grocery items before payday
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Political Tab */}
      {activeTab === "political" && (
        <div className="glass-card fade-in">
          <div className="chart-title">🏛️ Political Events & Market Impact</div>
          {political.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No upcoming political events affecting commerce.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {political.map((p, i) => (
                <div key={i} style={{ padding: 16, background: "var(--bg-glass)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 16, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 32 }}>{p.market_closure_expected ? "🔒" : "📅"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, textTransform: "capitalize" }}>{p.event_type?.replace("_", " ")}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p.region}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Disruption</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: p.disruption_probability > 0.5 ? "var(--accent-rose)" : "var(--accent-amber)" }}>
                      {Math.round(p.disruption_probability * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COD Tab */}
      {activeTab === "cod" && (
        <div className="glass-card fade-in">
          <div className="chart-title">📦 COD Failure Matrix by Region</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh"].map((region, i) => {
              const rate = [12, 15, 18, 22, 14, 20, 31, 16][i];
              const color = rate > 25 ? "rose" : rate > 18 ? "amber" : "emerald";
              return (
                <div key={i} style={{ padding: 16, background: "var(--bg-glass)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{region}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: `var(--accent-${color})` }}>{rate}%</div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div className={`progress-fill ${color}`} style={{ width: `${rate}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {rate > 25 ? "⚠️ Require advance payment" : rate > 18 ? "📞 Phone verify first" : "✅ Acceptable"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
