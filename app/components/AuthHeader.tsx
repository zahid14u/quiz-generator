"use client";

import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userEmail = session?.user?.email ?? "";
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          QuizAI
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/generate"
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Generate
          </Link>
          <Link
            href="/pricing"
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Pricing
          </Link>
          <Link
            href="/"
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Home
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {!session ? (
            <>
              <Link
                href="/login"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-950/90 px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                {userInitial}
              </div>
              <div className="min-w-[120px] text-sm text-slate-300">
                <p className="truncate text-sm font-medium">{userEmail}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
