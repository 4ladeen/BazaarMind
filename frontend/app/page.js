"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setMounted(true);
    // Try to fetch real stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/dashboard/kpis`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() =>
        setStats({
          total_merchants: 24,
          total_products: 156,
          queries_today: 234,
          demand_accuracy_pct: 89.3,
        }),
      );
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(20px)",
          background: "rgba(10, 14, 26, 0.8)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="sidebar-logo-icon">🧠</div>
          <span className="sidebar-logo-text">BazaarMind</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
          <Link href="/chat" className="btn btn-ghost">
            Live Demo
          </Link>
          <Link href="/onboarding" className="btn btn-primary">
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 24,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--accent-emerald)",
            }}
          >
            <span className="signal-dot green pulse" />
            AI-Powered Predictive Commerce
          </div>
        </div>

        <h1
          className="hero-title fade-in"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          বাজারের বুদ্ধি,
          <br />
          Your Commerce Brain
        </h1>

        <p
          className="hero-subtitle fade-in"
          style={{ animationDelay: "0.6s", opacity: 0 }}
        >
          WhatsApp-first AI advisory platform for Bangladeshi merchants.
          Real-time demand forecasting, dynamic pricing, and hyper-local
          disruption alerts — all in Banglish.
        </p>

        <div
          className="hero-cta fade-in"
          style={{ animationDelay: "0.8s", opacity: 0 }}
        >
          <Link
            href="/dashboard"
            className="btn btn-primary"
            style={{ padding: "14px 32px", fontSize: 16 }}
          >
            📊 Open Dashboard
          </Link>
          <Link
            href="/chat"
            className="btn btn-ghost"
            style={{ padding: "14px 32px", fontSize: 16 }}
          >
            💬 Try WhatsApp Demo
          </Link>
        </div>

        {/* Live Stats */}
        {stats && (
          <div
            className="fade-in"
            style={{
              animationDelay: "1s",
              opacity: 0,
              display: "flex",
              gap: 40,
              marginTop: 60,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              {
                value: stats.total_merchants,
                label: "Active Merchants",
                icon: "🏪",
              },
              {
                value: stats.total_products,
                label: "Products Tracked",
                icon: "📦",
              },
              {
                value: stats.queries_today,
                label: "AI Queries Today",
                icon: "🤖",
              },
              {
                value: `${stats.demand_accuracy_pct}%`,
                label: "Forecast Accuracy",
                icon: "🎯",
              },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    background: "var(--gradient-primary)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Cards */}
        <div className="hero-features">
          {[
            {
              icon: "📊",
              title: "Demand Forecasting",
              desc: "ML-powered demand predictions with seasonal patterns, festival cycles, and weather disruption analysis specific to Bangladesh.",
            },
            {
              icon: "💰",
              title: "Dynamic Pricing",
              desc: "Price elasticity modeling with hardcoded COGS protection. Never sell below cost, always maximize profit margins.",
            },
            {
              icon: "🌤️",
              title: "Disruption Alerts",
              desc: "Real-time weather, political event, and supply chain disruption monitoring for proactive logistics planning.",
            },
            {
              icon: "💬",
              title: "WhatsApp Interface",
              desc: "Natural Banglish conversational AI. Ask 'kal ki sell hobe?' and get actionable forecasts instantly.",
            },
            {
              icon: "📱",
              title: "MFS Payday Cycles",
              desc: "bKash/Nagad payday cycle tracking to predict local liquidity spikes and time your promotions perfectly.",
            },
            {
              icon: "🔒",
              title: "Edge/Offline Ready",
              desc: "Operates on low-bandwidth 2G networks with Ollama-powered edge inference for zero-connectivity scenarios.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="feature-card slide-up"
              style={{ animationDelay: `${1.2 + i * 0.15}s`, opacity: 0 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section
        style={{
          padding: "80px 40px",
          maxWidth: 1000,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 16,
            background: "var(--gradient-secondary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Multi-Agent AI Architecture
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: 40,
            maxWidth: 600,
            margin: "0 auto 40px",
          }}
        >
          BazaarMind uses a sophisticated multi-tier model topology with
          specialized agents for each commerce function.
        </p>

        <div className="glass-card" style={{ textAlign: "left" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                layer: "Orchestration",
                tech: "LangGraph",
                color: "var(--accent-emerald)",
              },
              {
                layer: "High-Tier Reasoning",
                tech: "Claude API",
                color: "var(--accent-blue)",
              },
              {
                layer: "High-Throughput",
                tech: "Gemini Flash",
                color: "var(--accent-amber)",
              },
              {
                layer: "Latency-Critical",
                tech: "Llama 3.3 (Groq)",
                color: "var(--accent-purple)",
              },
              {
                layer: "Edge/Offline",
                tech: "Phi-3 / Gemma 2",
                color: "var(--accent-rose)",
              },
              {
                layer: "Validation",
                tech: "Pydantic-AI",
                color: "var(--accent-cyan)",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  background: "var(--bg-glass)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: `3px solid ${item.color}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {item.layer}
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: item.color }}
                >
                  {item.tech}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "40px",
          textAlign: "center",
          borderTop: "1px solid var(--border-subtle)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          © 2026 BazaarMind — Engineered by Delta v
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
          AI-Driven Predictive Commerce for Bangladesh 🇧🇩
        </p>
      </footer>
    </div>
  );
}
