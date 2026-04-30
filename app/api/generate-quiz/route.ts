import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// Supabase admin client (service role — bypasses RLS, server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FREE_TIER_MAX_QUESTIONS = 10;

const systemPrompt = `You are a quiz generator for teachers. 
Always respond with valid JSON only, no markdown, no extra text, 
no code fences. Return only a JSON array starting with [ and ending with ].`;

function buildUserPrompt(
  topic: string,
  numQuestions: number,
  difficulty: string,
  questionType: string,
): string {
  switch (questionType) {
    case "truefalse":
      return `Generate ${numQuestions} True/False questions about '${topic}' at ${difficulty} difficulty. 
Return ONLY a JSON array: [{"question": string, "options": ["True","False"], "answer": string}]
Answer must be exactly "True" or "False". Do not add any explanation. Complete all ${numQuestions} questions.`;

    case "fillinblanks":
      return `Generate ${numQuestions} fill-in-the-blank questions about '${topic}' at ${difficulty} difficulty.
Each question must have a blank shown as _______
Return ONLY a JSON array: [{"question": string, "options": [string,string,string,string], "answer": string}]
Example: {"question": "The _______ protocol is used for sending email.", "options": ["SMTP","HTTP","FTP","DNS"], "answer": "SMTP"}
Do not add any explanation. Complete all ${numQuestions} questions.`;

    case "shortanswer":
      return `Generate ${numQuestions} short answer questions about '${topic}' at ${difficulty} difficulty.
Return ONLY a JSON array: [{"question": string, "options": [], "answer": string}]
Answer should be 1-2 sentences maximum. Do not add any explanation. Complete all ${numQuestions} questions.`;

    case "mixed":
      return `Generate ${numQuestions} mixed questions about '${topic}' at ${difficulty} difficulty.
Mix these types equally: MCQ, True/False, Fill in the blank, Short answer.
Return ONLY a JSON array:
[{"type": "mcq"|"truefalse"|"fillinblanks"|"shortanswer", "question": string, "options": [string], "answer": string}]
For shortanswer options = []. For truefalse options = ["True","False"]. For fillinblanks question must contain _______.
Do not add any explanation. Complete all ${numQuestions} questions.`;

    default:
      return `Generate ${numQuestions} multiple choice questions about '${topic}' at ${difficulty} difficulty.
Return ONLY a JSON array: [{"question": string, "options": [string,string,string,string], "answer": string}]
Each question must have exactly 4 options. Do not add any explanation.
Do not truncate. Complete all ${numQuestions} questions.`;
  }
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
  if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API_ERROR: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroqPrimary(messages: object[], maxTokens: number) {
  return callAPI(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    {
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    },
  );
}

async function callGroqFallback(messages: object[], maxTokens: number) {
  return callAPI(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    {
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    },
  );
}

async function callOpenRouter(messages: object[], maxTokens: number) {
  return callAPI(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://quiz-generator-ten-phi.vercel.app",
      "X-Title": "QuizAI",
    },
    {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
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
    // JWT verification
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: jwt.JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "",
      ) as jwt.JwtPayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const {
      topic,
      numQuestions,
      difficulty,
      questionType = "mcq",
    } = await request.json();

    if (!topic || !numQuestions || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields: topic, numQuestions, difficulty" },
        { status: 400 },
      );
    }

    // Server-side plan check via Supabase
    const userId = decoded.sub ?? decoded.id ?? decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token: missing user ID" },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError?.message);
      return NextResponse.json(
        { error: "Could not verify user plan. Please try again." },
        { status: 500 },
      );
    }

    // Enforce free tier limit — cannot be bypassed by calling API directly
    if (!profile.is_pro && numQuestions > FREE_TIER_MAX_QUESTIONS) {
      return NextResponse.json(
        {
          error: "FREE_TIER_LIMIT",
          message: `Free plan is limited to ${FREE_TIER_MAX_QUESTIONS} questions per quiz.`,
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: buildUserPrompt(topic, numQuestions, difficulty, questionType),
      },
    ];

    const maxTokens = numQuestions > 15 ? 6000 : 4000;

    const attempts = [
      { name: "Groq primary", fn: () => callGroqPrimary(messages, maxTokens) },
      {
        name: "Groq fallback",
        fn: () => callGroqFallback(messages, maxTokens),
      },
      { name: "OpenRouter", fn: () => callOpenRouter(messages, maxTokens) },
    ];

    let lastError = "";

    for (const attempt of attempts) {
      try {
        console.log(`Trying ${attempt.name}...`);
        const rawContent = await attempt.fn();
        const questions = parseQuestions(rawContent);

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("Empty questions array");
        }

        console.log(`Success with ${attempt.name}`);
        return NextResponse.json({ questions, modelUsed: attempt.name });
      } catch (err: unknown) {
        const error = err as Error;
        lastError = error.message;

        if (
          error.message === "RATE_LIMIT_429" ||
          error.message === "CREDITS_EXHAUSTED"
        ) {
          console.log(`${attempt.name} unavailable, trying next...`);
          continue;
        }

        // Non-rate-limit error — fail immediately
        console.error(`${attempt.name} error:`, error.message);
        return NextResponse.json(
          { error: `Failed to generate quiz. Please try again.` },
          { status: 500 },
        );
      }
    }

    // All 3 failed
    console.error("All AI models exhausted. Last error:", lastError);
    return NextResponse.json(
      {
        error:
          "Our AI is taking a short break due to high usage. Please try again in a few minutes.",
      },
      { status: 429 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Quiz generation error:", err.message);
    return NextResponse.json(
      { error: `Failed to generate quiz: ${err.message}` },
      { status: 500 },
    );
  }
}
