import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthHeader from "./components/AuthHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuizAI",
  description: "AI-powered quiz generation with Supabase auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <AuthHeader />
        <main>{children}</main>
        <footer className="mt-16 border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm font-bold text-slate-300">
                QuizAI — by Modern AI Softech
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <a href="/" className="hover:text-slate-200">
                  Home
                </a>
                <a href="/pricing" className="hover:text-slate-200">
                  Pricing
                </a>
                <a href="/generate" className="hover:text-slate-200">
                  Generate
                </a>
                <a href="/contact" className="hover:text-slate-200">
                  Contact
                </a>
                <a href="/terms" className="hover:text-slate-200">
                  Terms
                </a>
                <a href="/privacy" className="hover:text-slate-200">
                  Privacy
                </a>
              </div>
              <p className="text-xs text-slate-500">
                © 2025 Modern AI Softech. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
