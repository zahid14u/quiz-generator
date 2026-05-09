// 📁 SAVE AS: lib/useDeviceTracking.ts

"use client";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

// Generates a stable fingerprint for this browser/device
function getDeviceFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || "",
  ].join("|");

  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Parses a human-readable device name from userAgent
function getDeviceName(): string {
  const ua = window.navigator.userAgent;
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (/Windows NT 10/.test(ua)) os = "Windows 10";
  else if (/Windows NT 11/.test(ua)) os = "Windows 11";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  else if (/OPR\//.test(ua)) browser = "Opera";

  return `${browser} on ${os}`;
}

export function useDeviceTracking(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const trackDevice = async () => {
      try {
        const fingerprint = getDeviceFingerprint();
        const deviceName = getDeviceName();
        const now = new Date().toISOString();

        // Check if this device is already tracked
        const { data: existing } = await supabase
          .from("user_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("device_fingerprint", fingerprint)
          .single();

        if (existing) {
          // Update last_active
          await supabase
            .from("user_sessions")
            .update({ last_active: now })
            .eq("id", existing.id);
        } else {
          // Insert new device session
          await supabase.from("user_sessions").insert({
            user_id: userId,
            device_fingerprint: fingerprint,
            device_name: deviceName,
            last_active: now,
            created_at: now,
          });
        }
      } catch (err) {
        // Silently fail — tracking should never break the app
        console.warn("Device tracking error:", err);
      }
    };

    trackDevice();
  }, [userId]);
}
