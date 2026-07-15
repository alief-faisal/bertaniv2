// 📁 Simpan sebagai: components/FilterSidebar.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { KECAMATAN_LIST } from "@/components/Navbar";

interface FilterSidebarProps {
  selectedKecamatan: string;
  onKecamatanChange: (kecamatan: string) => void;
  minHarga: number;
  maxHarga: number;
  priceCeiling: number;
  onPriceApply: (min: number, max: number) => void;
  onReset: () => void;
}

// Fungsi pembantu untuk mengubah angka menjadi format IDR (contoh: 150000 -> "IDR 150.000")
const formatRupiah = (value: number): string => {
  if (!value) return "IDR 0";
  const numberString = value.toString();
  const sisa = numberString.length % 3;
  let rupiah = numberString.substr(0, sisa);
  const ribuan = numberString.substr(sisa).match(/\d{3}/g);

  if (ribuan) {
    const separator = sisa ? "." : "";
    rupiah += separator + ribuan.join(".");
  }

  return `IDR ${rupiah}`;
};

// Fungsi pembantu untuk membersihkan format string menjadi angka murni kembali
const parseRawNumber = (value: string): number => {
  const rawValue = value.replace(/[^0-9]/g, "");
  return Number(rawValue) || 0;
};

export default function FilterSidebar({
  selectedKecamatan,
  onKecamatanChange,
  minHarga,
  maxHarga,
  priceCeiling,
  onPriceApply,
  onReset,
}: FilterSidebarProps) {
  const [localMin, setLocalMin] = useState<number>(minHarga);
  const [localMax, setLocalMax] = useState<number>(maxHarga);

  // State untuk mengontrol expand/collapse list wilayah di desktop
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    setLocalMin(minHarga);
    setLocalMax(maxHarga);
  }, [minHarga, maxHarga]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const safeMin = Math.max(0, Math.min(localMin, localMax));
    const safeMax = Math.max(safeMin, localMax);
    onPriceApply(safeMin, safeMax);
  };

  // Logika memotong list kecamatan (Tampilkan 10 item pertama jika tidak di-expand)
  const visibleKecamatan = useMemo(() => {
    if (isExpanded) return KECAMATAN_LIST;
    return KECAMATAN_LIST.slice(0, 10);
  }, [isExpanded]);

  // Hitung sisa kecamatan yang tersembunyi
  const hiddenCount = KECAMATAN_LIST.length - 10;

  return (
    <aside
      aria-label="Filter pencarian kelompok tani"
      className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28 lg:self-start space-y-6"
    >
      {/* HEADER FILTER */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <SlidersHorizontal className="w-4 h-4 text-[#008000]" />
          Filter Pencarian
        </h2>
        <button
          type="button"
          onClick={() => {
            onReset();
            setIsExpanded(false);
          }}
          className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-[#008000] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* FILTER HARGA */}
      <form onSubmit={handleApplyPrice} className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase">
          Tarif Jasa per Hari
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label
              htmlFor="harga-min"
              className="block text-[10px] text-slate-800 mb-1 font-medium"
            >
              MIN
            </label>
            <input
              id="harga-min"
              type="text"
              value={formatRupiah(localMin)}
              onChange={(e) => {
                const rawValue = parseRawNumber(e.target.value);
                if (rawValue <= priceCeiling) {
                  setLocalMin(rawValue);
                }
              }}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none focus:border-[#008000] focus:ring-1 focus:ring-[#008000]"
            />
          </div>
          <span className="text-gray-300 mt-4">—</span>
          <div className="flex-1">
            <label
              htmlFor="harga-max"
              className="block text-[10px] text-gray-700 mb-1 font-medium"
            >
              MAKS
            </label>
            <input
              id="harga-max"
              type="text"
              value={formatRupiah(localMax)}
              onChange={(e) => {
                const rawValue = parseRawNumber(e.target.value);
                if (rawValue <= priceCeiling) {
                  setLocalMax(rawValue);
                }
              }}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white outline-none focus:border-[#008000] focus:ring-1 focus:ring-[#008000]"
            />
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={priceCeiling}
          value={localMax}
          onChange={(e) => setLocalMax(Number(e.target.value))}
          className="w-full accent-[#008000] cursor-pointer"
          aria-label="Geser batas maksimum tarif sewa"
        />

        <button
          type="submit"
          className="w-full bg-[#008000] text-white text-[14px] font-bold py-2 rounded-lg hover:bg-green-700 shadow-sm transition cursor-pointer"
        >
          Terapkan Harga
        </button>
      </form>

      {/* FILTER WILAYAH (CHECKBOX BOX LIST) */}
      <fieldset className="space-y-2 pt-2 border-t border-gray-100">
        <legend className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Wilayah / Kecamatan
        </legend>

        {/* 📱 Mobile: Max 5 item scrollable | 💻 Desktop: Normal auto-height list */}
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 lg:max-h-none lg:overflow-y-visible lg:pr-0 scrollbar-thin">
          {/* OPSI: Semua Wilayah */}
          <label className="flex items-center gap-2.5 py-1.5 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={selectedKecamatan === ""}
              onChange={() => onKecamatanChange("")}
              className="w-4 h-4 rounded border-gray-300 text-[#008000] focus:ring-[#008000] accent-[#008000] shrink-0"
            />
            <span
              className={`transition-colors text-xs ${selectedKecamatan === ""} ? "text-[#008000] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}
            >
              Semua Wilayah
            </span>
          </label>

          {/* 💻 List khusus Tampilan Desktop (Potong 10 item awal) */}
          <div className="hidden lg:block space-y-1">
            {visibleKecamatan.map((kec) => (
              <label
                key={`desktop-${kec}`}
                className="flex items-center gap-2.5 py-1.5 text-sm text-gray-600"
              >
                <input
                  type="checkbox"
                  checked={selectedKecamatan === kec}
                  onChange={() => onKecamatanChange(kec)}
                  className="w-4 h-4 rounded border-gray-300 text-[#008000] focus:ring-[#008000] accent-[#008000] shrink-0"
                />
                <span
                  className={`transition-colors text-xs ${selectedKecamatan === kec ? "text-[#008000] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}
                >
                  Kec. {kec}
                </span>
              </label>
            ))}
          </div>

          {/* 📱 List khusus Tampilan Mobile (Render semua di dalam scroll view) */}
          <div className="block lg:hidden space-y-1">
            {KECAMATAN_LIST.map((kec) => (
              <label
                key={`mobile-${kec}`}
                className="flex items-center gap-2.5 py-1.5 text-sm text-gray-600 "
              >
                <input
                  type="checkbox"
                  checked={selectedKecamatan === kec}
                  onChange={() => onKecamatanChange(kec)}
                  className="w-4 h-4 rounded border-gray-300 text-[#008000] focus:ring-[#008000] accent-[#008000] shrink-0"
                />
                <span
                  className={`transition-colors text-xs ${selectedKecamatan === kec ? "text-[#008000] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}
                >
                  Kec. {kec}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 💻 TOMBOL EXPAND/COLLAPSE (Hanya Muncul di Desktop) */}
        {KECAMATAN_LIST.length > 10 && (
          <div className="hidden lg:block pt-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-1 text-xs font-bold text-[#008000] transition"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  <span className="group-hover:underline decoration-[#008000] underline-offset-4 cursor-pointer">
                    Sembunyikan
                  </span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  <span className="group-hover:underline decoration-[#008000] underline-offset-4 cursor-pointer">
                    Tampilkan Semua (+{hiddenCount})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </fieldset>
    </aside>
  );
}
