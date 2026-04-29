"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
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
    <nav className="w-full bg-slate-900 text-white">
      <div
        className="mx-auto flex w-full max-w-6xl 
      items-center justify-between gap-3 px-4 py-4 
      sm:px-6"
      >
        <Link
          href="/"
          className="text-lg font-bold 
        tracking-tight sm:text-xl"
        >
          QuizAI
        </Link>

        <div
          className="flex items-center gap-2 
        flex-wrap justify-end"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm 
              font-medium transition sm:px-4 ${
                isActive(link.href)
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {session ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center 
              justify-center rounded-full bg-purple-600 
              text-sm font-bold"
              >
                {session.user.email?.[0].toUpperCase()}
              </div>
              <span
                className="hidden text-xs 
              text-slate-300 sm:block max-w-24 truncate"
              >
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-white/10 px-3 
                py-2 text-sm font-medium transition 
                hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`rounded-md px-3 py-2 
                text-sm font-medium transition sm:px-4 
                ${
                  isActive("/login")
                    ? "bg-purple-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className={`rounded-md px-3 py-2 
                text-sm font-medium transition sm:px-4 
                ${
                  isActive("/signup")
                    ? "bg-purple-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
