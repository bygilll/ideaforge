import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

type ScoreBreakdown = {
  problemSeverity: number;
  customerUrgency: number;
  mvpSimplicity: number;
  monetizationPotential: number;
  differentiationPotential: number;
};

type ParsedResponse = {
  asOfContext?: string;
  whyThisScore?: string;
  scoreBreakdown?: Partial<ScoreBreakdown>;
  risks?: string | string[];
  improvement?: string | string[];
  problem?: string;
  targetCustomer?: string;
  mvp?: string;
  validationPlan?: string;
};

function clamp(value: unknown, min: number, max: number) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function getAsOfLabel() {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "numeric",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${year}년 ${month}월 현재`;
}

function normalizeBulletList(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => `- ${String(item).replace(/^-+\s*/, "").trim()}`)
      .join("\n");
  }

  const text = String(value ?? "").trim();
  if (!text) return "";

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return lines
      .map((line) => `- ${line.replace(/^-+\s*/, "").trim()}`)
      .join("\n");
  }

  const splitBySentence = text
    .split(/(?<=[.!?다])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  return splitBySentence
    .map((line) => `- ${line.replace(/^-+\s*/, "").trim()}`)
    .join("\n");
}

function normalizeValidationPlan(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";

  let normalized = text
    .replace(/\r/g, "")
    .replace(/(Day\s*\d+\s*:)/gi, "\n$1")
    .replace(/(\d+\s*일차\s*:)/g, "\n$1")
    .replace(/(\d+\s*일차)/g, "\n$1")
    .replace(/(Day\s*\d+)/gi, "\n$1")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const lines = normalized
    .split("\n")
    .map((line) => line.trim().replace(/,\s*$/, ""))
    .filter(Boolean);

  return lines.join("\n");
}

function isMeaninglessIdea(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return true;

  const normalized = trimmed.toLowerCase();

  const exactMeaningless = new Set([
    "asdf",
    "test",
    "qwer",
    "zxcv",
    "1234",
    "123123",
    "ㅁㄴㅇㄹ",
    "ㅇㅇ",
    "ㄴㅇㄹ",
    "sdf",
    "abc",
  ]);

  if (exactMeaningless.has(normalized)) return true;
  if (/^([ㄱ-ㅎㅏ-ㅣa-zA-Z0-9])\1+$/.test(trimmed)) return true;

  const compact = trimmed.replace(/\s+/g, "");
  if (compact.length <= 2) return true;

  return false;
}

function parseJsonContent(content: string): ParsedResponse | null {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned) as ParsedResponse;
  } catch {
    return null;
  }
}

function countMatches(text: string, patterns: string[]) {
  const lower = text.toLowerCase();
  return patterns.reduce((count, pattern) => {
    return count + (lower.includes(pattern.toLowerCase()) ? 1 : 0);
  }, 0);
}

function inferScoreBreakdown(parsed: ParsedResponse, idea: string): ScoreBreakdown {
  const combinedText = [
    idea,
    parsed.asOfContext ?? "",
    parsed.whyThisScore ?? "",
    Array.isArray(parsed.risks) ? parsed.risks.join(" ") : String(parsed.risks ?? ""),
    Array.isArray(parsed.improvement)
      ? parsed.improvement.join(" ")
      : String(parsed.improvement ?? ""),
    parsed.problem ?? "",
    parsed.targetCustomer ?? "",
    parsed.mvp ?? "",
    parsed.validationPlan ?? "",
  ].join(" ");

  const negativePatterns = [
    "어렵",
    "불확실",
    "제한적",
    "부족",
    "낮",
    "약",
    "리스크",
    "위험",
    "문제",
    "불분명",
    "모호",
    "불가능",
    "불리",
    "경쟁",
    "치열",
    "비용",
    "복잡",
    "느림",
    "difficult",
    "unclear",
    "uncertain",
    "limited",
    "weak",
    "risk",
    "risky",
    "problem",
    "hard",
    "expensive",
    "competitive",
    "crowded",
    "low",
    "poor",
  ];

  const positivePatterns = [
    "수요",
    "필요",
    "명확",
    "유효",
    "강점",
    "기회",
    "실행",
    "가능",
    "검증",
    "유리",
    "차별화",
    "고객",
    "시장",
    "명백",
    "확장",
    "안정",
    "demand",
    "need",
    "clear",
    "strong",
    "opportunity",
    "viable",
    "feasible",
    "validation",
    "customer",
    "market",
    "differentiated",
    "scalable",
  ];

  const negatives = countMatches(combinedText, negativePatterns);
  const positives = countMatches(combinedText, positivePatterns);

  const ideaLength = idea.trim().length;
  const hasLocalOrOperationalWord =
    /지역|동네|예약|매칭|배송|산책|구독|결제|주문|재고|운영|앱|플랫폼|마켓|실시간|혼잡도|반려견|카페|스타벅스|matching|delivery|booking|subscription|inventory|marketplace|platform|app|real-time|crowd/i.test(
      idea
    );
  const hasB2BOrMonetizationWord =
    /소상공인|사장|기업|점주|구독|수수료|광고|파트너|b2b|saas|subscription|fee|commission|ads|partner/i.test(
      idea
    );
  const hasDifferentiationWord =
    /검증|실시간|자동|추천|분석|예측|맞춤|location|real-time|automation|recommend|analysis|prediction|personalized/i.test(
      idea
    );

  const baseProblem = ideaLength >= 18 ? 12 : 8;
  const baseUrgency = ideaLength >= 18 ? 11 : 7;
  const baseMvp = hasLocalOrOperationalWord ? 11 : 9;
  const baseMonetization = hasB2BOrMonetizationWord ? 12 : 9;
  const baseDifferentiation = hasDifferentiationWord ? 11 : 8;

  const adjustment = Math.max(-4, Math.min(4, positives - negatives));

  return {
    problemSeverity: clamp(baseProblem + adjustment, 0, 20),
    customerUrgency: clamp(baseUrgency + adjustment, 0, 20),
    mvpSimplicity: clamp(baseMvp + adjustment, 0, 20),
    monetizationPotential: clamp(baseMonetization + adjustment, 0, 20),
    differentiationPotential: clamp(baseDifferentiation + adjustment, 0, 20),
  };
}

function buildScoreBreakdown(parsed: ParsedResponse, idea: string): ScoreBreakdown {
  const fallback = inferScoreBreakdown(parsed, idea);
  const raw = parsed.scoreBreakdown ?? {};

  return {
    problemSeverity:
      typeof raw.problemSeverity === "number"
        ? clamp(raw.problemSeverity, 0, 20)
        : fallback.problemSeverity,
    customerUrgency:
      typeof raw.customerUrgency === "number"
        ? clamp(raw.customerUrgency, 0, 20)
        : fallback.customerUrgency,
    mvpSimplicity:
      typeof raw.mvpSimplicity === "number"
        ? clamp(raw.mvpSimplicity, 0, 20)
        : fallback.mvpSimplicity,
    monetizationPotential:
      typeof raw.monetizationPotential === "number"
        ? clamp(raw.monetizationPotential, 0, 20)
        : fallback.monetizationPotential,
    differentiationPotential:
      typeof raw.differentiationPotential === "number"
        ? clamp(raw.differentiationPotential, 0, 20)
        : fallback.differentiationPotential,
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  let body: { idea?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const idea = typeof body?.idea === "string" ? body.idea.trim() : "";
  const outputLanguage = /[가-힣]/.test(idea) ? "Korean" : "English";
  const asOfLabel = getAsOfLabel();

  if (!idea) {
    return NextResponse.json(
      { error: "Please provide an idea" },
      { status: 400 }
    );
  }

  if (isMeaninglessIdea(idea)) {
    return NextResponse.json({
      asOfLabel,
      score: 0,
      asOfContext: `${asOfLabel}, 현재 입력값은 유효한 창업 아이디어로 보기 어렵습니다.\n시장 상황이나 수요를 판단할 수 있을 정도의 문제, 고객, 서비스 맥락이 부족합니다.`,
      whyThisScore:
        "입력값이 너무 짧거나 무의미해 창업 아이디어로 평가할 수 없습니다.\n현재 상태로는 문제, 고객, 가치 제안을 판단할 근거가 없어 0점 처리했습니다.\n해결하려는 문제와 대상 고객이 드러나도록 한두 문장으로 다시 입력해 주세요.",
      scoreBreakdown: {
        problemSeverity: 0,
        customerUrgency: 0,
        mvpSimplicity: 0,
        monetizationPotential: 0,
        differentiationPotential: 0,
      },
      risks:
        "- 입력값이 모호해 실제 시장 수요를 판단할 수 없습니다.\n- 문제와 고객이 정의되지 않아 어떤 서비스인지 해석이 불가능합니다.\n- 이 상태로는 검증 계획을 세워도 의미 있는 인사이트를 얻기 어렵습니다.",
      improvement:
        "- 누가 어떤 상황에서 어떤 문제를 겪는지 먼저 적어보세요.\n- 서비스를 한 줄 소개가 아니라 문제 해결 문장으로 바꿔 적어보세요.\n- 대상 고객, 문제 상황, 제공 방식이 드러나도록 다시 입력해 주세요.",
      problem:
        "현재 입력값만으로는 사용자가 겪는 구체적인 문제를 확인할 수 없습니다. 평가 가능한 창업 아이디어는 최소한 해결하려는 불편이나 수요가 드러나야 합니다.",
      targetCustomer:
        "현재 입력값만으로는 특정 고객군을 정의할 수 없습니다. 누가 이 서비스를 필요로 하는지 드러나야 타겟 고객을 판단할 수 있습니다.",
      mvp:
        "문제와 고객이 정의되지 않은 상태에서는 MVP를 설계할 수 없습니다. 먼저 해결하려는 상황과 제공하려는 핵심 기능을 한두 문장으로 구체화해야 합니다.",
      validationPlan:
        "1일차: 해결하려는 문제를 한 문장으로 다시 정리하기\n2일차: 누가 이 문제를 겪는지 고객군 정하기\n3일차: 고객이 겪는 상황을 구체적인 장면으로 적기\n4일차: 기존에 쓰는 대안이 있는지 조사하기\n5일차: 이 서비스가 왜 필요한지 한 문장으로 정리하기\n6일차: 핵심 기능을 1개만 정하기\n7일차: 서비스 설명 문장을 다시 작성하기\n8일차: 주변 사람 3명에게 설명하고 이해되는지 확인하기\n9일차: 이해 안 되는 표현 제거하기\n10일차: 대상 고객이 실제로 필요로 할지 질문 정리하기\n11일차: 고객 인터뷰 질문 5개 만들기\n12일차: 비슷한 서비스 사례 3개 찾아보기\n13일차: 차별점이 있는지 정리하기\n14일차: 다시 한 번 구체적인 아이디어 문장으로 입력하기",
    });
  }

  const systemPrompt = `You are a veteran startup strategy consultant with 30 years of experience.

Your tone and judgment style must follow these rules:
- Be direct, sober, and analytical.
- Do not flatter the user.
- Do not overpraise weak ideas.
- Prioritize structural weakness, execution difficulty, demand uncertainty, monetization risk, and differentiation risk.
- If something is unclear, say it is unclear.
- If an idea sounds weak, say so plainly.
- Write like an experienced consultant reviewing an idea before money and time are wasted.
- Prefer judgment over encouragement.

The required output language is ${outputLanguage}.
You must write the entire response in ${outputLanguage} only.
If the user's input is Korean, every field in the response must be written in Korean with no English sentences.
If the user's input is English, every field in the response must be written in English with no Korean sentences.
Do not mix languages.

Return VALID JSON only with these exact keys:
"asOfContext", "whyThisScore", "scoreBreakdown", "risks", "improvement", "problem", "targetCustomer", "mvp", "validationPlan".

The "scoreBreakdown" object should have these exact keys:
"problemSeverity", "customerUrgency", "mvpSimplicity", "monetizationPotential", "differentiationPotential".

Scoring rubric:
- Each scoreBreakdown field should be an integer from 0 to 20.
- Do NOT return a separate total score.
- The server will calculate the total score by summing the 5 category scores.

Category meaning:
- problemSeverity: how painful and meaningful the problem is
- customerUrgency: how strongly users would want and need this service
- mvpSimplicity: how easy and cheap it is to test quickly
- monetizationPotential: whether users or businesses are likely to pay
- differentiationPotential: whether the idea has defensible uniqueness

If the input is a valid startup idea:
- asOfContext: exactly 2 sentences
  - do not just restate the idea
  - mention current market context, adoption barrier, competitive structure, trust issue, data dependency, operational challenge, or demand realism
- whyThisScore: exactly 3 sentences
  - explain the score with judgment, not encouragement
  - explicitly mention at least one structural weakness or execution risk
- risks: exactly 3 bullet points worth of content
  - focus on why this idea may fail
  - be critical, concrete, and unsentimental
- improvement: exactly 3 bullet points worth of content
  - actionable, specific, and practical
- problem: 2-3 sentences
- targetCustomer: 2-3 sentences
- mvp: 2-4 sentences

For validationPlan:
- return exactly 14 lines
- one line per day
- Korean format: "1일차: ..."
- English format: "Day 1: ..."
- every line must be specific to the user's idea
- every line must include at least one domain-specific noun or action related to the idea
- include concrete channels, communities, stakeholders, data sources, trust barriers, operational constraints, or customer situations
- avoid generic phrases like only "시장 조사", "고객 인터뷰", "MVP 설계", "프로토타입 개발"
- each day should feel unusable for a totally unrelated startup idea
- examples of specificity:
  - for pet services: 보호자 커뮤니티, 산책 대행 신뢰, 도우미 검증, 사고 책임, 지역 수요
  - for cafe/Starbucks ideas: 점포 혼잡도, 사이렌오더 사용자, 실시간 데이터 수집, 제휴 가능성, 유저 제보 방식
- if a line could apply to any startup idea without changing the noun, rewrite it to be more specific

Do not include markdown fences.
Return JSON only.`;

  const userPrompt = `Startup idea:

${idea}`;

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${res.status}. ${err}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 502 }
      );
    }

    const parsed = parseJsonContent(content);

    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse OpenAI response" },
        { status: 502 }
      );
    }

    const breakdown = buildScoreBreakdown(parsed, idea);

    const totalScore =
      breakdown.problemSeverity +
      breakdown.customerUrgency +
      breakdown.mvpSimplicity +
      breakdown.monetizationPotential +
      breakdown.differentiationPotential;

    return NextResponse.json({
      asOfLabel,
      score: totalScore,
      asOfContext: String(parsed.asOfContext ?? ""),
      whyThisScore: String(parsed.whyThisScore ?? ""),
      scoreBreakdown: breakdown,
      risks: normalizeBulletList(parsed.risks),
      improvement: normalizeBulletList(parsed.improvement),
      problem: String(parsed.problem ?? ""),
      targetCustomer: String(parsed.targetCustomer ?? ""),
      mvp: String(parsed.mvp ?? ""),
      validationPlan: normalizeValidationPlan(parsed.validationPlan),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}