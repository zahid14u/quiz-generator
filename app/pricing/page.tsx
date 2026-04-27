"use client";
import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const proPrice = isYearly ? 36 : 5;
  const proPeriod = isYearly ? "/yr" : "/mo";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Simple Pricing for Every Teacher
          </h1>
          <p className="mt-4 text-slate-600">
            Start free and upgrade anytime when you need advanced question
            types, bigger quizzes, and faster generation.
          </p>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <div className="flex items-center gap-4 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${!isYearly ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative rounded-md px-4 py-2 text-sm font-medium transition ${isYearly ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}
            >
              Yearly
              {isYearly && (
                <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                  Save 40%
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-slate-500">forever</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>MCQ only
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>10 questions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>3/day
              </li>
            </ul>
            <Link
              href="/generate"
              className="mt-8 block w-full rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Get Started Free
            </Link>
          </div>

          <div className="relative rounded-2xl border-2 border-purple-500 bg-purple-50 p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-xs font-bold text-white">
              Most Popular
            </span>
            <h2 className="text-xl font-bold">Pro</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-purple-700">
                ${proPrice}
              </span>
              <span className="text-slate-500">{proPeriod}</span>
              {isYearly && (
                <>
                  <span className="ml-2 text-sm text-slate-400 line-through">
                    $60
                  </span>
                  <span className="ml-2 text-sm text-green-600 font-semibold">
                    Save $24
                  </span>
                  <div className="text-sm text-slate-500">just $3/mo</div>
                </>
              )}
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>All question
                types
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>30 questions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>Unlimited
              </li>
            </ul>
            <Link
              href="/generate"
              className="mt-8 block w-full rounded-lg bg-purple-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Upgrade to Pro
            </Link>
            <p className="mt-2 text-center text-xs text-slate-500">
              Cancel anytime · Secure payment
            </p>
            <p className="mt-2 text-center text-xs text-slate-500">
              Already a Pro member?{" "}
              <Link href="/login" className="text-purple-600 hover:underline">
                Login here →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-lg bg-green-50 border border-green-200 p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <span className="text-2xl">🛡️</span>
            <span className="font-semibold">7-day money back guarantee</span>
          </div>
          <p className="mt-2 text-sm text-green-600">
            Not satisfied? Get a full refund within 7 days, no questions asked.
          </p>
        </div>

        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold">See Pro in Action</h2>
          <p className="mt-2 text-center text-slate-600">
            Experience the question types before you upgrade
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                True / False
              </span>
              <p className="mt-3 font-semibold text-slate-800">
                HTTP is a stateless protocol.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-full border-2 border-blue-400 py-2 text-sm font-semibold text-blue-700">
                  True
                </button>
                <button className="rounded-full border-2 border-blue-400 py-2 text-sm font-semibold text-blue-700">
                  False
                </button>
              </div>
              <div className="mt-3 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">
                ✓ Correct Answer: True
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Perfect for quick comprehension checks
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                Fill in the Blanks
              </span>
              <p className="mt-3 font-semibold text-slate-800">
                The <span className="font-bold text-purple-700">_______</span>{" "}
                protocol sends email.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["SMTP", "HTTP", "FTP", "DNS"].map((o) => (
                  <div
                    key={o}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center text-xs text-slate-700"
                  >
                    {o}
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">
                ✓ Correct Answer: SMTP
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Tests precise knowledge recall
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                Short Answer
              </span>
              <p className="mt-3 font-semibold text-slate-800">
                What is the purpose of DNS?
              </p>
              <textarea
                className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-500"
                rows={2}
                placeholder="Student writes answer here..."
                readOnly
              />
              <div className="mt-2 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">
                ✓ DNS translates domain names to IP addresses.
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Encourages deeper understanding
              </p>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600 mb-4">
                Ready to try these features yourself?
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                🎁 Try Pro Demo on Generator →
              </Link>
              <p className="mt-2 text-xs text-slate-500">
                No payment needed · Experience all Pro features live
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold">What Teachers Say</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "I used to spend 2 hours making quizzes. Now it takes 10 seconds. QuizAI is a game changer.",
                name: "Sarah K.",
                role: "High School Teacher",
              },
              {
                quote:
                  "The True/False and Fill in the Blanks features are perfect for my IT students.",
                name: "Ahmed R.",
                role: "College Lecturer",
              },
              {
                quote:
                  "My students actually enjoy taking these quizzes. The variety of question types keeps them engaged!",
                name: "Maria T.",
                role: "Primary Teacher",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl bg-slate-50 p-6">
                <p className="text-sm text-slate-700 italic">"{t.quote}"</p>
                <div className="mt-4">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes, cancel with one click. No questions asked.",
              },
              {
                q: "What payment methods?",
                a: "All major cards accepted via Lemon Squeezy.",
              },
              {
                q: "Is my data safe?",
                a: "Yes, we never store your quiz content on our servers.",
              },
              {
                q: "Can I try Pro free?",
                a: "Yes! Use our free demo on the generate page to try all Pro features before paying.",
              },
              {
                q: "What is the refund policy?",
                a: "We offer a 7-day money back guarantee. If you're not satisfied, contact support for a full refund.",
              },
              {
                q: "How do I cancel my subscription?",
                a: "Go to your account settings and click 'Cancel Subscription'. Your access continues until the end of the billing period.",
              },
            ].map((f) => (
              <div key={f.q} className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-2xl bg-slate-900 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">
            Ready to Transform Your Teaching?
          </h2>
          <p className="mt-4 text-slate-300">
            Join thousands of teachers using QuizAI to create engaging quizzes
            in seconds.
          </p>
          <Link
            href="/generate"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-purple-700"
          >
            Start Creating Quizzes Now
          </Link>
        </div>
      </div>
    </main>
  );
}
