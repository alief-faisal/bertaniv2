// 📁 Simpan sebagai: app/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import BannerCarousel from "@/components/BannerCarousel";
import MainMenu from "@/components/MainMenu";
import PoktanCard from "@/components/PoktanCard";
import FilterSidebar from "@/components/FilterSidebar";
import { supabase } from "@/utils/supabase";
import { PoktanProfile } from "@/types";
import { calculateDistanceKm, formatDistance } from "@/utils/distance";
import dynamic from "next/dynamic";
import { useFavorites } from "@/hooks/useFavorites";
import {
  PoktanGridSkeleton,
  MiniMapSkeleton,
} from "@/components/SkeletonShimmer";

// Move dynamic import outside component to avoid recreation on each render
const PoktanMiniMap = dynamic(() => import("@/components/PoktanMiniMap"), {
  ssr: false,
  loading: () => <MiniMapSkeleton />,
});

interface SupabasePoktanRow {
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
}

export default function Home() {
  const [poktanList, setPoktanList] = useState<PoktanProfile[]>([]);
  const [filterKecamatan, setFilterKecamatan] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [minHarga, setMinHarga] = useState<number>(0);
  
  // State dinamis untuk batas atas harga termahal
  const [priceCeiling, setPriceCeiling] = useState<number>(1000000);
  const [maxHarga, setMaxHarga] = useState<number>(1000000);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Flag untuk mendeteksi apakah harga termahal dari database sudah berhasil diambil pertama kali
  const [hasSetInitialMax, setHasSetInitialMax] = useState<boolean>(false);

  // Koordinat GPS pengguna, diisi setelah "Lokasi saat ini" berhasil dideteksi
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get current user ID untuk favorites
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Gunakan hook useFavorites untuk realtime favorites
  const { favoriteIds, toggleFavorite } = useFavorites(currentUserId);

  // Ref supaya tidak setState pada komponen yang sudah unmount
  const isMountedRef = useRef<boolean>(true);

  // Dapatkan user ID saat komponen dimount
  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // Hide scrollbar on mobile for main page
  useEffect(() => {
    document.documentElement.classList.add("hide-scrollbar-mobile");
    document.body.classList.add("hide-scrollbar-mobile");
    return () => {
      document.documentElement.classList.remove("hide-scrollbar-mobile");
      document.body.classList.remove("hide-scrollbar-mobile");
    };
  }, []);

  // Fetch data on mount and when filters change
  useEffect(() => {
    isMountedRef.current = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        // Ambil data tanpa filter harga jika ini adalah inisialisasi awal untuk mencari harga termahal asli
        let query = supabase
          .from("poktan_profiles")
          .select("*")
          .eq("is_active", true);

        // Jika harga maksimal awal sudah terdeteksi, baru filter harga diikutkan ke query Supabase
        if (hasSetInitialMax) {
          query = query.gte("harga_sewa", minHarga).lte("harga_sewa", maxHarga);
        }

        if (filterKecamatan) {
          query = query.eq("kecamatan", filterKecamatan);
        }

        const trimmedKeyword = searchKeyword.trim();
        if (trimmedKeyword !== "") {
          const safeKeyword = trimmedKeyword.replace(/[%_]/g, String.raw`\$&`);
          query = query.ilike("nama_kelompok", `%${safeKeyword}%`);
        }

        query = query.order("created_at", { ascending: false });

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
          gallery_urls: Array.isArray(item.gallery_urls)
            ? item.gallery_urls
            : [],
          latitude: Number(item.latitude) || 0,
          longitude: Number(item.longitude) || 0,
          is_active: item.is_active,
          created_at: item.created_at,
        }));

        // DINAMIS: Deteksi harga termahal dari data asli yang ada di database
        if (mappedData.length > 0 && !hasSetInitialMax) {
          const highestPrice = Math.max(...mappedData.map((o) => o.harga_sewa));
          if (highestPrice > 0) {
            setPriceCeiling(highestPrice);
            setMaxHarga(highestPrice);
            setHasSetInitialMax(true);
          }
        }

        // Jika lokasi GPS diketahui, hitung jarak lalu urutkan terdekat
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
          err instanceof Error
            ? err.message
            : "Gagal memuat data kelompok tani.";
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
    };

    void loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [filterKecamatan, searchKeyword, minHarga, maxHarga, userLocation, hasSetInitialMax]);

  // Helper function to retry fetching data
  const fetchRealData = () => {
    window.location.reload();
  };

  const handleNavbarFilter = (kecamatan: string, search: string) => {
    setFilterKecamatan(kecamatan);
    setSearchKeyword(search);
  };

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
    setMaxHarga(priceCeiling);
  };

  return (
    <>
      <Navbar
        onFilterChange={handleNavbarFilter}
        onLocationDetected={handleLocationDetected}
      />
      <main className="min-h-screen pb-20 bg-[#fcfcfc]">
        <BannerCarousel />
        <MainMenu />

        <section
          aria-labelledby="poktan-heading"
          className="max-w-7xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8"
        >
          {/* ================= STICKY CONTAINER KIRI (MAP + FILTER) ================= */}
          <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* 🗺️ MINI MAP BARU */}
            <PoktanMiniMap data={poktanList} />

            {/* SIDEBAR FILTER */}
            <FilterSidebar
              selectedKecamatan={filterKecamatan}
              onKecamatanChange={(kec) => setFilterKecamatan(kec)}
              minHarga={minHarga}
              maxHarga={maxHarga}
              priceCeiling={priceCeiling}
              onPriceApply={handlePriceApply}
              onReset={handleResetFilters}
            />
          </div>

          {/* KONTEN UTAMA (DAFTAR CARD) */}
          <div className="flex-1 min-w-0">
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4"
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

            {/* KONDISI LOADING (SKELETON GRID) */}
            {loading ? <PoktanGridSkeleton count={6} /> : null}

            {!loading && poktanList.length === 0 && !errorMessage ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200 text-sm text-gray-400">
                Belum ada data kelompok tani yang sesuai untuk filter ini.
              </div>
            ) : null}

            {!loading && poktanList.length > 0 ? (
              /* KONDISI BERHASIL: Grid 3 Kolom Kesamping Pada Desktop */
              <ul className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4 list-none p-0 m-0">
                {poktanList.map((poktan) => (
                  <li key={poktan.id} className="h-full">
                    <PoktanCard
                      data={poktan}
                      isFavorite={favoriteIds.has(poktan.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}