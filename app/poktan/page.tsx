"use client";

import React from "react";
import { supabase } from "@/utils/supabase";

export default function PoktanDashboardPage() {
  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Dashboard Ketua Kelompok Tani
      </h1>
      <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Kelola inventarisasi alsintan dan pemetaan lahan produktif di sini.
        </p>
      </div>
    </main>
  );
}
