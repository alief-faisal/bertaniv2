// 📁 Simpan sebagai: components/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef, MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronDown, LayoutDashboard, Receipt } from "lucide-react";
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
  onLocationDetected?: (latitude: number, longitude: number) => void;
}

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

  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);

  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // Ref untuk mendeteksi klik di luar dropdown lokasi
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Menutup dropdown saat mengklik di luar komponen dropdown lokasi
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpenDropdown(false);
      }
    };

    if (isOpenDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenDropdown]);

  // 2. Reset otomatis data filter saat query pencarian dikosongkan
  useEffect(() => {
    if (searchQuery === "") {
      const rawLoc = selectedLoc.replace("Kec. ", "");
      const filterValue =
        rawLoc === "Semua Wilayah" || rawLoc === "Lokasi Terdekat"
          ? ""
          : rawLoc;
      onFilterChange(filterValue, "");
    }
  }, [searchQuery, selectedLoc, onFilterChange]);

  // 3. Load Font Awesome Icon
  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

  // 4. Fetch Badges (Favorit & Pesanan)
  useEffect(() => {
    if (!userId) return;

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

    const channel = supabase
      .channel(`navbar-badges-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=${userId}`,
        },
        () => loadCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=${userId}`,
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleLogoClick = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;

    if (timeDiff < 500) {
      window.location.reload();
    } else {
      window.location.href = "/";
    }

    setLastClickTime(currentTime);
  };

  return (
    <header className="w-full bg-[#008000] md:bg-[#ffff] text-white sticky top-0 z-[999] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-3 md:gap-4">
        {/* LOGO */}
        <div className="hidden md:block shrink-0">
          <button
            onClick={handleLogoClick}
            className="cursor-pointer bg-transparent border-0 p-0"
            type="button"
            aria-label="Kembali ke beranda"
          >
            <Image
              src="/logo/logo.png"
              alt="Bertani Logo"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </button>
        </div>

        {/* SEARCHBAR & FILTER */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 items-center gap-2 max-w-full md:max-w-3xl"
        >
          {/* TOMBOL & DROPDOWN LOKASI */}
          <div
            ref={dropdownRef}
            className="relative border border-gray-300 rounded-[10px] bg-white h-11 flex items-center shrink-0 z-[1000] focus-within:ring-2 focus-within:ring-[#008000] focus-within:border-transparent transition-all"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsOpenDropdown((prev) => !prev);
              }}
              aria-haspopup="listbox"
              aria-expanded={isOpenDropdown}
              aria-label="Pilih wilayah atau deteksi lokasi"
              className="flex items-center gap-2 px-2.5 md:px-4 h-full text-xs md:text-sm font-medium transition whitespace-nowrap text-gray-700 rounded-[10px] outline-none"
            >
              <i
                className="fa-solid fa-location-dot text-gray-700 text-base shrink-0 w-5 text-center"
                aria-hidden="true"
              ></i>
              <span className="max-w-[95px] md:max-w-[150px] truncate">
                {selectedLoc}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform duration-700 ease-in-out ${
                  isOpenDropdown ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {/* DROPDOWN MENU */}
            {isOpenDropdown && (
              <div
                role="listbox"
                aria-label="Daftar wilayah"
                /* 
                  style={{ overscrollBehavior: "contain" }} memicu isolasi scroll 
                  agar mouse scroll wheel berhenti di dalam kontainer ini tanpa menggerakkan latar belakang (body).
                */
                style={{ overscrollBehavior: "contain" }}
                className="absolute left-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-[10px] shadow-xl max-h-80 overflow-y-auto z-[1001]"
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
                      className={`fa-solid fa-location-crosshairs text-xl ${
                        loadingLocation ? "animate-spin" : ""
                      }`}
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
                  className="w-full text-left px-4 py-2 text-xs md:text-sm hover:bg-green-50 font-semibold text-[#008000] border-b border-gray-100"
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

          {/* KOTAK INPUT SEARCHBAR */}
          <div className="flex items-center flex-1 px-1 h-11 bg-white border border-gray-300 rounded-[10px] text-gray-800 focus-within:ring-2 focus-within:ring-[#008000] focus-within:border-transparent transition-all group">
            <label htmlFor="navbar-search" className="sr-only">
              Cari kelompok tani atau wilayah
            </label>
            <input
              id="navbar-search"
              type="text"
              value={searchQuery}
              // Begitu pengguna mengklik/fokus pada searchbar, dropdown otomatis tertutup
              onFocus={() => setIsOpenDropdown(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Temukan kelompok tani, wilayah dan lainnya ..."
              className="w-full outline-none text-md md:text-[15px] text-gray-900 px-2 bg-transparent"
            />
            <button
              type="submit"
              className="p-2 text-gray-500 cursor-pointer active:scale-110 outline-none transition-colors group-focus-within:text-[#008000]"
              aria-label="Cari"
            >
              <Search className="w-7 h-7" />
            </button>
          </div>
        </form>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {userRole !== "guest" && (
            <Link
              href="/user/favorit"
              className="relative w-12 h-12 hover:bg-green-800 rounded-full transition flex items-center justify-center text-green-800 hover:text-white"
              aria-label={`Kelompok tani favorit saya${
                favoriteCount > 0 ? `, ${favoriteCount} tersimpan` : ""
              }`}
            >
              <i className="fa-solid fa-bookmark text-lg" aria-hidden="true" />
              {favoriteCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-yellow-400 text-green-900 text-[10px] font-bold leading-none border border-[#008000]"
                >
                  {formatBadgeCount(favoriteCount)}
                </span>
              )}
            </Link>
          )}

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
                  className="text-[14px] text-[#008000] font-medium hover:underline"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="text-[14px] font-medium bg-[#008000] text-white px-4 py-1.5 rounded-[5px] shadow"
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
                  className="flex items-center gap-1 bg-green-800 px-3 py-1.5 rounded-md text-[14px] font-semibold"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[14px] bg-white text-green-800 px-3 py-1.5 rounded-md opacity-100 hover:opacity-100 hover:underline cursor-pointer font-semibold"
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
              className={`block absolute h-2 w-6 bg-white rounded-full transition-all duration-300 transform ${
                isOpenMobileMenu ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`block absolute h-2 w-6 bg-white rounded-full transition-all duration-300 transform ${
                isOpenMobileMenu ? "-rotate-45" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
