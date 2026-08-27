// 📁 SAVE AS: src/app/api/generate-quiz/route.ts
// ✅ PARALLEL model calls — all models tried at once, fastest wins
// Solves Vercel 10s timeout by not waiting for each model sequentially

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

async function callModel(
  name: string,
  url: string,
  headers: Record<string, string>,
  body: object,
): Promise<{ name: string; questions: any[] }> {
  const controller = new AbortController();
  // 9s timeout — just under Vercel's 10s limit
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const questions = parseQuestions(content);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Empty questions array");
    }

    return { name, questions };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(`${name} failed: ${err.message}`);
  }
}

// Race all models — first successful one wins
async function raceModels(
  models: { name: string; url: string; headers: Record<string, string>; body: object }[]
): Promise<{ name: string; questions: any[] }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let failCount = 0;
    const errors: string[] = [];

    models.forEach((m) => {
      callModel(m.name, m.url, m.headers, m.body)
        .then((result) => {
          if (!settled) {
            settled = true;
            console.log(`✅ Won race: ${result.name}`);
            resolve(result);
          }
        })
        .catch((err) => {
          failCount++;
          errors.push(err.message);
          console.log(`❌ ${err.message}`);
          if (failCount === models.length && !settled) {
            reject(new Error(`All models failed: ${errors.join(" | ")}`));
          }
        });
    });
  });
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
    const orKey    = process.env.OPENROUTER_API_KEY ?? "";

    // Build list of ALL models to race in parallel
    const models: { name: string; url: string; headers: Record<string, string>; body: object }[] = [];

    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    const orUrl   = "https://openrouter.ai/api/v1/chat/completions";

    // Groq models (all 3 keys × 3 models — use whichever keys you have)
    for (const [idx, key] of [[1, groqKey1], [2, groqKey2], [3, groqKey3]] as [number, string][]) {
      if (!key) continue;
      for (const model of [
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "qwen/qwen3-32b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
      ]) {
        models.push({
          name: `Groq-K${idx} ${model.split("/").pop()}`,
          url: groqUrl,
          headers: { Authorization: `Bearer ${key}` },
          body: { model, messages, temperature: 0.7, max_tokens: maxTokens },
        });
      }
    }

    // OpenRouter free models (no credits needed)
    if (orKey) {
      for (const model of [
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
      ]) {
        models.push({
          name: `OR ${model.split("/").pop()}`,
          url: orUrl,
          headers: {
            Authorization: `Bearer ${orKey}`,
            "HTTP-Referer": "https://quizai.dev",
            "X-Title": "QuizAI",
          },
          body: { model, messages, temperature: 0.7, max_tokens: maxTokens },
        });
      }
    }

    if (models.length === 0) {
      return NextResponse.json({ error: "No API keys configured." }, { status: 500 });
    }

    // 🏁 RACE — all models fire at once, first success wins
    const { name: modelUsed, questions } = await raceModels(models);

    // Save to DB for Pro users
    if (profile.is_pro) {
      const { error: insertError } = await supabaseSSR.from("quizzes").insert({
        user_id: user.id,
        topic, difficulty,
        question_type: questionType,
        num_questions: numQuestions,
        questions,
      });
      if (insertError) console.error("DB save failed:", insertError.message);
    }

    return NextResponse.json({ questions, modelUsed });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Quiz generation error:", err.message);

    if (err.message.includes("All models failed")) {
      return NextResponse.json(
        { error: "Our AI is taking a short break. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: `Failed to generate quiz: ${err.message}` },
      { status: 500 }
    );
  }
}
