// 📁 Simpan sebagai: hooks/useFavorites.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

interface FavoriteRow {
  poktan_id: string;
}

/**
 * Satu sumber logika favorit dipakai bersama oleh app/page.tsx,
 * app/detail/[id]/page.tsx, dan app/user/favorit/page.tsx supaya perilaku
 * (optimistic update, redirect ke /login kalau guest, rollback kalau gagal)
 * selalu konsisten di semua tempat tanpa duplikasi kode.
 */
export function useFavorites(userId: string | null) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refreshFavorites = useCallback(async () => {
    if (!userId) {
      setFavoriteIds(new Set());
      return;
    }
    const { data, error } = await supabase
      .from("user_favorites")
      .select("poktan_id")
      .eq("user_id", userId)
      .returns<FavoriteRow[]>();

    if (!error && data) {
      setFavoriteIds(new Set(data.map((row) => row.poktan_id)));
    }
  }, [userId]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  // REALTIME: Subscribe ke perubahan user_favorites untuk user ini,
  // sehingga favorit langsung ter-update di semua komponen/halaman.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-favorites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 Realtime update detected in useFavorites:", payload);
          // Refresh favorit setiap ada perubahan (insert/delete)
          refreshFavorites();
        },
      )
      .subscribe((status) => {
        console.log("📡 useFavorites subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshFavorites]);

  const toggleFavorite = useCallback(
    async (poktanId: string) => {
      if (!userId) {
        // Guest tidak boleh menyimpan favorit — arahkan untuk login dulu.
        window.location.href = "/login";
        return;
      }

      const isCurrentlyFavorite = favoriteIds.has(poktanId);

      // Optimistic update supaya ikon hati langsung berubah.
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFavorite) next.delete(poktanId);
        else next.add(poktanId);
        return next;
      });

      try {
        if (isCurrentlyFavorite) {
          const { error } = await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", userId)
            .eq("poktan_id", poktanId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_favorites")
            .insert({ user_id: userId, poktan_id: poktanId });
          if (error) throw error;
        }
      } catch (err) {
        console.error("Gagal memperbarui favorit:", err);
        // Rollback kalau request ke Supabase gagal.
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFavorite) next.add(poktanId);
          else next.delete(poktanId);
          return next;
        });
      }
    },
    [userId, favoriteIds],
  );

  return { favoriteIds, toggleFavorite, refreshFavorites };
}
