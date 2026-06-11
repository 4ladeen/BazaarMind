"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [
      {
        href: "/dashboard",
        icon: "📊",
        label: "Dashboard",
        id: "nav-dashboard",
      },
      { href: "/chat", icon: "💬", label: "WhatsApp Chat", id: "nav-chat" },
    ],
  },
  {
    section: "Commerce",
    items: [
      {
        href: "/inventory",
        icon: "📦",
        label: "Inventory",
        id: "nav-inventory",
      },
      {
        href: "/pricing",
        icon: "💰",
        label: "Pricing & Elasticity",
        id: "nav-pricing",
      },
      {
        href: "/forecasts",
        icon: "📈",
        label: "Demand Forecasts",
        id: "nav-forecasts",
      },
    ],
  },
  {
    section: "Intelligence",
    items: [
      {
        href: "/signals",
        icon: "🔔",
        label: "Signal Monitor",
        id: "nav-signals",
        badge: "3",
      },
      {
        href: "/merchants",
        icon: "🏪",
        label: "Merchants",
        id: "nav-merchants",
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        href: "/onboarding",
        icon: "🚀",
        label: "Add Merchant",
        id: "nav-onboarding",
      },
      { href: "/settings", icon: "⚙️", label: "Settings", id: "nav-settings" },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [apiStatus, setApiStatus] = useState({
    claude: false,
    whatsapp: false,
    checked: false,
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/`)
      .then((r) => r.json())
      .then((d) =>
        setApiStatus({
          claude: d.claude_enabled,
          whatsapp: d.whatsapp_enabled,
          checked: true,
        }),
      )
      .catch(() =>
        setApiStatus({ claude: false, whatsapp: false, checked: true }),
      );
  }, []);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <Link
            href="/"
            className="sidebar-logo"
            style={{ textDecoration: "none" }}
          >
            <div className="sidebar-logo-icon">🧠</div>
            <div>
              <span className="sidebar-logo-text">BazaarMind</span>
              <span className="sidebar-logo-badge">v2.0 • AI Commerce</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  id={item.id}
                  className={`nav-item ${pathname === item.href ? "active" : ""}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Status indicators */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {apiStatus.checked && (
            <div style={{ marginBottom: "10px" }}>
              <StatusRow on={apiStatus.claude} label="Claude AI" icon="🤖" />
              <StatusRow on={apiStatus.whatsapp} label="WhatsApp" icon="📱" />
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <span className="signal-dot green pulse" />
            <span>BazaarMind Online</span>
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
          >
            Delta v © 2026
          </div>
        </div>
      </aside>
    </>
  );
}

function StatusRow({ on, label, icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
        fontSize: "12px",
      }}
    >
      <span>{icon}</span>
      <span style={{ flex: 1, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: on ? "#4ade80" : "#f87171", fontWeight: "600" }}>
        {on ? "● LIVE" : "○ OFF"}
      </span>
    </div>
  );
}
