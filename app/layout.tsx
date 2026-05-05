import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QuizAI — AI Quiz Generator for Teachers",
  description:
    "Create engaging quizzes in seconds with AI. MCQ, True/False, Fill in Blanks, and Short Answer — built for teachers.",
  verification: {
    google: "suMx87QSl-7MEK9E8CcBNliRYS8n1SW6eOEfnUf1Xk0",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm font-bold">QuizAI</p>
                <p className="text-xs text-slate-500">by Modern AI Softech</p>
              </div>
              <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <Link
                  href="/"
                  className="hover:text-slate-900 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/pricing"
                  className="hover:text-slate-900 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/generate"
                  className="hover:text-slate-900 transition-colors"
                >
                  Generate
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-slate-900 transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-slate-900 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-slate-900 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/login"
                  className="hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/review"
                  className="hover:text-slate-900 transition-colors"
                >
                  Review
                </Link>
              </nav>
              <p className="text-xs text-slate-500">
                © {currentYear} Modern AI Softech. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
