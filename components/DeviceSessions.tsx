// 📁 This is a COMPONENT to add to your dashboard page
// SAVE AS: components/DeviceSessions.tsx

"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Session = {
  id: string;
  device_name: string;
  device_fingerprint: string;
  last_active: string;
  created_at: string;
};

export default function DeviceSessions({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("last_active", { ascending: false });
    if (data) setSessions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    await supabase.from("user_sessions").delete().eq("id", sessionId);
    await loadSessions();
    setRevokingId(null);
  };

  const revokeAll = async () => {
    if (!confirm("Remove all devices except your current one?")) return;
    // Get current fingerprint
    const nav = window.navigator;
    const screen = window.screen;
    const raw = [nav.userAgent, nav.language, screen.colorDepth, screen.width + "x" + screen.height, new Date().getTimezoneOffset(), nav.hardwareConcurrency || ""].join("|");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) { const c = raw.charCodeAt(i); hash = (hash << 5) - hash + c; hash = hash & hash; }
    const currentFingerprint = Math.abs(hash).toString(36);

    await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", userId)
      .neq("device_fingerprint", currentFingerprint);
    await loadSessions();
  };

  const formatLastActive = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getDeviceIcon = (deviceName: string) => {
    if (/android|ios|iphone|ipad/i.test(deviceName)) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-900">Active Devices</h2>
        {sessions.length > 1 && (
          <button
            onClick={revokeAll}
            className="text-xs text-red-600 hover:underline font-medium"
          >
            Remove other devices
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No active devices tracked yet.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                index === 0
                  ? "border-green-200 bg-green-50"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className={`flex-shrink-0 ${index === 0 ? "text-green-600" : "text-slate-400"}`}>
                {getDeviceIcon(session.device_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {session.device_name}
                  </p>
                  {index === 0 && (
                    <span className="text-xs bg-green-200 text-green-800 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Last active: {formatLastActive(session.last_active)} · First seen: {new Date(session.created_at).toLocaleDateString()}
                </p>
              </div>
              {index !== 0 && (
                <button
                  onClick={() => revokeSession(session.id)}
                  disabled={revokingId === session.id}
                  className="flex-shrink-0 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {revokingId === session.id ? "..." : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
