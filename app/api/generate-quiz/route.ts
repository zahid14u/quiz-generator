// 📁 SAVE AS: src/app/api/generate-quiz/route.ts
//
// ✅ Uses Node.js runtime with reduced per-model timeout (8s)
// so all fallback models fit within Vercel Hobby's 10s limit.
// Groq 429 errors respond instantly so fallback is near-instant.

export const dynamic = "force-dynamic";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FREE_TIER_MAX_QUESTIONS = 10;

const systemPrompt = `You are a quiz generator for teachers. 
Always respond with valid JSON only, no markdown, no extra text, 
no code fences. Return only a JSON array starting with [ and ending with ].`;

function buildUserPrompt(topic: string, numQuestions: number, difficulty: string, questionType: string): string {
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

// 8 second timeout — fast enough to fail and try next model
// Groq 429 responses come back in <1s so fallback is near-instant
async function callAPI(url: string, headers: Record<string, string>, body: object): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") throw new Error("TIMEOUT");
    throw err;
  }
  clearTimeout(timeoutId);

  if (response.status === 429) throw new Error("RATE_LIMIT_429");
  if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`API_ERROR: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function groqCall(apiKey: string, model: string, messages: object[], maxTokens: number) {
  return callAPI(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
    { model, messages, temperature: 0.7, max_tokens: maxTokens },
  );
}

function openRouterCall(model: string, messages: object[], maxTokens: number) {
  return callAPI(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://quizai.dev",
      "X-Title": "QuizAI",
    },
    { model, messages, temperature: 0.7, max_tokens: maxTokens },
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
    const { topic, questionType = "mcq", numQuestions, difficulty } = body;

    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } },
    );

    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (!topic || !numQuestions || !difficulty) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("is_pro").eq("id", user.id).single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Could not verify user plan." }, { status: 500 });
    }

    if (!profile.is_pro && numQuestions > FREE_TIER_MAX_QUESTIONS) {
      return NextResponse.json(
        { error: "FREE_TIER_LIMIT", message: `Free plan limit: ${FREE_TIER_MAX_QUESTIONS} questions.`, upgradeRequired: true },
        { status: 403 },
      );
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildUserPrompt(topic, numQuestions, difficulty, questionType) },
    ];
    const maxTokens = numQuestions > 15 ? 6000 : 4000;

    const groqKey1 = process.env.GROQ_API_KEY ?? "";
    const groqKey2 = process.env.GROQ_API_KEY_2 ?? "";
    const groqKey3 = process.env.GROQ_API_KEY_3 ?? "";

    const attempts: { name: string; fn: () => Promise<string> }[] = [];

    // Groq Key 1 (you already have this)
    if (groqKey1) {
      attempts.push(
        { name: "Groq-K1 Llama4-Maverick", fn: () => groqCall(groqKey1, "meta-llama/llama-4-maverick-17b-128e-instruct", messages, maxTokens) },
        { name: "Groq-K1 Qwen3-32B",       fn: () => groqCall(groqKey1, "qwen/qwen3-32b", messages, maxTokens) },
        { name: "Groq-K1 Llama4-Scout",    fn: () => groqCall(groqKey1, "meta-llama/llama-4-scout-17b-16e-instruct", messages, maxTokens) },
      );
    }

    // Groq Key 2 (optional — create free account, add GROQ_API_KEY_2 to Vercel)
    if (groqKey2) {
      attempts.push(
        { name: "Groq-K2 Llama4-Maverick", fn: () => groqCall(groqKey2, "meta-llama/llama-4-maverick-17b-128e-instruct", messages, maxTokens) },
        { name: "Groq-K2 Qwen3-32B",       fn: () => groqCall(groqKey2, "qwen/qwen3-32b", messages, maxTokens) },
        { name: "Groq-K2 Llama4-Scout",    fn: () => groqCall(groqKey2, "meta-llama/llama-4-scout-17b-16e-instruct", messages, maxTokens) },
      );
    }

    // Groq Key 3 (optional — add GROQ_API_KEY_3 to Vercel)
    if (groqKey3) {
      attempts.push(
        { name: "Groq-K3 Llama4-Maverick", fn: () => groqCall(groqKey3, "meta-llama/llama-4-maverick-17b-128e-instruct", messages, maxTokens) },
        { name: "Groq-K3 Qwen3-32B",       fn: () => groqCall(groqKey3, "qwen/qwen3-32b", messages, maxTokens) },
        { name: "Groq-K3 Llama4-Scout",    fn: () => groqCall(groqKey3, "meta-llama/llama-4-scout-17b-16e-instruct", messages, maxTokens) },
      );
    }

    // OpenRouter free models — $0 balance is fine, these are truly free
    if (process.env.OPENROUTER_API_KEY) {
      attempts.push(
        { name: "OR Llama3.3-70B", fn: () => openRouterCall("meta-llama/llama-3.3-70b-instruct:free", messages, maxTokens) },
        { name: "OR Llama3.1-8B",  fn: () => openRouterCall("meta-llama/llama-3.1-8b-instruct:free", messages, maxTokens) },
        { name: "OR Mistral-7B",   fn: () => openRouterCall("mistralai/mistral-7b-instruct:free", messages, maxTokens) },
      );
    }

    let lastError = "";
    for (const attempt of attempts) {
      try {
        console.log(`Trying ${attempt.name}...`);
        const rawContent = await attempt.fn();
        const questions = parseQuestions(rawContent);

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("Empty questions array");
        }

        console.log(`✅ Success with ${attempt.name}`);

        if (profile.is_pro) {
          await supabaseSSR.from("quizzes").insert({
            user_id: user.id,
            topic, difficulty,
            question_type: questionType,
            num_questions: numQuestions,
            questions,
          });
        }

        return NextResponse.json({ questions, modelUsed: attempt.name });

      } catch (err: unknown) {
        const error = err as Error;
        lastError = error.message;
        console.log(`❌ ${attempt.name} failed: ${error.message} — trying next...`);
        continue;
      }
    }

    console.error("All models exhausted. Last error:", lastError);
    return NextResponse.json(
      { error: "Our AI is taking a short break. Please try again in a few minutes." },
      { status: 429 },
    );

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Quiz generation error:", err.message);
    return NextResponse.json({ error: `Failed to generate quiz: ${err.message}` }, { status: 500 });
  }
}
