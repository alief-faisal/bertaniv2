"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { PoktanProfile } from "@/types"; // Pastikan interface ini sudah mencakup id, nama_kelompok, dll.

export default function UserFavoritesPage() {
  const [favorites, setFavorites] = useState<PoktanProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Join tabel user_favorites dengan poktan_profiles
      const { data } = await supabase
        .from("user_favorites")
        .select(`poktan_profiles (*)`)
        .eq("user_id", user.id);

      if (data) {
        // Mengambil array poktan saja dari hasil join
        const poktanData = data.map((item: any) => item.poktan_profiles);
        setFavorites(poktanData);
      }
    }
    setLoading(false);
  };

  const removeFavorite = async (poktanId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("poktan_id", poktanId);

    fetchFavorites(); // Refresh data
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Kelompok Tani Favorit Anda</h1>

      {loading ? (
        <p>Memuat data...</p>
      ) : favorites.length === 0 ? (
        <p className="text-gray-500">
          Anda belum menambahkan kelompok tani ke favorit.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {favorites.map((poktan) => (
            <div
              key={poktan.id}
              className="bg-white p-4 rounded-xl shadow border border-gray-100"
            >
              <img
                src={poktan.banner_url}
                alt={poktan.nama_kelompok}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              <h2 className="font-bold text-lg">{poktan.nama_kelompok}</h2>
              <p className="text-sm text-gray-600 mb-4">{poktan.kecamatan}</p>
              <button
                onClick={() => removeFavorite(poktan.id)}
                className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition"
              >
                Hapus dari Favorit
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
