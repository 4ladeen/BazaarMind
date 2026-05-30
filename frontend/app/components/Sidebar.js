"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", icon: "📊", label: "Dashboard", id: "nav-dashboard" },
      { href: "/chat", icon: "💬", label: "WhatsApp Chat", id: "nav-chat" },
    ],
  },
  {
    section: "Commerce",
    items: [
      { href: "/inventory", icon: "📦", label: "Inventory", id: "nav-inventory" },
      { href: "/pricing", icon: "💰", label: "Pricing & Elasticity", id: "nav-pricing" },
      { href: "/forecasts", icon: "📈", label: "Demand Forecasts", id: "nav-forecasts" },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { href: "/signals", icon: "🔔", label: "Signal Monitor", id: "nav-signals", badge: "3" },
      { href: "/merchants", icon: "🏪", label: "Merchants", id: "nav-merchants" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/settings", icon: "⚙️", label: "Settings", id: "nav-settings" },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" style={{ textDecoration: "none" }}>
            <div className="sidebar-logo-icon">🧠</div>
            <div>
              <span className="sidebar-logo-text">BazaarMind</span>
              <span className="sidebar-logo-badge">v1.0 • AI Commerce</span>
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
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom info */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
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
            <span>Demo Mode Active</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            Kibou Studio © 2025
          </div>
        </div>
      </aside>
    </>
  );
}
