// 📁 SAVE AS: src/app/dashboard/page.tsx

"use client";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const QUIZ_HISTORY_KEY = "quizai-recent-quizzes";

type QuizHistoryItem = {
  id: string;
  topic: string;
  difficulty: string;
  numQuestions: number;
  questions: any[];
  createdAt: string;
};

const checkProStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_pro, pro_expires_at, plan, full_name")
      .eq("id", userId)
      .single();
    if (error) return { isPro: false, plan: null, fullName: null };
    if (!data.is_pro) return { isPro: false, plan: null, fullName: data.full_name };
    if (data.pro_expires_at && new Date() > new Date(data.pro_expires_at))
      return { isPro: false, plan: null, fullName: data.full_name };
    return { isPro: true, plan: data.plan, fullName: data.full_name };
  } catch {
    return { isPro: false, plan: null, fullName: null };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      const { isPro: pro, plan: p, fullName: fn } = await checkProStatus(session.user.id);
      setIsPro(pro);
      setPlan(p);
      setFullName(fn);
      try {
        const stored = localStorage.getItem(QUIZ_HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as QuizHistoryItem[];
          if (Array.isArray(parsed)) setQuizHistory(parsed);
        }
        const today = new Date().toISOString().split("T")[0];
        const lastDate = localStorage.getItem("quizai_last_date");
        const count = Number(localStorage.getItem("quizai_daily_count") || "0");
        setDailyCount(lastDate === today ? count : 0);
      } catch {}
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const userInitial = (fullName || user?.email || "U")[0].toUpperCase();
  const displayName = fullName || user?.email?.split("@")[0] || "Teacher";
  const totalQuestions = quizHistory.reduce((s, q) => s + q.numQuestions, 0);

  const navLinks = [
    {
      href: "/dashboard", label: "Overview",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      href: "/generate", label: "Generate Quiz",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>,
    },
    {
      href: "/pricing", label: "Pricing",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      href: "/review", label: "Reviews",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    },
    {
      href: "/contact", label: "Support",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">Q</div>
        <span className="font-bold text-lg tracking-tight">QuizAI</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <p className="px-6 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Core Navigation
      </p>

      <nav className="flex-1 px-3 space-y-0.5">
        {navLinks.map((link) => {
          const active = link.href === "/dashboard";
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.icon}
              {link.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <p className="text-slate-500 text-xs">{isPro ? "Pro Member" : "Free Plan"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white text-slate-900">

      {/* Desktop sidebar — fixed */}
      <div className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 fixed left-0 top-0 bottom-0 z-20">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 flex-shrink-0 h-full">
            <SidebarContent mobile />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Top header — white, matches app style */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Overview</h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Track your quiz generation activity
              </p>
            </div>
          </div>
          <Link
            href="/generate"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Quiz
          </Link>
        </header>

        {/* Page body */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-5xl w-full mx-auto">

          {/* Welcome row */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome back, {displayName.split(" ")[0]} 👋
              </h2>
              <p className="text-slate-500 text-sm mt-1">Here's your quiz activity at a glance.</p>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${
              isPro
                ? "bg-purple-50 border-purple-300 text-purple-700"
                : "bg-slate-100 border-slate-300 text-slate-600"
            }`}>
              {isPro ? (
                <>
                  <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Pro Member
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Free Plan
                </>
              )}
            </span>
          </div>

          {/* Stat cards — same colour pattern as admin page */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Quizzes",        value: quizHistory.length,  color: "bg-blue-50 text-blue-700"   },
              { label: "Questions Generated",  value: totalQuestions,      color: "bg-purple-50 text-purple-700" },
              { label: "Used Today",           value: `${dailyCount} / ${isPro ? "∞" : "3"}`, color: "bg-green-50 text-green-700" },
              { label: "Current Plan",         value: isPro ? (plan === "yearly" ? "Yearly" : "Monthly") : "Free", color: "bg-amber-50 text-amber-700" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Lower grid */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Recent quizzes */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-900">Recent Quizzes</h2>
                <Link href="/generate" className="text-xs font-medium text-purple-600 hover:underline">
                  + New Quiz
                </Link>
              </div>

              {quizHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No quizzes yet</p>
                  <Link href="/generate" className="mt-2 text-purple-600 text-sm hover:underline">
                    Generate your first quiz →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {quizHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.topic}</p>
                        <p className="text-xs text-slate-500">
                          {item.difficulty} · {item.numQuestions} Qs · {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href="/generate" className="text-xs text-purple-600 hover:underline flex-shrink-0">
                        Reload →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">

              {/* Quick actions */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/generate"
                    className="flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-700 transition text-white text-sm font-semibold px-4 py-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Quiz
                  </Link>
                  <Link href="/pricing"
                    className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-white text-sm font-semibold px-4 py-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" /></svg>
                    {isPro ? "Manage Plan" : "Upgrade Pro"}
                  </Link>
                  <Link href="/review"
                    className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-sm font-semibold px-4 py-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    Leave Review
                  </Link>
                  <Link href="/contact"
                    className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-sm font-semibold px-4 py-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Get Support
                  </Link>
                </div>
              </div>

              {/* Plan banner */}
              {!isPro ? (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h3 className="font-semibold text-purple-900 text-sm">Unlock Pro Features</h3>
                      <p className="text-purple-700 text-xs mt-1 leading-relaxed">
                        True/False, Fill in Blanks, Short Answer, 30 questions per quiz, and unlimited daily quizzes.
                      </p>
                      <Link href="/pricing" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-purple-700 hover:text-purple-900">
                        Upgrade for $5/mo →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <h3 className="font-semibold text-green-900 text-sm">Pro is Active</h3>
                      <p className="text-green-700 text-xs mt-1 leading-relaxed">
                        Full access — all question types, 30 questions per quiz, unlimited daily generation.
                      </p>
                      <Link href="/generate" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-green-700 hover:text-green-900">
                        Start generating →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
