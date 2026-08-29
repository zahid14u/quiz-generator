// 📁 SAVE AS: src/app/api/generate-quiz/route.ts
// ✅ Uses Google Gemini (free) as primary + Groq + OpenRouter as fallbacks

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

function parseQuestions(rawContent: string) {
  const cleaned = extractJSON(rawContent.trim());
  try {
    return JSON.parse(cleaned);
  } catch {
    const partial = cleaned.match(/\{[^{}]*"question"[^{}]*\}/g);
    if (partial && partial.length > 0) return JSON.parse(`[${partial.join(",")}]`);
    throw new Error("Cannot parse JSON");
  }
}

// ── Google Gemini (FREE — 1500 req/day, no credit card) ──────────────────────
async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("No GOOGLE_AI_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(t);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(`Gemini ${res.status}: ${JSON.stringify(e)}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (err: any) {
    clearTimeout(t);
    if (err.name === "AbortError") throw new Error("TIMEOUT");
    throw err;
  }
}

// ── OpenRouter / Groq (OpenAI-compatible) ────────────────────────────────────
async function callOpenAICompat(
  url: string,
  headers: Record<string, string>,
  model: string,
  messages: object[],
  maxTokens: number
): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (res.status === 429) throw new Error("RATE_LIMIT_429");
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(`${res.status}: ${JSON.stringify(e)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err: any) {
    clearTimeout(t);
    if (err.name === "AbortError") throw new Error("TIMEOUT");
    throw err;
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

    const userPrompt = buildUserPrompt(topic, numQuestions, difficulty, questionType);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    const maxTokens = numQuestions > 15 ? 6000 : 4000;

    const groqKey1 = process.env.GROQ_API_KEY ?? "";
    const groqKey2 = process.env.GROQ_API_KEY_2 ?? "";
    const groqKey3 = process.env.GROQ_API_KEY_3 ?? "";
    const orKey    = process.env.OPENROUTER_API_KEY ?? "";
    const groqUrl  = "https://api.groq.com/openai/v1/chat/completions";
    const orUrl    = "https://openrouter.ai/api/v1/chat/completions";
    const orHeaders = { Authorization: `Bearer ${orKey}`, "HTTP-Referer": "https://quizai.dev", "X-Title": "QuizAI" };

    // ── Attempt list — each returns {name, content} or throws ────────────────
    type Attempt = { name: string; fn: () => Promise<string> };
    const attempts: Attempt[] = [];

    // 1. Google Gemini FREE — 1500 req/day, very generous
    if (process.env.GOOGLE_AI_API_KEY) {
      attempts.push({ name: "Gemini-2.0-Flash", fn: () => callGemini(userPrompt, maxTokens) });
    }

    // 2. Groq keys (up to 3 accounts)
    for (const [i, key] of [[1,groqKey1],[2,groqKey2],[3,groqKey3]] as [number,string][]) {
      if (!key) continue;
      attempts.push(
        { name: `Groq-K${i} Llama4-Maverick`, fn: () => callOpenAICompat(groqUrl, { Authorization: `Bearer ${key}` }, "meta-llama/llama-4-maverick-17b-128e-instruct", messages, maxTokens) },
        { name: `Groq-K${i} Qwen3-32B`,       fn: () => callOpenAICompat(groqUrl, { Authorization: `Bearer ${key}` }, "qwen/qwen3-32b", messages, maxTokens) },
      );
    }

    // 3. OpenRouter free models (correct names as of 2026)
    if (orKey) {
      attempts.push(
        { name: "OR Gemini-2.0-Flash",  fn: () => callOpenAICompat(orUrl, orHeaders, "google/gemini-2.0-flash-exp:free", messages, maxTokens) },
        { name: "OR Qwen3-235B",        fn: () => callOpenAICompat(orUrl, orHeaders, "qwen/qwen3-235b-a22b:free", messages, maxTokens) },
        { name: "OR Llama3.3-70B",      fn: () => callOpenAICompat(orUrl, orHeaders, "meta-llama/llama-3.3-70b-instruct:free", messages, maxTokens) },
      );
    }

    if (attempts.length === 0) {
      return NextResponse.json({ error: "No AI API keys configured." }, { status: 500 });
    }

    // ── Try sequentially but fast — 429s fail in <1s so still fits 10s limit ─
    let lastError = "";
    for (const attempt of attempts) {
      try {
        console.log(`Trying ${attempt.name}...`);
        const content = await attempt.fn();
        const questions = parseQuestions(content);
        if (!Array.isArray(questions) || questions.length === 0) throw new Error("Empty array");

        console.log(`✅ Success: ${attempt.name}`);

        if (profile.is_pro) {
          const { error: insertError } = await supabaseSSR.from("quizzes").insert({
            user_id: user.id, topic, difficulty,
            question_type: questionType, num_questions: numQuestions, questions,
          });
          if (insertError) console.error("DB save failed:", insertError.message);
        }

        return NextResponse.json({ questions, modelUsed: attempt.name });
      } catch (err: any) {
        lastError = err.message;
        console.log(`❌ ${attempt.name}: ${err.message}`);
        continue;
      }
    }

    return NextResponse.json(
      { error: "Our AI is taking a short break. Please try again in a few minutes." },
      { status: 429 }
    );

  } catch (error: any) {
    console.error("Quiz generation error:", error.message);
    return NextResponse.json({ error: `Failed to generate quiz: ${error.message}` }, { status: 500 });
  }
}
