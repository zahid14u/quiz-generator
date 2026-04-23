import Link from "next/link";

const freeFeatures = [
  { label: "MCQ questions only", included: true },
  { label: "Up to 10 questions per quiz", included: true },
  { label: "Download PDF", included: true },
  { label: "Copy to clipboard", included: true },
  { label: "3 quizzes per day", included: true },
  { label: "True/False questions", included: false },
  { label: "Fill in the Blanks", included: false },
  { label: "Short Answer questions", included: false },
  { label: "Mixed question types", included: false },
  { label: "Up to 30 questions", included: false },
  { label: "Save quizzes to account", included: false },
  { label: "Quiz history across devices", included: false },
  { label: "Priority generation speed", included: false },
];

const proFeatures = [
  "Everything in Free",
  "True/False questions",
  "Fill in the Blanks",
  "Short Answer questions",
  "Mixed question types",
  "Up to 30 questions per quiz",
  "Unlimited quizzes per day",
  "Save quizzes to account",
  "Quiz history across devices",
  "Priority generation speed",
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes, cancel with one click.",
  },
  {
    question: "What payment methods?",
    answer: "All major cards via Lemon Squeezy.",
  },
  {
    question: "Is my data safe?",
    answer: "Yes, we never store your quiz content.",
  },
  {
    question: "Can I try Pro free?",
    answer: "Free plan available forever, no card needed.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <nav className="flex items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/" className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
            QuizAI
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Home
            </Link>
            <Link
              href="/generate"
              className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:px-4"
            >
              Generate
            </Link>
          </div>
        </nav>

        <header className="py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple Pricing for Every Teacher
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
            Start free and upgrade anytime when you need advanced question
            types, bigger quizzes, and faster generation.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <p className="text-sm text-slate-500">/ forever</p>

            <ul className="mt-6 space-y-3 text-sm">
              {freeFeatures.map((feature) => (
                <li
                  key={feature.label}
                  className={feature.included ? "text-slate-700" : "text-slate-400"}
                >
                  <span className="mr-2">{feature.included ? "✓" : "✗"}</span>
                  {feature.label}
                </li>
              ))}
            </ul>

            <Link
              href="/generate"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Get Started Free
            </Link>
          </article>

          <article className="relative rounded-2xl border border-purple-300 bg-purple-50 p-6 shadow-sm sm:p-8">
            <span className="absolute -top-3 right-6 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>

            <h2 className="text-2xl font-semibold text-purple-950">Pro</h2>
            <p className="mt-2 text-3xl font-bold text-purple-950">$5</p>
            <p className="text-sm text-purple-700">/ month</p>

            <ul className="mt-6 space-y-3 text-sm text-purple-950">
              {proFeatures.map((feature) => (
                <li key={feature}>
                  <span className="mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Upgrade to Pro
            </button>
            <p className="mt-3 text-center text-xs text-purple-700">
              Cancel anytime · Secure payment
            </p>
          </article>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">FAQ</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
