"use client";

import React, { useEffect, useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { KECAMATAN_LIST } from "@/components/Navbar";

interface FilterSidebarProps {
  selectedKecamatan: string; // "" berarti Semua Wilayah
  onKecamatanChange: (kecamatan: string) => void;
  minHarga: number;
  maxHarga: number;
  priceCeiling: number; // batas atas slider, mis. harga tertinggi di data
  onPriceApply: (min: number, max: number) => void;
  onReset: () => void;
}

/**
 * Sidebar filter di sisi kiri halaman utama (mirip filter properti pada
 * situs booking). Radio button untuk wilayah bekerja terhadap state
 * `filterKecamatan` yang sama dengan dropdown lokasi di Navbar, sehingga
 * keduanya selalu sinkron. Filter harga dikirim ke query Supabase (gte/lte).
 */
export default function FilterSidebar({
  selectedKecamatan,
  onKecamatanChange,
  minHarga,
  maxHarga,
  priceCeiling,
  onPriceApply,
  onReset,
}: FilterSidebarProps) {
  // Nilai lokal supaya input harga tidak langsung memicu fetch di tiap
  // ketikan; baru diterapkan saat tombol "Terapkan" ditekan.
  const [localMin, setLocalMin] = useState<number>(minHarga);
  const [localMax, setLocalMax] = useState<number>(maxHarga);

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

  return (
    <aside
      aria-label="Filter pencarian kelompok tani"
      className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start"
    >
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <SlidersHorizontal className="w-4 h-4 text-[#008000]" />
            Filter
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#008000]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* FILTER HARGA */}
        <form
          onSubmit={handleApplyPrice}
          className="px-4 py-4 border-b border-gray-100"
        >
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
            Tarif Sewa per Hari
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1">
              <label htmlFor="harga-min" className="block text-[10px] text-gray-400 mb-1">
                Min
              </label>
              <input
                id="harga-min"
                type="number"
                min={0}
                max={priceCeiling}
                value={localMin}
                onChange={(e) => setLocalMin(Number(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-[#008000]"
              />
            </div>
            <span className="text-gray-300 mt-4">—</span>
            <div className="flex-1">
              <label htmlFor="harga-max" className="block text-[10px] text-gray-400 mb-1">
                Maks
              </label>
              <input
                id="harga-max"
                type="number"
                min={0}
                max={priceCeiling}
                value={localMax}
                onChange={(e) => setLocalMax(Number(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-[#008000]"
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={priceCeiling}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            className="w-full accent-[#008000] mb-3"
            aria-label="Geser batas maksimum tarif sewa"
          />
          <button
            type="submit"
            className="w-full bg-[#008000] text-white text-xs font-semibold py-2 rounded-md hover:bg-green-700 transition"
          >
            Terapkan Harga
          </button>
        </form>

        {/* FILTER WILAYAH (RADIO) */}
        <fieldset className="px-4 py-4 max-h-80 overflow-y-auto">
          <legend className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
            Wilayah / Kecamatan
          </legend>

          <label className="flex items-center gap-2 py-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="filter-kecamatan"
              value=""
              checked={selectedKecamatan === ""}
              onChange={() => onKecamatanChange("")}
              className="accent-[#008000] w-4 h-4"
            />
            Semua Wilayah
          </label>

          {KECAMATAN_LIST.map((kec) => (
            <label
              key={kec}
              className="flex items-center gap-2 py-1.5 text-sm text-gray-600 cursor-pointer hover:text-[#008000]"
            >
              <input
                type="radio"
                name="filter-kecamatan"
                value={kec}
                checked={selectedKecamatan === kec}
                onChange={() => onKecamatanChange(kec)}
                className="accent-[#008000] w-4 h-4"
              />
              Kec. {kec}
            </label>
          ))}
        </fieldset>
      </div>
    </aside>
  );
}