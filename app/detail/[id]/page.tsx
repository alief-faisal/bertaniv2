// 📁 Simpan sebagai: app/detail/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/utils/supabase";
import Navbar from "@/components/Navbar";
import PoktanCard from "@/components/PoktanCard";
import { PoktanProfile } from "@/types";
import { calculateDistanceKm } from "@/utils/distance";
import { useFavorites } from "@/hooks/useFavorites";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800";

function formatRupiah(value: number): string {
  return value.toLocaleString("id-ID");
}

export default function DetailPoktanPage() {
  const params = useParams();
  const id = params?.id as string;

  const [poktan, setPoktan] = useState<PoktanProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeImage, setActiveImage] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [recommendedPoktans, setRecommendedPoktans] = useState<PoktanProfile[]>(
    [],
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ambil informasi user yang sedang login
  const { favoriteIds, toggleFavorite } = useFavorites(currentUserId);

  // Dapatkan user ID saat komponen dimount
  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUserId();
  }, []);

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

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("poktan_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setPoktan({
          id: data.id,
          nama_kelompok: data.nama_kelompok,
          kecamatan: data.kecamatan,
          jumlah_anggota: data.jumlah_anggota,
          harga_sewa: Number(data.harga_sewa) || 0,
          diskon_persen: data.diskon_persen,
          banner_url: data.banner_url || "",
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
          is_active: data.is_active,
          created_at: data.created_at,
          // Field opsional, aman kalau kolomnya belum ada / masih kosong.
          nama_ketua: data.nama_ketua ?? undefined,
          daftar_anggota: data.daftar_anggota ?? undefined,
          gallery_urls: Array.isArray(data.gallery_urls)
            ? data.gallery_urls
            : undefined,
        });
      }
    } catch (err) {
      console.error("Gagal memuat detail kelompok tani:", err);
      setErrorMessage("Kelompok tani tidak ditemukan atau gagal dimuat.");
      setPoktan(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Fetch rekomendasi poktan dengan kecamatan yang sama
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!poktan) return;

      try {
        const { data, error } = await supabase
          .from("poktan_profiles")
          .select("*")
          .eq("kecamatan", poktan.kecamatan)
          .eq("is_active", true)
          .neq("id", poktan.id)
          .limit(4);

        if (error) throw error;

        if (data) {
          const mapped: PoktanProfile[] = data.map((item) => ({
            id: item.id,
            nama_kelompok: item.nama_kelompok,
            kecamatan: item.kecamatan,
            jumlah_anggota: item.jumlah_anggota,
            harga_sewa: Number(item.harga_sewa) || 0,
            diskon_persen: item.diskon_persen,
            banner_url: item.banner_url || "",
            latitude: Number(item.latitude) || 0,
            longitude: Number(item.longitude) || 0,
            is_active: item.is_active,
            created_at: item.created_at,
            nama_ketua: item.nama_ketua ?? undefined,
            daftar_anggota: item.daftar_anggota ?? undefined,
            gallery_urls: Array.isArray(item.gallery_urls)
              ? item.gallery_urls
              : undefined,
          }));
          setRecommendedPoktans(mapped);
        }
      } catch (err) {
        console.error("Gagal memuat rekomendasi poktan:", err);
      }
    };

    fetchRecommendations();
  }, [poktan]);

  // Kalau pengguna sebelumnya SUDAH memberi izin lokasi (mis. lewat tombol
  // "Lokasi saat ini" di Navbar pada kunjungan sebelumnya), tampilkan jarak
  // ke poktan ini juga di halaman detail — tanpa memunculkan popup izin
  // baru kalau izinnya belum ada, supaya tidak mengganggu pengguna.
  useEffect(() => {
    if (!poktan || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    if (!navigator.permissions?.query) return;

    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state !== "granted" || cancelled) return;
        navigator.geolocation.getCurrentPosition((position) => {
          if (cancelled) return;
          setDistanceKm(
            calculateDistanceKm(
              position.coords.latitude,
              position.coords.longitude,
              poktan.latitude,
              poktan.longitude,
            ),
          );
        });
      })
      .catch(() => {
        // Diamkan saja: browser lama yang tidak mendukung Permissions API.
      });

    return () => {
      cancelled = true;
    };
  }, [poktan]);

  const handleToggleFavorite = () => {
    if (!id) return;
    toggleFavorite(id);
  };

  if (loading) {
    return (
      <>
        <Navbar onFilterChange={() => {}} />
        <div
          className="text-center py-20 text-sm text-gray-500"
          aria-busy="true"
        >
          Memuat detail kelompok tani...
        </div>
      </>
    );
  }

  if (!poktan) {
    return (
      <>
        <Navbar onFilterChange={() => {}} />
        <div className="text-center py-20 text-sm text-gray-500" role="alert">
          {errorMessage || "Data tidak ditemukan."}
        </div>
      </>
    );
  }

  // Gabungkan banner dengan gallery (banner selalu di urutan pertama)
  const gallery: string[] = [];
  if (poktan.banner_url) {
    gallery.push(poktan.banner_url);
  } else {
    gallery.push(FALLBACK_IMAGE);
  }

  // Tambahkan gambar gallery jika ada
  if (poktan.gallery_urls && poktan.gallery_urls.length > 0) {
    gallery.push(...poktan.gallery_urls);
  }

  const hargaSewa = poktan.harga_sewa;
  const diskonPersen = Number(poktan.diskon_persen) || 0;
  const hargaDiskon =
    diskonPersen > 0 ? hargaSewa - (hargaSewa * diskonPersen) / 100 : hargaSewa;

  const goPrev = () =>
    setActiveImage((i) => (i === 0 ? gallery.length - 1 : i - 1));
  const goNext = () =>
    setActiveImage((i) => (i === gallery.length - 1 ? 0 : i + 1));

  return (
    <>
      <Navbar onFilterChange={() => {}} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* BREADCRUMB */}
        <nav aria-label="breadcrumb" className="text-xs text-gray-500 mb-4">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#008000]">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="hover:text-[#008000]">Kec. {poktan.kecamatan}</li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-800 font-medium" aria-current="page">
              {poktan.nama_kelompok}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM KIRI: GALERI + INFORMASI */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* GALERI FOTO */}
            <div className="relative bg-black rounded-[16px] overflow-hidden">
              <div className="relative w-full h-[380px]">
                {gallery.map((src, i) => (
                  <img
                    key={src + i}
                    src={src}
                    alt={`Foto ${poktan.nama_kelompok} ${i + 1} dari ${gallery.length}`}
                    className={`absolute inset-0 w-full h-full object-contain bg-black transition-all duration-500 ease-in-out ${
                      i === activeImage
                        ? "opacity-100 translate-x-0"
                        : i < activeImage
                          ? "opacity-0 -translate-x-full"
                          : "opacity-0 translate-x-full"
                    }`}
                  />
                ))}
              </div>

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Foto sebelumnya"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-all z-10"
                  >
                    <ChevronLeft className="w-9 h-9 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Foto berikutnya"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-all z-10"
                  >
                    <ChevronRight className="w-9 h-9 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {gallery.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto"
                role="tablist"
                aria-label="Pilih foto"
              >
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImage}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${i === activeImage ? "border-[#008000]" : "border-transparent"}`}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* DETAIL INFORMASI */}
            <div className="bg-white border border-gray-200 rounded-[16px] p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {poktan.nama_kelompok}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                <MapPin className="w-4 h-4 text-gray-400" />
                Kec. {poktan.kecamatan}
                {typeof distanceKm === "number" && (
                  <span className="text-[#008000] font-medium">
                    · {distanceKm.toFixed(1)} km dari lokasi Anda
                  </span>
                )}
              </p>

              <h2 className="text-base font-bold text-gray-800 mb-4 border-t border-gray-100 pt-5">
                Detail Informasi
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Nama Kelompok</dt>
                  <dd className="font-semibold text-gray-800">
                    {poktan.nama_kelompok}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Nama Ketua</dt>
                  <dd className="font-semibold text-gray-800">
                    {poktan.nama_ketua || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Wilayah Kecamatan</dt>
                  <dd className="font-semibold text-gray-800">
                    Kec. {poktan.kecamatan}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Kapasitas Anggota</dt>
                  <dd className="font-semibold text-gray-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {poktan.jumlah_anggota} Anggota
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Status</dt>
                  <dd className="font-semibold flex items-center gap-1">
                    {poktan.is_active ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                        &amp; Aktif
                      </span>
                    ) : (
                      <span className="text-gray-400">Tidak aktif</span>
                    )}
                  </dd>
                </div>
              </dl>

              {/* DAFTAR ANGGOTA */}
              {poktan.daftar_anggota && (
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <h2 className="text-base font-bold text-gray-800 mb-3">
                    Daftar Anggota
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ol className="space-y-2">
                      {poktan.daftar_anggota
                        .split(",")
                        .map((nama) => nama.trim())
                        .filter((nama) => nama !== "")
                        .map((nama, index) => (
                          <li
                            key={`${nama}-${index}`}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="inline-flex items-center justify-center min-w-6 h-6 bg-[#008000] text-white text-xs font-semibold rounded">
                              {index + 1}
                            </span>
                            <span className="text-gray-700 leading-6">
                              {nama}
                              {index === 0 && (
                                <span className="ml-2 text-xs text-[#008000] font-semibold">
                                  (Ketua)
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: HARGA + KETUA */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm relative">
              {/* BUTTON FAVORIT - ICON ONLY */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-pressed={favoriteIds.has(id)}
                aria-label={
                  favoriteIds.has(id)
                    ? "Hapus dari favorit"
                    : "Tambahkan ke favorit"
                }
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition shadow-sm"
              >
                <i
                  className={`text-xl ${favoriteIds.has(id) ? "fa-solid fa-bookmark text-yellow-500" : "fa-regular fa-bookmark text-gray-600"}`}
                />
              </button>

              {diskonPersen > 0 && (
                <p className="text-sm text-red-400 line-through">
                  Rp {formatRupiah(hargaSewa)}
                </p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-[#008000]">
                  Rp {formatRupiah(hargaDiskon)}
                  <span className="text-sm font-normal text-gray-400">
                    {" "}
                    / hari
                  </span>
                </p>
                {diskonPersen > 0 && (
                  <span className="inline-flex items-center bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
                    Diskon {diskonPersen}%
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-1">
                {poktan.nama_kelompok}
              </p>

              <button
                type="button"
                onClick={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) {
                    window.location.href = "/login";
                  } else {
                    // Logika order akan ditambahkan di sini
                  }
                }}
                className="w-full mt-4 font-semibold py-3 rounded-[10px] flex items-center justify-center gap-2 transition bg-[#008000] hover:bg-green-700 text-white cursor-pointer"
              >
                Order Sekarang
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Ketua</p>
              <p className="font-bold text-gray-800 mb-4">
                {poktan.nama_ketua || "Belum diisi"}
              </p>
              <button
                type="button"
                onClick={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) {
                    window.location.href = "/login";
                  }
                  // Logika chat akan ditambahkan di sini
                }}
                className="w-full font-semibold py-2.5 rounded-[10px] flex items-center justify-center gap-2 transition border border-[#008000] text-[#008000] hover:bg-green-50 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>
          </div>
        </div>

        {/* SECTION REKOMENDASI POKTAN */}
        {recommendedPoktans.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Rekomendasi Poktan di Kec. {poktan.kecamatan}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendedPoktans.map((item) => (
                <PoktanCard
                  key={item.id}
                  data={item}
                  isFavorite={favoriteIds.has(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
