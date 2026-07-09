"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { ProfilesRow } from "@/types";

interface PoktanLayoutProps {
  children: ReactNode;
}

export default function PoktanLayout({ children }: PoktanLayoutProps) {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkPoktan = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const activeProfile = profile as ProfilesRow;

      if (activeProfile?.role !== "poktan" && activeProfile?.role !== "admin") {
        router.push("/");
      } else {
        setAuthorized(true);
      }
    };

    checkPoktan();
  }, [router]);

  if (!authorized)
    return (
      <div className="p-6 text-sm text-center">
        Memvalidasi Akses Kelompok Tani...
      </div>
    );

  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
