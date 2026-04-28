import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
