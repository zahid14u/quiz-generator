"use client";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useDeviceTracking } from "@/lib/useDeviceTracking";
import jsPDF from "jspdf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import * as XLSX from "xlsx";
type QuizQuestion = {
  type?: "mcq" | "truefalse" | "fillinblanks" | "shortanswer";
  question: string;
  options: string[];
  answer: string;
};

type QuizHistoryItem = {
  id: string;
  topic: string;
  difficulty: string;
  numQuestions: number;
  questions: QuizQuestion[];
  createdAt: string;
};

const mockQuiz: QuizQuestion[] = [
  {
    question: "What does DNS stand for?",
    options: [
      "Domain Name System",
      "Data Network Service",
      "Digital Node Setup",
      "Distributed Name Server",
    ],
    answer: "Domain Name System",
  },
  {
    question: "Which layer of the OSI model handles IP addressing?",
    options: ["Data Link", "Transport", "Network", "Application"],
    answer: "Network",
  },
  {
    question: "What port does HTTPS use by default?",
    options: ["80", "443", "8080", "22"],
    answer: "443",
  },
];

const optionLabels = ["A", "B", "C", "D"];
const QUIZ_HISTORY_KEY = "quizai-recent-quizzes";
const MAX_QUESTION_COUNT = 30;
const FREE_QUIZ_DAILY_LIMIT = 3;
const FREE_QUESTION_LIMIT = 10;
const DAILY_COUNT_KEY = "quizai_daily_count";
const LAST_DATE_KEY = "quizai_last_date";
const loadingMessages = [
  "Reading your topic...",
  "Thinking of good questions...",
  "Writing answer options...",
  "Checking difficulty level...",
  "Almost ready...",
];

function normalizeQuestionType(
  rawType: unknown,
  fallbackType: QuizQuestion["type"],
): NonNullable<QuizQuestion["type"]> {
  if (
    rawType === "mcq" ||
    rawType === "truefalse" ||
    rawType === "fillinblanks" ||
    rawType === "shortanswer"
  ) {
    return rawType;
  }

  return fallbackType ?? "mcq";
}

function getTypeLabel(type: NonNullable<QuizQuestion["type"]>): string {
  if (type === "truefalse") return "True/False";
  if (type === "fillinblanks") return "Fill in the blank";
  if (type === "shortanswer") return "Short answer";
  return "MCQ";
}

const checkProStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_pro, pro_expires_at, plan")
      .eq("id", userId)
      .single();

    if (error) return false;

    if (!data.is_pro) return false;

    // Check if Pro has expired
    if (data.pro_expires_at) {
      const expiryDate = new Date(data.pro_expires_at);
      const now = new Date();
      if (now > expiryDate) return false;
    }

    return true;
  } catch {
    return false;
  }
};

