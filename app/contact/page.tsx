"use client";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Opens email client with pre-filled message
    const mailtoLink = `mailto:your@email.com?subject=${encodeURIComponent(
      `QuizAI Support: ${formData.subject}`
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    window.open(mailtoLink);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="w-full bg-slate-900 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight sm:text-xl">QuizAI</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/pricing" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4">Pricing</Link>
            <Link href="/generate" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4">Generate</Link>
            <Link href="/" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4">Home</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Contact & Support</h1>
          <p className="mt-4 text-slate-600">Have a question or need help? We respond within 24 hours.</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">

          {/* Quick help cards */}
          <div className="rounded-xl border border-slate-200 p-6 text-center">
            <div className="text-3xl">📧</div>
            <h3 className="mt-3 font-semibold">Email Support</h3>
            <p className="mt-2 text-sm text-slate-600">Get help with your account or technical issues.</p>
            <a href="mailto:zahid.14u@gmail.com" className="mt-4 block text-sm font-medium text-purple-600 hover:underline">
              zahid.14u@gmail.com
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 text-center">
            <div className="text-3xl">💬</div>
            <h3 className="mt-3 font-semibold">WhatsApp</h3>
            <p className="mt-2 text-sm text-slate-600">Quick questions answered fast on WhatsApp.</p>
            
              <a href="https://wa.me/923039382848"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-sm font-medium text-purple-600 hover:underline"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 text-center">
            <div className="text-3xl">⚡</div>
            <h3 className="mt-3 font-semibold">Response Time</h3>
            <p className="mt-2 text-sm text-slate-600">We typically respond within 24 hours on working days.</p>
            <p className="mt-4 text-sm font-medium text-green-600">Mon–Sat, 9am–6pm PKT</p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">

          {/* Contact form */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold">Send a Message</h2>
            <p className="mt-1 text-sm text-slate-600">Fill the form and we will get back to you.</p>

            {submitted ? (
              <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                <div className="text-3xl">✅</div>
                <h3 className="mt-3 font-semibold text-green-800">Message Sent!</h3>
                <p className="mt-2 text-sm text-green-700">Your email client should have opened. We will respond within 24 hours.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-sm text-purple-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Muhammad Zahid Ghaffar"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="zahid.14u@gmail.com"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="general">General Question</option>
                    <option value="billing">Billing & Payment</option>
                    <option value="technical">Technical Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Report a Bug</option>
                    <option value="pro">Pro Upgrade Help</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue or question..."
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold">Common Questions</h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  q: "How do I upgrade to Pro?",
                  a: "Click 'Upgrade to Pro' on any page or visit the Pricing page. Payment is handled securely via Lemon Squeezy.",
                },
                {
                  q: "My quiz generation failed. What do I do?",
                  a: "Try again in a few minutes. Our AI occasionally hits usage limits but recovers quickly. If it persists, contact us.",
                },
                {
                  q: "Can I use QuizAI for any subject?",
                  a: "Yes! QuizAI works for any topic — IT, Science, Math, English, History, and more.",
                },
                {
                  q: "How do I cancel my Pro subscription?",
                  a: "Email us or use the cancellation link in your payment confirmation email. No questions asked.",
                },
                {
                  q: "Is there a limit on free plan?",
                  a: "Free plan allows 3 quizzes per day with MCQ format and up to 10 questions each.",
                },
                {
                  q: "Can I get a refund?",
                  a: "Yes, we offer a full refund within 7 days of purchase. Just email us.",
                },
              ].map((item) => (
                <div key={item.q} className="border-b border-slate-100 pb-5">
                  <h3 className="font-semibold text-sm">{item.q}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      
    </main>
  );
}