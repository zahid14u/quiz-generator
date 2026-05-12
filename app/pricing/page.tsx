// 📁 SAVE AS: app/pricing/page.tsx

"use client";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const proPrice = isYearly ? 36 : 5;
  const proPeriod = isYearly ? "/yr" : "/mo";
  const [featuredReviews, setFeaturedReviews] = useState<any[]>([]);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    // Fetch only featured reviews for pricing page (max 6)
    supabase
      .from("reviews")
      .select("*")
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setFeaturedReviews(data);
      });
  }, []);

  const handleUpgrade = async () => {
    setCheckoutError("");
    setIsLoadingCheckout(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/signup?next=pricing";
        return;
      }
      const variantId = isYearly
        ? process.env.NEXT_PUBLIC_LS_YEARLY_VARIANT_ID
        : process.env.NEXT_PUBLIC_LS_MONTHLY_VARIANT_ID;

      if (!variantId) {
        setCheckoutError("Checkout not configured. Please contact support.");
        return;
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          userEmail: session.user.email,
          userId: session.user.id,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setCheckoutError(
          data.error || "Failed to start checkout. Please try again.",
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  // Fallback reviews if none featured yet
  const defaultReviews = [
    {
      user_name: "Sarah K.",
      comment:
        "I used to spend 2 hours making quizzes. Now it takes 10 seconds.",
      rating: 5,
      role: "High School Teacher",
    },
    {
      user_name: "Ahmed R.",
      comment:
        "The True/False and Fill in the Blanks features are perfect for my IT students.",
      rating: 5,
      role: "College Lecturer",
    },
    {
      user_name: "Maria T.",
      comment: "My students actually enjoy taking these quizzes!",
      rating: 5,
      role: "Primary Teacher",
    },
  ];

  const reviewsToShow =
    featuredReviews.length > 0 ? featuredReviews : defaultReviews;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Simple Pricing for Every Teacher
            </h1>
            <p className="mt-4 text-slate-600">
              Start free and upgrade anytime for advanced features.
            </p>
          </div>

          {/* Toggle */}
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

          {/* Plans */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Free */}
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
                  <span className="text-green-600 font-bold">✓</span>10
                  questions max
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>3 quizzes
                  per day
                </li>
              </ul>
              <Link
                href="/generate"
                className="mt-8 block w-full rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-purple-500 bg-purple-50 p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-xs font-bold text-white">
                Most Popular
              </span>
              <h2 className="text-xl font-bold">Pro</h2>
              <div className="mt-2 flex items-baseline gap-1 flex-wrap">
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
                    <div className="w-full text-sm text-slate-500">
                      just $3/mo
                    </div>
                  </>
                )}
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">✓</span>All
                  question types
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">✓</span>Up to 30
                  questions per quiz
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">✓</span>Unlimited
                  quizzes daily
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">✓</span>Secure
                  cloud storage & access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">✓</span>Priority
                  support
                </li>
              </ul>

              {checkoutError && (
                <p className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  {checkoutError}
                </p>
              )}

              <button
                onClick={handleUpgrade}
                disabled={isLoadingCheckout}
                className="mt-8 block w-full rounded-lg bg-purple-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
              >
                {isLoadingCheckout
                  ? "Preparing checkout..."
                  : `Upgrade to Pro — $${proPrice}${proPeriod}`}
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">
                Cancel anytime · Secure payment via Lemon Squeezy
              </p>
              <p className="mt-1 text-center text-xs text-slate-500">
                Already Pro?{" "}
                <Link href="/login" className="text-purple-600 hover:underline">
                  Login here →
                </Link>
              </p>
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-12 rounded-lg bg-green-50 border border-green-200 p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <span className="text-2xl">🛡️</span>
              <span className="font-semibold">7-day money back guarantee</span>
            </div>
            <p className="mt-2 text-sm text-green-600">
              Not satisfied? Full refund within 7 days, no questions asked.
            </p>
          </div>

          {/* Pro preview */}
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold">
              See Pro in Action
            </h2>
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
              </div>
            </div>
            <div className="mt-8 text-center">
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

          {/* Featured Reviews */}
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold">
              What Teachers Say
            </h2>
            {featuredReviews.length === 0 && (
              <p className="text-center text-sm text-slate-400 mt-2">
                Showing sample reviews
              </p>
            )}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {reviewsToShow.map((review, index) => (
                <div key={index} className="rounded-xl bg-slate-50 p-6">
                  <div className="text-yellow-500 text-sm">
                    {"⭐".repeat(review.rating)}
                  </div>
                  <p className="mt-3 text-sm text-slate-700 italic">
                    "{review.comment}"
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">{review.user_name}</p>
                    <p className="text-xs text-slate-500">
                      {review.role || "Teacher"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/reviews"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                📖 Read All Reviews
              </Link>
              <Link
                href="/review"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ⭐ Leave a Review
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes, cancel with one click from your Lemon Squeezy account. No questions asked.",
                },
                {
                  q: "What payment methods?",
                  a: "All major cards accepted via Lemon Squeezy.",
                },
                {
                  q: "Is my data safe?",
                  a: "Yes. Free quizzes stay on your browser. Pro quizzes are securely stored in our cloud database for cross-device access.",
                },
                {
                  q: "Can I try Pro free?",
                  a: "Yes! Use our free demo on the generate page to try all Pro features before paying.",
                },
                {
                  q: "What is the refund policy?",
                  a: "We offer a 7-day money back guarantee. Contact support for a full refund.",
                },
                {
                  q: "How do I cancel my subscription?",
                  a: "Log into your Lemon Squeezy account and click Cancel. Access continues until end of billing period.",
                },
              ].map((f) => (
                <div
                  key={f.q}
                  className="rounded-xl border border-slate-200 p-6"
                >
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 rounded-2xl bg-slate-900 py-16 text-center text-white">
            <h2 className="text-3xl font-bold">
              Ready to Transform Your Teaching?
            </h2>
            <p className="mt-4 text-slate-300">
              Join teachers using QuizAI to create engaging quizzes in seconds.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isLoadingCheckout}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-purple-700 disabled:bg-purple-400"
            >
              {isLoadingCheckout ? "Preparing..." : "Start Pro Today →"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
