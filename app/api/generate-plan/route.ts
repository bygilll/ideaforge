import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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

  if (!idea) {
    return NextResponse.json(
      { error: "Please provide an idea" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are a strict startup validation expert.

The user may write in Korean or English.
Always respond in the SAME language as the user's input.

You must return VALID JSON only with these exact keys:
"score", "problem", "targetCustomer", "mvp", "validationPlan".

Scoring rule:
- 0 = terrible idea
- 10 = excellent idea ready to build

Be critical and realistic.

If the input is meaningless, random text, or too vague to evaluate as a startup idea:
- set "score" to 1
- set "problem" to a short explanation that this is not a valid startup idea
- set "targetCustomer" to "N/A"
- set "mvp" to "N/A"
- set "validationPlan" to "Please enter a real product or service idea."

If the input is a valid startup idea:
- score: a number from 0 to 10
- problem: 2-3 sentences
- targetCustomer: 2-3 sentences
- mvp: 2-4 sentences
- validationPlan: either:
  1) a simple 14-day text plan, or
  2) a JSON object like {"Day 1":"...", "Day 2":"..."}.

Do not include markdown fences. Return JSON only.`;

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
        temperature: 0.7,
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

    return NextResponse.json({
      score: Number(parsed.score ?? 0),
      problem: String(parsed.problem ?? ""),
      targetCustomer: String(parsed.targetCustomer ?? ""),
      mvp: String(parsed.mvp ?? ""),
      validationPlan:
        typeof parsed.validationPlan === "string"
          ? parsed.validationPlan
          : JSON.stringify(parsed.validationPlan ?? "", null, 2),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}

function parseJsonContent(content: string): {
  score?: number;
  problem?: string;
  targetCustomer?: string;
  mvp?: string;
  validationPlan?: string | Record<string, string>;
} | null {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned) as {
      score?: number;
      problem?: string;
      targetCustomer?: string;
      mvp?: string;
      validationPlan?: string | Record<string, string>;
    };
  } catch {
    return null;
  }
}