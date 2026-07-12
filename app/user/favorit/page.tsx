// 📁 Simpan sebagai: app/user/favorit/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PoktanCard from "@/components/PoktanCard";
import { supabase } from "@/utils/supabase";
import { PoktanProfile } from "@/types";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteJoinRow {
  poktan_profiles: {
    id: string;
    nama_kelompok: string;
    kecamatan: string;
    jumlah_anggota: number;
    harga_sewa: number | string;
    diskon_persen: number;
    banner_url: string | null;
    gallery_urls: string[] | null;
    latitude: number | string;
    longitude: number | string;
    is_active: boolean;
    created_at: string;
  } | null;
}

export default function UserFavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<PoktanProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Gunakan hook useFavorites untuk realtime favorites
  const { favoriteIds, toggleFavorite } = useFavorites(currentUserId);

  // Load Font Awesome CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

  // Dapatkan user ID saat komponen dimount
  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);
    };
    getUserId();
  }, [router]);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Halaman favorit hanya untuk pengguna yang sudah login.
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .select("poktan_profiles (*)")
      .eq("user_id", user.id)
      .returns<FavoriteJoinRow[]>();

    if (error) {
      console.error("Gagal memuat favorit:", error.message);
      setErrorMessage("Gagal memuat daftar favorit. Coba lagi.");
      setFavorites([]);
      setLoading(false);
      return;
    }

    const mapped: PoktanProfile[] = (data ?? [])
      .map((row) => row.poktan_profiles)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item) => ({
        id: item.id,
        nama_kelompok: item.nama_kelompok,
        kecamatan: item.kecamatan,
        jumlah_anggota: item.jumlah_anggota,
        harga_sewa: Number(item.harga_sewa) || 0,
        diskon_persen: item.diskon_persen,
        banner_url: item.banner_url || "",
        gallery_urls: Array.isArray(item.gallery_urls) ? item.gallery_urls : [],
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        is_active: item.is_active,
        created_at: item.created_at,
      }));

    setFavorites(mapped);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (currentUserId) {
      fetchFavorites();
    }
  }, [fetchFavorites, currentUserId]);

  // Wrapper untuk handle toggle favorit dengan optimistic update pada list
  const handleToggleFavorite = async (poktanId: string) => {
    // Hapus dari list secara optimistik
    setFavorites((prev) => prev.filter((p) => p.id !== poktanId));

    // Toggle favorit menggunakan hook (sudah ada rollback otomatis di hook)
    await toggleFavorite(poktanId);
  };

  return (
    <>
      <Navbar onFilterChange={() => {}} />
      <main className="min-h-screen bg-gray-50 pb-20">
        <section
          aria-labelledby="favorit-heading"
          className="max-w-4xl mx-auto px-4 py-8"
        >
          <h1
            id="favorit-heading"
            className="text-xl font-bold text-gray-800 mb-6"
          >
            Kelompok Tani Favorit Anda
          </h1>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4"
            >
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => fetchFavorites()}
                className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {loading ? (
            <div
              aria-busy="true"
              aria-live="polite"
              className="flex flex-col gap-4 animate-pulse"
            >
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-40 rounded-lg" />
              ))}
            </div>
          ) : favorites.length === 0 && !errorMessage ? (
            <div className="text-center py-20 bg-white rounded-md border border-gray-200 text-sm text-gray-400">
              Anda belum menambahkan kelompok tani ke favorit. Ketuk ikon
              bookmark pada kartu kelompok tani untuk menyimpannya di sini.
            </div>
          ) : (
            <ul className="flex flex-col gap-4 list-none p-0 m-0">
              {favorites.map((poktan) => (
                <li key={poktan.id}>
                  <PoktanCard
                    data={poktan}
                    isFavorite={favoriteIds.has(poktan.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
