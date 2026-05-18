// 📁 SAVE AS: app/api/demo-quiz/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const systemPrompt = `You are a quiz generator for teachers. 
Always respond with valid JSON only, no markdown, no extra text, 
no code fences. Return only a JSON array starting with [ and ending with ].`;

function buildUserPrompt(topic: string): string {
  return `Generate 3 multiple choice questions about '${topic}' at easy difficulty.
Return ONLY a JSON array: [{"question": string, "options": [string,string,string,string], "answer": string}]
Each question must have exactly 4 options. Do not add any explanation. Complete all 3 questions.`;
}

function extractJSON(text: string): string {
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1) {
    return text.substring(firstBracket, lastBracket + 1);
  }
  return text;
}

async function callAPI(
  url: string,
  headers: Record<string, string>,
  body: object,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (response.status === 429) throw new Error("RATE_LIMIT_429");
  if (!response.ok) throw new Error("API_ERROR");
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroqPrimary(messages: object[]) {
  return callAPI(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    {
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    },
  );
}

async function callGroqFallback(messages: object[]) {
  return callAPI(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    {
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    },
  );
}

function parseQuestions(rawContent: string) {
  const cleanedContent = extractJSON(rawContent.trim());
  try {
    return JSON.parse(cleanedContent);
  } catch {
    const partialMatch = cleanedContent.match(/\{[^{}]*"question"[^{}]*\}/g);
    if (partialMatch && partialMatch.length > 0) {
      return JSON.parse(`[${partialMatch.join(",")}]`);
    }
    throw new Error("Cannot parse JSON");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { topic } = body;

    if (!topic) {
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });
    }

    // ── Cookie Rate Limit Checking ──
    const cookieStore = await cookies();
    const hasUsedDemo = cookieStore.get("quizai_demo_used");
    if (hasUsedDemo) {
      return NextResponse.json(
        {
          error: "DEMO_LIMIT_REACHED",
          message:
            "You have already generated your free demo quiz. Sign up for a free account to create unlimited quizzes!",
        },
        { status: 403 },
      );
    }

    // Plant protection cookie instantly
    cookieStore.set("quizai_demo_used", "true", {
      maxAge: 60 * 60 * 24 * 30, // 30 Days
      httpOnly: true,
      path: "/",
    });

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildUserPrompt(topic) },
    ];

    const attempts = [
      { name: "Groq primary", fn: () => callGroqPrimary(messages) },
      { name: "Groq fallback", fn: () => callGroqFallback(messages) },
    ];

    for (const attempt of attempts) {
      try {
        console.log(`Trying public demo route via ${attempt.name}...`);
        const rawContent = await attempt.fn();
        const questions = parseQuestions(rawContent);
        return NextResponse.json({ questions });
      } catch (err) {
        console.log(`${attempt.name} failed, trying fallback...`);
        continue;
      }
    }

    return NextResponse.json(
      { error: "AI service busy. Try again shortly." },
      { status: 429 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
