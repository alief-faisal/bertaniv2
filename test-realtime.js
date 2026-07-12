/**
 * Test Script untuk Supabase Realtime
 *
 * Buka file ini di browser console untuk test realtime connection
 */

import { supabase } from "./utils/supabase";

async function testRealtimeConnection() {
  console.log("🧪 Testing Supabase Realtime Connection...");

  // 1. Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ User tidak login:", authError);
    return;
  }

  console.log("✅ User ID:", user.id);

  // 2. Subscribe to user_favorites changes
  const channel = supabase
    .channel(`test-favorites-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_favorites",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log("🎉 REALTIME EVENT RECEIVED!", payload);
        console.log("Event type:", payload.eventType);
        console.log("New data:", payload.new);
        console.log("Old data:", payload.old);
      },
    )
    .subscribe((status, err) => {
      console.log("📡 Subscription status:", status);
      if (err) {
        console.error("❌ Subscription error:", err);
      }

      if (status === "SUBSCRIBED") {
        console.log("✅ Successfully subscribed to realtime updates!");
        console.log(
          "👉 Now try adding/removing a favorite and watch for events...",
        );
      } else if (status === "CHANNEL_ERROR") {
        console.error(
          "❌ Channel error - Make sure Realtime is enabled in Supabase Dashboard!",
        );
        console.log("📖 Read REALTIME_SETUP.md for instructions");
      } else if (status === "TIMED_OUT") {
        console.error("❌ Connection timed out");
      }
    });

  // Cleanup after 60 seconds
  setTimeout(() => {
    console.log("⏱️ Test finished. Unsubscribing...");
    supabase.removeChannel(channel);
  }, 60000);
}

// Run test
testRealtimeConnection();
