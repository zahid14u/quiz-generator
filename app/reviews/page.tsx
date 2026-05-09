// 📁 SAVE AS: app/reviews/page.tsx  ← NEW FILE, create "reviews" folder inside app/

"use client";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AllReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3">("all");

  useEffect(() => {
    supabase
      .from("reviews")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data);
        setIsLoading(false);
      });
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (filter === "all") return true;
    return r.rating === Number(filter);
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold sm:text-4xl">Teacher Reviews</h1>
            <p className="mt-3 text-slate-600">Real feedback from teachers using QuizAI</p>
          </div>

          {/* Rating summary */}
          {!isLoading && reviews.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 mb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Big number */}
                <div className="text-center flex-shrink-0">
                  <p className="text-6xl font-bold text-slate-900">{avgRating}</p>
                  <div className="text-yellow-500 text-xl mt-1">
                    {"⭐".repeat(Math.round(Number(avgRating)))}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{reviews.length} reviews</p>
                </div>

                {/* Bar breakdown */}
                <div className="flex-1 w-full space-y-2">
                  {ratingCounts.map(({ star, count, percent }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-4 text-right">{star}</span>
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filter buttons */}
          {!isLoading && reviews.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {[
                { key: "all", label: `All (${reviews.length})` },
                { key: "5",   label: `5 ⭐ (${ratingCounts[0].count})` },
                { key: "4",   label: `4 ⭐ (${ratingCounts[1].count})` },
                { key: "3",   label: `3 ⭐ (${ratingCounts[2].count})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Reviews grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No reviews yet.</p>
              <Link href="/review" className="mt-4 inline-block text-purple-600 hover:underline text-sm">
                Be the first to leave a review →
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                  <div className="text-yellow-500 text-sm">{"⭐".repeat(review.rating)}</div>
                  <p className="mt-3 text-sm text-slate-700 italic flex-1">"{review.comment}"</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                      {(review.user_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{review.user_name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-slate-600 mb-4">Have you used QuizAI? Share your experience.</p>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              ⭐ Leave a Review
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
