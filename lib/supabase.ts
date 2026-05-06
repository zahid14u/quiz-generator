// 📁 SAVE AS: src/lib/supabase.ts

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient stores the session in cookies instead of localStorage
// This allows Next.js middleware to read the session server-side
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const getAuthRedirectUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "");

  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth/callback` : "";
};
