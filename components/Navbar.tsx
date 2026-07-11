// 📁 Simpan sebagai: components/Navbar.tsx
"use client";

import React, { useState, useEffect, MouseEvent, FormEvent } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import { supabase } from "@/utils/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const KECAMATAN_LIST: string[] = [
  "Angsana",
  "Banjar",
  "Bojong",
  "Cadasari",
  "Carita",
  "Cibaliung",
  "Cibitung",
  "Cigeulis",
  "Cikedal",
  "Cikeusik",
  "Cimanggu",
  "Cimanuk",
  "Cipeucang",
  "Cisata",
  "Jiput",
  "Kaduhejo",
  "Karang Tanjung",
  "Koroncong",
  "Labuan",
  "Majasari",
  "Mandalawangi",
  "Mekarjaya",
  "Menes",
  "Munjul",
  "Pagelaran",
  "Pandeglang",
  "Panimbang",
  "Patia",
  "Picung",
  "Pulosari",
  "Saketi",
  "Sindangresmi",
  "Sobang",
  "Sukaresmi",
  "Sumur",
];

interface NavbarProps {
  onFilterChange: (kecamatan: string, search: string) => void;
  // Dipanggil dengan koordinat asli pengguna setelah GPS browser berhasil,
  // supaya halaman utama bisa menghitung & menampilkan badge jarak per kartu.
  onLocationDetected?: (latitude: number, longitude: number) => void;
}

