import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  const cookieStore = await cookies();
  const responseHeaders = new Headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          const allCookies = await cookieStore.getAll();
          return allCookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            responseHeaders.append(
              "set-cookie",
              serialize(name, value, options || {}),
            );
          });
          Object.entries(headers).forEach(([key, value]) => {
            responseHeaders.set(key, value);
          });
        },
      },
    },
  );

  if (code) {
    try {
      const { error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) {
        console.error("Session exchange error:", sessionError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(sessionError.message)}`,
        );
      }
    } catch (err) {
      console.error("Unexpected error during session exchange:", err);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=Authentication failed`,
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/generate`, {
    headers: responseHeaders,
  });
}
