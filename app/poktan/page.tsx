"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PoktanProfile } from "@/types";
import {
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlinePhotograph,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSave,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineUserGroup,
} from "react-icons/hi";

const KECAMATAN_LIST = [
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

const MAX_BANNER_MB = 5;
const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "webp"];

export default function PoktanDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PoktanProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form states
  const [namaKelompok, setNamaKelompok] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [hargaSewa, setHargaSewa] = useState(0);
  const [diskonPersen, setDiskonPersen] = useState(0);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [newGallery, setNewGallery] = useState<File[]>([]);
  const [galleryToDelete, setGalleryToDelete] = useState<string[]>([]);

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("poktan_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) throw error;

      setProfile(data as PoktanProfile);
      setNamaKelompok(data.nama_kelompok);
      setKecamatan(data.kecamatan);
      setHargaSewa(data.harga_sewa);
      setDiskonPersen(data.diskon_persen || 0);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_IMAGE_EXT.includes(ext)) {
      setError("Format gambar tidak didukung");
      return;
    }
    if (file.size > MAX_BANNER_MB * 1024 * 1024) {
      setError(`Ukuran maksimal ${MAX_BANNER_MB}MB`);
      return;
    }

    setError("");
    setNewBanner(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_IMAGE_EXT.includes(ext)) {
        setError("Format gambar tidak didukung");
        return;
      }
      if (file.size > MAX_BANNER_MB * 1024 * 1024) {
        setError(`Ukuran maksimal ${MAX_BANNER_MB}MB`);
        return;
      }
    }

    const currentCount =
      (profile?.gallery_urls?.length || 0) -
      galleryToDelete.length +
      newGallery.length;
    if (currentCount + files.length > 5) {
      setError("Maksimal 5 gambar galeri");
      return;
    }

    setError("");
    setNewGallery([...newGallery, ...files]);
  };

  const removeNewGallery = (index: number) => {
    setNewGallery(newGallery.filter((_, i) => i !== index));
  };

  const markGalleryForDeletion = (url: string) => {
    setGalleryToDelete([...galleryToDelete, url]);
  };

  const unmarkGalleryForDeletion = (url: string) => {
    setGalleryToDelete(galleryToDelete.filter((u) => u !== url));
  };

  const handleSave = async () => {
    if (!profile) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada sesi aktif");

      console.log("Starting save process...");

      // Upload banner baru jika ada
      let bannerUrl = profile.banner_url;
      if (newBanner) {
        console.log("Uploading new banner...");
        const fileExt = newBanner.name.split(".").pop();
        const fileName = `banners/${session.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("poktan-media")
          .upload(fileName, newBanner, { upsert: true });

        if (uploadError) {
          console.error("Banner upload error:", uploadError);
          throw new Error(`Upload banner gagal: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("poktan-media")
          .getPublicUrl(fileName);

        bannerUrl = urlData.publicUrl;
        console.log("New banner URL:", bannerUrl);

        // Hapus banner lama
        if (profile.banner_url) {
          const oldPath = profile.banner_url.split("/poktan-media/")[1];
          if (oldPath) {
            console.log("Removing old banner:", oldPath);
            await supabase.storage.from("poktan-media").remove([oldPath]);
          }
        }
      }

      // Upload gambar galeri baru
      const galleryUrls = [...(profile.gallery_urls || [])];
      console.log("Current gallery URLs:", galleryUrls);

      // Hapus yang ditandai untuk dihapus
      for (const url of galleryToDelete) {
        const path = url.split("/poktan-media/")[1];
        if (path) {
          console.log("Removing gallery image:", path);
          await supabase.storage.from("poktan-media").remove([path]);
          const index = galleryUrls.indexOf(url);
          if (index > -1) galleryUrls.splice(index, 1);
        }
      }

      // Upload gambar baru
      for (let i = 0; i < newGallery.length; i++) {
        const file = newGallery[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `gallery/${session.user.id}-${Date.now()}-${i}.${fileExt}`;

        console.log("Uploading gallery image:", fileName);
        const { error: uploadError } = await supabase.storage
          .from("poktan-media")
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error("Gallery upload error:", uploadError);
          // Continue with other images even if one fails
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("poktan-media")
          .getPublicUrl(fileName);
        galleryUrls.push(urlData.publicUrl);
        console.log("Gallery image uploaded:", urlData.publicUrl);
      }

      console.log("Final gallery URLs:", galleryUrls);

      // Update database
      const updateData = {
        nama_kelompok: namaKelompok,
        kecamatan,
        harga_sewa: hargaSewa,
        diskon_persen: diskonPersen,
        banner_url: bannerUrl,
        gallery_urls: galleryUrls.length > 0 ? galleryUrls : [],
      };

      console.log("Updating database with:", updateData);

      const { error: updateError, data: updateResult } = await supabase
        .from("poktan_profiles")
        .update(updateData)
        .eq("user_id", session.user.id)
        .select();

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(`Update database gagal: ${updateError.message}`);
      }

      console.log("Update result:", updateResult);

      setSuccess("Profil berhasil diperbarui!");
      setIsEditing(false);
      setNewBanner(null);
      setNewGallery([]);
      setGalleryToDelete([]);
      await fetchProfile();
    } catch (err) {
      console.error("Save error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus profil ini? Tindakan ini tidak dapat dibatalkan!",
      )
    ) {
      return;
    }

    if (!profile) return;

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada sesi aktif");

      // Hapus semua gambar dari storage
      const filesToDelete: string[] = [];

      if (profile.banner_url) {
        const path = profile.banner_url.split("/poktan-media/")[1];
        if (path) filesToDelete.push(path);
      }

      if (profile.gallery_urls) {
        for (const url of profile.gallery_urls) {
          const path = url.split("/poktan-media/")[1];
          if (path) filesToDelete.push(path);
        }
      }

      if (filesToDelete.length > 0) {
        await supabase.storage.from("poktan-media").remove(filesToDelete);
      }

      // Hapus profil dari database
      const { error } = await supabase
        .from("poktan_profiles")
        .delete()
        .eq("user_id", session.user.id);

      if (error) throw error;

      // Hapus user dari auth
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal menghapus profil");
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    if (!profile) return;
    setIsEditing(false);
    setNamaKelompok(profile.nama_kelompok);
    setKecamatan(profile.kecamatan);
    setHargaSewa(profile.harga_sewa);
    setDiskonPersen(profile.diskon_persen || 0);
    setNewBanner(null);
    setNewGallery([]);
    setGalleryToDelete([]);
    setError("");
  };

  if (loading && !profile) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Profil tidak ditemukan</p>
      </div>
    );
  }

  const hargaDiskon =
    diskonPersen > 0 ? hargaSewa - (hargaSewa * diskonPersen) / 100 : hargaSewa;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* ==========================================
          SIDEBAR NAVIGASI
          ========================================== */}
      <aside className="w-64 bg-green-900 text-white flex flex-col border-r border-green-800">
        <div className="p-6 border-b border-green-800">
          <h1 className="text-lg font-bold tracking-wider">BERTANI PANEL</h1>
          <p className="text-xs text-green-300 mt-1">Dashboard Kelompok Tani</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium bg-green-700 text-white">
            <HiOutlineUserGroup size={18} />
            <span>Profil Kelompok</span>
          </div>
        </nav>

        <div className="p-4 border-t border-green-800 space-y-2">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs py-2 rounded-md font-medium transition text-center"
          >
            <HiOutlineHome size={14} />
            <span>Kembali ke Beranda</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs py-2 rounded-md font-medium transition text-center"
          >
            <HiOutlineLogout size={14} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          KONTEN UTAMA DASHBOARD
          ========================================== */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HEADER KONTEN */}
        <header className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Dashboard Kelompok Tani
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Kelola profil dan informasi kelompok tani Anda
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition text-sm font-medium"
                >
                  <HiOutlinePencil size={16} />
                  Edit Profil
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition text-sm font-medium"
                >
                  <HiOutlineTrash size={16} />
                  Hapus Profil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition disabled:opacity-50 text-sm font-medium"
                >
                  <HiOutlineSave size={16} />
                  Simpan
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition disabled:opacity-50 text-sm font-medium"
                >
                  <HiOutlineX size={16} />
                  Batal
                </button>
              </>
            )}
          </div>
        </header>

        {loading && (
          <div className="text-sm text-gray-500 animate-pulse mb-4">
            Memuat data profil...
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          {/* Banner Section */}
          <div className="relative h-64 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                newBanner ? URL.createObjectURL(newBanner) : profile.banner_url
              }
              alt="Banner"
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute bottom-4 right-4">
                <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow cursor-pointer hover:bg-gray-50 transition text-sm font-medium">
                  <HiOutlinePhotograph size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  Ganti Banner
                </label>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Nama Kelompok */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Kelompok
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={namaKelompok}
                  onChange={(e) => setNamaKelompok(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {profile.nama_kelompok}
                </p>
              )}
            </div>

            {/* Kecamatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kecamatan
              </label>
              {isEditing ? (
                <select
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {KECAMATAN_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-700">{profile.kecamatan}</p>
              )}
            </div>

            {/* Harga & Diskon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Harga Sewa (Rp/hari)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={hargaSewa}
                    onChange={(e) => setHargaSewa(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-green-700">
                      Rp {hargaDiskon.toLocaleString("id-ID")}
                    </p>
                    {diskonPersen > 0 && (
                      <span className="text-sm text-red-500 line-through">
                        Rp {hargaSewa.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Diskon (%)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={diskonPersen}
                    onChange={(e) => setDiskonPersen(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-700">{diskonPersen}%</p>
                )}
              </div>
            </div>

            {/* Info Lainnya */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Jumlah Anggota</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile.jumlah_anggota}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={`text-lg font-semibold ${profile.is_active ? "text-green-600" : "text-yellow-600"}`}
                >
                  {profile.is_active ? "Aktif" : "Menunggu Verifikasi"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pesanan</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile.order_count || 0}
                </p>
              </div>
            </div>

            {/* Galeri */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-800">Galeri Foto</h2>
                {isEditing && (
                  <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition text-sm font-medium">
                    <HiOutlinePlus size={16} />
                    Tambah Foto
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Existing Gallery Images */}
                {profile.gallery_urls?.map((url) => {
                  const isMarkedForDeletion = galleryToDelete.includes(url);
                  return (
                    <div
                      key={url}
                      className={`relative group ${isMarkedForDeletion ? "opacity-50" : ""}`}
                    >
                      <img
                        src={url}
                        alt="Foto Galeri"
                        className="w-full h-32 object-cover rounded-md border border-gray-200"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            isMarkedForDeletion
                              ? unmarkGalleryForDeletion(url)
                              : markGalleryForDeletion(url)
                          }
                          className={`absolute top-2 right-2 p-1.5 rounded-full transition ${
                            isMarkedForDeletion
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-red-500 hover:bg-red-600"
                          } text-white opacity-0 group-hover:opacity-100`}
                        >
                          {isMarkedForDeletion ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          ) : (
                            <HiOutlineTrash className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {isMarkedForDeletion && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                          <span className="text-white text-xs font-bold">
                            Akan Dihapus
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* New Gallery Images */}
                {newGallery.map((file) => {
                  const fileId = `${file.name}-${file.size}-${file.lastModified}`;
                  const fileIndex = newGallery.indexOf(file);
                  return (
                    <div key={fileId} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Foto baru"
                        className="w-full h-32 object-cover rounded-md border-2 border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewGallery(fileIndex)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Baru
                      </div>
                    </div>
                  );
                })}

                {/* Placeholder jika tidak ada gambar */}
                {!profile.gallery_urls?.length && newGallery.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <p>Belum ada foto galeri</p>
                    {isEditing && (
                      <p className="text-sm mt-2">
                        Klik &quot;Tambah Foto&quot; untuk menambahkan
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
