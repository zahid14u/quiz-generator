// 📁 SAVE AS: src/app/api/webhooks/lemonsqueezy/route.ts

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Verify the webhook signature from Lemon Squeezy
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(digest, "hex"),
    Buffer.from(signature, "hex"),
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  // 1. Verify this is genuinely from Lemon Squeezy
  if (!verifySignature(rawBody, signature)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName = event?.meta?.event_name;
  const userId = event?.meta?.custom_data?.user_id;
  const attributes = event?.data?.attributes;

  console.log("Webhook received:", eventName, "for user:", userId);

  // 2. Handle subscription created or payment success
  if (
    eventName === "subscription_created" ||
    eventName === "order_created"
  ) {
    if (!userId) {
      console.error("No user_id in webhook custom data");
      return NextResponse.json({ error: "No user ID" }, { status: 400 });
    }

    // Calculate expiry: 1 month for monthly, 1 year for yearly
    const variantName: string =
      attributes?.variant_name?.toLowerCase() ?? "";
    const isYearly = variantName.includes("year") || variantName.includes("annual");

    const expiryDate = new Date();
    if (isYearly) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        plan: isYearly ? "yearly" : "monthly",
        pro_started_at: new Date().toISOString(),
        pro_expires_at: expiryDate.toISOString(),
        lemonsqueezy_subscription_id:
          event?.data?.id ?? null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Supabase update error:", error.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log("✅ Pro activated for user:", userId);
  }

  // 3. Handle subscription cancelled or expired
  if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_pro: false,
        plan: null,
        pro_expires_at: null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Supabase revoke error:", error.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log("❌ Pro revoked for user:", userId);
  }

  return NextResponse.json({ received: true });
}
