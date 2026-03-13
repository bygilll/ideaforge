import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local." },
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

  const systemPrompt = `You are a startup advisor. Given a startup idea, respond with exactly 4 short sections. Use clear, actionable language. Output valid JSON only, no markdown or extra text, with these exact keys: "problem", "targetCustomer", "mvp", "validationPlan".

- problem: 2-3 sentences on the core problem being solved.
- targetCustomer: 2-3 sentences on who the ideal early customer is.
- mvp: 2-4 sentences describing a minimal viable product to test the idea.
- validationPlan: A concise 14-day day-by-day validation plan (e.g. "Day 1: ... Day 2: ..." etc.).`;

  const userPrompt = `Startup idea:\n\n${idea}`;

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
      problem: String(parsed.problem ?? ""),
      targetCustomer: String(parsed.targetCustomer ?? ""),
      mvp: String(parsed.mvp ?? ""),
      validationPlan: String(parsed.validationPlan ?? ""),
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
  problem?: string;
  targetCustomer?: string;
  mvp?: string;
  validationPlan?: string;
} | null {
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as {
      problem?: string;
      targetCustomer?: string;
      mvp?: string;
      validationPlan?: string;
    };
  } catch {
    return null;
  }
}
