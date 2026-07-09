"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { ProfilesRow } from "@/types";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
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

      if (activeProfile?.role !== "admin") {
        router.push("/");
      } else {
        setAuthorized(true);
      }
    };

    checkAdmin();
  }, [router]);

  if (!authorized)
    return (
      <div className="p-6 text-sm text-center">Memvalidasi Akses Admin...</div>
    );

  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