export default function GeneratePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [questionType, setQuestionType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizQuestion[]>([]);
  const [openAnswers, setOpenAnswers] = useState<Record<number, boolean>>({});
  const [shortAnswerDrafts, setShortAnswerDrafts] = useState<
    Record<number, string>
  >({});
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [dailyQuizCount, setDailyQuizCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPostGenerateNudge, setShowPostGenerateNudge] = useState(true);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoQuizUsed, setDemoQuizUsed] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useDeviceTracking(userId);

  useEffect(() => {
    // Clean URL hash after OAuth redirect
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    let mounted = true;

    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!mounted) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setAuthChecked(true);
      const proStatus = await checkProStatus(session.user.id);
      if (mounted) setIsPro(proStatus);
      if (mounted) setUserId(session.user.id);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setAuthChecked(true);
        const proStatus = await checkProStatus(session.user.id);
        if (mounted) setIsPro(proStatus);
      } else if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isFreeUser = !isPro && !isDemoActive;
  const hasReachedDailyLimit =
    isFreeUser && dailyQuizCount >= FREE_QUIZ_DAILY_LIMIT;

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const saveQuizHistory = (history: QuizHistoryItem[]) => {
    try {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
    } catch {
      setErrorMessage("Could not save quiz history.");
    }
  };

  useEffect(() => {
    if (!isGenerating) {
      setLoadingMessageIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(intervalId);
  }, [isGenerating]);

  useEffect(() => {
    const localhost = window.location.hostname === "localhost";
    setIsLocalhost(localhost);
    if (localStorage.getItem("quizai_demo_used") === "true") {
      setDemoQuizUsed(true);
    }
  }, []);

  useEffect(() => {
    try {
      const today = getTodayDate();
      const storedDate = localStorage.getItem(LAST_DATE_KEY);
      const storedCount = Number(localStorage.getItem(DAILY_COUNT_KEY) || "0");

      if (storedDate !== today) {
        localStorage.setItem(LAST_DATE_KEY, today);
        localStorage.setItem(DAILY_COUNT_KEY, "0");
        setDailyQuizCount(0);
      } else {
        setDailyQuizCount(Number.isFinite(storedCount) ? storedCount : 0);
      }
    } catch {
      setDailyQuizCount(0);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as QuizHistoryItem[];
      if (Array.isArray(parsed)) {
        setQuizHistory(parsed);
      }
    } catch {
      setErrorMessage("Could not load quiz history.");
    }
  }, []);

  async function getToken(): Promise<string> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return "";

      const res = await fetch("/api/auth/token", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      return data.token || "";
    } catch {
      return "";
    }
  }

  const handleGenerateQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFreeUser && hasReachedDailyLimit) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setOpenAnswers({});
    setErrorMessage("");

    try {
      const safeQuestionCount = Math.min(
        Number(questionCount),
        MAX_QUESTION_COUNT,
      );

      if (String(safeQuestionCount) !== questionCount) {
        setQuestionCount(String(safeQuestionCount));
      }

      const token = await getToken();

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          numQuestions: safeQuestionCount,
          difficulty,
          questionType,
        }),
      });

      const data = await response.json();
      if (data.upgradeRequired) {
        setShowUpgradeModal(true);
        return;
      }
      if (data.error) {
        throw new Error(data.error);
      }

      const questionsArray = Array.isArray(data) ? data : data.questions;

      if (!questionsArray || !Array.isArray(questionsArray)) {
        throw new Error("Invalid quiz data format returned by server.");
      }

      const fallbackType: NonNullable<QuizQuestion["type"]> =
        questionType === "mixed"
          ? "mcq"
          : normalizeQuestionType(questionType, "mcq");

      const validatedQuiz = questionsArray
        .filter(
          (item: unknown): item is Record<string, unknown> =>
            typeof item === "object" && item !== null,
        )
        .map((item) => {
          const type = normalizeQuestionType(item.type, fallbackType);
          const options = Array.isArray(item.options)
            ? item.options.filter(
                (option): option is string => typeof option === "string",
              )
            : [];

          return {
            type,
            question: typeof item.question === "string" ? item.question : "",
            options,
            answer: typeof item.answer === "string" ? item.answer : "",
          } satisfies QuizQuestion;
        })
        .filter((item) => {
          if (!item.question || !item.answer) return false;
          if (item.type === "shortanswer") return true;
          if (item.type === "truefalse") return item.options.length >= 2;
          return item.options.length >= 4;
        });

      const quizToShow = validatedQuiz.length > 0 ? validatedQuiz : mockQuiz;
      setQuizResults(quizToShow);
      if (isDemoActive) {
        setIsPro(false);
        setIsDemoActive(false);
        setErrorMessage(
          "🎉 Demo complete! You just experienced Pro features. Upgrade for $5/mo to keep access.",
        );
      }
      setShortAnswerDrafts({});
      if (isFreeUser) {
        setShowPostGenerateNudge(true);
      }
      if (validatedQuiz.length === 0) {
        setErrorMessage(
          "AI returned an unexpected format, so fallback mock questions are shown.",
        );
      }

      const newHistoryItem: QuizHistoryItem = {
        id: crypto.randomUUID(),
        topic: topic || "Untitled",
        difficulty,
        numQuestions: safeQuestionCount,
        questions: quizToShow,
        createdAt: new Date().toISOString(),
      };

      setQuizHistory((prev) => {
        const updatedHistory = [newHistoryItem, ...prev].slice(0, 5);
        saveQuizHistory(updatedHistory);
        return updatedHistory;
      });

      if (isFreeUser) {
        const updatedCount = dailyQuizCount + 1;
        setDailyQuizCount(updatedCount);
        try {
          localStorage.setItem(DAILY_COUNT_KEY, String(updatedCount));
          localStorage.setItem(LAST_DATE_KEY, getTodayDate());
        } catch {
          // If storage is unavailable, keep in-memory count.
        }
      }
    } catch (error) {
      setQuizResults(mockQuiz);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate quiz. Showing mock questions instead.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAnswer = (index: number) => {
    setOpenAnswers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDownloadPdf = () => {
    if (quizResults.length === 0) return;

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
    doc.text(`QuizAI — ${topic || "Untitled"} Quiz`, left, y);
    y += 10;

    writeLines(
      [
        `Difficulty: ${difficulty}`,
        `Number of questions: ${quizResults.length}`,
      ],
      12,
    );
    y += 4;

    quizResults.forEach((item, index) => {
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
        item.options.forEach((option, optionIndex) => {
          const optionLines = doc.splitTextToSize(
            `${optionLabels[optionIndex]}. ${option}`,
            maxWidth - 8,
          ) as string[];
          writeLines(
            optionLines.map((line) => `  ${line}`),
            11,
          );
        });
      }

      // Blank line between each question for readability.
      y += 4;
    });

    doc.addPage();
    y = 20;
    doc.setFontSize(16);
    doc.text("Answer Key", left, y);
    y += 10;

    quizResults.forEach((item, index) => {
      const resolvedType = normalizeQuestionType(item.type, "mcq");
      const answerLines = doc.splitTextToSize(
        `${index + 1}. [${getTypeLabel(resolvedType)}] ${item.answer}`,
        maxWidth,
      ) as string[];
      writeLines(answerLines, 12);
    });

    doc.save(
      `quizai-${(topic || "quiz").toLowerCase().replace(/\s+/g, "-")}.pdf`,
    );
    setDownloadMessage("PDF downloaded successfully.");
    setTimeout(() => {
      setDownloadMessage("");
    }, 2500);
  };

  const handleCopyToClipboard = async () => {
    if (quizResults.length === 0) return;

    const quizText = [
      `QuizAI — ${topic || "Untitled"} Quiz`,
      `Difficulty: ${difficulty} | Questions: ${quizResults.length}`,
      "",
      ...quizResults.flatMap((item, index) => {
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
          `   A. ${item.options[0] ?? ""}`,
          `   B. ${item.options[1] ?? ""}`,
          `   C. ${item.options[2] ?? ""}`,
          `   D. ${item.options[3] ?? ""}`,
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
      setErrorMessage("Could not copy text. Please try again.");
    }
  };
  const handleDownloadKahoot = () => {
    if (quizResults.length === 0) return;

    // Filter: Kahoot strictly supports Multiple Choice and True/False.
    const supportedQuestions = quizResults.filter(
      (q) => q.type === "mcq" || q.type === "truefalse" || !q.type,
    );

    if (supportedQuestions.length === 0) {
      alert("Kahoot export only supports MCQ and True/False questions.");
      return;
    }

    const kahootData = supportedQuestions.map((q) => {
      // Find 1-based index for correct answer (1-4)
      const correctIndex = q.options.findIndex((opt) => opt === q.answer) + 1;

      return {
        Question: q.question.substring(0, 120), // 120 char limit[cite: 1]
        "Answer 1": q.options[0]?.substring(0, 75) || "", // 75 char limit[cite: 1]
        "Answer 2": q.options[1]?.substring(0, 75) || "",
        "Answer 3": q.options[2]?.substring(0, 75) || "",
        "Answer 4": q.options[3]?.substring(0, 75) || "",
        "Time limit (sec)": 20, // Default recommended limit[cite: 1]
        "Correct answer(s)": correctIndex > 0 ? correctIndex : 1,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(kahootData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(
      workbook,
      `Kahoot-${(topic || "quiz").replace(/\s+/g, "-")}.xlsx`,
    );
  };
  const handleLoadHistoryQuiz = (item: QuizHistoryItem) => {
    setTopic(item.topic);
    setDifficulty(item.difficulty);
    setQuestionCount(String(Math.min(item.numQuestions, MAX_QUESTION_COUNT)));
    setQuizResults(item.questions);
    setOpenAnswers({});
    setErrorMessage("");
  };

  const handleDeleteHistoryQuiz = (id: string) => {
    setQuizHistory((prev) => {
      const updatedHistory = prev.filter((item) => item.id !== id);
      saveQuizHistory(updatedHistory);
      return updatedHistory;
    });
  };

  const handleClearQuizHistory = () => {
    try {
      localStorage.removeItem(QUIZ_HISTORY_KEY);
      setQuizHistory([]);
    } catch {
      setErrorMessage("Could not clear quiz history.");
    }
  };

  const handleQuestionCountChange = (value: string) => {
    if (isFreeUser && Number(value) > FREE_QUESTION_LIMIT) {
      setQuestionCount(String(FREE_QUESTION_LIMIT));
      setShowUpgradeModal(true);
      return;
    }

    setQuestionCount(value);
  };

  const handleQuestionTypeChange = (value: string) => {
    if (isFreeUser && value !== "mcq") {
      setQuestionType("mcq");
      setShowUpgradeModal(true);
      return;
    }

    setQuestionType(value);
  };

  const getTypeBadgeClass = (type: NonNullable<QuizQuestion["type"]>) => {
    if (type === "truefalse") return "bg-blue-100 text-blue-700";
    if (type === "fillinblanks") return "bg-purple-100 text-purple-700";
    if (type === "shortanswer") return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-700";
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        {isFreeUser && (
          <div
            className={
              hasReachedDailyLimit
                ? "bg-orange-500 px-4 py-2 text-xs text-white sm:text-sm"
                : "bg-violet-600 px-4 py-2 text-xs text-white sm:text-sm"
            }
          >
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 sm:px-2">
              <span>
                {hasReachedDailyLimit
                  ? "Daily limit reached · Resets tomorrow · Upgrade to Pro →"
                  : `Free plan · ${dailyQuizCount}/${FREE_QUIZ_DAILY_LIMIT} quizzes used today · Upgrade to Pro for unlimited →`}
              </span>
              <Link
                href="/pricing"
                className="font-semibold underline underline-offset-2"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}
        {isPro && (
          <div className="bg-green-600 px-4 py-2 text-xs text-white sm:text-sm">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between sm:px-2">
              <span>
                {isDemoActive
                  ? "🎁 Pro Demo Active — enjoy 1 free Pro quiz!"
                  : "Pro plan active (test mode)"}
              </span>
              {isDemoActive && (
                <Link href="/pricing" className="font-bold underline">
                  Upgrade $5/mo →
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-16">
          <header>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Quiz Generator
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Create multiple-choice quizzes for your class in seconds with
              AI-ready inputs.
            </p>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
                <h2 className="text-xl font-semibold">Generate a New Quiz</h2>

                <form onSubmit={handleGenerateQuiz} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="topic"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Enter a topic
                    </label>
                    <input
                      id="topic"
                      name="topic"
                      type="text"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="Computer Networking Basics"
                      className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      required
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="question-count"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Number of questions
                      </label>
                      <select
                        id="question-count"
                        name="question-count"
                        value={questionCount}
                        onChange={(event) =>
                          handleQuestionCountChange(event.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">
                          {isFreeUser ? "15  🔒" : "15"}
                        </option>
                        <option value="20">
                          {isFreeUser ? "20 🔒" : "20"}
                        </option>
                        <option value="25">
                          {isFreeUser ? "25 🔒" : "25"}
                        </option>
                        <option value="30">
                          {isFreeUser ? "30 🔒" : "30"}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="difficulty"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Difficulty
                      </label>
                      <select
                        id="difficulty"
                        name="difficulty"
                        value={difficulty}
                        onChange={(event) => setDifficulty(event.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="question-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Question type
                    </label>
                    <select
                      id="question-type"
                      name="question-type"
                      value={questionType}
                      onChange={(event) =>
                        handleQuestionTypeChange(event.target.value)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="truefalse">
                        {isFreeUser ? "True/False 🔒" : "True/False"}
                      </option>
                      <option value="fillinblanks">
                        {isFreeUser
                          ? "Fill in the Blanks 🔒"
                          : "Fill in the Blanks"}
                      </option>
                      <option value="shortanswer">
                        {isFreeUser ? "Short Answer 🔒" : "Short Answer"}
                      </option>
                      <option value="mixed">
                        {isFreeUser
                          ? "Mixed question types 🔒"
                          : "Mixed question types"}
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isGenerating || (isFreeUser && hasReachedDailyLimit)
                    }
                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isGenerating
                      ? "Generating..."
                      : isFreeUser && hasReachedDailyLimit
                        ? "Daily Limit Reached"
                        : "Generate Quiz"}
                  </button>
                  {isFreeUser && hasReachedDailyLimit && (
                    <p className="text-center text-sm text-slate-600">
                      Upgrade to Pro for unlimited quizzes
                    </p>
                  )}
                </form>
              </section>

              <section className="mt-10 pb-8">
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Generated Questions
                </h2>

                {isFreeUser &&
                  quizResults.length > 0 &&
                  showPostGenerateNudge && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-violet-50 px-4 py-3 text-sm text-violet-900">
                      <Link
                        href="/pricing"
                        className="font-medium hover:underline"
                      >
                        Want True/False & Fill in the Blanks? Upgrade to Pro →
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShowPostGenerateNudge(false)}
                        className="rounded px-2 py-1 text-violet-700 transition hover:bg-violet-100"
                        aria-label="Dismiss upgrade nudge"
                      >
                        X
                      </button>
                    </div>
                  )}

                {isGenerating && (
                  <div className="mt-6 rounded-lg border border-slate-200 p-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
                      <p className="text-base italic text-slate-500">
                        {loadingMessages[loadingMessageIndex]}
                      </p>
                    </div>
                  </div>
                )}

                {!isGenerating && quizResults.length === 0 && (
                  <p className="mt-4 text-slate-600">
                    No questions yet. Fill the form above and click Generate
                    Quiz.
                  </p>
                )}

                {!isGenerating && errorMessage && (
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {errorMessage}
                  </p>
                )}

                {!isGenerating && downloadMessage && (
                  <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {downloadMessage}
                  </p>
                )}

                {!isGenerating && quizResults.length > 0 && (
                  <div className="mt-6 space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto"
                      >
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                      >
                        {isCopied ? "Copied!" : "Copy to Clipboard"}
                      </button>
                      <button
                        type="button"
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
                        Download Kahoot (Excel)
                      </button>
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                      <p className="text-[11px] sm:text-xs text-blue-800 leading-relaxed">
                        <strong>Note:</strong> Kahoot only supports Multiple
                        Choice and True/False. Short Answer and
                        Fill-in-the-blank questions will be skipped in the
                        export. Ensure questions are under 120 characters and
                        answers under 75.
                      </p>
                    </div>
                    {quizResults.map((item, index) => {
                      const resolvedType = normalizeQuestionType(
                        item.type,
                        "mcq",
                      );
                      const questionParts =
                        resolvedType === "fillinblanks"
                          ? item.question.split("_______")
                          : [item.question];

                      return (
                        <article
                          key={`${item.question}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeBadgeClass(
                                resolvedType,
                              )}`}
                            >
                              {getTypeLabel(resolvedType)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQuizResults((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              🗑️ Delete
                            </button>
                          </div>

                          {(resolvedType === "fillinblanks" ||
                            resolvedType === "shortanswer") && (
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {resolvedType === "fillinblanks"
                                ? "Fill in the blank"
                                : "Short answer"}
                            </p>
                          )}

                          <h3 className="text-lg font-semibold">
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
                              item.question
                            )}
                          </h3>

                          {resolvedType === "truefalse" && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                className="rounded-full border-2 border-blue-400 px-4 py-2 font-semibold text-blue-700 transition hover:bg-blue-50"
                              >
                                True
                              </button>
                              <button
                                type="button"
                                className="rounded-full border-2 border-blue-400 px-4 py-2 font-semibold text-blue-700 transition hover:bg-blue-50"
                              >
                                False
                              </button>
                            </div>
                          )}

                          {(resolvedType === "mcq" ||
                            resolvedType === "fillinblanks") && (
                            <ul className="mt-4 space-y-2">
                              {item.options
                                .slice(0, 4)
                                .map((option, optionIndex) => (
                                  <li
                                    key={`${item.question}-${option}`}
                                    className="rounded-md border border-slate-200 px-4 py-2 text-slate-700"
                                  >
                                    <span className="mr-2 font-medium">
                                      {optionLabels[optionIndex]}.
                                    </span>
                                    {option}
                                  </li>
                                ))}
                            </ul>
                          )}

                          {resolvedType === "shortanswer" && (
                            <textarea
                              value={shortAnswerDrafts[index] ?? ""}
                              onChange={(event) =>
                                setShortAnswerDrafts((prev) => ({
                                  ...prev,
                                  [index]: event.target.value,
                                }))
                              }
                              placeholder="Type expected student answer..."
                              className="mt-4 min-h-28 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => toggleAnswer(index)}
                            className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            {resolvedType === "shortanswer"
                              ? openAnswers[index]
                                ? "Hide Model Answer"
                                : "Show Model Answer"
                              : openAnswers[index]
                                ? "Hide Answer"
                                : "Show Answer"}
                          </button>

                          {openAnswers[index] && (
                            <p className="mt-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold">
                                {resolvedType === "shortanswer"
                                  ? "Model Answer:"
                                  : "Correct Answer:"}
                              </span>{" "}
                              {item.answer}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="h-fit w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Recent Quizzes</h3>
                {quizHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQuizHistory}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {quizHistory.length === 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  No quizzes yet — generate your first one!
                </p>
              )}

              {quizHistory.length > 0 && (
                <div className="mt-4 space-y-3">
                  {quizHistory.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <p className="font-semibold">{item.topic}</p>
                      <p className="text-xs text-slate-500">
                        {item.difficulty} | {item.numQuestions} questions
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadHistoryQuiz(item)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryQuiz(item.id)}
                          className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                          aria-label={`Delete ${item.topic}`}
                        >
                          X
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>

        {isLocalhost && (
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-6 sm:px-6">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("quizai_daily_count");
                localStorage.removeItem("quizai_last_date");
                localStorage.removeItem("quizai_demo_used");
                window.location.reload();
              }}
              className="text-xs text-slate-400 transition hover:text-slate-600"
            >
              [dev: reset limits]
            </button>
            <button
              type="button"
              onClick={() => {
                if (isPro) {
                  localStorage.removeItem("quizai_pro");
                } else {
                  localStorage.setItem("quizai_pro", "true");
                }
                window.location.reload();
              }}
              className="text-xs text-slate-400 transition hover:text-slate-600"
            >
              {isPro ? "[dev: deactivate pro]" : "[dev: activate pro]"}
            </button>
          </div>
        )}
      </main>

      {isFreeUser && showUpgradeModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-start",
            paddingTop: "15vh",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-3 top-3 rounded px-2 py-1 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close modal"
            >
              X
            </button>

            <h3 className="text-xl font-bold text-purple-700">
              Unlock Pro Features
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              <li>
                ✓ All question types (True/False, Fill in Blanks, Short Answer)
              </li>
              <li>✓ Up to 30 questions per quiz</li>
              <li>✓ Unlimited quizzes every day</li>
            </ul>

            <div className="mt-6 space-y-3">
              {!demoQuizUsed ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDemoActive(true);
                      setIsPro(true);
                      setDemoQuizUsed(true);
                      setShowUpgradeModal(false);
                      try {
                        localStorage.setItem("quizai_demo_used", "true");
                      } catch {}
                    }}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    🎁 Try Pro Free — 1 Demo Quiz
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    No payment needed · 1 free Pro quiz
                  </p>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-amber-800">
                    You have already used your free demo.
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    Upgrade to Pro to keep all features.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                  >
                    Upgrade to Pro — $5/mo →
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="mt-3 w-full text-center text-sm text-slate-500 transition hover:text-slate-700"
              >
                Maybe later
              </button>
            </div>

            <p className="mt-2 text-center text-xs text-slate-400">
              Already have Pro?{" "}
              <Link href="/login" className="text-purple-600 hover:underline">
                Login →
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
