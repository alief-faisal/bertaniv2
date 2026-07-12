"use client";

import React, { MouseEvent } from "react";
import Link from "next/link";
import { MapPin, Users, ShieldCheck, Heart, Navigation } from "lucide-react";
import { PoktanProfile } from "@/types";
import { formatDistance } from "@/utils/distance";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500";

function formatRupiah(value: number): string {
  return value.toLocaleString("id-ID");
}

interface PoktanCardProps {
  data: PoktanProfile;
  isFavorite?: boolean;
  onToggleFavorite?: (poktanId: string) => void;
}

export default function PoktanCard({
  data,
  isFavorite = false,
  onToggleFavorite,
}: PoktanCardProps) {
  // Defensif: format numerik aman dari crash
  const hargaSewa = Number(data.harga_sewa) || 0;
  const diskonPersen = Number(data.diskon_persen) || 0;
  const jumlahAnggota = Number(data.jumlah_anggota) || 0;

  const hargaDiskon =
    diskonPersen > 0 ? hargaSewa - (hargaSewa * diskonPersen) / 100 : hargaSewa;

  const hasDistance =
    typeof data.distanceKm === "number" && Number.isFinite(data.distanceKm);

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(data.id);
  };

  return (
    <Link
      href={`/detail/${data.id}`}
      aria-label={`Lihat detail ${data.nama_kelompok}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000] rounded-md h-full"
    >
      <article className="flex flex-col sm:flex-row md:flex-col bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-sm transition h-full">
        {/* Bagian Foto (Simetris & Fixed Height di Desktop) */}
        <div className="relative w-full sm:w-56 md:w-full h-48 md:h-52 shrink-0 bg-gray-100">
          <img
            src={data.banner_url || FALLBACK_IMAGE}
            alt={`Banner ${data.nama_kelompok}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {hasDistance && (
            <span className="absolute top-0 left-0 flex items-center gap-1 bg-[#008000] text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-br-xl shadow-sm z-10">
              <Navigation className="w-3 h-3" aria-hidden="true" />
              {formatDistance(data.distanceKm as number)}
            </span>
          )}

          {/* Tombol Favorit */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={isFavorite}
            aria-label={
              isFavorite
                ? `Hapus ${data.nama_kelompok} dari favorit`
                : `Tambahkan ${data.nama_kelompok} ke favorit`
            }
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/95 shadow hover:scale-110 active:scale-95 transition"
          >
            <Heart
              className={`w-4.5 h-4.5 transition-colors ${
                isFavorite
                  ? "fill-red-500 stroke-red-500"
                  : "fill-transparent stroke-gray-600"
              }`}
            />
          </button>
        </div>

        {/* Wrapper Konten: Menggunakan flex-1 dan justify-between agar tinggi konten selalu sejajar */}
        <div className="flex flex-col flex-1 p-5 justify-between gap-4">
          {/* Info Utama */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-800 text-lg md:text-xl leading-snug line-clamp-2 min-h-[3.5rem]">
                {data.nama_kelompok}
              </h3>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              Kec. {data.kecamatan}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {jumlahAnggota} anggota
              </span>
              {data.is_active && (
                <span className="flex items-center gap-1 text-green-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                </span>
              )}
            </div>
          </div>

          {/* Bagian Harga (Di bawah & Selalu Simetris secara Vertikal) */}
          <div className="pt-4 border-t border-gray-100 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Tarif Sewa / Jasa
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-green-700 whitespace-nowrap">
                  Rp {formatRupiah(hargaDiskon)}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  / Hari
                </span>
              </div>
              {diskonPersen > 0 && (
                <span className="text-xs text-red-400 line-through font-normal mt-0.5">
                  Rp {formatRupiah(hargaSewa)}
                </span>
              )}
            </div>

            {diskonPersen > 0 && (
              <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded header-badge self-center">
                Diskon {diskonPersen}%
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
