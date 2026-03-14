"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OutputLanguage = "ko" | "en";

type ScoreBreakdown = {
  problemSeverity: number;
  customerUrgency: number;
  mvpSimplicity: number;
  monetizationPotential: number;
  differentiationPotential: number;
};

type PlanResponse = {
  language: OutputLanguage;
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

const LABELS = {
  ko: {
    pageTitle: "아이디어, 만들기 전에 검증해라",
    pageSubtitle: "Validate your startup idea before you build it",
    intro:
      "AI가 당신의 아이디어를 14일 검증 플랜으로 바꿔줍니다.\n아이디어를 막연한 낙관이 아니라 실행 가능한 검증 구조로 바꿔보세요.",
    englishHint: "You can also enter your idea in English.",
    placeholder:
      "검증하고 싶은 창업 아이디어를 한두 문장으로, 구체적으로 적어보세요.\n예: 혼자 사는 직장인이 퇴근 후 반려견 산책을 맡길 수 있도록, 근처 검증된 산책 도우미를 연결해주는 서비스\n예: 동네 카페 사장이 재고 부족을 미리 파악할 수 있도록, 판매 흐름을 기반으로 발주 시점을 알려주는 재고 관리 서비스",
    createButton: "검증 플랜 만들기",
    loadingButton: "진단 생성 중...",
    shareLabel: "AI 창업 검증 도구",
    summaryLabel: "한 줄 진단",
    riskLabel: "핵심 리스크",
    saveImage: "이미지 저장",
    copyLink: "링크 복사",
    copySuccess: "링크가 복사되었습니다.",
    copyFail: "링크 복사에 실패했습니다.",
    saveSuccess: "이미지가 저장되었습니다.",
    saveFail: "이미지 저장에 실패했습니다.",
    resultTitle: "검증 결과",
    resultIntro:
      "이 결과는 문제 강도, 필요도, MVP 실행 용이성, 수익화 가능성, 차별화 가능성을 기준으로 평가한 초기 진단입니다.",
    score: "0. 아이디어 점수",
    scoreDesc:
      "점수는 좋고 나쁨의 감상이 아니라, 지금 아이디어가 시장에서 얼마나 설득력 있게 검증될 수 있는지를 기준으로 계산됩니다.",
    asOf: "1. 현재 시점 기준 진단",
    asOfPrefix: "기준 시점",
    why: "2. 이 점수의 이유",
    breakdown: "3. 점수 세부 분석",
    risks: "4. 핵심 리스크",
    improvement: "5. 개선 방향",
    problem: "6. 문제 정의",
    target: "7. 타겟 고객",
    mvp: "8. MVP",
    plan: "9. 14일 검증 계획",
    problemSeverity: "문제 강도",
    customerUrgency: "필요도",
    mvpSimplicity: "MVP 실행 용이성",
    monetizationPotential: "수익화 가능성",
    differentiationPotential: "차별화 가능성",
    problemSeverityDesc:
      "사람들이 실제로 자주 겪고, 불편을 크게 느끼는 문제인지 평가합니다.",
    customerUrgencyDesc:
      "고객이 이 서비스를 실제로 원하고 필요하다고 느낄 가능성을 평가합니다.",
    mvpSimplicityDesc:
      "적은 비용과 짧은 시간으로 빠르게 검증 가능한지 평가합니다.",
    monetizationPotentialDesc:
      "고객이나 기업이 실제로 돈을 지불할 가능성이 있는지 평가합니다.",
    differentiationPotentialDesc:
      "기존 대안과 비교해 분명한 차이와 방어력이 있는지 평가합니다.",
    emptyError: "아이디어를 입력해 주세요.",
  },
  en: {
    pageTitle: "Validate your startup idea before you build it",
    pageSubtitle: "Get a 14-day validation plan before you start building",
    intro:
      "IdeaForge AI turns your startup idea into a 14-day validation plan.\nMove from vague optimism to something you can actually test.",
    englishHint: "You can also enter your idea in English.",
    placeholder:
      "Describe your startup idea in one or two specific sentences.\nExample: A service that connects busy pet owners with verified local dog walkers for evening walks\nExample: A tool that helps neighborhood cafe owners predict reorder timing based on daily sales flow",
    createButton: "Generate Validation Plan",
    loadingButton: "Generating...",
    shareLabel: "AI startup validation tool",
    summaryLabel: "One-line diagnosis",
    riskLabel: "Key risk",
    saveImage: "Save image",
    copyLink: "Copy link",
    copySuccess: "Link copied.",
    copyFail: "Failed to copy link.",
    saveSuccess: "Image saved.",
    saveFail: "Failed to save image.",
    resultTitle: "Validation Result",
    resultIntro:
      "This is an early-stage evaluation based on problem intensity, customer need, MVP ease, monetization potential, and differentiation.",
    score: "0. Idea Score",
    scoreDesc:
      "This score is not a compliment or insult. It estimates how convincingly this idea can be validated in the market right now.",
    asOf: "1. Current Market View",
    asOfPrefix: "Reference date",
    why: "2. Why this score",
    breakdown: "3. Score Breakdown",
    risks: "4. Key Risks",
    improvement: "5. Improvement Direction",
    problem: "6. Problem Definition",
    target: "7. Target Customer",
    mvp: "8. MVP",
    plan: "9. 14-Day Validation Plan",
    problemSeverity: "Problem Severity",
    customerUrgency: "Customer Need",
    mvpSimplicity: "MVP Ease",
    monetizationPotential: "Monetization Potential",
    differentiationPotential: "Differentiation Potential",
    problemSeverityDesc:
      "Evaluates whether the problem is frequent and meaningfully painful.",
    customerUrgencyDesc:
      "Evaluates how strongly users are likely to want and need this service.",
    mvpSimplicityDesc:
      "Evaluates whether the idea can be tested quickly with limited cost and effort.",
    monetizationPotentialDesc:
      "Evaluates whether customers or businesses are likely to pay for it.",
    differentiationPotentialDesc:
      "Evaluates whether the idea has a meaningful difference versus existing alternatives.",
    emptyError: "Please enter an idea.",
  },
} as const;

function detectInputLanguage(text: string): OutputLanguage {
  if (!text.trim()) return "ko";
  return /[가-힣]/.test(text) ? "ko" : "en";
}

function firstSentence(text: string) {
  const normalized = text.replace(/\n/g, " ").trim();
  if (!normalized) return "";

  const match = normalized.match(/.*?[.!?다]\s|.*$/);
  return match?.[0]?.trim() ?? normalized;
}

function firstBullet(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean);

  return lines[0] ?? "";
}

