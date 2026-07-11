// 📁 Simpan sebagai: hooks/useCurrentUser.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { UserRole } from "@/types";

interface CurrentUserState {
  userId: string | null;
  role: UserRole | "guest";
  loading: boolean;
}

/**
 * Hook kecil dipakai di banyak tempat (Navbar, halaman detail, dll) supaya
 * logika "siapa yang sedang login & apa rolenya" tidak diduplikasi di
 * setiap komponen. Otomatis membaca ulang session + role setiap kali status
 * login berubah (login/logout/refresh token) lewat supabase.auth.onAuthStateChange,
 * jadi tombol yang bergantung pada role (mis. tombol Order) selalu akurat
 * tanpa perlu reload halaman.
 */
export function useCurrentUser(): CurrentUserState {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | "guest">("guest");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMounted) {
          setUserId(null);
          setRole("guest");
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!isMounted) return;
      setUserId(session.user.id);
      setRole(!error && data ? (data.role as UserRole) : "guest");
      setLoading(false);
    };

    load();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { userId, role, loading };
}
