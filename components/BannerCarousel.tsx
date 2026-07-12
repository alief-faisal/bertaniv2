"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { Banner } from "@/types";
import { BannerSkeleton } from "@/components/SkeletonShimmer";

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("urutan", { ascending: true });

        if (error) throw error;

        const mappedBanners: Banner[] = (data || []).map((b) => ({
          id: b.id,
          image_url: b.image_url,
          target_url: b.target_url,
          urutan: Number(b.urutan),
          created_at: b.created_at,
        }));

        setBanners(mappedBanners);
      } catch (err) {
        console.error("Gagal memuat banner:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Deteksi ukuran layar untuk mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const originalCount = banners.length;

  // Duplikasi minimal untuk infinite loop (1 set di kiri, 1 set di tengah, 1 set di kanan)
  const displayBanners =
    originalCount > 0 ? [...banners, ...banners, ...banners] : [];
  const offsetIndex = currentIndex + originalCount;

  const handleNext = () => {
    if (!isTransitioning) return; // Mengunci klik cepat sebelum animasi selesai
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isTransitioning) return; // Mengunci klik cepat
    setCurrentIndex((prev) => prev - 1);
  };

  // Mekanisme perpindahan siluman di latar belakang saat menyentuh batas klon
  const handleTransitionEnd = () => {
    if (currentIndex >= originalCount) {
      setIsTransitioning(false); // Matikan animasi sementara
      setCurrentIndex(0); // Kembalikan ke indeks asli di tengah
    } else if (currentIndex < 0) {
      setIsTransitioning(false); // Matikan animasi sementara
      setCurrentIndex(originalCount - 1); // Lompat ke ujung indeks asli
    }
  };

  // Mengaktifkan kembali efek transisi setelah lompatan posisi selesai
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Menghitung indeks titik indikator aktif
  const activeDotIndex =
    originalCount > 0
      ? ((currentIndex % originalCount) + originalCount) % originalCount
      : 0;

  if (loading) {
    return <BannerSkeleton />;
  }

  if (originalCount === 0) return null;

  return (
    <div className="relative w-full max-w-7xl mx-auto my-6 px-4 group select-none">
      {/* --- TOMBOL CHEVRON KIRI --- */}
      <button
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 text-gray-800 p-2.5 rounded-full shadow-md border border-gray-100 transition"
        aria-label="Previous Slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-7 h-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      {/* --- KONTAINER VIEWPORT CAROUSEL --- */}
      <div className="w-full overflow-hidden py-2">
        <div
          className="flex flex-nowrap"
          onTransitionEnd={handleTransitionEnd}
          style={{
            // Mobile (2 banner @ 47%): kompensasi -3%
            // Desktop (38%): kompensasi +12%
            transform: isMobile
              ? `translateX(calc(-${offsetIndex * 47}% - ${offsetIndex * 16}px - 3%))`
              : `translateX(calc(-${offsetIndex * 38}% - ${offsetIndex * 16}px + 12%))`,
            transition: isTransitioning
              ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
          }}
        >
          {displayBanners.map((banner, index) => (
            <div
              key={`${banner.id}-${index}`}
              // Mobile: 47% (2 banner), Desktop: 38%
              style={{
                width: isMobile ? "47%" : "38%",
                marginRight: "16px",
              }}
              className="shrink-0 h-36 md:h-60 overflow-hidden rounded-[38px] shadow-sm border border-gray-100"
            >
              {banner.target_url ? (
                <a
                  href={banner.target_url}
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <img
                    src={banner.image_url}
                    alt="Promo"
                    className="w-full h-full object-cover rounded-2xl"
                    draggable={false}
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt="Promo"
                  className="w-full h-full object-cover rounded-2xl"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- TOMBOL CHEVRON KANAN --- */}
      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 text-gray-800 p-2.5 rounded-full shadow-md border border-gray-100 transition "
        aria-label="Next Slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-7 h-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* --- INDIKATOR PIL BAWAH --- */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!isTransitioning) return;
              setCurrentIndex(idx);
            }}
            className={`h-3 rounded-full transition-all duration-300 ${
              idx === activeDotIndex
                ? "w-8 bg-[#15803d] shadow-sm"
                : "w-3 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
