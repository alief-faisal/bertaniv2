"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setAuthenticated(true);
      }
    };

    checkUser();
  }, [router]);

  if (!authenticated)
    return (
      <div className="p-6 text-sm text-center">
        Mengecek Autentikasi Sesi...
      </div>
    );

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
