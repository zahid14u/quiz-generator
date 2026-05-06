// 📁 SAVE AS: src/app/admin/page.tsx

"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "zahid.14u@gmail.com";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved" | "featured">("all");
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    featuredReviews: 0,
    avgRating: 0,
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
        freeUsers: profilesData.filter((u) => !u.is_pro).length,
      }));
    }

    if (reviewsData) {
      setReviews(reviewsData);
      const approved = reviewsData.filter((r) => r.is_approved);
      const avg = approved.length
        ? approved.reduce((s, r) => s + (r.rating || 0), 0) / approved.length
        : 0;
      setStats((prev) => ({
        ...prev,
        totalReviews: reviewsData.length,
        pendingReviews: reviewsData.filter((r) => !r.is_approved).length,
        approvedReviews: approved.length,
        featuredReviews: reviewsData.filter((r) => r.is_featured).length,
        avgRating: Math.round(avg * 10) / 10,
      }));
    }
  };

  const approveReview = async (id: string) => {
    await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
    await loadData();
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    await loadData();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase
      .from("reviews")
      .update({ is_featured: !current })
      .eq("id", id);
    await loadData();
  };

  const togglePro = async (userId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          plan: "manual",
          pro_started_at: new Date().toISOString(),
          pro_expires_at: expiryDate.toISOString(),
        })
        .eq("id", userId);
    } else {
      await supabase
        .from("profiles")
        .update({ is_pro: false, plan: null, pro_expires_at: null })
        .eq("id", userId);
    }
    await loadData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === "pending") return !r.is_approved;
    if (reviewFilter === "approved") return r.is_approved && !r.is_featured;
    if (reviewFilter === "featured") return r.is_featured;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    {
      id: "overview", label: "Overview",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      id: "users", label: "Users",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      id: "reviews", label: "Reviews",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    },
  ];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          Q
        </div>
        <div>
          <p className="font-bold text-base tracking-tight">QuizAI</p>
          <p className="text-[10px] text-slate-500">Admin Panel</p>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <p className="px-6 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Navigation
      </p>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {item.icon}
            {item.label}
            {item.id === "reviews" && stats.pendingReviews > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingReviews}
              </span>
            )}
            {item.id === "users" && (
              <span className="ml-auto text-slate-500 text-xs">{stats.totalUsers}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Admin user footer */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            A
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium">Admin</p>
            <p className="text-slate-500 text-xs truncate">{ADMIN_EMAIL}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white text-slate-900">

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 fixed left-0 top-0 bottom-0 z-20">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 h-full flex-shrink-0">
            <SidebarContent mobile />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Modern AI Softech — QuizAI Admin
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-sm font-medium px-4 py-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto">

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <div className="space-y-6">

              {/* Row 1 stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Users",    value: stats.totalUsers,    color: "bg-blue-50 text-blue-700"     },
                  { label: "Pro Users",       value: stats.proUsers,      color: "bg-purple-50 text-purple-700" },
                  { label: "Free Users",      value: stats.freeUsers,     color: "bg-slate-100 text-slate-700"  },
                  { label: "Total Reviews",   value: stats.totalReviews,  color: "bg-green-50 text-green-700"   },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">{s.label}</p>
                    <p className="text-3xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Row 2 stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Pending Reviews",  value: stats.pendingReviews,  color: "bg-amber-50 text-amber-700"   },
                  { label: "Approved Reviews", value: stats.approvedReviews, color: "bg-teal-50 text-teal-700"     },
                  { label: "Featured Reviews", value: stats.featuredReviews, color: "bg-pink-50 text-pink-700"     },
                  { label: "Avg Rating",        value: `${stats.avgRating} ⭐`, color: "bg-yellow-50 text-yellow-700" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">{s.label}</p>
                    <p className="text-3xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Summary panels */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Recent signups */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Recent Signups</h2>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                          {(u.full_name || u.email || "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.is_pro
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {u.is_pro ? "Pro" : "Free"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending reviews quick list */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Pending Reviews</h2>
                    <button
                      onClick={() => { setActiveTab("reviews"); setReviewFilter("pending"); }}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  {reviews.filter((r) => !r.is_approved).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="text-3xl mb-2">✅</span>
                      <p className="text-slate-500 text-sm">All reviews approved</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews
                        .filter((r) => !r.is_approved)
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-800">{r.user_name}</p>
                                <span className="text-yellow-500 text-xs">{"⭐".repeat(r.rating)}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{r.comment}</p>
                            </div>
                            <button
                              onClick={() => approveReview(r.id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex-shrink-0"
                            >
                              Approve
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pro conversion bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900 mb-4">Plan Distribution</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Free ({stats.freeUsers})</span>
                      <span>Pro ({stats.proUsers})</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{
                          width: stats.totalUsers
                            ? `${(stats.proUsers / stats.totalUsers) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.totalUsers
                        ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}% conversion rate`
                        : "No users yet"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-purple-700">{stats.proUsers}</p>
                    <p className="text-xs text-slate-500">paying users</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ══ USERS TAB ══ */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{users.length} total registered users</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Plan</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Joined</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Pro Expires</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                                {(user.full_name || user.email || "U")[0].toUpperCase()}
                              </div>
                              <span className="text-slate-700 truncate max-w-[160px] block">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{user.full_name || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.is_pro
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {user.is_pro ? `Pro (${user.plan || "manual"})` : "Free"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {user.pro_expires_at
                              ? new Date(user.pro_expires_at).toLocaleDateString()
                              : "—"}
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
              </div>
            </div>
          )}

          {/* ══ REVIEWS TAB ══ */}
          {activeTab === "reviews" && (
            <div className="space-y-4">

              {/* Filter buttons */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "all",      label: `All (${reviews.length})` },
                  { key: "pending",  label: `Pending (${stats.pendingReviews})` },
                  { key: "approved", label: `Approved (${stats.approvedReviews})` },
                  { key: "featured", label: `Featured (${stats.featuredReviews})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setReviewFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      reviewFilter === f.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Info banner */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
                <strong>Featured</strong> reviews appear on the Pricing page (up to 6).{" "}
                <strong>Approved</strong> reviews appear on the public All Reviews page.
              </div>

              {/* Reviews list */}
              {filteredReviews.length === 0 ? (
                <p className="text-slate-500 text-sm py-10 text-center">
                  No reviews in this category.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`rounded-xl border p-5 ${
                        review.is_featured
                          ? "border-pink-200 bg-pink-50"
                          : review.is_approved
                          ? "border-green-200 bg-green-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900">{review.user_name}</p>
                            <span className="text-xs text-slate-500">{review.user_email}</span>
                            <span className="text-yellow-500 text-sm">
                              {"⭐".repeat(review.rating)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                          {/* Status badges */}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              review.is_approved
                                ? "bg-green-200 text-green-800"
                                : "bg-amber-200 text-amber-800"
                            }`}>
                              {review.is_approved ? "Approved" : "Pending"}
                            </span>
                            {review.is_featured && (
                              <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-pink-200 text-pink-800">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!review.is_approved && (
                            <button
                              onClick={() => approveReview(review.id)}
                              className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => toggleFeatured(review.id, review.is_featured)}
                            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                              review.is_featured
                                ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {review.is_featured ? "Unfeature" : "Set Featured"}
                          </button>
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
