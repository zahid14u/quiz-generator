"use client";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "zahid.14u@gmail.com";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    totalReviews: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }
      setIsAdmin(true);
      await loadData();
      setIsLoading(false);
    });
  }, []);

  const loadData = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesData) {
      setUsers(profilesData);
      setStats((prev) => ({
        ...prev,
        totalUsers: profilesData.length,
        proUsers: profilesData.filter((u) => u.is_pro).length,
      }));
    }

    if (reviewsData) {
      setReviews(reviewsData);
      setStats((prev) => ({
        ...prev,
        totalReviews: reviewsData.length,
        pendingReviews: reviewsData.filter((r) => !r.is_approved).length,
      }));
    }
  };

  const approveReview = async (id: string) => {
    await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
    await loadData();
  };

  const deleteReview = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    await loadData();
  };

  const togglePro = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_pro: !currentStatus })
      .eq("id", userId);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Modern AI Softech — QuizAI</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            {
              label: "Total Users",
              value: stats.totalUsers,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Pro Users",
              value: stats.proUsers,
              color: "bg-purple-50 text-purple-700",
            },
            {
              label: "Total Reviews",
              value: stats.totalReviews,
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Pending Reviews",
              value: stats.pendingReviews,
              color: "bg-amber-50 text-amber-700",
            },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          {["users", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {user.full_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          user.is_pro
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.is_pro ? "Pro" : "Free"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePro(user.id, user.is_pro)}
                        className={`rounded px-3 py-1 text-xs font-medium transition ${
                          user.is_pro
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        }`}
                      >
                        {user.is_pro ? "Remove Pro" : "Grant Pro"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="mt-6 space-y-4">
            {reviews.length === 0 && (
              <p className="text-slate-500">No reviews yet.</p>
            )}
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`rounded-xl border p-5 ${
                  review.is_approved
                    ? "border-green-200 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{review.user_name}</p>
                      <span className="text-sm text-slate-500">
                        {review.user_email}
                      </span>
                      <span className="text-yellow-500">
                        {"⭐".repeat(review.rating)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {review.comment}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!review.is_approved && (
                      <button
                        onClick={() => approveReview(review.id)}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    review.is_approved
                      ? "bg-green-200 text-green-800"
                      : "bg-amber-200 text-amber-800"
                  }`}
                >
                  {review.is_approved ? "Approved" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
