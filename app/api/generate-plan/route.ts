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
  score?: number;
  whyThisScore?: string;
  scoreBreakdown?: ScoreBreakdown;
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

function normalizeImprovement(value: unknown): string {
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
    .map((line) => line.trim())
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
"whyThisScore", "scoreBreakdown", "improvement", "problem", "targetCustomer", "mvp", "validationPlan".

The "scoreBreakdown" object must have these exact keys:
"problemSeverity", "customerUrgency", "mvpSimplicity", "monetizationPotential", "differentiationPotential".

Scoring rubric:
- Each scoreBreakdown field must be an integer from 0 to 20.
- Do NOT return a separate total score.
- The server will calculate the total score by summing the 5 category scores.

Evaluation rules:
- problemSeverity: how painful and meaningful the problem is
- customerUrgency: whether customers urgently want to solve it
- mvpSimplicity: how easy and cheap it is to test quickly
- monetizationPotential: whether users or businesses are likely to pay
- differentiationPotential: whether the idea has defensible uniqueness

If the input is meaningless, random text, or too vague to evaluate as a startup idea:
- keep all scoreBreakdown values very low
- explain clearly why it is not a valid startup idea
- still return valid JSON with all required keys

If the input is a valid startup idea:
- whyThisScore: exactly 3 sentences
- improvement: exactly 3 bullet points worth of content
- problem: 2-3 sentences
- targetCustomer: 2-3 sentences
- mvp: 2-4 sentences
- validationPlan: exactly 14 lines, one line per day
  - Korean example: "1일차: ..."
  - English example: "Day 1: ..."

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
      score: totalScore,
      whyThisScore: String(parsed.whyThisScore ?? ""),
      scoreBreakdown: breakdown,
      improvement: normalizeImprovement(parsed.improvement),
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