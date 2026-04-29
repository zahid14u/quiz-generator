"use client";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
            <span className="inline-block mt-4 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Last updated: April 2026
            </span>
          </div>

          <div className="space-y-8">
            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
              <p className="mb-4">
                QuizAI is operated by Modern AI Softech. This Privacy Policy
                explains how we collect, use, and protect your information.
              </p>
              <p className="mb-4">
                We respect your privacy and are committed to protecting your
                personal data. By using QuizAI, you agree to the collection and
                use of information in accordance with this policy.
              </p>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">
                2. What Data We Collect
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>No account registration required for free plan</li>
                <li>Contact form collects name and email via Formspree</li>
                <li>Quiz content NOT stored on our servers</li>
                <li>
                  Browser localStorage used for quiz history (stays on your
                  device only)
                </li>
                <li>Pro plan: email collected via Lemon Squeezy for billing</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">
                3. How We Use Your Data
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Contact form data: only to respond to your message</li>
                <li>Payment data: handled entirely by Lemon Squeezy</li>
                <li>No data sold to third parties ever</li>
                <li>No advertising targeting</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">4. Cookies and Storage</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>No tracking cookies</li>
                <li>No advertising cookies</li>
                <li>Only browser localStorage for app functionality</li>
                <li>You can clear localStorage anytime in browser settings</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">
                5. Third Party Services We Use
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Groq AI: processes quiz generation (no content stored)</li>
                <li>OpenRouter: backup AI processing</li>
                <li>Formspree: handles contact form submissions</li>
                <li>Vercel: hosts the application</li>
                <li>Lemon Squeezy: handles payments securely</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">6. Data Security</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>API keys stored server-side only, never exposed</li>
                <li>Payment data handled entirely by Lemon Squeezy</li>
                <li>We never see or store your card details</li>
                <li>HTTPS encryption on all pages</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">7. Your Rights</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Request deletion of contact data: email us</li>
                <li>Quiz history stored locally: clear anytime in browser</li>
                <li>Opt out: simply stop using the service</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">8. Children's Privacy</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>QuizAI is intended for teachers and adults</li>
                <li>We do not knowingly collect data from children under 13</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">
                9. Changes to Privacy Policy
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Policy may update anytime</li>
                <li>Continued use means acceptance</li>
                <li>Check this page for latest version</li>
              </ul>
            </section>

            <section className="rounded-lg bg-slate-50 p-6">
              <h2 className="text-xl font-bold mb-4">10. Contact</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>zahid.14u@gmail.com</li>
                <li>Response within 24 hours</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link href="/terms" className="text-purple-600 hover:underline">
              View our Terms and Conditions
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
