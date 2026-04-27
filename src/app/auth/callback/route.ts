import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
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
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin + "/generate", {
    headers: responseHeaders,
  });
}
