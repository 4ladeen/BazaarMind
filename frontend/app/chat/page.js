"use client";
import { useState, useRef, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { sendChatMessage } from "../lib/api";

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "আসসালামু আলাইকুম ভাই! 🙏\n\nAmi BazaarMind AI — apnar dokan er digital brain! 🧠\n\nAmi apnake help korte pari:\n\n📊 **Price advice** → 'dam ki rakhbo?'\n📈 **Demand forecast** → 'kal ki sell hobe?'\n📦 **Stock check** → 'stock koto ase?'\n⚠️ **Disruption alerts** → 'weather ki hobe?'\n📱 **Marketing copy** → 'Facebook post banao'\n\nBolun, ki jante chan? 😊",
  timestamp: new Date().toISOString(),
};

const QUICK_MESSAGES = [
  { text: "alu er dam ki rakhbo?", label: "💰 Price advice" },
  { text: "kal ki sell hobe?", label: "📈 Demand forecast" },
  { text: "stock koto ase?", label: "📦 Stock check" },
  { text: "weather ki hobe?", label: "🌤️ Weather alert" },
  { text: "Facebook post banao", label: "📱 Marketing" },
  { text: "help koren", label: "🆘 Help" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text = null) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await sendChatMessage(msg, conversationId);
      if (response.conversation_id) setConversationId(response.conversation_id);
      if (response.suggestions) setSuggestions(response.suggestions);

      const assistantMsg = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        intent: response.intent,
        confidence: response.confidence,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Sorry, ekta problem hoyeche. Please abar try korun.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">💬 WhatsApp Chat Simulator</h1>
        <p className="page-subtitle">Test the BazaarMind AI advisor in Banglish</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, height: "calc(100vh - 160px)" }}>
        {/* Chat Window */}
        <div className="chat-container">
          {/* Chat Header */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}>
              🧠
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>BazaarMind AI</div>
              <div style={{ fontSize: 12, color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="signal-dot green pulse" /> Online • Banglish Mode
              </div>
            </div>
            {conversationId && (
              <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
                Session: {conversationId.slice(0, 8)}...
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                {msg.intent && (
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6, display: "flex", gap: 8 }}>
                    <span className="badge badge-emerald" style={{ fontSize: 10, padding: "2px 6px" }}>
                      {msg.intent}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {Math.round(msg.confidence * 100)}% confidence
                    </span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                <div style={{ display: "flex", gap: 4 }}>
                  <span className="signal-dot green pulse" />
                  <span className="signal-dot green pulse" style={{ animationDelay: "0.3s" }} />
                  <span className="signal-dot green pulse" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="chat-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type in Banglish... e.g., 'alu er dam ki rakhbo?'"
              disabled={loading}
              id="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              id="chat-send"
            >
              Send →
            </button>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="glass-card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
              ⚡ Quick Messages
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_MESSAGES.map((qm, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qm.text)}
                  disabled={loading}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--bg-glass-hover)";
                    e.target.style.borderColor = "var(--accent-emerald)";
                    e.target.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "var(--bg-glass)";
                    e.target.style.borderColor = "var(--border-subtle)";
                    e.target.style.color = "var(--text-secondary)";
                  }}
                >
                  {qm.label}
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    "{qm.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
              📝 About This Demo
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              This simulates the WhatsApp-first interface merchants use.
              Type in Banglish (Bengali + English mix) and the AI will
              understand your intent and respond with actionable advice.
            </p>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--accent-emerald)" }}>
              🧠 Intent detection • 💬 Banglish NLP • 📊 Real-time data
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
