"use client";

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
    title: "Export to PDF",
    description:
      "Download and share clean quiz sheets quickly for classroom or online use.",
  },
];

export default function HomePage() {
  const [session, setSession] = useState<any>(null);

  useEffect(function cleanUrlHash() {
    // Clean URL hash after OAuth redirect
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const userEmail = session?.user?.email ?? "";
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4 sm:py-5">
          <span className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
            QuizAI
          </span>

          <div className="hidden items-center gap-2 text-xs sm:flex sm:text-sm">
            <Link
              href="/"
              className="rounded-md px-2 py-2 text-slate-700 transition hover:bg-slate-100 sm:px-3"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="rounded-md px-2 py-2 text-slate-700 transition hover:bg-slate-100 sm:px-3"
            >
              Pricing
            </Link>
            <Link
              href="/generate"
              className="rounded-md px-2 py-2 text-slate-700 transition hover:bg-slate-100 sm:px-3"
            >
              Generate
            </Link>
            <Link
              href="/contact"
              className="rounded-md px-2 py-2 text-slate-700 transition hover:bg-slate-100 sm:px-3"
            >
              Support
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!session ? (
              <>
                <Link
                  href="/login"
                  className="rounded-md bg-white/10 px-2 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white sm:px-3 sm:text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-purple-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 sm:px-3 sm:text-sm"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-xs sm:text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm text-white">
                    {userInitial}
                  </span>
                  <span className="hidden min-w-[120px] truncate text-slate-700 sm:inline">
                    {userEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md bg-slate-900 px-2 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 sm:px-3 sm:text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>

        <section className="py-16 text-center md:py-28">
          <p className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Generate quizzes in seconds with AI
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-600 sm:text-base md:text-lg">
            QuizAI helps teachers create engaging, high-quality quizzes quickly,
            with less manual work and more time for students.
          </p>
          <Link
            href="/generate"
            className="mt-10 inline-flex rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-700 sm:px-8 sm:py-4 sm:text-lg"
          >
            Create Your First Quiz
          </Link>
        </section>

        <section className="pb-16 md:pb-24">
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
      </div>
    </main>
  );
}
