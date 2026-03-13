"use client";

import { useState } from "react";

type ScoreBreakdown = {
  problemSeverity: number;
  customerUrgency: number;
  mvpSimplicity: number;
  monetizationPotential: number;
  differentiationPotential: number;
};

type PlanResponse = {
  score: number;
  whyThisScore: string;
  scoreBreakdown: ScoreBreakdown;
  improvement: string;
  problem: string;
  targetCustomer: string;
  mvp: string;
  validationPlan: string;
};

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
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 10,
            lineHeight: 1.35,
            whiteSpace: "pre-line",
          }}
        >
          {"아이디어, 만들기 전에 검증해라\nValidate your startup idea before you build it"}
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "#555",
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {"AI가 당신의 아이디어를 14일 검증 플랜으로 바꿔줍니다\nTurn your startup idea into a 14-day validation plan"}
        </p>
      </div>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder={"창업 아이디어를 한두 문장으로 적어보세요\nDescribe your startup idea in a few sentences..."}
        style={{
          width: "100%",
          minHeight: 120,
          padding: 16,
          fontSize: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          resize: "vertical",
          marginBottom: 16,
          whiteSpace: "pre-wrap",
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
          <p
            style={{
              fontSize: 14,
              color: "#666",
              margin: 0,
              fontWeight: 600,
            }}
          >
            Validation Result
          </p>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              0. Idea Score
            </h2>
            <p style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>
              {result.score} / 100
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
              1. Why this score
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
              {result.whyThisScore}
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
              2. Score Breakdown
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <strong>Problem Severity</strong>: {result.scoreBreakdown.problemSeverity} / 20
              </div>
              <div>
                <strong>Customer Urgency</strong>: {result.scoreBreakdown.customerUrgency} / 20
              </div>
              <div>
                <strong>MVP Simplicity</strong>: {result.scoreBreakdown.mvpSimplicity} / 20
              </div>
              <div>
                <strong>Monetization Potential</strong>: {result.scoreBreakdown.monetizationPotential} / 20
              </div>
              <div>
                <strong>Differentiation Potential</strong>: {result.scoreBreakdown.differentiationPotential} / 20
              </div>
            </div>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              3. How to improve
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
              {result.improvement}
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
              4. Problem
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
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
              5. Target Customer
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
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
              6. MVP
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
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
              7. 14-Day Validation Plan
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
              {result.validationPlan}
            </pre>
          </section>
        </div>
      ) : null}
    </main>
  );
}