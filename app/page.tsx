// 📁 Simpan sebagai: app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import BannerCarousel from "@/components/BannerCarousel";
import MainMenu from "@/components/MainMenu";
import PoktanCard from "@/components/PoktanCard";
import FilterSidebar from "@/components/FilterSidebar";
import { supabase } from "@/utils/supabase";
import { PoktanProfile } from "@/types";
import { calculateDistanceKm, formatDistance } from "@/utils/distance";

interface SupabasePoktanRow {
  id: string;
  nama_kelompok: string;
  kecamatan: string;
  jumlah_anggota: number;
  harga_sewa: number | string;
  diskon_persen: number;
  banner_url: string | null;
  latitude: number | string;
  longitude: number | string;
  is_active: boolean;
  created_at: string;
}

const PRICE_CEILING = 5_000_000; // batas atas slider harga; sesuaikan dengan data riil

export default function Home() {
  const [poktanList, setPoktanList] = useState<PoktanProfile[]>([]);
  const [filterKecamatan, setFilterKecamatan] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [minHarga, setMinHarga] = useState<number>(0);
  const [maxHarga, setMaxHarga] = useState<number>(PRICE_CEILING);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Koordinat GPS pengguna, diisi setelah "Lokasi saat ini" berhasil dideteksi
  // di Navbar. Dipakai untuk menghitung + mengurutkan jarak tiap poktan.
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Set id poktan yang sudah difavoritkan pengguna yang sedang login.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Ref supaya tidak setState pada komponen yang sudah unmount (mis. saat
  // pengguna berpindah halaman sebelum request selesai).
  const isMountedRef = useRef<boolean>(true);

  const fetchRealData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let query = supabase
        .from("poktan_profiles")
        .select("*")
        .eq("is_active", true)
        .gte("harga_sewa", minHarga)
        .lte("harga_sewa", maxHarga)
        .order("created_at", { ascending: false });

      if (filterKecamatan) {
        query = query.eq("kecamatan", filterKecamatan);
      }

      const trimmedKeyword = searchKeyword.trim();
      if (trimmedKeyword !== "") {
        // Escape karakter khusus ILIKE (% dan _) agar tidak jadi wildcard tak terduga
        const safeKeyword = trimmedKeyword.replace(/[%_]/g, "\\$&");
        query = query.ilike("nama_kelompok", `%${safeKeyword}%`);
      }

      const { data, error } = await query.returns<SupabasePoktanRow[]>();

      if (error) {
        throw new Error(error.message);
      }

      if (!isMountedRef.current) return;

      let mappedData: PoktanProfile[] = (data ?? []).map((item) => ({
        id: item.id,
        nama_kelompok: item.nama_kelompok,
        kecamatan: item.kecamatan,
        jumlah_anggota: item.jumlah_anggota,
        harga_sewa: Number(item.harga_sewa) || 0,
        diskon_persen: item.diskon_persen,
        banner_url: item.banner_url || "",
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        is_active: item.is_active,
        created_at: item.created_at,
      }));

      // Kalau lokasi GPS pengguna sudah diketahui, hitung jarak tiap poktan
      // lalu urutkan dari yang terdekat.
      if (userLocation) {
        mappedData = mappedData
          .map((poktan) => {
            const distanceKm = calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              poktan.latitude,
              poktan.longitude,
            );
            return {
              ...poktan,
              distanceKm,
              // `distance` (string) adalah label badge siap-tampil sesuai
              // definisi di types/index.ts, PoktanCard cukup membacanya
              // langsung tanpa perlu format ulang.
              distance: formatDistance(distanceKm),
            };
          })
          .sort(
            (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
          );
      }

      setPoktanList(mappedData);
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg =
        err instanceof Error ? err.message : "Gagal memuat data kelompok tani.";
      console.error("Supabase Error:", errorMsg);
      setErrorMessage(
        "Gagal memuat data kelompok tani. Silakan periksa koneksi Anda dan coba lagi.",
      );
      setPoktanList([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filterKecamatan, searchKeyword, minHarga, maxHarga, userLocation]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRealData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchRealData]);

  // Ambil daftar favorit milik pengguna yang sedang login (kalau ada), agar
  // tombol love di tiap PoktanCard langsung menunjukkan status yang benar.
  const fetchFavorites = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .select("poktan_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setFavoriteIds(
        new Set(data.map((row: { poktan_id: string }) => row.poktan_id)),
      );
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = async (poktanId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Belum login: arahkan ke halaman masuk supaya favorit tersimpan ke akun.
      window.location.href = "/login";
      return;
    }

    const isCurrentlyFavorite = favoriteIds.has(poktanId);

    // Optimistic update supaya ikon hati langsung berubah tanpa menunggu
    // roundtrip ke Supabase.
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
          .eq("user_id", user.id)
          .eq("poktan_id", poktanId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, poktan_id: poktanId });
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
  };

  const handleNavbarFilter = (kecamatan: string, search: string) => {
    setFilterKecamatan(kecamatan);
    setSearchKeyword(search);
  };

  // Dipanggil Navbar setelah GPS browser berhasil mendeteksi koordinat asli
  // pengguna (tombol "Lokasi saat ini").
  const handleLocationDetected = (latitude: number, longitude: number) => {
    setUserLocation({ latitude, longitude });
  };

  const handlePriceApply = (min: number, max: number) => {
    setMinHarga(min);
    setMaxHarga(max);
  };

  const handleResetFilters = () => {
    setFilterKecamatan("");
    setMinHarga(0);
    setMaxHarga(PRICE_CEILING);
  };

  return (
    <>
      <Navbar
        onFilterChange={handleNavbarFilter}
        onLocationDetected={handleLocationDetected}
      />
      <main className="min-h-screen pb-20 bg-gray-50">
        <BannerCarousel />
        <MainMenu />

        <section
          aria-labelledby="poktan-heading"
          className="max-w-7xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-6"
        >
          <FilterSidebar
            selectedKecamatan={filterKecamatan}
            onKecamatanChange={(kec) => setFilterKecamatan(kec)}
            minHarga={minHarga}
            maxHarga={maxHarga}
            priceCeiling={PRICE_CEILING}
            onPriceApply={handlePriceApply}
            onReset={handleResetFilters}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2
                id="poktan-heading"
                className="text-xl font-bold text-gray-800"
              >
                Kelompok Tani Terdaftar
              </h2>
              {!loading && (
                <span className="text-xs text-gray-400">
                  {poktanList.length} kelompok ditemukan
                  {userLocation
                    ? " · diurutkan berdasarkan jarak terdekat"
                    : ""}
                </span>
              )}
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4"
              >
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => fetchRealData()}
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
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-40 rounded-lg" />
                ))}
              </div>
            ) : poktanList.length === 0 && !errorMessage ? (
              <div className="text-center py-20 bg-white rounded-md border border-gray-200 text-sm text-gray-400">
                Belum ada data kelompok tani yang sesuai untuk filter ini.
              </div>
            ) : (
              <ul className="flex flex-col gap-4 list-none p-0 m-0">
                {poktanList.map((poktan) => (
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
          </div>
        </section>
      </main>
    </>
  );
}
