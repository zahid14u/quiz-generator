// 📁 SAVE AS: src/app/api/generate-quiz/route.ts
// ✅ Google Gemini primary + Groq + OpenRouter fallbacks

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

// ── Google Gemini — fixed with correct header and model names ────────────────
async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("No GOOGLE_AI_API_KEY");

  console.log(`[Gemini] Key starts with: ${apiKey.substring(0, 6)}...`);

  // Current working models as of Aug 2026 — gemini-2.5-flash is stable
  const models = ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash-lite"];

  for (const model of models) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,  // ✅ correct header format
          },
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
        console.log(`[Gemini] ${model} failed ${res.status}: ${JSON.stringify(e)}`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) throw new Error("Empty Gemini response");
      console.log(`[Gemini] ✅ ${model} succeeded`);
      return text;
    } catch (err: any) {
      clearTimeout(t);
      if (err.name === "AbortError") { console.log(`[Gemini] ${model} timeout`); continue; }
      if (err.message.includes("Empty Gemini")) throw err;
      console.log(`[Gemini] ${model} error: ${err.message}`);
      continue;
    }
  }
  throw new Error("All Gemini models failed");
}

// ── OpenAI-compatible (Groq / OpenRouter) ────────────────────────────────────
async function callOpenAICompat(
  name: string,
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
    const orH      = { Authorization: `Bearer ${orKey}`, "HTTP-Referer": "https://quizai.dev", "X-Title": "QuizAI" };

    // Log which keys are available (without revealing values)
    console.log(`[Keys] Gemini:${!!process.env.GOOGLE_AI_API_KEY} Groq1:${!!groqKey1} Groq2:${!!groqKey2} Groq3:${!!groqKey3} OR:${!!orKey}`);

    type Attempt = { name: string; fn: () => Promise<string> };
    const attempts: Attempt[] = [];

    // ── 1. Google Gemini — FREE 1500 req/day ──────────────────────────────────
    if (process.env.GOOGLE_AI_API_KEY) {
      attempts.push({ name: "Gemini", fn: () => callGemini(userPrompt, maxTokens) });
    }

    // ── 2. Groq (up to 3 keys × 2 models) ────────────────────────────────────
    for (const [i, key] of [[1, groqKey1], [2, groqKey2], [3, groqKey3]] as [number, string][]) {
      if (!key) continue;
      attempts.push(
        { name: `Groq-K${i}-Maverick`, fn: () => callOpenAICompat(`Groq-K${i}-Maverick`, groqUrl, { Authorization: `Bearer ${key}` }, "openai/gpt-oss-120b", messages, maxTokens) },
        { name: `Groq-K${i}-Qwen3`,    fn: () => callOpenAICompat(`Groq-K${i}-Qwen3`,    groqUrl, { Authorization: `Bearer ${key}` }, "qwen/qwen3.6-27b", messages, maxTokens) },
      );
    }

    // ── 3. OpenRouter — only confirmed free models ────────────────────────────
    if (orKey) {
      attempts.push(
        { name: "OR-Qwen3-235B",   fn: () => callOpenAICompat("OR-Qwen3-235B",   orUrl, orH, "amazon/nova-2-lite-v1:free", messages, maxTokens) },
        { name: "OR-Gemini-Flash", fn: () => callOpenAICompat("OR-Gemini-Flash", orUrl, orH, "z-ai/glm-4.5-air:free", messages, maxTokens) },
        { name: "OR-DeepSeek-R1",  fn: () => callOpenAICompat("OR-DeepSeek-R1",  orUrl, orH, "amazon/nova-2-lite-v1:free", messages, maxTokens) },
      );
    }

    if (attempts.length === 0) {
      return NextResponse.json({ error: "No AI API keys configured." }, { status: 500 });
    }

    let lastError = "";
    for (const attempt of attempts) {
      try {
        console.log(`[Quiz] Trying ${attempt.name}...`);
        const content = await attempt.fn();
        const questions = parseQuestions(content);
        if (!Array.isArray(questions) || questions.length === 0) throw new Error("Empty array");

        console.log(`[Quiz] ✅ Success: ${attempt.name}`);

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
        console.log(`[Quiz] ❌ ${attempt.name}: ${err.message}`);
        continue;
      }
    }

    console.error("[Quiz] All models exhausted. Last error:", lastError);
    return NextResponse.json(
      { error: "Our AI is taking a short break. Please try again in a few minutes." },
      { status: 429 }
    );

  } catch (error: any) {
    console.error("Quiz generation error:", error.message);
    return NextResponse.json({ error: `Failed to generate quiz: ${error.message}` }, { status: 500 });
  }
}