export default function Page() {
  const [idea, setIdea] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");

  const cardRef = useRef<HTMLDivElement | null>(null);
  const hasAutoRunRef = useRef(false);

  const activeLanguage: OutputLanguage = isComposing ? "ko" : detectInputLanguage(idea);
  const inputUi = LABELS[activeLanguage];
  const resultUi = LABELS[result?.language ?? activeLanguage];

  const cardSummary = useMemo(() => {
    if (!result) return null;

    return {
      score: result.score,
      summary: firstSentence(result.whyThisScore),
      risk: firstBullet(result.risks),
      asOfLabel: result.asOfLabel,
    };
  }, [result]);

  async function generatePlan(overrideIdea?: string) {
    const finalIdea = (overrideIdea ?? idea).trim();
    const language = detectInputLanguage(finalIdea);
    const ui = LABELS[language];

    if (!finalIdea) {
      setError(ui.emptyError);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopyMessage("");
    setDownloadMessage("");

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea: finalIdea }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || ui.emptyError);
        return;
      }

      setResult(data);
      setIdea(finalIdea);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("idea", finalIdea);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      setError(language === "en" ? "Something went wrong." : "요청 처리 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (typeof window === "undefined") return;

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("idea", idea.trim());

      await navigator.clipboard.writeText(url.toString());
      setCopyMessage(resultUi.copySuccess);
      setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage(resultUi.copyFail);
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  async function handleDownloadCard() {
    if (!cardRef.current) return;

    try {
      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `ideaforge-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadMessage(resultUi.saveSuccess);
      setTimeout(() => setDownloadMessage(""), 2000);
    } catch {
      setDownloadMessage(resultUi.saveFail);
      setTimeout(() => setDownloadMessage(""), 2000);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasAutoRunRef.current) return;

    const url = new URL(window.location.href);
    const sharedIdea = url.searchParams.get("idea");

    if (sharedIdea && sharedIdea.trim()) {
      hasAutoRunRef.current = true;
      setIdea(sharedIdea);
      generatePlan(sharedIdea);
    }
  }, []);

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
          {`${inputUi.pageTitle}\n${inputUi.pageSubtitle}`}
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
          {inputUi.intro}
        </p>
      </div>

      <p
        style={{
          fontSize: 14,
          color: "#666",
          marginTop: 0,
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        {inputUi.englishHint}
      </p>

      <textarea
  value={idea}
  onChange={(e) => setIdea(e.target.value)}
  onCompositionStart={() => setIsComposing(true)}
  onCompositionEnd={(e) => {
    setIsComposing(false);
    setIdea(e.currentTarget.value);
  }}
  placeholder={inputUi.placeholder}
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
        onClick={() => generatePlan()}
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
        {loading ? inputUi.loadingButton : inputUi.createButton}
      </button>

      {error ? (
        <p style={{ color: "red", marginBottom: 24 }}>{error}</p>
      ) : null}

      {result ? (
        <div style={{ display: "grid", gap: 16 }}>
          <section
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <div
              ref={cardRef}
              style={{
                borderRadius: 20,
                padding: 24,
                background: "#111",
                color: "#fff",
                display: "grid",
                gap: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    IdeaForge AI
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.72)",
                      marginTop: 4,
                    }}
                  >
                    {resultUi.shareLabel}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.72)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cardSummary?.asOfLabel}
                </div>
              </div>

              <div
                style={{
                  fontSize: 20,
                  lineHeight: 1.5,
                  fontWeight: 700,
                  whiteSpace: "pre-wrap",
                  wordBreak: "keep-all",
                }}
              >
                {idea}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    padding: "18px 16px",
                    borderRadius: 16,
                    background: "#fff",
                    color: "#111",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "#666",
                      marginBottom: 8,
                      fontWeight: 700,
                    }}
                  >
                    IDEA SCORE
                  </div>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {result.score}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    / 100
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.72)",
                        marginBottom: 8,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {resultUi.summaryLabel.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.7,
                        wordBreak: "keep-all",
                      }}
                    >
                      {cardSummary?.summary}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.72)",
                        marginBottom: 8,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {resultUi.riskLabel.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.7,
                        wordBreak: "keep-all",
                      }}
                    >
                      {cardSummary?.risk}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleDownloadCard}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {resultUi.saveImage}
              </button>

              <button
                onClick={handleCopyLink}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f3f3f3",
                  color: "#111",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {resultUi.copyLink}
              </button>

              {downloadMessage ? (
                <span
                  style={{
                    fontSize: 14,
                    color: "#666",
                    alignSelf: "center",
                  }}
                >
                  {downloadMessage}
                </span>
              ) : null}

              {!downloadMessage && copyMessage ? (
                <span
                  style={{
                    fontSize: 14,
                    color: "#666",
                    alignSelf: "center",
                  }}
                >
                  {copyMessage}
                </span>
              ) : null}
            </div>
          </section>

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
              {resultUi.resultTitle}
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {resultUi.resultIntro}
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
              {resultUi.score}
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
              {resultUi.scoreDesc}
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
              {resultUi.asOf}
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
              {resultUi.asOfPrefix}: {result.asOfLabel}
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
              {resultUi.why}
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
              {resultUi.breakdown}
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <strong>{resultUi.problemSeverity}</strong>: {result.scoreBreakdown.problemSeverity} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {resultUi.problemSeverityDesc}
                </div>
              </div>

              <div>
                <strong>{resultUi.customerUrgency}</strong>: {result.scoreBreakdown.customerUrgency} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {resultUi.customerUrgencyDesc}
                </div>
              </div>

              <div>
                <strong>{resultUi.mvpSimplicity}</strong>: {result.scoreBreakdown.mvpSimplicity} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {resultUi.mvpSimplicityDesc}
                </div>
              </div>

              <div>
                <strong>{resultUi.monetizationPotential}</strong>: {result.scoreBreakdown.monetizationPotential} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {resultUi.monetizationPotentialDesc}
                </div>
              </div>

              <div>
                <strong>{resultUi.differentiationPotential}</strong>: {result.scoreBreakdown.differentiationPotential} / 20
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  {resultUi.differentiationPotentialDesc}
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
              {resultUi.risks}
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
              {resultUi.improvement}
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
              {resultUi.problem}
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
              {resultUi.target}
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
              {resultUi.mvp}
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
              {resultUi.plan}
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