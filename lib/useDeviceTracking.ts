// 📁 SAVE AS: src/lib/useDeviceTracking.ts

import { useEffect } from "react";
import { supabase } from "./supabase";

export function useDeviceTracking(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const trackDevice = async () => {
      try {
        // 1. Get or create a persistent fingerprint for this specific browser
        let fingerprint = localStorage.getItem("quizai_device_fingerprint");
        if (!fingerprint) {
          fingerprint = crypto.randomUUID();
          localStorage.setItem("quizai_device_fingerprint", fingerprint);
        }

        // Generate a readable device name
        const ua = navigator.userAgent;
        let baseDevice = "Unknown OS";
        if (ua.includes("Windows")) baseDevice = "Windows PC";
        else if (ua.includes("Mac")) baseDevice = "Mac";
        else if (ua.includes("iPhone")) baseDevice = "iPhone";
        else if (ua.includes("iPad")) baseDevice = "iPad";
        else if (ua.includes("Android")) baseDevice = "Android";

        let browserName = "Browser";
        if (ua.includes("Chrome") && !ua.includes("Edg"))
          browserName = "Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome"))
          browserName = "Safari";
        else if (ua.includes("Firefox")) browserName = "Firefox";
        else if (ua.includes("Edg")) browserName = "Edge";

        const deviceName = `${browserName} on ${baseDevice}`;
        const now = new Date().toISOString();

        // 2. Check if this exact device is already registered in your user_sessions table
        const { data: existingSession } = await supabase
          .from("user_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("device_fingerprint", fingerprint)
          .single();

        if (existingSession) {
          // Update the "last_active" timestamp
          await supabase
            .from("user_sessions")
            .update({ last_active: now, device_name: deviceName })
            .eq("id", existingSession.id);
        } else {
          // Insert the new device session
          await supabase.from("user_sessions").insert({
            user_id: userId,
            device_fingerprint: fingerprint,
            device_name: deviceName,
            last_active: now,
          });
        }

        // 3. Enforce the 3-device limit
        const { data: activeSessions } = await supabase
          .from("user_sessions")
          .select("id, device_fingerprint")
          .eq("user_id", userId)
          .order("last_active", { ascending: false }); // Sort newest to oldest

        if (activeSessions && activeSessions.length > 3) {
          // Keep the 3 most recently active devices
          const allowedFingerprints = activeSessions
            .slice(0, 3)
            .map((s) => s.device_fingerprint);

          if (!allowedFingerprints.includes(fingerprint)) {
            alert(
              "Device limit reached (Max 3). Please log out of another device to use QuizAI here.",
            );
            await supabase.auth.signOut();
            window.location.href = "/login";
            return;
          }

          // Clean up the old records from your database to keep it tidy
          const sessionsToDelete = activeSessions.slice(3);
          for (const session of sessionsToDelete) {
            await supabase.from("user_sessions").delete().eq("id", session.id);
          }
        }
      } catch (error) {
        console.error("Device tracking error:", error);
      }
    };

    trackDevice();
  }, [userId]);
}