// Batasi angka badge supaya layout tidak melebar, mis. 99+ bukan 134.
function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export default function Navbar({
  onFilterChange,
  onLocationDetected,
}: NavbarProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState<boolean>(false);
  const [selectedLoc, setSelectedLoc] = useState<string>("Semua Wilayah");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);

  const { userId, role: userRole } = useCurrentUser();

  // Jumlah favorit & jumlah pesanan milik pengguna yang sedang login,
  // ditampilkan sebagai badge kecil di navbar.
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);

  useEffect(() => {
    if (!userId) {
      setFavoriteCount(0);
      setOrderCount(0);
      return;
    }

    let isMounted = true;

    const loadCounts = async () => {
      const [favoriteResult, orderResult] = await Promise.all([
        supabase
          .from("user_favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      if (!isMounted) return;
      setFavoriteCount(favoriteResult.count ?? 0);
      setOrderCount(orderResult.count ?? 0);
    };

    loadCounts();

    // REALTIME: begitu ada baris baru/terhapus di user_favorites atau orders
    // milik user ini (dari komponen manapun — PoktanCard, OrderModal, dll),
    // badge di navbar langsung ikut berubah tanpa perlu refresh halaman.
    const channel = supabase
      .channel(`navbar-badges-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=eq.${userId}`,
        },
        () => loadCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        () => loadCounts(),
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleDetectLocation = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingLocation) return;
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLoc("Lokasi Terdekat");
        setIsOpenDropdown(false);
        setLoadingLocation(false);
        // Kosongkan filter kecamatan supaya semua poktan tampil, diurutkan
        // berdasarkan jarak asli dari koordinat GPS (bukan kecamatan tebakan).
        onFilterChange("", searchQuery);
        onLocationDetected?.(latitude, longitude);
      },
      () => {
        alert(
          "Gagal mendeteksi lokasi saat ini. Pastikan izin lokasi browser diaktifkan.",
        );
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleLocationSelect = (
    e: MouseEvent<HTMLButtonElement>,
    kecamatan: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLoc(
      kecamatan === "Semua Wilayah" ? "Semua Wilayah" : `Kec. ${kecamatan}`,
    );
    setIsOpenDropdown(false);

    const filterValue = kecamatan === "Semua Wilayah" ? "" : kecamatan;
    onFilterChange(filterValue, searchQuery);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawLoc = selectedLoc.replace("Kec. ", "");
    const filterValue =
      rawLoc === "Semua Wilayah" || rawLoc === "Lokasi Terdekat" ? "" : rawLoc;
    onFilterChange(filterValue, searchQuery);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="w-full bg-[#008000] text-white sticky top-0 z-[999] shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-3 md:gap-4">
        {/* LOGO */}
        <div className="hidden md:block flex-shrink-0">
          <Link href="/">
            <img
              src="/logo/logo.png"
              alt="Bertani Logo"
              className="h-9 object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* SEARCHBAR & FILTER */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 items-center bg-white rounded-[10px] text-gray-800 shadow-sm h-11 relative max-w-full md:max-w-xl"
        >
          <div className="relative border-r border-gray-200 h-full flex items-center z-[1000]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsOpenDropdown(!isOpenDropdown);
              }}
              aria-haspopup="listbox"
              aria-expanded={isOpenDropdown}
              aria-label="Pilih wilayah atau deteksi lokasi"
              className="flex items-center gap-2 px-2.5 md:px-4 h-full text-xs md:text-sm font-medium transition whitespace-nowrap text-gray-700 rounded-l-md"
            >
              <i
                className="fa-solid fa-location-dot text-gray-700 text-base flex-shrink-0 w-5 text-center"
                aria-hidden="true"
              ></i>
              <span className="max-w-[95px] md:max-w-[150px] truncate">
                {selectedLoc}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform duration-[700ms] ease-in-out ${isOpenDropdown ? "rotate-180" : "rotate-0"}`}
              />
            </button>

            {isOpenDropdown && (
              <div
                role="listbox"
                aria-label="Daftar wilayah"
                className="absolute left-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-[10px] shadow-xl max-h-90 overflow-y-auto z-[1001]"
              >
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="w-full flex items-center gap-2 text-left text-sm font-bold text-[#15803d] hover:opacity-80 disabled:opacity-60"
                    disabled={loadingLocation}
                    aria-label="Deteksi lokasi GPS saat ini"
                  >
                    <i
                      className={`fa-solid fa-location-crosshairs text-xl ${loadingLocation ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    ></i>
                    <span>
                      {loadingLocation ? "Mendeteksi..." : "Lokasi saat ini"}
                    </span>
                  </button>
                </div>

                <div className="p-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Lokasi Terkini
                </div>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedLoc === "Semua Wilayah"}
                  onClick={(e) => handleLocationSelect(e, "Semua Wilayah")}
                  className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-600 hover:bg-green-50 font-semibold text-[#008000] border-b border-gray-100"
                >
                  Semua Wilayah
                </button>
                {KECAMATAN_LIST.map((kec) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedLoc === `Kec. ${kec}`}
                    key={kec}
                    onClick={(e) => handleLocationSelect(e, kec)}
                    className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-green-50 hover:text-[#008000] transition"
                  >
                    {kec}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center flex-1 px-1 h-full rounded-r-md">
            <label htmlFor="navbar-search" className="sr-only">
              Cari kelompok tani atau wilayah
            </label>
            <input
              id="navbar-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kelompok tani, wilayah, dan lainnya ..."
              className="w-full outline-none text-xs md:text-[14px] bg-transparent text-gray-800 px-2"
            />
            <button
              type="submit"
              className="p-2 text-gray-500 cursor-pointer active:scale-110"
              aria-label="Cari"
            >
              <Search className="w-7 h-7" />
            </button>
          </div>
        </form>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {userRole !== "guest" && (
            <Link
              href="/user/favorit"
              className="relative p-1.5 hover:bg-green-800 rounded-full transition flex items-center justify-center text-white"
              aria-label={`Kelompok tani favorit saya${favoriteCount > 0 ? `, ${favoriteCount} tersimpan` : ""}`}
            >
              <Heart className="w-6 h-6 fill-white stroke-none" />
              {favoriteCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border border-[#008000]"
                >
                  {formatBadgeCount(favoriteCount)}
                </span>
              )}
            </Link>
          )}

          {/* Muncul otomatis begitu pengguna punya minimal 1 pesanan */}
          {userRole !== "guest" && orderCount > 0 && (
            <Link
              href="/user/riwayat"
              className="relative p-1.5 hover:bg-green-800 rounded-full transition flex items-center justify-center text-white"
              aria-label={`Riwayat pembayaran saya, ${orderCount} pesanan`}
            >
              <Receipt className="w-6 h-6" />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-yellow-400 text-green-900 text-[10px] font-bold leading-none border border-[#008000]"
              >
                {formatBadgeCount(orderCount)}
              </span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-3">
            {userRole === "guest" ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium hover:underline"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-white text-[#008000] px-4 py-2 rounded-[10px] shadow"
                >
                  Daftar
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={
                    userRole === "admin"
                      ? "/admin"
                      : userRole === "poktan"
                        ? "/poktan"
                        : "/user"
                  }
                  className="flex items-center gap-1 bg-green-800 px-3 py-1.5 rounded-md text-xs font-semibold"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs opacity-80 hover:opacity-100"
                >
                  Keluar
                </button>
              </>
            )}
          </div>

          {/* HAMBURGER BUTTON */}
          <button
            type="button"
            onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
            aria-label="Buka menu"
            aria-expanded={isOpenMobileMenu}
            className="md:hidden flex flex-col justify-center items-center w-6 h-6 relative z-[1002]"
          >
            <span
              className={`block absolute h-0.5 w-6 bg-white rounded-full transition-all duration-300 transform ${isOpenMobileMenu ? "rotate-45" : "-translate-y-1"}`}
            />
            <span
              className={`block absolute h-0.5 w-6 bg-white rounded-full transition-all duration-300 transform ${isOpenMobileMenu ? "-rotate-45" : "translate-y-1"}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
