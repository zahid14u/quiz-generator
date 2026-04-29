"use client";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user?.id || null,
        user_name:
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          "Anonymous",
        user_email: user?.email || "anonymous",
        rating,
        comment: comment.trim(),
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setError("Failed to submit review. Please try again.");
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
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="text-4xl transition-transform hover:scale-110"
                    >
                      {star <= (hoveredRating || rating) ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="mt-2 text-sm text-slate-500">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent!"}
                  </p>
                )}
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
                <p className="mt-1 text-xs text-slate-400">
                  {comment.length} characters
                </p>
              </div>

              {!user && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You are not logged in. Your review will be submitted
                  anonymously.{" "}
                  <Link href="/login" className="font-medium underline">
                    Login for a verified review
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:bg-purple-300"
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
