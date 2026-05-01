import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Read the Supabase access token from the Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAccessToken = authHeader.split(" ")[1];

  // Verify it with Supabase and get the user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(supabaseAccessToken);

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sign our own JWT with the verified user ID
  const token = jwt.sign(
    {
      sub: user.id,
      app: "quizai",
      role: "frontend",
    },
    secret,
    { expiresIn: "1h" },
  );

  return NextResponse.json({ token });
}
