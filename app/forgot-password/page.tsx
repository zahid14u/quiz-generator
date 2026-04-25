"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error: authError } =
        await supabase.auth.resetPasswordForEmail(email);

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
      setEmail("");
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
          <h1 className="text-2xl font-bold text-center mb-2">
            Reset Password
          </h1>
          <p className="text-center text-sm text-slate-600 mb-6">
            Enter your email to receive a password reset link
          </p>

          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-green-800 font-semibold text-center mb-2">
                ✓ Email Sent!
              </p>
              <p className="text-green-700 text-sm text-center mb-4">
                Password reset link sent to your email
              </p>
              <Link
                href="/login"
                className="block text-center text-purple-600 hover:underline text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleResetPassword} className="space-y-4">
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
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                <Link href="/login" className="text-purple-600 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
