import Link from "next/link";

const features = [
  {
    title: "Any Topic",
    description:
      "Create quizzes for IT, science, business, language, or any subject your students need.",
  },
  {
    title: "Instant Results",
    description:
      "Generate well-structured questions in seconds, so you can focus on teaching.",
  },
  {
    title: "Export to PDF",
    description:
      "Download and share clean quiz sheets quickly for classroom or online use.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6">
        <nav className="flex items-center justify-between gap-3 border-b border-slate-200 py-5">
          <span className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
            QuizAI
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pricing"
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Pricing
            </Link>
            <Link
              href="/generate"
              className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:px-4"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <section className="py-16 text-center md:py-28">
          <p className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Generate quizzes in seconds with AI
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-600 sm:text-base md:text-lg">
            QuizAI helps teachers create engaging, high-quality quizzes quickly,
            with less manual work and more time for students.
          </p>
          <Link
            href="/generate"
            className="mt-10 inline-flex rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-700 sm:px-8 sm:py-4 sm:text-lg"
          >
            Create Your First Quiz
          </Link>
        </section>

        <section className="pb-16 md:pb-24">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            Why Teachers Choose QuizAI
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
