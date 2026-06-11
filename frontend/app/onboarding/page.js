"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh"];
const DISTRICTS = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj"],
  Chittagong: ["Chittagong", "Cox's Bazar", "Comilla", "Noakhali"],
  Rajshahi: ["Rajshahi", "Bogra", "Pabna", "Natore"],
  Khulna: ["Khulna", "Jessore", "Satkhira", "Bagerhat"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Barisal: ["Barisal", "Patuakhali", "Bhola"],
  Rangpur: ["Rangpur", "Dinajpur", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona"],
};
const CATEGORIES = [
  { value: "grocery", label: "🛒 Grocery" },
  { value: "fmcg", label: "🧴 FMCG" },
  { value: "electronics", label: "📱 Electronics" },
  { value: "pharmacy", label: "💊 Pharmacy" },
  { value: "agriculture", label: "🌾 Agriculture" },
  { value: "clothing", label: "👗 Clothing" },
  { value: "hardware", label: "🔧 Hardware" },
  { value: "cosmetics", label: "💄 Cosmetics" },
];

const STEPS = ["Personal Info", "Location", "Business Type", "Done!"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "+880",
    location: "",
    division: "Dhaka",
    district: "Dhaka",
    categories: [],
    tier: "starter",
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return "Name required";
      if (!/^\+880\d{10}$/.test(form.phone)) return "Phone must be +880 followed by 10 digits";
    }
    if (step === 1) {
      if (!form.location.trim()) return "Shop location required";
    }
    if (step === 2) {
      if (form.categories.length === 0) return "Select at least one category";
    }
    return null;
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");

    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }

    // Final submit
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "" || "http://localhost:8000";
      const res = await fetch(`${API}/api/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏪</div>
          <Link
           href="/" style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: 0 }}>BazaarMind</Link>
          <p style={{ color: "#94a3b8", marginTop: "4px" }}>AI Business Advisor for Bangladeshi Merchants</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: i <= step ? "#6366f1" : "#334155",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: "600", transition: "background 0.3s"
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: "32px", height: "2px", background: i < step ? "#6366f1" : "#334155", transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "32px", backdropFilter: "blur(10px)" }}>

          {step === 0 && (
            <div>
              <h2 style={{ color: "white", marginTop: 0, marginBottom: "24px" }}>👋 Personal Info</h2>
              <Field label="Your Name / Shop Name">
                <input
                  value={form.name} onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Rahim General Store"
                  style={inputStyle}
                />
              </Field>
              <Field label="WhatsApp Number">
                <input
                  value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  placeholder="+8801712345678"
                  style={inputStyle}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ color: "white", marginTop: 0, marginBottom: "24px" }}>📍 Location</h2>
              <Field label="Shop Address / Area">
                <input
                  value={form.location} onChange={(e) => update("location", e.target.value)}
                  placeholder="e.g. New Market, Dhaka Bazar"
                  style={inputStyle}
                />
              </Field>
              <Field label="Division">
                <select value={form.division} onChange={(e) => { update("division", e.target.value); update("district", DISTRICTS[e.target.value][0]); }} style={inputStyle}>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="District">
                <select value={form.district} onChange={(e) => update("district", e.target.value)} style={inputStyle}>
                  {(DISTRICTS[form.division] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ color: "white", marginTop: 0, marginBottom: "8px" }}>🛍️ What do you sell?</h2>
              <p style={{ color: "#94a3b8", marginBottom: "20px", fontSize: "14px" }}>Select all that apply</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {CATEGORIES.map((cat) => {
                  const selected = form.categories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      style={{
                        padding: "12px", borderRadius: "10px", border: `2px solid ${selected ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                        background: selected ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        color: selected ? "#a5b4fc" : "#94a3b8", cursor: "pointer",
                        fontSize: "14px", fontWeight: selected ? "600" : "400", transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>🎉</div>
              <h2 style={{ color: "#4ade80", margin: "0 0 8px 0" }}>Welcome to BazaarMind!</h2>
              <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
                {result.message}
              </p>
              <div style={{ background: "rgba(99,102,241,0.1)", borderRadius: "12px", padding: "16px", marginBottom: "24px", textAlign: "left" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>YOUR MERCHANT ID</div>
                <div style={{ color: "white", fontFamily: "monospace", fontSize: "14px", wordBreak: "break-all" }}>
                  {result.merchant?.id}
                </div>
                {result.whatsapp_sent && (
                  <div style={{ marginTop: "12px", color: "#4ade80", fontSize: "13px" }}>
                    ✅ WhatsApp welcome message sent!
                  </div>
                )}
              </div>
              <button onClick={() => router.push("/chat")} style={{ ...btnStyle, width: "100%", marginBottom: "12px" }}>
                💬 Start Chatting with AI
              </button>
              <button onClick={() => router.push("/dashboard")} style={{ ...btnStyle, background: "rgba(255,255,255,0.05)", width: "100%" }}>
                📊 View Dashboard
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "14px" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              {step > 0 && (
                <button
                  onClick={() => { setStep((s) => s - 1); setError(""); }}
                  style={{ ...btnStyle, background: "rgba(255,255,255,0.05)", flex: 1 }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                style={{ ...btnStyle, flex: step > 0 ? 1 : undefined, width: step === 0 ? "100%" : undefined, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Creating account..." : step === 2 ? "🚀 Create Account" : "Next →"}
              </button>
            </div>
          )}
        </div>

        {/* Login link */}
        {step < 3 && (
          <p style={{ textAlign: "center", color: "#64748b", marginTop: "20px", fontSize: "14px" }}>
            Already have an account?{" "}
            <span onClick={() => router.push("/chat")} style={{ color: "#818cf8", cursor: "pointer" }}>
              Go to Chat →
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
  color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box",
  appearance: "none",
};

const btnStyle = {
  padding: "12px 24px", borderRadius: "10px", border: "none",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "white", fontWeight: "600", fontSize: "15px", cursor: "pointer",
};
