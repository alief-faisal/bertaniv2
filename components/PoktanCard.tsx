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
  // Defensif: field numerik dari Supabase kadang datang sebagai string atau
  // null/undefined kalau kolom kosong. Selalu jatuhkan ke 0 daripada crash.
  const hargaSewa = Number(data.harga_sewa) || 0;
  const diskonPersen = Number(data.diskon_persen) || 0;
  const jumlahAnggota = Number(data.jumlah_anggota) || 0;

  const hargaDiskon =
    diskonPersen > 0 ? hargaSewa - (hargaSewa * diskonPersen) / 100 : hargaSewa;

  const hasDistance =
    typeof data.distanceKm === "number" && Number.isFinite(data.distanceKm);

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Cegah klik jantung ikut men-trigger navigasi <Link> pembungkus card.
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(data.id);
  };

  return (
    <Link
      href={`/detail/${data.id}`}
      aria-label={`Lihat detail ${data.nama_kelompok}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000] rounded-[20px]"
    >
      <article className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition w-full">
        {/* Foto */}
        <div className="relative w-full sm:w-56 h-44 md:h-50 sm:h-auto shrink-0 bg-gray-100">
          <img
            src={data.banner_url || FALLBACK_IMAGE}
            alt={`Banner ${data.nama_kelompok}`}
            className="w-full h-full object-cover"
          />

          {hasDistance && (
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-600 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full shadow">
              <Navigation className="w-3 h-3" aria-hidden="true" />
              {formatDistance(data.distanceKm as number)}
            </span>
          )}

          {/* Tombol love/favorit di kanan atas foto */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={isFavorite}
            aria-label={
              isFavorite
                ? `Hapus ${data.nama_kelompok} dari favorit`
                : `Tambahkan ${data.nama_kelompok} ke favorit`
            }
            className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 shadow hover:scale-110 active:scale-95 transition"
          >
            <Heart
              className={`w-4.5 h-4.5 ${isFavorite ? "fill-red-500 stroke-red-500" : "fill-transparent stroke-gray-600"}`}
            />
          </button>
        </div>

        {/* Info utama */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-2 border-b sm:border-b-0 sm:border-r border-gray-100">
          <h3 className="font-bold text-gray-800 text-xl leading-snug line-clamp-2">
            {data.nama_kelompok}
          </h3>

          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            Kec. {data.kecamatan}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {jumlahAnggota} anggota
            </span>
            {data.is_active && (
              <span className="flex items-center gap-1 text-green-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
              </span>
            )}
          </div>

          {diskonPersen > 0 && (
            <span className="inline-flex w-fit items-center bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
              Diskon {diskonPersen}%
            </span>
          )}
        </div>

        {/* Harga */}
        <div className="w-full sm:w-40 shrink-0 bg-gray-50/70 p-4 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 text-right">
          <span className="text-[10px] text-gray-400 font-medium sm:mb-1">
            Tarif Sewa / Jasa
          </span>
          <div className="flex flex-col items-end">
            {diskonPersen > 0 && (
              <span className="text-xs text-red-400 line-through font-normal">
                Rp {formatRupiah(hargaSewa)}
              </span>
            )}
            <span className="text-base font-bold text-green-700 whitespace-nowrap">
              Rp {formatRupiah(hargaDiskon)}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">
              / Hari
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
