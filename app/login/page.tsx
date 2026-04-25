"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/generate");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="w-full bg-slate-900 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            QuizAI
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/generate"
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4"
            >
              Generate
            </Link>
            <Link
              href="/pricing"
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4"
            >
              Pricing
            </Link>
            <Link
              href="/"
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-center mb-2">Sign In</h1>
          <p className="text-center text-sm text-slate-600 mb-6">
            Login to access your Pro account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              Don't have Pro yet?{" "}
              <Link
                href="/pricing"
                className="font-medium text-purple-600 hover:underline"
              >
                Upgrade on the pricing page
              </Link>
            </p>
            <p className="mt-2">
              <Link
                href="/forgot-password"
                className="text-purple-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
