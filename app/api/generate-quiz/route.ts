import { NextResponse } from "next/server";

type GenerateQuizRequest = {
  topic?: string;
  numQuestions?: number;
  difficulty?: string;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function stripCodeFences(text: string): string {
  return text.replace(/```json\s*|```/gi, "").trim();
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY in environment variables." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateQuizRequest;
    const topic = body.topic?.trim();
    const numQuestions = body.numQuestions;
    const difficulty = body.difficulty?.trim();

    if (!topic || !numQuestions || !difficulty) {
      return NextResponse.json(
        {
          error:
            "Invalid request body. Required fields: topic, numQuestions, difficulty.",
        },
        { status: 400 },
      );
    }

    const userPrompt = `Generate ${numQuestions} multiple choice questions about '${topic}' at ${difficulty} difficulty. Return ONLY a JSON array in this exact format: [{question: string, options: [string,string,string,string], answer: string}]`;

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a quiz generator for teachers. Always respond with valid JSON only, no markdown, no extra text, no code fences.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return NextResponse.json(
        {
          error: `Groq API request failed (${groqResponse.status}): ${errorText}`,
        },
        { status: groqResponse.status },
      );
    }

    const data = await groqResponse.json();
    const generatedText = data?.choices?.[0]?.message?.content;

    if (!generatedText || typeof generatedText !== "string") {
      return NextResponse.json(
        {
          error:
            "Groq response did not contain expected content at choices[0].message.content.",
        },
        { status: 502 },
      );
    }

    const cleanedText = stripCodeFences(generatedText);

    let parsedQuiz: unknown;
    try {
      parsedQuiz = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json(
        {
          error:
            "Failed to parse Groq response as JSON. Ensure model returns only a JSON array.",
          raw: generatedText,
        },
        { status: 502 },
      );
    }

    if (!Array.isArray(parsedQuiz)) {
      return NextResponse.json(
        {
          error: "Parsed Groq response is not a JSON array.",
          raw: parsedQuiz,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsedQuiz);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json(
      { error: `Failed to generate quiz: ${message}` },
      { status: 500 },
    );
  }
}
