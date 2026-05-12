// 📁 SAVE AS: components/Navbar.tsx

"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setMenuOpen(false);
    await supabase.auth.signOut();
    // Show toast
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      router.push("/");
    }, 2000);
    setIsLoggingOut(false);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/generate", label: "Generate" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Support" },
    { href: "/review", label: "Review" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Logout Toast ── */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
          showToast
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 bg-white text-slate-900 px-5 py-3 rounded-xl shadow-2xl border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-medium">Logged out successfully</p>
        </div>
      </div>

      {/* ── Dark Theme Navbar ── */}
      <nav className="w-full bg-slate-900 text-white border-b border-white/10 relative z-40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo (Requires a white version of the logo!) */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-white.png"
              alt="QuizAI Logo"
              width={140}
              height={40}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  isActive(link.href)
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {session ? (
              <div className="flex items-center gap-2 ml-1 border-l border-white/10 pl-3">
                <Link
                  href="/dashboard"
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive("/dashboard")
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold flex-shrink-0 shadow-sm">
                  {session.user.email?.[0].toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-md bg-transparent text-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-red-500 hover:text-white disabled:opacity-60 ml-1"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1 border-l border-white/10 pl-3">
                <Link
                  href="/login"
                  className={`rounded-md px-3 py-2 text-sm font-medium transition sm:px-4 ${
                    isActive("/login")
                      ? "bg-white/20 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-md px-3 py-2 text-sm font-medium transition sm:px-4 ${
                    isActive("/signup")
                      ? "bg-purple-700 text-white"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-3">
            {session && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold flex-shrink-0 shadow-sm">
                {session.user.email?.[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="flex flex-col justify-center items-center w-9 h-9 rounded-md bg-white/5 hover:bg-white/10 transition gap-1.5 px-2"
            >
              <span
                className={`block h-0.5 w-5 bg-white rounded transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-white rounded transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-white rounded transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden fixed left-0 right-0 z-30 bg-slate-900 text-white border-b border-white/10 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${
          menuOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
        style={{ top: "64px" }}
      >
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${
                isActive(link.href)
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive("/dashboard")
                      ? "bg-purple-600 text-white"
                      : "text-purple-400 hover:bg-white/10 hover:text-purple-300"
                  }`}
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
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </Link>
                <div className="px-4 py-2 text-xs text-slate-400 truncate">
                  Signed in as {session.user.email}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white transition disabled:opacity-60"
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
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition mt-2"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
