"use client";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Terms and Conditions
            </h1>
            <span className="inline-block mt-4 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Last updated: April 2026
            </span>
          </div>

          <div className="mb-12 rounded-lg bg-slate-50 p-6">
            <h2 className="text-lg font-bold mb-4">Table of Contents</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#section1"
                  className="text-purple-600 hover:underline"
                >
                  1. Introduction
                </Link>
              </li>
              <li>
                <Link
                  href="#section2"
                  className="text-purple-600 hover:underline"
                >
                  2. Service Description
                </Link>
              </li>
              <li>
                <Link
                  href="#section3"
                  className="text-purple-600 hover:underline"
                >
                  3. Free Plan Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#section4"
                  className="text-purple-600 hover:underline"
                >
                  4. Pro Plan Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#section5"
                  className="text-purple-600 hover:underline"
                >
                  5. Cancellation Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#section6"
                  className="text-purple-600 hover:underline"
                >
                  6. Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#section7"
                  className="text-purple-600 hover:underline"
                >
                  7. Acceptable Use
                </Link>
              </li>
              <li>
                <Link
                  href="#section8"
                  className="text-purple-600 hover:underline"
                >
                  8. Privacy Summary
                </Link>
              </li>
              <li>
                <Link
                  href="#section9"
                  className="text-purple-600 hover:underline"
                >
                  9. Changes to Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#section10"
                  className="text-purple-600 hover:underline"
                >
                  10. Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-8">
            <section id="section1" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
              <p className="mb-4">
                QuizAI is operated by Modern AI Softech. These Terms and
                Conditions ("Terms") govern your use of the QuizAI service.
              </p>
              <p className="mb-4">
                By accessing or using QuizAI, you agree to be bound by these
                Terms. If you do not agree to these Terms, please do not use the
                service.
              </p>
            </section>

            <section id="section2" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">2. Service Description</h2>
              <p className="mb-4">
                QuizAI is an AI-powered quiz generator designed for teachers to
                create educational quizzes quickly and easily.
              </p>
              <p className="mb-4">
                We offer both Free and Pro plans. AI-generated content may vary
                in quality and accuracy, and we recommend reviewing all
                generated quizzes before use.
              </p>
            </section>

            <section id="section3" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">3. Free Plan Terms</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>3 quizzes per day limit</li>
                <li>MCQ questions only</li>
                <li>No account required</li>
                <li>Limits may change at any time without notice</li>
              </ul>
            </section>

            <section id="section4" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">4. Pro Plan Terms</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Monthly: $5/month</li>
                <li>Yearly: $36/year</li>
                <li>Billed automatically via Lemon Squeezy</li>
                <li>
                  All question types unlocked (True/False, Fill in the Blanks,
                  Short Answer)
                </li>
                <li>Up to 30 questions per quiz</li>
                <li>Unlimited daily quizzes</li>
              </ul>
            </section>

            <section id="section5" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">5. Cancellation Policy</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Cancel anytime from your Lemon Squeezy account</li>
                <li>No cancellation fees ever</li>
                <li>
                  Pro access continues until the end of your current billing
                  period
                </li>
                <li>Monthly: access until end of current month</li>
                <li>Yearly: access until end of current year</li>
                <li>Account reverts to Free plan after cancellation</li>
              </ul>
            </section>

            <section id="section6" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">6. Refund Policy</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Full refund within 7 days of first purchase only</li>
                <li>No refund after 7 days</li>
                <li>No partial refunds for unused period</li>
                <li>
                  Request refund by emailing zahid.14u@gmail.com with order
                  number
                </li>
                <li>Refunds processed in 5-7 business days</li>
                <li>Refund to original payment method only</li>
              </ul>
            </section>

            <section id="section7" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">7. Acceptable Use</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Do not use QuizAI for illegal or harmful content</li>
                <li>Do not bypass free tier limits artificially</li>
                <li>Do not share Pro credentials with others</li>
                <li>We may terminate accounts violating these terms</li>
              </ul>
            </section>

            <section id="section8" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">8. Privacy Summary</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>We do not store quiz content</li>
                <li>Contact form data used only to respond</li>
                <li>No advertising or tracking cookies</li>
                <li>
                  Full privacy policy at{" "}
                  <Link
                    href="/privacy"
                    className="text-purple-600 hover:underline"
                  >
                    /privacy
                  </Link>
                </li>
              </ul>
            </section>

            <section id="section9" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">9. Changes to Terms</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Terms may update at any time</li>
                <li>Continued use means acceptance of changes</li>
                <li>Major changes notified by email</li>
              </ul>
            </section>

            <section id="section10" className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">10. Contact Us</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Email: zahid.14u@gmail.com</li>
                <li>Response within 24 hours Mon-Sat</li>
                <li>WhatsApp support available</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link href="/privacy" className="text-purple-600 hover:underline">
              View our full Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
