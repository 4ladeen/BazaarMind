"use client";
import DashboardLayout from "../components/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">System configuration and API management</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
        {/* System Status */}
        <div className="glass-card">
          <div className="chart-title">🖥️ System Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "API Server", status: "Demo Mode", color: "var(--accent-amber)", icon: "🟡" },
              { label: "AI Orchestrator", status: "Active (Pattern Matching)", color: "var(--accent-emerald)", icon: "🟢" },
              { label: "RAG Pipeline", status: "Ready", color: "var(--accent-emerald)", icon: "🟢" },
              { label: "Forecast MCP", status: "Synthetic Data", color: "var(--accent-amber)", icon: "🟡" },
              { label: "Signals MCP", status: "Synthetic Data", color: "var(--accent-amber)", icon: "🟡" },
              { label: "Database", status: "In-Memory (Demo)", color: "var(--accent-amber)", icon: "🟡" },
              { label: "Ollama Edge", status: "Not Connected", color: "var(--text-muted)", icon: "⚪" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-glass)", borderRadius: "var(--radius-sm)" }}>
                <span>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: 13, color: item.color, fontWeight: 600 }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="glass-card">
          <div className="chart-title">🔑 API Keys Configuration</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Configure API keys to enable production AI models. The system operates in demo mode without keys.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { name: "Anthropic Claude", env: "ANTHROPIC_API_KEY", purpose: "Strategic reasoning & brand simulation" },
              { name: "Google Gemini", env: "GEMINI_API_KEY", purpose: "Context extraction & normalization" },
              { name: "Groq (Llama 3.3)", env: "GROQ_API_KEY", purpose: "Real-time intent classification" },
              { name: "Cohere", env: "COHERE_API_KEY", purpose: "RAG reranking" },
              { name: "Mistral", env: "MISTRAL_API_KEY", purpose: "Creative marketing copy" },
            ].map((key, i) => (
              <div key={i} style={{ padding: 12, background: "var(--bg-glass)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{key.name}</span>
                  <span className="badge badge-amber">Not Set</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{key.purpose}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "monospace" }}>{key.env}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Info */}
        <div className="glass-card">
          <div className="chart-title">🏗️ Architecture</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { layer: "Orchestration", tech: "LangGraph Multi-Agent Supervisor", status: "✅ Demo" },
              { layer: "High-Tier Reasoning", tech: "Claude API (Anthropic)", status: "⏳ Key Needed" },
              { layer: "High-Throughput", tech: "Gemini Flash-Lite", status: "⏳ Key Needed" },
              { layer: "Latency-Critical", tech: "Llama 3.3 via Groq", status: "⏳ Key Needed" },
              { layer: "Edge/Offline", tech: "Phi-3 / Gemma 2 (Ollama Q4_K_M)", status: "⏳ Setup Needed" },
              { layer: "Creative", tech: "Mistral (Local/API)", status: "⏳ Key Needed" },
              { layer: "Validation", tech: "Pydantic-AI", status: "✅ Active" },
              { layer: "RAG", tech: "BM25 + Vector Hybrid Search", status: "✅ Active" },
              { layer: "Cache", tech: "Semantic Cache (0.92 cosine)", status: "✅ Active" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg-glass)", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", width: 120, flexShrink: 0 }}>{item.layer}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{item.tech}</span>
                <span style={{ fontSize: 12, flexShrink: 0 }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="glass-card">
          <div className="chart-title">ℹ️ About BazaarMind</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>BazaarMind v1.0</strong> — AI-driven predictive commerce platform
              for regional and rural merchants in Bangladesh.
            </p>
            <p style={{ marginBottom: 12 }}>
              Built with a multi-tiered language model topology and edge-based
              inference, delivering real-time inventory advice, dynamic pricing,
              and hyper-local disruption alerts via culturally calibrated
              Banglish conversational interfaces.
            </p>
            <div style={{ padding: 16, background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-md)", marginTop: 16 }}>
              <div style={{ fontWeight: 700, color: "var(--accent-emerald)", marginBottom: 8 }}>
                🏢 Kibou Studio
              </div>
              <div style={{ fontSize: 13 }}>
                Engineered and deployed as a flagship B2B productized service.
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span className="badge badge-emerald">Next.js 14</span>
              <span className="badge badge-blue">FastAPI</span>
              <span className="badge badge-purple">LangGraph</span>
              <span className="badge badge-amber">Pydantic-AI</span>
              <span className="badge badge-rose">pgvector</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
