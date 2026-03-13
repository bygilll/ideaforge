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
  asOfLabel: string;
  score: number;
  asOfContext: string;
  whyThisScore: string;
  scoreBreakdown: ScoreBreakdown;
  risks: string;
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
        setError(data?.error || "문제가 발생했습니다.");
        return;
      }

      setResult(data);
    } catch {
      setError("요청 처리 중 문제가 발생했습니다.");
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
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 10,
            lineHeight: 1.3,
            whiteSpace: "pre-line",
            letterSpacing: "-0.02em",
          }}
        >
          {"아이디어, 만들기 전에 검증해라\nValidate your startup idea before you build it"}
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "#555",
            lineHeight: 1.7,
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {"AI가 당신의 아이디어를 14일 검증 플랜으로 바꿔줍니다.\n아이디어를 막연한 낙관이 아니라 실행 가능한 검증 구조로 바꿔보세요."}
        </p>
      </div>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder={"창업 아이디어를 한두 문장으로 적어보세요.\n예: 반려견 산책 대행 서비스, 동네 소상공인용 재고 관리 앱"}
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
          lineHeight: 1.6,
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
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 24,
          opacity: loading || !idea.trim() ? 0.7 : 1,
        }}
      >
        {loading ? "진단 생성 중..." : "검증 플랜 만들기"}
      </button>

      {error ? (
        <p style={{ color: "red", marginBottom: 24 }}>{error}</p>
      ) : null}

      {result ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: "#666",
                margin: 0,
                fontWeight: 700,
              }}
            >
              검증 결과
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              이 결과는 문제 강도, 필요도, MVP 실행 용이성, 수익화 가능성, 차별화 가능성을 기준으로 평가한 초기 진단입니다.
            </p>
          </div>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              0. 아이디어 점수
            </h2>
            <p
              style={{
                fontSize: 40,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.03em",
              }}
            >
              {result.score} / 100
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                lineHeight: 1.6,
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              점수는 좋고 나쁨의 감상이 아니라, 지금 아이디어가 시장에서 얼마나 설득력 있게 검증될 수 있는지를 기준으로 계산됩니다.
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              1. 현재 시점 기준 진단
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                lineHeight: 1.6,
                marginTop: 0,
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              기준 시점: {result.asOfLabel}
            </p>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, margin: 0 }}>
              {result.asOfContext}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              2. 이 점수의 이유
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, margin: 0 }}>
              {result.whyThisScore}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              3. 점수 세부 분석
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <strong>문제 강도</strong>: {result.scoreBreakdown.problemSeverity} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  사람들이 실제로 자주 겪고, 불편을 크게 느끼는 문제인지 평가합니다.
                </div>
              </div>

              <div>
                <strong>필요도</strong>: {result.scoreBreakdown.customerUrgency} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  고객이 이 서비스를 실제로 원하고 필요하다고 느낄 가능성을 평가합니다.
                </div>
              </div>

              <div>
                <strong>MVP 실행 용이성</strong>: {result.scoreBreakdown.mvpSimplicity} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  적은 비용과 짧은 시간으로 빠르게 검증 가능한지 평가합니다.
                </div>
              </div>

              <div>
                <strong>수익화 가능성</strong>: {result.scoreBreakdown.monetizationPotential} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  고객이나 기업이 실제로 돈을 지불할 가능성이 있는지 평가합니다.
                </div>
              </div>

              <div>
                <strong>차별화 가능성</strong>: {result.scoreBreakdown.differentiationPotential} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  기존 대안과 비교해 분명한 차이와 방어력이 있는지 평가합니다.
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              4. 핵심 리스크
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
              {result.risks}
            </pre>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              5. 개선 방향
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
              {result.improvement}
            </pre>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              6. 문제 정의
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, margin: 0 }}>
              {result.problem}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              7. 타겟 고객
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, margin: 0 }}>
              {result.targetCustomer}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              8. MVP
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, margin: 0 }}>
              {result.mvp}
            </p>
          </section>

          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              9. 14일 검증 계획
            </h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.9,
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