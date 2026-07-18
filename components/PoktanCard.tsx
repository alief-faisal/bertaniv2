"use client";

import React, { MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Users,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load Font Awesome CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

  // Defensif: format numerik aman dari crash
  const hargaSewa = Number(data.harga_sewa) || 0;
  const diskonPersen = Number(data.diskon_persen) || 0;
  const jumlahAnggota = Number(data.jumlah_anggota) || 0;

  const hargaDiskon =
    diskonPersen > 0 ? hargaSewa - (hargaSewa * diskonPersen) / 100 : hargaSewa;

  const hasDistance =
    typeof data.distanceKm === "number" && Number.isFinite(data.distanceKm);

  // Gabungkan banner_url dengan gallery_urls jika ada
  const galleryImages = Array.isArray(data.gallery_urls)
    ? data.gallery_urls.filter((url) => url && url.trim() !== "")
    : [];

  const allImages = [
    data.banner_url || FALLBACK_IMAGE,
    ...galleryImages,
  ].filter(Boolean);

  const hasMultipleImages = allImages.length > 1;

  // Debug log untuk development
  if (process.env.NODE_ENV === "development") {
    console.log(`[PoktanCard] ${data.nama_kelompok}:`, {
      banner_url: data.banner_url,
      gallery_urls: data.gallery_urls,
      galleryImages,
      allImages: allImages.length,
      hasMultipleImages,
    });
  }

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(data.id);
  };

  const handlePrevImage = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1,
    );
  };

  const handleNextImage = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <Link
      href={`/detail/${data.id}`}
      aria-label={`Lihat detail ${data.nama_kelompok}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000] rounded-md h-full"
    >
      {/* Penambahan kelas 'group' untuk mendeteksi status hover pada card tujuan */}
      <article className="group flex flex-col sm:flex-row md:flex-col bg-white border border-gray-100 rounded-[10px] overflow-hidden shadow-xs transition h-full">
        {/* 1. Bagian Foto */}
        <div className="relative w-full sm:w-56 md:w-full h-40 md:h-44 shrink-0 overflow-hidden">
          {allImages.map((src, i) => {
            const getTransitionClass = () => {
              if (i === currentImageIndex) return "translate-x-0";
              if (i < currentImageIndex) return "-translate-x-full";
              return "translate-x-full";
            };

            const isPriority = i === 0 && currentImageIndex === 0;

            return (
              <Image
                key={`${data.id}-gallery-${i}`}
                src={src}
                alt={`Foto ${data.nama_kelompok} ${i + 1} dari ${allImages.length}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 224px, 280px"
                priority={isPriority}
                loading={isPriority ? "eager" : "lazy"}
                className={`object-cover transition-transform duration-500 ease-in-out ${getTransitionClass()}`}
              />
            );
          })}

          {hasDistance && (
            <span className="absolute top-0 left-0 flex items-center gap-1 bg-[#008000] text-white font-semibold text-[12px] px-2.5 py-1.5 rounded-br-xl z-10">
              <Navigation
                className="w-3 h-3"
                fill="currentColor"
                aria-hidden="true"
              />
              {formatDistance(data.distanceKm as number)}
            </span>
          )}

          {/* Tombol Chevron Kiri - opacity-0 group-hover:opacity-100 */}
          <button
            type="button"
            onClick={handlePrevImage}
            disabled={!hasMultipleImages}
            aria-label="Gambar sebelumnya"
            className={`absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md hover:scale-110 active:scale-95 transition-all duration-200 z-20 opacity-0 group-hover:opacity-100 ${
              !hasMultipleImages ? "hidden" : ""
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>

          {/* Tombol Chevron Kanan - opacity-0 group-hover:opacity-100 */}
          <button
            type="button"
            onClick={handleNextImage}
            disabled={!hasMultipleImages}
            aria-label="Gambar berikutnya"
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md hover:scale-110 active:scale-95 transition-all duration-200 z-20 opacity-0 group-hover:opacity-100 ${
              !hasMultipleImages ? "hidden" : ""
            }`}
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>

          {/* Indikator Dots - opacity-0 group-hover:opacity-100 */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 transition-opacity duration-200 z-10 opacity-0 group-hover:opacity-100">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  aria-label={`Gambar ${idx + 1}`}
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx === currentImageIndex
                      ? "bg-white w-4"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
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
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/95 shadow hover:scale-110 active:scale-95 transition z-10"
          >
            <i
              className={`text-base transition-colors ${
                isFavorite
                  ? "fa-solid fa-bookmark text-yellow-500"
                  : "fa-regular fa-bookmark text-gray-600"
              }`}
            />
          </button>
        </div>

        {/* 2. Wrapper Konten */}
        <div className="flex flex-col flex-1 p-4 justify-between gap-2">
          {/* Info Utama */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              {/* 3. Judul */}
              <h3 className="font-bold text-gray-800 text-base md:text-lg leading-snug line-clamp-2 min-h-[2.5rem]">
                {data.nama_kelompok}
              </h3>
            </div>

            <p className="text-xs text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Kec. {data.kecamatan}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {jumlahAnggota} anggota
              </span>
            </div>
          </div>

          {/* Bagian Harga */}
          <div className="pt-2 flex items-end justify-between">
            <div className="flex flex-col w-full">
              <span className="text-[11px] text-slate-500">Tarif Jasa</span>
              <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                <span className="text-base md:text-lg font-bold text-green-700 whitespace-nowrap">
                  IDR {formatRupiah(hargaDiskon)}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  / Hari
                </span>
              </div>

              {/* 4. Harga Coret & Badge */}
              {diskonPersen > 0 && (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] text-gray-500 font-medium relative inline-block before:content-[''] before:absolute before:left-0 before:right-0 before:top-1/2 before:h-[1.5px] before:bg-red-500 before:-translate-y-1/2 before:-rotate-5">
                    IDR {formatRupiah(hargaSewa)}
                  </span>
                  <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-1.5 py-0.5 rounded header-badge flex items-center gap-1">
                    <i className="fa-solid fa-tag text-red-600"></i>
                    {diskonPersen}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
