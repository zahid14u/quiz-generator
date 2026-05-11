// 📁 SAVE AS: src/app/dashboard/quiz/[id]/page.tsx

"use client";

import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const optionLabels = ["A", "B", "C", "D"];

function normalizeQuestionType(rawType: any, fallbackType: string): string {
  if (
    rawType === "mcq" ||
    rawType === "truefalse" ||
    rawType === "fillinblanks" ||
    rawType === "shortanswer"
  ) {
    return rawType;
  }
  return fallbackType;
}

function getTypeLabel(type: string): string {
  if (type === "truefalse") return "True/False";
  if (type === "fillinblanks") return "Fill in the blank";
  if (type === "shortanswer") return "Short answer";
  return "MCQ";
}

export default function ViewQuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
      const id = params?.id as string;
      if (!id) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Quiz not found", error);
        router.push("/dashboard");
        return;
      }

      setQuiz(data);
      setIsLoading(false);
    };

    fetchQuiz();
  }, [params, router]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone.",
      )
    )
      return;

    setIsDeleting(true);
    const id = params?.id as string;

    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete quiz:", error);
      alert("Failed to delete quiz. Please try again.");
      setIsDeleting(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleDownloadPdf = () => {
    if (!quiz || !quiz.questions) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = 180;
    const lineHeight = 8;
    const left = 15;
    let y = 20;

    const writeLines = (lines: string[], fontSize = 12) => {
      doc.setFontSize(fontSize);
      lines.forEach((line) => {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, left, y);
        y += lineHeight;
      });
    };

    doc.setFontSize(16);
    doc.text(`QuizAI — ${quiz.topic || "Untitled"} Quiz`, left, y);
    y += 10;

    writeLines(
      [
        `Difficulty: ${quiz.difficulty}`,
        `Number of questions: ${quiz.questions.length}`,
      ],
      12,
    );
    y += 4;

    quiz.questions.forEach((item: any, index: number) => {
      const resolvedType = normalizeQuestionType(item.type, "mcq");
      const questionLines = doc.splitTextToSize(
        `${index + 1}. ${item.question}`,
        maxWidth,
      ) as string[];
      writeLines(questionLines, 12);

      if (resolvedType === "shortanswer") {
        writeLines(
          [
            "  ________________________________",
            "  ________________________________",
          ],
          11,
        );
      } else if (resolvedType === "truefalse") {
        writeLines(["  True", "  False"], 11);
      } else {
        if (item.options) {
          item.options.forEach((option: string, optionIndex: number) => {
            const optionLines = doc.splitTextToSize(
              `${optionLabels[optionIndex] || "*"}. ${option}`,
              maxWidth - 8,
            ) as string[];
            writeLines(
              optionLines.map((line) => `  ${line}`),
              11,
            );
          });
        }
      }
      y += 4;
    });

    doc.addPage();
    y = 20;
    doc.setFontSize(16);
    doc.text("Answer Key", left, y);
    y += 10;

    quiz.questions.forEach((item: any, index: number) => {
      const resolvedType = normalizeQuestionType(item.type, "mcq");
      const answerLines = doc.splitTextToSize(
        `${index + 1}. [${getTypeLabel(resolvedType)}] ${item.answer}`,
        maxWidth,
      ) as string[];
      writeLines(answerLines, 12);
    });

    doc.save(
      `quizai-${(quiz.topic || "quiz").toLowerCase().replace(/\s+/g, "-")}.pdf`,
    );
    setDownloadMessage("PDF downloaded successfully.");
    setTimeout(() => {
      setDownloadMessage("");
    }, 2500);
  };

  const handleCopyToClipboard = async () => {
    if (!quiz || !quiz.questions) return;

    const quizText = [
      `QuizAI — ${quiz.topic || "Untitled"} Quiz`,
      `Difficulty: ${quiz.difficulty} | Questions: ${quiz.questions.length}`,
      "",
      ...quiz.questions.flatMap((item: any, index: number) => {
        const resolvedType = normalizeQuestionType(item.type, "mcq");
        if (resolvedType === "shortanswer") {
          return [
            `${index + 1}. [Short answer] ${item.question}`,
            "   Student answer: ________________________________",
            `   Model answer: ${item.answer}`,
            "",
          ];
        }

        if (resolvedType === "truefalse") {
          return [
            `${index + 1}. [True/False] ${item.question}`,
            "   True",
            "   False",
            `   Answer: ${item.answer}`,
            "",
          ];
        }

        return [
          `${index + 1}. [${getTypeLabel(resolvedType)}] ${item.question}`,
          `   A. ${item.options?.[0] ?? ""}`,
          `   B. ${item.options?.[1] ?? ""}`,
          `   C. ${item.options?.[2] ?? ""}`,
          `   D. ${item.options?.[3] ?? ""}`,
          `   Answer: ${item.answer}`,
          "",
        ];
      }),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(quizText);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      alert("Could not copy text. Please try again.");
    }
  };

  const handleDownloadKahoot = () => {
    if (!quiz || !quiz.questions) return;

    const supportedQuestions = quiz.questions.filter(
      (q: any) => q.type === "mcq" || q.type === "truefalse" || !q.type,
    );

    if (supportedQuestions.length === 0) {
      alert("Kahoot export only supports MCQ and True/False questions.");
      return;
    }

    const kahootData = supportedQuestions.map((q: any) => {
      const correctIndex =
        q.options?.findIndex((opt: string) => opt === q.answer) + 1 || 1;

      return {
        Question: q.question.substring(0, 120),
        "Answer 1": q.options?.[0]?.substring(0, 75) || "",
        "Answer 2": q.options?.[1]?.substring(0, 75) || "",
        "Answer 3": q.options?.[2]?.substring(0, 75) || "",
        "Answer 4": q.options?.[3]?.substring(0, 75) || "",
        "Time limit (sec)": 20,
        "Correct answer(s)": correctIndex > 0 ? correctIndex : 1,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(kahootData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(
      workbook,
      `Kahoot-${(quiz.topic || "quiz").replace(/\s+/g, "-")}.xlsx`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-purple-600 hover:underline mb-6 inline-block font-semibold"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 capitalize">
            {quiz.topic}
          </h1>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-8 font-medium">
            <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full capitalize">
              {quiz.difficulty}
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-full">
              {quiz.num_questions} Questions
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-full capitalize">
              {quiz.question_type}
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-full">
              {new Date(quiz.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* ── NEW ACTION BUTTONS ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center mb-8 pb-8 border-b border-slate-100">
            <button
              onClick={handleDownloadPdf}
              className="w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto"
            >
              Download PDF
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              {isCopied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleDownloadKahoot}
              className="w-full rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Kahoot
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full rounded-lg bg-red-50 border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:w-auto sm:ml-auto"
            >
              {isDeleting ? "Deleting..." : "🗑️ Delete Quiz"}
            </button>
          </div>

          {downloadMessage && (
            <p className="mb-8 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {downloadMessage}
            </p>
          )}

          <div className="space-y-6">
            {quiz.questions.map((q: any, index: number) => {
              const resolvedType = normalizeQuestionType(q.type, "mcq");
              const questionParts =
                resolvedType === "fillinblanks"
                  ? q.question.split("_______")
                  : [q.question];

              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="mb-4">
                    <span className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded mb-3 uppercase tracking-wider">
                      {getTypeLabel(resolvedType)}
                    </span>
                  </div>

                  <p className="font-semibold text-lg mb-5 text-slate-800">
                    {index + 1}.{" "}
                    {resolvedType === "fillinblanks" ? (
                      <>
                        {questionParts[0]}
                        <span className="font-bold text-purple-700">
                          _______
                        </span>
                        {questionParts.slice(1).join("_______")}
                      </>
                    ) : (
                      q.question
                    )}
                  </p>

                  {q.options &&
                    q.options.length > 0 &&
                    resolvedType !== "shortanswer" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        {q.options.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium"
                          >
                            <span className="font-bold mr-2 opacity-50">
                              {optionLabels[i]}.
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-sm font-bold">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Answer: {q.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
