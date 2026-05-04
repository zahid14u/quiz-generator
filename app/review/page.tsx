"use client";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Filter } from "bad-words";
import Link from "next/link";
import { useEffect, useState } from "react";

const filter = new Filter();

export default function ReviewPage() {
  const [rating, setRating]               = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment]             = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [error, setError]                 = useState("");
  const [user, setUser]                   = useState<any>(null);
  const [authLoading, setAuthLoading]     = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
      setAuthLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to post a review.");
      return;
    }
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }
    if (filter.isProfane(comment)) {
      setError("Please avoid using inappropriate or abusive language.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: dbError } = await supabase.from("reviews").insert({
        user_id:    user.id,
        user_name:  user.user_metadata?.full_name || user.email?.split("@")[0],
        user_email: user.email,
        rating,
        comment: comment.trim(),
      });

      if (dbError) throw new Error(dbError.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Leave a Review</h1>
          <p className="mt-3 text-slate-600">
            Help other teachers discover QuizAI
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 p-8">
          {submitted ? (
            <div className="text-center">
              <div className="text-5xl">🎉</div>
              <h2 className="mt-4 text-xl font-bold text-green-700">
                Thank you for your review!
              </h2>
              <p className="mt-2 text-slate-600">
                Your review will appear on our pricing page after approval.
              </p>
              <Link
                href="/generate"
                className="mt-6 inline-block rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Back to Quiz Generator
              </Link>
            </div>

          ) : authLoading ? (
            /* Loading state while we check auth */
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>

          ) : !user ? (
            /* ✅ FIXED: Show a clear login prompt instead of a confusing error */
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-lg font-semibold text-slate-800">
                Sign in to Leave a Review
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                You need a free account to post a review.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={`/login?next=${encodeURIComponent("/review")}`}
                  className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Sign In
                </Link>
                <Link
                  href={`/signup?next=${encodeURIComponent("/review")}`}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Create Free Account
                </Link>
              </div>
            </div>

          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Your Rating
                </label>
                <div className="flex flex-col items-start isolate">
                  <div className="flex items-center gap-1 py-2 pr-12">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className="relative h-12 w-12 flex items-center justify-center"
                      >
                        <button
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="absolute z-[100] text-4xl transition-transform duration-200 hover:scale-125 p-1 active:scale-95"
                          aria-label={`Rate ${star} out of 5`}
                        >
                          <span className="pointer-events-none select-none">
                            {star <= (hoveredRating || rating) ? "⭐" : "☆"}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="h-6">
                    {(hoveredRating || rating) > 0 && (
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {(hoveredRating || rating) === 1 && "Poor"}
                        {(hoveredRating || rating) === 2 && "Fair"}
                        {(hoveredRating || rating) === 3 && "Good"}
                        {(hoveredRating || rating) === 4 && "Very Good"}
                        {(hoveredRating || rating) === 5 && "Excellent!"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Your Review
                </label>
                <textarea
                  required
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell other teachers how QuizAI has helped you..."
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
                <p className={`mt-1 text-xs ${comment.length < 10 && comment.length > 0 ? "text-red-400" : "text-slate-400"}`}>
                  {comment.length} characters{comment.length < 10 && comment.length > 0 ? ` (${10 - comment.length} more needed)` : ""}
                </p>
              </div>

              {/* Show who is submitting */}
              <div className="rounded-md bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Submitting as <span className="font-semibold">{user.email}</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || rating === 0 || comment.trim().length < 10}
                className="w-full rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
