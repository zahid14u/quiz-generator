"use client";

import Navbar from "@/components/Navbar";
import SampleOutput from "@/components/SampleOutput";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

const features = [
  {
    title: "Any Topic",
    description:
      "Create quizzes for IT, science, business, language, or any subject your students need.",
  },
  {
    title: "Instant Results",
    description:
      "Generate well-structured questions in seconds, so you can focus on teaching.",
  },
  {
    title: "Export to PDF and Kahoot!",
    description:
      "Download and share clean quiz sheets quickly for classroom or online use.",
  },
];

export default function HomePage() {
  const [session, setSession] = useState<any>(null);

  // Interactive Demo States
  const [demoTopic, setDemoTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoQuiz, setDemoQuiz] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(function cleanUrlHash() {
    if (window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(function initializeAuth() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Demo Submission Handler
  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoTopic.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setDemoQuiz(null);

    try {
      const response = await fetch("/api/demo-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: demoTopic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to generate demo quiz",
        );
      }

      setDemoQuiz(data.questions);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        {/* Hero Section */}
        <section className="py-16 text-center md:py-24 max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Generate quizzes in seconds with AI
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-600 sm:text-base md:text-lg">
            QuizAI helps teachers create engaging, high-quality quizzes quickly,
            with less manual work and more time for students.
          </p>

          {/* Dynamic Interactive Demo Bar */}
          <div className="mt-10 max-w-2xl mx-auto text-left">
            <form
              onSubmit={handleDemoSubmit}
              className="bg-white rounded-2xl sm:rounded-full p-2 flex flex-col sm:flex-row shadow-xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500 transition-all gap-2"
            >
              <input
                type="text"
                value={demoTopic}
                onChange={(e) => setDemoTopic(e.target.value)}
                placeholder="Enter a classroom topic (e.g., Solar System)..."
                className="flex-grow px-4 py-3 sm:px-6 outline-none text-slate-700 bg-transparent text-base sm:text-lg placeholder:text-slate-400"
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl sm:rounded-full font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 flex-shrink-0"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate Free Quiz
                  </>
                )}
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-slate-400">
              No credit card required. Try 1 free generation instantly.
            </p>
          </div>

          {/* Error Message UI */}
          {errorMsg && (
            <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{errorMsg}</span>
              {errorMsg.includes("LIMIT") && (
                <Link
                  href="/signup"
                  className="ml-auto bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-700 transition-colors flex-shrink-0"
                >
                  Sign Up Free
                </Link>
              )}
            </div>
          )}

          {/* Live Generated Quiz Box */}
          {demoQuiz && (
            <div className="mt-8 max-w-2xl mx-auto text-left bg-slate-900 text-white rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden animate-fadeIn">
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                <span className="font-semibold text-sm text-purple-400 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  Live Demo Output
                </span>
                <Link
                  href="/signup"
                  className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Account to Export
                </Link>
              </div>
              <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
                {demoQuiz.map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/40 p-4 rounded-xl border border-slate-800"
                  >
                    <p className="font-medium text-white mb-3">
                      {idx + 1}. {q.question}
                    </p>
                    {q.options && q.options.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isCorrect = opt === q.answer;
                          return (
                            <div
                              key={oIdx}
                              className={`px-3 py-2.5 rounded-lg text-sm transition border ${
                                isCorrect
                                  ? "bg-purple-600/20 border-purple-500/50 text-purple-200 font-medium"
                                  : "bg-slate-800 border-slate-700 text-slate-300"
                              }`}
                            >
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-purple-600/10 border border-purple-500/20 p-3 rounded-lg text-sm text-purple-300 font-mono">
                        Answer Key: {q.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Social Proof Static Block */}
        <SampleOutput />

        {/* Feature Highlights Grid */}
        <section className="pb-16 md:pb-24 max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            Why Teachers Choose QuizAI
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
