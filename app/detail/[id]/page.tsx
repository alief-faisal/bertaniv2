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
  Heart,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/utils/supabase";
import Navbar from "@/components/Navbar";
import { PoktanProfile } from "@/types";
import { calculateDistanceKm } from "@/utils/distance";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);

  // Ambil informasi user yang sedang login
  const { role } = useCurrentUser();

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

  // Cek status favorit awal untuk kelompok tani ini.
  useEffect(() => {
    const checkFavorite = async () => {
      if (!id) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("poktan_id", id)
        .maybeSingle();

      setIsFavorite(!!data);
    };
    checkFavorite();
  }, [id]);

  const handleToggleFavorite = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const nextValue = !isFavorite;
    setIsFavorite(nextValue); // optimistic update

    try {
      if (nextValue) {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, poktan_id: id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("poktan_id", id);
        if (error) throw error;
      }
    } catch (err) {
      console.error("Gagal memperbarui favorit:", err);
      setIsFavorite(!nextValue); // rollback
    }
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

  // Cek apakah user bisa melakukan order/chat (hanya role 'user' yang boleh)
  const canInteract = role === "user";

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
              <img
                src={gallery[activeImage]}
                alt={`Foto ${poktan.nama_kelompok} ${activeImage + 1} dari ${gallery.length}`}
                className="w-full h-[380px] object-contain bg-black"
              />

              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-pressed={isFavorite}
                aria-label={
                  isFavorite ? "Hapus dari favorit" : "Tambahkan ke favorit"
                }
                className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow hover:scale-110 active:scale-95 transition"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-red-500 stroke-red-500" : "fill-transparent stroke-gray-600"}`}
                />
              </button>

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Foto sebelumnya"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Foto berikutnya"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
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
            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
              {diskonPersen > 0 && (
                <span className="inline-flex w-fit items-center bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded mb-2">
                  Diskon {diskonPersen}%
                </span>
              )}
              {diskonPersen > 0 && (
                <p className="text-sm text-red-400 line-through">
                  Rp {formatRupiah(hargaSewa)}
                </p>
              )}
              <p className="text-2xl font-bold text-[#008000]">
                Rp {formatRupiah(hargaDiskon)}
                <span className="text-sm font-normal text-gray-400">
                  {" "}
                  / hari
                </span>
              </p>
              <p className="text-sm font-semibold text-gray-700 mt-1">
                {poktan.nama_kelompok}
              </p>

              <button
                type="button"
                disabled={!canInteract}
                title={
                  !canInteract
                    ? "Hanya user yang dapat melakukan order"
                    : "Klik untuk order"
                }
                className={`w-full mt-4 font-semibold py-3 rounded-[10px] flex items-center justify-center gap-2 transition ${
                  canInteract
                    ? "bg-[#008000] hover:bg-green-700 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
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
                disabled={!canInteract}
                title={
                  !canInteract
                    ? "Hanya user yang dapat melakukan chat"
                    : "Klik untuk chat"
                }
                className={`w-full font-semibold py-2.5 rounded-[10px] flex items-center justify-center gap-2 transition ${
                  canInteract
                    ? "border border-[#008000] text-[#008000] hover:bg-green-50 cursor-pointer"
                    : "border border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
