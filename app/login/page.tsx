"use client";

import { getAuthRedirectUrl, supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/generate");
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    const callbackUrl = getAuthRedirectUrl();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    router.push("/generate");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900 text-center">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to continue generating quizzes with AI.
          </p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-70"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.5 12.27c0-.78-.07-1.53-.2-2.25H12.24v4.25h5.92c-.25 1.35-1 2.5-2.1 3.27v2.7h3.4c1.98-1.82 3.14-4.5 3.14-7.97z"
                  fill="#4285F4"
                />
                <path
                  d="M12.24 23c2.84 0 5.22-.94 6.96-2.56l-3.4-2.7c-.94.63-2.15 1-3.56 1-2.74 0-5.06-1.85-5.89-4.33H2.72v2.72C4.45 20.94 8.01 23 12.24 23z"
                  fill="#34A853"
                />
                <path
                  d="M6.35 13.4a7.02 7.02 0 0 1 0-4.77V5.91H2.72a11.99 11.99 0 0 0 0 12.18l3.63-2.69z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.24 4.5c1.54 0 2.93.53 4.03 1.57l3.03-3.03C17.45 1.35 15.08 0 12.24 0 8.01 0 4.45 2.06 2.72 5.91l3.63 2.72C7.18 6.35 9.5 4.5 12.24 4.5z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
              <p className="relative mx-auto w-fit bg-white px-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                or
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
            <p>
              No account?{" "}
              <Link
                href="/signup"
                className="font-medium text-purple-600 hover:underline"
              >
                Sign up
              </Link>
            </p>
            <p>
              <Link href="/pricing" className="text-purple-600 hover:underline">
                Want Pro? See pricing
              </Link>
            </p>
            <p>
              <Link
                href="/forgot-password"
                className="text-purple-600 hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
