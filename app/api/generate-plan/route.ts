import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

type ScoreBreakdown = {
  problemSeverity?: number;
  customerUrgency?: number;
  mvpSimplicity?: number;
  monetizationPotential?: number;
  differentiationPotential?: number;
};

type ParsedResponse = {
  asOfContext?: string;
  whyThisScore?: string;
  scoreBreakdown?: ScoreBreakdown;
  risks?: string | string[];
  improvement?: string | string[];
  problem?: string;
  targetCustomer?: string;
  mvp?: string;
  validationPlan?: string;
};

function clamp(value: unknown, min: number, max: number) {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (Number.isNaN(num)) return min;
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

  const systemPrompt = `You are a strict startup validation expert.

The required output language is ${outputLanguage}.
You must write the entire response in ${outputLanguage} only.
Do not mix languages.

Return VALID JSON only with these exact keys:
"asOfContext", "whyThisScore", "scoreBreakdown", "risks", "improvement", "problem", "targetCustomer", "mvp", "validationPlan".

The "scoreBreakdown" object must have these exact keys:
"problemSeverity", "customerUrgency", "mvpSimplicity", "monetizationPotential", "differentiationPotential".

Scoring rubric:
- Each scoreBreakdown field must be an integer from 0 to 20.
- Do NOT return a separate total score.
- The server will calculate the total score by summing the 5 category scores.

Category meaning:
- problemSeverity: how painful and meaningful the problem is
- customerUrgency: how strongly users would want and need this service
- mvpSimplicity: how easy and cheap it is to test quickly
- monetizationPotential: whether users or businesses are likely to pay
- differentiationPotential: whether the idea has defensible uniqueness

If the input is meaningless, random text, or too vague to evaluate as a startup idea:
- keep all scoreBreakdown values very low
- explain clearly why it is not a valid startup idea
- still return valid JSON with all required keys

If the input is a valid startup idea:
- asOfContext: exactly 2 sentences
  - first sentence must start with "${asOfLabel}"
  - mention the current market context or user demand context in a realistic but non-hyped way
- whyThisScore: exactly 3 sentences
  - be analytical, not flattering
  - explain why this idea gets this score now
- risks: exactly 3 bullet points worth of content
  - focus on why this idea may fail
  - be critical and concrete
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
- every line must mention idea-related keywords, target users, channels, or domain context
- avoid generic startup steps that could apply to any idea
- bad example: "시장 조사", "인터뷰", "MVP 개발 시작" only
- good example: include concrete references to the idea category, customer type, acquisition channel, trust issue, operational constraint, or niche domain keyword

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

    const breakdown = {
      problemSeverity: clamp(parsed.scoreBreakdown?.problemSeverity, 0, 20),
      customerUrgency: clamp(parsed.scoreBreakdown?.customerUrgency, 0, 20),
      mvpSimplicity: clamp(parsed.scoreBreakdown?.mvpSimplicity, 0, 20),
      monetizationPotential: clamp(parsed.scoreBreakdown?.monetizationPotential, 0, 20),
      differentiationPotential: clamp(parsed.scoreBreakdown?.differentiationPotential, 0, 20),
    };

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