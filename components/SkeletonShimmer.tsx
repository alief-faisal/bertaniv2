"use client";

import React from "react";

// Komponen base shimmer effect
const ShimmerEffect = () => (
  <div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
    style={{
      animation: "shimmer 2s infinite",
      transform: "translateX(-100%)",
    }}
  />
);

// Skeleton untuk Poktan Card
export function PoktanCardSkeleton() {
  return (
    <article className="flex flex-col sm:flex-row md:flex-col bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-sm h-full">
      {/* Bagian Foto Skeleton */}
      <div className="relative w-full sm:w-56 md:w-full h-48 md:h-52 shrink-0 bg-gray-200 overflow-hidden">
        <ShimmerEffect />

        {/* Badge Jarak Skeleton */}
        <div className="absolute top-0 left-0 w-20 h-7 bg-gray-300 rounded-br-xl" />

        {/* Tombol Chevron Skeleton */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-300" />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-300" />

        {/* Dots Indicator Skeleton */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className="w-4 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Tombol Favorit Skeleton */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-300" />
      </div>

      {/* Wrapper Konten Skeleton */}
      <div className="flex flex-col flex-1 p-5 justify-between gap-4">
        {/* Info Utama Skeleton */}
        <div className="space-y-2">
          {/* Judul Skeleton - 2 baris */}
          <div className="space-y-2 min-h-[3.5rem]">
            <div className="relative h-5 bg-gray-200 rounded w-full overflow-hidden">
              <ShimmerEffect />
            </div>
          </div>

          {/* Badge Terverifikasi Skeleton */}
          <div className="relative w-28 h-5 bg-gray-200 rounded overflow-hidden">
            <ShimmerEffect />
          </div>

          {/* Lokasi Skeleton */}
          <div className="relative h-4 bg-gray-200 rounded w-32 overflow-hidden">
            <ShimmerEffect />
          </div>

          {/* Anggota Skeleton */}
          <div className="relative h-4 bg-gray-200 rounded w-24 overflow-hidden">
            <ShimmerEffect />
          </div>
        </div>

        {/* Bagian Harga Skeleton */}
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-2">
            {/* Label Tarif Skeleton */}
            <div className="relative h-3 bg-gray-200 rounded w-16 overflow-hidden">
              <ShimmerEffect />
            </div>

            {/* Harga Skeleton */}
            <div className="flex items-baseline gap-2">
              <div className="relative h-6 bg-gray-200 rounded w-32 overflow-hidden">
                <ShimmerEffect />
              </div>
              <div className="relative h-3 bg-gray-200 rounded w-10 overflow-hidden">
                <ShimmerEffect />
              </div>
            </div>

            {/* Harga Coret & Badge Diskon Skeleton */}
            <div className="flex items-center gap-2">
              <div className="relative h-4 bg-gray-200 rounded w-24 overflow-hidden">
                <ShimmerEffect />
              </div>
              <div className="relative h-5 bg-gray-200 rounded w-12 overflow-hidden">
                <ShimmerEffect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// Skeleton untuk Mini Map
export function MiniMapSkeleton() {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] bg-gray-200 rounded-2xl overflow-hidden">
      <ShimmerEffect />

      {/* Tombol Lokasi Skeleton */}
      <div className="absolute top-4 left-4 w-12 h-12 rounded-lg bg-gray-300 shadow-md" />

      {/* Marker Skeleton - beberapa titik */}
      <div className="absolute top-1/4 left-1/3 w-8 h-8 rounded-full bg-gray-300" />
      <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-gray-300" />
      <div className="absolute top-2/3 left-2/3 w-8 h-8 rounded-full bg-gray-300" />

      {/* Control Zoom Skeleton */}
      <div className="absolute bottom-4 right-4 space-y-2">
        <div className="w-10 h-10 rounded bg-gray-300" />
        <div className="w-10 h-10 rounded bg-gray-300" />
      </div>
    </div>
  );
}

// Skeleton untuk Banner Carousel
export function BannerSkeleton() {
  return (
    <div className="relative w-full max-w-7xl mx-auto my-6 px-4 group select-none">
      {/* Tombol Chevron Kiri Skeleton */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-300 shadow-md border border-gray-100" />

      {/* Kontainer Viewport Carousel */}
      <div className="w-full overflow-hidden py-2">
        <div className="flex flex-nowrap">
          {/* Banner Skeleton - 3 items untuk simulasi carousel */}
          <div
            className="shrink-0 h-36 md:h-60 overflow-hidden rounded-[38px] shadow-sm border border-gray-100"
            style={{
              width: "47%",
              marginRight: "16px",
            }}
          >
            <div className="relative w-full h-full bg-gray-200 overflow-hidden">
              <ShimmerEffect />
            </div>
          </div>
          <div
            className="shrink-0 h-36 md:h-60 overflow-hidden rounded-[38px] shadow-sm border border-gray-100"
            style={{
              width: "47%",
              marginRight: "16px",
            }}
          >
            <div className="relative w-full h-full bg-gray-200 overflow-hidden">
              <ShimmerEffect />
            </div>
          </div>
          <div
            className="shrink-0 h-36 md:h-60 overflow-hidden rounded-[38px] shadow-sm border border-gray-100"
            style={{
              width: "47%",
              marginRight: "16px",
            }}
          >
            <div className="relative w-full h-full bg-gray-200 overflow-hidden">
              <ShimmerEffect />
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Chevron Kanan Skeleton */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-300 shadow-md border border-gray-100" />

      {/* Dots Indicator Skeleton */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <div className="w-8 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}

// Grid Skeleton untuk Multiple Poktan Cards
export function PoktanGridSkeleton({
  count = 8,
}: Readonly<{ count?: number }>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, index) => (
        <PoktanCardSkeleton key={index} />
      ))}
    </div>
  );
}
