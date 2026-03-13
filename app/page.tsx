"use client";

import { useState } from "react";

type PlanResponse = {
  problem: string;
  targetCustomer: string;
  mvp: string;
  validationPlan: string;
};

function formatValidationPlan(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed)
        .map(([day, text]) => `${day}: ${String(text)}`)
        .join("\n");
    }

    return value;
  } catch {
    return value;
  }
}

export default function Page() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "40px 24px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 24,
          lineHeight: 1.3,
        }}
      >
        Turn your startup idea into a 14-day validation plan
      </h1>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your startup idea in a few sentences..."
        style={{
          width: "100%",
          minHeight: 120,
          padding: 16,
          fontSize: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          resize: "vertical",
          marginBottom: 16,
        }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !idea.trim()}
        style={{
          width: "100%",
          padding: "14px 16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 24,
          opacity: loading || !idea.trim() ? 0.7 : 1,
        }}
      >
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      {error ? (
        <p style={{ color: "red", marginBottom: 24 }}>{error}</p>
      ) : null}

      {result ? (
        <div style={{ display: "grid", gap: 16 }}>
          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              1. Problem
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
              {result.problem}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              2. Target Customer
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
              {result.targetCustomer}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              3. MVP
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
              {result.mvp}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              4. 14-Day Validation Plan
            </h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
                margin: 0,
                fontFamily: "inherit",
                fontSize: 16,
              }}
            >
              {formatValidationPlan(result.validationPlan)}
            </pre>
          </section>
        </div>
      ) : null}
    </main>
  );
}