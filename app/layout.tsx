import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm font-bold">QuizAI — by Modern AI Softech</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
                <Link href="/" className="hover:text-slate-900">
                  Home
                </Link>
                <Link href="/pricing" className="hover:text-slate-900">
                  Pricing
                </Link>
                <Link href="/generate" className="hover:text-slate-900">
                  Generate
                </Link>
                <Link href="/contact" className="hover:text-slate-900">
                  Contact
                </Link>
                <Link href="/terms" className="hover:text-slate-900">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-slate-900">
                  Privacy
                </Link>
                <Link href="/login" className="hover:text-slate-900">
                  Login
                </Link>
                <Link href="/review" className="hover:text-slate-900">
                  Review
                </Link>
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
