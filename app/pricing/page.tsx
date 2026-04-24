"use client";
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="w-full bg-slate-900 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight sm:text-xl">QuizAI</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/generate" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4">Generate</Link>
            <Link href="/" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4">Home</Link>
            <Link href="/contact" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:px-4">
  Support
</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Simple Pricing for Every Teacher</h1>
          <p className="mt-4 text-slate-600">Start free and upgrade anytime when you need advanced question types, bigger quizzes, and faster generation.</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-slate-500">/ forever</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {["MCQ questions only","Up to 10 questions per quiz","Download PDF","Copy to clipboard","3 quizzes per day"].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span>{f}</li>
              ))}
              {["True/False questions","Fill in the Blanks","Short Answer questions","Mixed question types","Up to 30 questions","Save quizzes to account","Quiz history across devices","Priority generation speed"].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-400"><span className="font-bold">✗</span>{f}</li>
              ))}
            </ul>
            <Link href="/generate" className="mt-8 block w-full rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700">
              Get Started Free
            </Link>
          </div>

          <div className="relative rounded-2xl border-2 border-purple-500 bg-purple-50 p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-xs font-bold text-white">Most Popular</span>
            <h2 className="text-xl font-bold">Pro</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-purple-700">$5</span>
              <span className="text-slate-500">/ month</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {["Everything in Free","True/False questions","Fill in the Blanks","Short Answer questions","Mixed question types","Up to 30 questions per quiz","Unlimited quizzes per day","Save quizzes to account","Quiz history across devices","Priority generation speed"].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-purple-600 font-bold">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/generate" className="mt-8 block w-full rounded-lg bg-purple-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-700">
              Upgrade to Pro
            </Link>
            <p className="mt-2 text-center text-xs text-slate-500">Cancel anytime · Secure payment</p>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold">See Pro in Action</h2>
          <p className="mt-2 text-center text-slate-600">Experience the question types before you upgrade</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">True / False</span>
              <p className="mt-3 font-semibold text-slate-800">HTTP is a stateless protocol.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-full border-2 border-blue-400 py-2 text-sm font-semibold text-blue-700">True</button>
                <button className="rounded-full border-2 border-blue-400 py-2 text-sm font-semibold text-blue-700">False</button>
              </div>
              <div className="mt-3 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">✓ Correct Answer: True</div>
              <p className="mt-3 text-xs text-slate-500">Perfect for quick comprehension checks</p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">Fill in the Blanks</span>
              <p className="mt-3 font-semibold text-slate-800">The <span className="font-bold text-purple-700">_______</span> protocol sends email.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["SMTP","HTTP","FTP","DNS"].map(o => (
                  <div key={o} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center text-xs text-slate-700">{o}</div>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">✓ Correct Answer: SMTP</div>
              <p className="mt-3 text-xs text-slate-500">Tests precise knowledge recall</p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Short Answer</span>
              <p className="mt-3 font-semibold text-slate-800">What is the purpose of DNS?</p>
              <textarea className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-500" rows={2} placeholder="Student writes answer here..." readOnly />
              <div className="mt-2 rounded-md bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">✓ DNS translates domain names to IP addresses.</div>
              <p className="mt-3 text-xs text-slate-500">Encourages deeper understanding</p>
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
              { quote: "I used to spend 2 hours making quizzes. Now it takes 10 seconds. QuizAI is a game changer.", name: "Sarah K.", role: "High School Teacher" },
              { quote: "The True/False and Fill in the Blanks features are perfect for my IT students.", name: "Ahmed R.", role: "College Lecturer" },
              { quote: "My students actually enjoy taking these quizzes. The variety of question types keeps them engaged!", name: "Maria T.", role: "Primary Teacher" },
            ].map(t => (
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
          <h2 className="text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              { q: "Can I cancel anytime?", a: "Yes, cancel with one click. No questions asked." },
              { q: "What payment methods?", a: "All major cards accepted via Lemon Squeezy." },
              { q: "Is my data safe?", a: "Yes, we never store your quiz content on our servers." },
              { q: "Can I try Pro free?", a: "Yes! Use our free demo on the generate page to try all Pro features before paying." },
            ].map(f => (
              <div key={f.q} className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}