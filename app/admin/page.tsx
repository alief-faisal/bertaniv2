"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useCallback,
} from "react";
import { supabase } from "@/utils/supabase";
import { Banner, PoktanProfile } from "@/types";
import {
  HiOutlineChartBar,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineTrash,
} from "react-icons/hi";

type ActiveMenu = "dashboard" | "banners" | "poktan";

export default function AdminDashboardPage() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("dashboard");
  const [loading, setLoading] = useState<boolean>(false);

  // --- State Data ---
  const [banners, setBanners] = useState<Banner[]>([]);
  const [poktanList, setPoktanList] = useState<PoktanProfile[]>([]);
  const [stats, setStats] = useState({
    totalPoktan: 0,
    activePoktan: 0,
    percentageActive: 0,
    totalBanners: 0,
  });

  // --- State Form Banner Baru ---
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [urutan, setUrutan] = useState<number>(1);
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);

  // --- State Form Edit Banner ---
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editTargetUrl, setEditTargetUrl] = useState<string>("");
  const [editUrutan, setEditUrutan] = useState<number>(1);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editOldImageUrl, setEditOldImageUrl] = useState<string>("");
  const [updatingBanner, setUpdatingBanner] = useState<boolean>(false);

  // --- Fetch Data Utama ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Ambil data banners
      const { data: bannerData, error: bannerError } = await supabase
        .from("banners")
        .select("*")
        .order("urutan", { ascending: true });
      if (bannerError) throw bannerError;

      // 2. Ambil data poktan
      const { data: poktanData, error: poktanError } = await supabase
        .from("poktan_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (poktanError) throw poktanError;

      // Masing-masing di-mapping agar tipe data numerik sesuai
      const mappedBanners: Banner[] = (bannerData || []).map((b) => ({
        id: b.id,
        image_url: b.image_url,
        target_url: b.target_url,
        urutan: Number(b.urutan),
        created_at: b.created_at,
      }));

      const mappedPoktan: PoktanProfile[] = (poktanData || []).map((p) => ({
        id: p.id,
        nama_kelompok: p.nama_kelompok,
        kecamatan: p.kecamatan,
        jumlah_anggota: Number(p.jumlah_anggota),
        harga_sewa: Number(p.harga_sewa),
        diskon_persen: Number(p.diskon_persen),
        banner_url: p.banner_url || "",
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        is_active: p.is_active,
        created_at: p.created_at,
      }));

      setBanners(mappedBanners);
      setPoktanList(mappedPoktan);

      // 3. Kalkulasi Statistik Persentase Poktan Aktif
      const totalP = mappedPoktan.length;
      const activeP = mappedPoktan.filter((p) => p.is_active).length;
      const percent = totalP > 0 ? Math.round((activeP / totalP) * 100) : 0;

      setStats({
        totalPoktan: totalP,
        activePoktan: activeP,
        percentageActive: percent,
        totalBanners: mappedBanners.length,
      });
    } catch (err) {
      console.error("Gagal memuat data admin:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // --- Aksi Aktivasi / Verifikasi Poktan ---
  const handleTogglePoktanActive = async (
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("poktan_profiles")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      alert(`Status Kelompok Tani berhasil diubah!`);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status");
    }
  };

  // --- Aksi Tambah Banner Baru ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBannerFile(e.target.files[0]);
    }
  };

  const handleAddBanner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bannerFile) {
      alert("Silakan pilih file gambar banner terlebih dahulu.");
      return;
    }

    try {
      setUploadingBanner(true);
      const fileExt = bannerFile.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      // Upload berkas gambar banner ke storage bucket 'banners'
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, bannerFile);

      if (uploadError) throw uploadError;

      // Ambil URL Publik hasil unggahan
      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);

      // Simpan data rekaman banner ke tabel database
      const { error: dbError } = await supabase.from("banners").insert([
        {
          image_url: urlData.publicUrl,
          target_url: targetUrl || null,
          urutan: urutan,
        },
      ]);

      if (dbError) throw dbError;

      alert("Banner baru berhasil diterbitkan!");
      setBannerFile(null);
      setTargetUrl("");
      setUrutan((prev) => prev + 1);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengunggah banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  // --- Aksi Edit Banner ---
  const handleStartEdit = (banner: Banner) => {
    setEditingBannerId(banner.id);
    setEditTargetUrl(banner.target_url || "");
    setEditUrutan(banner.urutan);
    setEditOldImageUrl(banner.image_url);
    setEditBannerFile(null);
  };

  const handleCancelEdit = () => {
    setEditingBannerId(null);
    setEditTargetUrl("");
    setEditUrutan(1);
    setEditBannerFile(null);
    setEditOldImageUrl("");
  };

  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditBannerFile(e.target.files[0]);
    }
  };

  const handleUpdateBanner = async (id: string) => {
    try {
      setUpdatingBanner(true);

      let newImageUrl = editOldImageUrl;

      // Jika ada file gambar baru yang dipilih, upload dan hapus yang lama
      if (editBannerFile) {
        const fileExt = editBannerFile.name.split(".").pop();
        const fileName = `banner-${Date.now()}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        // Upload gambar baru
        const { error: uploadError } = await supabase.storage
          .from("banners")
          .upload(filePath, editBannerFile);

        if (uploadError) throw uploadError;

        // Ambil URL publik gambar baru
        const { data: urlData } = supabase.storage
          .from("banners")
          .getPublicUrl(filePath);

        newImageUrl = urlData.publicUrl;

        // Hapus gambar lama dari storage
        const oldUrlParts = editOldImageUrl.split(
          "/storage/v1/object/public/banners/",
        );
        const oldFilePath = oldUrlParts[1];

        if (oldFilePath) {
          await supabase.storage.from("banners").remove([oldFilePath]);
        }
      }

      // Update data banner di database
      const { error } = await supabase
        .from("banners")
        .update({
          image_url: newImageUrl,
          target_url: editTargetUrl || null,
          urutan: editUrutan,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Banner berhasil diperbarui!");
      handleCancelEdit();
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui banner");
    } finally {
      setUpdatingBanner(false);
    }
  };

  // --- Aksi Hapus Banner (Database + Storage Bucket) ---
  const handleDeleteBanner = async (
    id: string,
    imageUrl: string,
    currentUrutan: number,
  ) => {
    if (
      !confirm("Apakah Anda yakin ingin menghapus banner ini beserta filenya?")
    )
      return;

    try {
      // 1. Ekstrak file path dari URL publik untuk menghapus file di storage bucket
      const urlParts = imageUrl.split("/storage/v1/object/public/banners/");
      const filePath = urlParts[1];

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("banners")
          .remove([filePath]);

        if (storageError) {
          console.error(
            "Gagal menghapus file gambar di storage:",
            storageError,
          );
        }
      }

      // 2. Hapus baris data terikat di database tabel banners
      const { error: dbError } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // 3. Update urutan banner lainnya yang urutannya lebih besar dari banner yang dihapus
      // Kurangi 1 pada urutan banner yang ada di atasnya
      const { error: updateError } = await supabase
        .from("banners")
        .update({ urutan: supabase.rpc("decrement_urutan") })
        .gt("urutan", currentUrutan);

      // Jika RPC tidak tersedia, lakukan manual update
      if (updateError) {
        // Ambil semua banner yang urutannya lebih besar
        const { data: bannersToUpdate } = await supabase
          .from("banners")
          .select("id, urutan")
          .gt("urutan", currentUrutan);

        if (bannersToUpdate && bannersToUpdate.length > 0) {
          // Update satu per satu
          for (const banner of bannersToUpdate) {
            await supabase
              .from("banners")
              .update({ urutan: banner.urutan - 1 })
              .eq("id", banner.id);
          }
        }
      }

      alert("Banner dan berkas gambar berhasil dibersihkan!");
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus banner");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* ==========================================
          SIDEBAR MENUNAVIGASI
          ========================================== */}
      <aside className="w-64 bg-green-900 text-white flex flex-col border-r border-green-800">
        <div className="p-6 border-b border-green-800">
          <h1 className="text-lg font-bold tracking-wider">BERTANI PANEL</h1>
          <p className="text-xs text-green-300 mt-1">Super Admin Core</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition ${
              activeMenu === "dashboard"
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-800"
            }`}
          >
            <HiOutlineChartBar size={18} />
            <span>Ringkasan Sistem</span>
          </button>
          <button
            onClick={() => setActiveMenu("banners")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition ${
              activeMenu === "banners"
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-800"
            }`}
          >
            <HiOutlinePhotograph size={18} />
            <span>Manajemen Banner</span>
          </button>
          <button
            onClick={() => setActiveMenu("poktan")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition ${
              activeMenu === "poktan"
                ? "bg-green-700 text-white"
                : "text-green-100 hover:bg-green-800"
            }`}
          >
            <HiOutlineUserGroup size={18} />
            <span>Verifikasi Poktan</span>
          </button>
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
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {activeMenu === "dashboard" && "Dashboard Ringkasan Utama"}
            {activeMenu === "banners" && "Kelola Banner Dinamis Beranda"}
            {activeMenu === "poktan" && "Validasi Pendaftaran Kelompok Tani"}
          </h2>
          <span className="text-xs bg-gray-200 px-3 py-1 rounded-full font-medium text-gray-600">
            Role: Super Admin
          </span>
        </header>

        {loading && (
          <div className="text-sm text-gray-500 animate-pulse">
            Sinkronisasi data database...
          </div>
        )}

        {/* ------------------------------------------
            MENU 1: RINGKASAN & PERSENTASE
            ------------------------------------------ */}
        {!loading && activeMenu === "dashboard" && (
          <div className="space-y-6">
            {/* Widget Kartu Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Kelompok Tani Pendaftar
                </span>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {stats.totalPoktan}
                </p>
              </div>

              <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Poktan Lolos Verifikasi
                </span>
                <p className="text-3xl font-extrabold text-green-700 mt-1">
                  {stats.activePoktan}
                </p>
              </div>

              <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Persentase Kesiapan Operasional
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-3xl font-extrabold text-blue-600">
                    {stats.percentageActive}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percentageActive}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Petunjuk Penggunaan Panel
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Gunakan bilah menu sebelah kiri untuk melakukan operasi kontrol.
                Anda memiliki hak akses penuh mutlak untuk menyunting banner
                iklan di aplikasi serta menyetujui (memverifikasi) akun kelompok
                tani agar lapak sewa alsintan mereka tampil di halaman publik
                beranda pengguna.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            MENU 2: MANAJEMEN BANNER
            ------------------------------------------ */}
        {!loading && activeMenu === "banners" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Tambah Banner */}
            <form
              onSubmit={handleAddBanner}
              className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-4 h-fit"
            >
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2">
                Unggah Banner Baru
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  File Gambar Banner
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Target URL Pengalihan (Opsional)
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://promo-pertanian.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-xs focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Urutan Tampilan Carousel
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={urutan}
                  onChange={(e) => setUrutan(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-xs focus:border-green-600"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingBanner}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded text-xs transition disabled:opacity-50"
              >
                {uploadingBanner ? "Mengunggah Berkas..." : "Terbitkan Banner"}
              </button>
            </form>

            {/* List Banner Aktif */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-gray-800">
                Daftar Banner Berjalan ({stats.totalBanners})
              </h3>
              {banners.length === 0 ? (
                <div className="text-center py-10 bg-white rounded border text-xs text-gray-400">
                  Belum ada banner terpasang.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <img
                          src={b.image_url}
                          alt="Banner"
                          className="w-full h-32 object-cover bg-gray-100"
                        />

                        {editingBannerId === b.id ? (
                          // Form Edit Inline
                          <div className="p-3 bg-blue-50 border-b border-blue-100 space-y-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                Ganti Gambar Banner (Opsional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditFileChange}
                                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-100 file:text-blue-700 cursor-pointer"
                              />
                              {editBannerFile && (
                                <p className="text-[9px] text-blue-600 mt-1">
                                  ✓ File baru dipilih: {editBannerFile.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                Target URL
                              </label>
                              <input
                                type="url"
                                value={editTargetUrl}
                                onChange={(e) =>
                                  setEditTargetUrl(e.target.value)
                                }
                                placeholder="https://promo-pertanian.com"
                                className="w-full px-2 py-1 border border-gray-300 rounded outline-none text-xs focus:border-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                                Urutan
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={editUrutan}
                                onChange={(e) =>
                                  setEditUrutan(Number(e.target.value))
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded outline-none text-xs focus:border-blue-600"
                              />
                            </div>
                          </div>
                        ) : (
                          // Display Info
                          <div className="p-3 bg-gray-50 flex justify-between items-center text-xs border-b border-gray-100">
                            <span className="font-semibold text-gray-600">
                              Urutan Tampil: #{b.urutan}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate max-w-37.5">
                              {b.target_url || "Tidak ada link"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-2 bg-gray-50 flex justify-end gap-2">
                        {editingBannerId === b.id ? (
                          // Tombol Simpan & Batal saat mode edit
                          <>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={updatingBanner}
                              className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white text-[11px] font-medium px-3 py-1.5 rounded transition shadow-sm disabled:opacity-50"
                            >
                              <span>Batal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBanner(b.id)}
                              disabled={updatingBanner}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition shadow-sm disabled:opacity-50"
                            >
                              <span>
                                {updatingBanner ? "Menyimpan..." : "Simpan"}
                              </span>
                            </button>
                          </>
                        ) : (
                          // Tombol Edit & Hapus saat mode normal
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(b)}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition shadow-sm"
                            >
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteBanner(b.id, b.image_url, b.urutan)
                              }
                              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium px-3 py-1.5 rounded transition shadow-sm"
                            >
                              <HiOutlineTrash size={14} />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------
            MENU 3: VERIFIKASI KELOMPOK TANI
            ------------------------------------------ */}
        {!loading && activeMenu === "poktan" && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                    <th className="p-4">Kelompok Tani</th>
                    <th className="p-4">Kecamatan</th>
                    <th className="p-4">Anggota</th>
                    <th className="p-4">Tarif Sewa</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {poktanList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Belum ada kelompok tani yang mendaftar di sistem.
                      </td>
                    </tr>
                  ) : (
                    poktanList.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-bold text-gray-900">
                          {p.nama_kelompok}
                        </td>
                        <td className="p-4 text-gray-600">{p.kecamatan}</td>
                        <td className="p-4 text-gray-600">
                          {p.jumlah_anggota} Orang
                        </td>
                        <td className="p-4 font-semibold text-green-700">
                          Rp {p.harga_sewa.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {p.is_active
                              ? "Aktif / Tayang"
                              : "Menunggu Verifikasi"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() =>
                              handleTogglePoktanActive(p.id, p.is_active)
                            }
                            className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                              p.is_active
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {p.is_active
                              ? "Sembunyikan Lapak"
                              : "Setujui & Tayangkan"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
