"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { ProfilesRow } from "@/types";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      if (authData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profileError) throw profileError;

        const activeProfile = profile as ProfilesRow;

        if (activeProfile?.role === "admin") {
          router.push("/admin");
        } else if (activeProfile?.role === "poktan") {
          router.push("/poktan");
        } else {
          router.push("/user");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kredensial salah.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white p-6 rounded-md shadow-sm border border-gray-200"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Masuk ke Akun
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md transition text-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          {/* Tombol Simpel ke Halaman Daftar */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-xs text-green-700 hover:underline"
            >
              Belum punya akun? Daftar
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
