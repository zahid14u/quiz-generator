// 📁 SAVE AS: app/api/webhooks/lemonsqueezy/route.ts

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    console.error("❌ Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event?.meta?.event_name ?? "";
  const userId: string = event?.meta?.custom_data?.user_id ?? "";
  const attributes = event?.data?.attributes ?? {};

  console.log(`📦 Webhook received: ${eventName} | user: ${userId}`);

  // ── Helper: calculate expiry based on variant name ──
  const getExpiryDate = () => {
    const variantName: string = attributes?.variant_name?.toLowerCase() ?? "";
    const isYearly =
      variantName.includes("year") || variantName.includes("annual");
    const expiry = new Date();
    if (isYearly) {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    return { expiry, isYearly };
  };

  // ── Helper: update profile to Pro ──
  const activatePro = async (
    plan: string,
    expiryDate: Date,
    isTrial = false,
  ) => {
    if (!userId) {
      console.error("No user_id in webhook custom_data");
      return false;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        plan,
        pro_started_at: new Date().toISOString(),
        pro_expires_at: expiryDate.toISOString(),
        is_trial: isTrial,
        trial_ends_at: isTrial ? expiryDate.toISOString() : null,
        lemonsqueezy_subscription_id: event?.data?.id ?? null,
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Supabase activatePro error:", error.message);
      return false;
    }
    console.log(
      `✅ Pro ${isTrial ? "trial " : ""}activated for user: ${userId}`,
    );
    return true;
  };

  // ── Helper: revoke Pro ──
  const revokePro = async () => {
    if (!userId) return false;
    const { error } = await supabase
      .from("profiles")
      .update({
        is_pro: false,
        plan: null,
        pro_expires_at: null,
        is_trial: false,
        trial_ends_at: null,
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Supabase revokePro error:", error.message);
      return false;
    }
    console.log(`❌ Pro revoked for user: ${userId}`);
    return true;
  };

  // ════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════

  switch (eventName) {
    // ── New subscription created (paid) ──
    case "subscription_created": {
      const { expiry, isYearly } = getExpiryDate();
      const status: string = attributes?.status ?? "";
      const isTrial = status === "on_trial";

      if (isTrial) {
        // Trial just started — set trial expiry from Lemon Squeezy's trial_ends_at
        const trialEndsAt = attributes?.trial_ends_at
          ? new Date(attributes.trial_ends_at)
          : expiry;
        await activatePro(isYearly ? "yearly" : "monthly", trialEndsAt, true);
      } else {
        await activatePro(isYearly ? "yearly" : "monthly", expiry, false);
      }
      break;
    }

    // ── Order completed (one-time purchase if applicable) ──
    case "order_created": {
      const { expiry, isYearly } = getExpiryDate();
      await activatePro(isYearly ? "yearly" : "monthly", expiry, false);
      break;
    }

    // ── Trial started (fired separately in some LS configs) ──
    case "subscription_trial_started": {
      const trialEndsAt = attributes?.trial_ends_at
        ? new Date(attributes.trial_ends_at)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            return d;
          })();

      await activatePro("trial", trialEndsAt, true);
      break;
    }

    // ── Trial ended — check if they converted to paid ──
    case "subscription_trial_ended": {
      const status: string = attributes?.status ?? "";
      if (status === "active") {
        // Trial ended and they are now a paid subscriber — upgrade to full pro
        const { expiry, isYearly } = getExpiryDate();
        await activatePro(isYearly ? "yearly" : "monthly", expiry, false);
      } else {
        // Trial ended, did not convert — revoke Pro
        await revokePro();
      }
      break;
    }

    // ── Subscription renewed successfully ──
    case "subscription_updated": {
      const status: string = attributes?.status ?? "";
      if (status === "active") {
        const { expiry, isYearly } = getExpiryDate();
        await activatePro(isYearly ? "yearly" : "monthly", expiry, false);
      } else if (
        status === "cancelled" ||
        status === "expired" ||
        status === "unpaid"
      ) {
        await revokePro();
      }
      break;
    }

    // ── Subscription cancelled by user ──
    case "subscription_cancelled": {
      // Don't revoke immediately — access continues until period ends
      // Just mark it in DB so you know it's cancelled
      if (userId) {
        await supabase
          .from("profiles")
          .update({ plan: "cancelled" })
          .eq("id", userId);
        console.log(
          `⚠️ Subscription cancelled for user: ${userId} — access continues until expiry`,
        );
      }
      break;
    }

    // ── Subscription fully expired ──
    case "subscription_expired": {
      await revokePro();
      break;
    }

    // ── Payment failed ──
    case "subscription_payment_failed": {
      console.warn(`⚠️ Payment failed for user: ${userId}`);
      // Don't revoke yet — Lemon Squeezy will retry
      // Optionally you could set a "payment_failed" flag here
      break;
    }
    case "subscription_resumed": {
      const { expiry, isYearly } = getExpiryDate();
      await activatePro(isYearly ? "yearly" : "monthly", expiry, false);
      break;
    }

    case "order_refunded":
    case "subscription_payment_refunded": {
      // Revoke Pro on refund
      await revokePro();
      break;
    }
    default:
      console.log(`ℹ️ Unhandled event: ${eventName}`);
  }

  return NextResponse.json({ received: true });
}
