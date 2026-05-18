// 📁 SAVE AS: components/SampleOutput.tsx

export default function SampleOutput() {
  return (
    <section className="w-full bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            From Boring Text to Engaging Quiz in Seconds
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            See how our AI instantly transforms basic study material into
            classroom-ready questions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Before: Raw Text */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-red-400"></span>
              <span className="flex h-3 w-3 rounded-full bg-yellow-400"></span>
              <span className="flex h-3 w-3 rounded-full bg-green-400"></span>
              <span className="ml-2 text-sm font-medium text-slate-500">
                Your Topic or Study Text
              </span>
            </div>
            <div className="p-6 text-slate-600 font-mono text-sm leading-relaxed flex-grow">
              Topic: "Photosynthesis and how plants convert sunlight into
              chemical energy for middle school science."
            </div>
          </div>

          {/* After: QuizAI Output */}
          <div className="bg-slate-900 rounded-2xl border border-purple-500/30 shadow-xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Exported to Kahoot!
            </div>
            <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-sm font-medium text-slate-300">
                QuizAI Generation
              </span>
            </div>
            <div className="p-6 flex-grow space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-white font-medium mb-3">
                  1. What is the primary purpose of photosynthesis?
                </p>
                <div className="space-y-2">
                  <div className="bg-slate-700/50 text-slate-300 px-3 py-2 rounded-md text-sm">
                    A) To absorb water from soil
                  </div>
                  <div className="bg-purple-600/20 border border-purple-500/50 text-purple-100 px-3 py-2 rounded-md text-sm flex justify-between">
                    <span>B) To harness sunlight into chemical energy</span>
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="bg-slate-700/50 text-slate-300 px-3 py-2 rounded-md text-sm">
                    C) To release carbon dioxide
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
