import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const token = jwt.sign({ app: "quizai", role: "frontend" }, secret, {
    expiresIn: "1h",
  });

  return NextResponse.json({ token });
}
