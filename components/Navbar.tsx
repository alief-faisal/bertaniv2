"use client";

import React, { useState, useEffect, MouseEvent, FormEvent } from "react";
import Link from "next/link";
import { Search, ChevronDown, Heart, LayoutDashboard } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { UserRole } from "@/types";

const KECAMATAN_LIST: string[] = [
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
}

export default function Navbar({ onFilterChange }: NavbarProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState<boolean>(false);
  const [selectedLoc, setSelectedLoc] = useState<string>("Semua Wilayah");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole>("guest");
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!error && data) {
          setUserRole(data.role as UserRole);
        }
      }
    };
    checkUser();
  }, []);

  const handleDetectLocation = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    loadingLocation ? null : setLoadingLocation(true);

    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setSelectedLoc("Lokasi Terdekat");
        setIsOpenDropdown(false);
        setLoadingLocation(false);
        onFilterChange("Pandeglang", searchQuery);
      },
      () => {
        alert("Gagal mendeteksi lokasi saat ini.");
        setLoadingLocation(false);
      },
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
              className="flex items-center gap-2 px-2.5 md:px-4 h-full text-xs md:text-sm font-medium transition whitespace-nowrap text-gray-700 rounded-l-md"
            >
              {/* MENGGUNAKAN FONTAWESOME MAP-PIN */}
              <i className="fa-solid fa-location-dot text-gray-700 text-base flex-shrink-0 w-5 text-center"></i>
              <span className="max-w-[95px] md:max-w-[150px] truncate">
                {selectedLoc}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform duration-[700ms] ease-in-out ${isOpenDropdown ? "rotate-180" : "rotate-0"}`}
              />
            </button>

            {isOpenDropdown && (
              <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-[10px] shadow-xl max-h-90 overflow-y-auto z-[1001]">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="w-full flex items-center gap-2 text-left text-sm font-bold text-[#15803d] hover:opacity-80"
                  >
                    {/* MENGGUNAKAN FONTAWESOME CROSSHAIRS */}
                    <i
                      className={`fa-solid fa-location-crosshairs text-xl ${loadingLocation ? "animate-spin" : ""}`}
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
                  onClick={(e) => handleLocationSelect(e, "Semua Wilayah")}
                  className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-600 hover:bg-green-50 font-semibold text-[#008000] border-b border-gray-100"
                >
                  Semua Wilayah
                </button>
                {KECAMATAN_LIST.map((kec) => (
                  <button
                    type="button"
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kelompok tani, wilayah, dan lainnya ..."
              className="w-full outline-none text-xs md:text-[14px] bg-transparent text-gray-800 px-2"
            />
            <button
              type="submit"
              className="p-2 text-gray-500 cursor-pointer active:scale-110"
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
              className="p-1.5 hover:bg-green-800 rounded-full transition flex items-center justify-center text-white"
            >
              <Heart className="w-6 h-6 fill-white stroke-none" />
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
