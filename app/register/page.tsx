"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { UserRole } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  // --- Kredensial Akun Utama ---
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");

  // --- Data Spesifik Kelompok Tani (Poktan) ---
  const [namaKelompok, setNamaKelompok] = useState<string>("");
  const [kecamatan, setKecamatan] = useState<string>("Pandeglang"); // default pusat
  const [inputNamaAnggota, setInputNamaAnggota] = useState<string>(""); // Menggunakan input string dipisah koma
  const [jumlahAnggota, setJumlahAnggota] = useState<number>(0);
  const [hargaSewa, setHargaSewa] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(-6.3112);
  const [longitude, setLongitude] = useState<number>(105.8385);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locLoading, setLocLoading] = useState<boolean>(false);

  // Fungsi memproses input string nama anggota, menghitung jumlah, dan menentukan ketua
  const handleAnggotaInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputNamaAnggota(value);

    if (!value.trim()) {
      setJumlahAnggota(0);
      return;
    }

    // Pisahkan berdasarkan koma dan buang baris/spasi yang kosong
    const listAnggota = value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    setJumlahAnggota(listAnggota.length);
  };

  // Fungsi Deteksi Lokasi Otomatis Browser (GPS Geolocation)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi otomatis GPS.");
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocLoading(false);
        alert("Lokasi terdeteksi");
      },
      (error) => {
        console.error(error);
        alert("Gagal mendeteksi lokasi. Pastikan izin akses lokasi aktif.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  // Fungsi ambil berkas gambar banner
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedBannerUrl = "";

      // 1. Proses upload gambar ke storage tetap dilakukan di client (Gunakan bucket public)
      if (selectedRole === "poktan" && imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `temp-${Date.now()}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("poktan-media")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("poktan-media")
          .getPublicUrl(filePath);

        uploadedBannerUrl = publicUrlData.publicUrl;
      }

      // Olah data nama anggota
      const arrayNamaBersih = inputNamaAnggota
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n !== "");

      const namaKetua =
        arrayNamaBersih.length > 0 ? arrayNamaBersih[0] : fullName;

      // 2. Kirim data ke API Route internal kita untuk diproses secara aman di sisi server
      const response = await fetch("/api/register-poktan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          selectedRole,
          namaKelompok,
          kecamatan,
          namaKetua,
          daftarAnggota: arrayNamaBersih.join(", "),
          jumlahAnggota,
          hargaSewa,
          bannerUrl: uploadedBannerUrl,
          latitude,
          longitude,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert(
        "Pendaftaran berhasil! Tunggu verifikasi admin agar tampil di halaman utama.",
      );
      router.push("/login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 my-10">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-lg bg-white p-6 rounded-md shadow-sm border border-gray-200 space-y-4"
      >
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Form Pendaftaran</h2>
          <p className="text-xs text-gray-400 mt-1">
            Silakan lengkapi form pendaftaran di bawah ini
          </p>
        </div>

        {/* --- AKUN UTAMA --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nama Lengkap Anda
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Daftar Sebagai Peran
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
            >
              <option value="user">Pengguna</option>
              <option value="poktan">Kelompok Tani</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="budi@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* --- FORM KELOMPOK TANI (Hanya muncul jika role = 'poktan') --- */}
        {selectedRole === "poktan" && (
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-4">
            <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider">
              Informasi Detail Kelompok Tani (Poktan)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nama Kelompok Tani
                </label>
                <input
                  type="text"
                  required
                  value={namaKelompok}
                  onChange={(e) => setNamaKelompok(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                  placeholder="Poktan Tani Makmur"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Wilayah Kecamatan
                </label>
                <select
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className="w-full px-3 py-2 max-h-90 bg-white border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                >
                  <option value="Angsana">Angsana</option>
                  <option value="Banjar">Banjar</option>
                  <option value="Bojong">Bojong</option>
                  <option value="Cadasari">Cadasari</option>
                  <option value="Carita">Carita</option>
                  <option value="Cibaliung">Cibaliung</option>
                  <option value="Cibitung">Cibitung</option>
                  <option value="Cigeulis">Cigeulis</option>
                  <option value="Cikedal">Cikedal</option>
                  <option value="Cikeusik">Cikeusik</option>
                  <option value="Cimanggu">Cimanggu</option>
                  <option value="Cimanuk">Cimanuk</option>
                  <option value="Cipeucang">Cipeucang</option>
                  <option value="Cisata">Cisata</option>
                  <option value="Jiput">Jiput</option>
                  <option value="Kaduhejo">Kaduhejo</option>
                  <option value="Karang Tanjung">Karang Tanjung</option>
                  <option value="Koroncong">Koroncong</option>
                  <option value="Labuan">Labuan</option>
                  <option value="Majasari">Majasari</option>
                  <option value="Mandalawangi">Mandalawangi</option>
                  <option value="Mekarjaya">Mekarjaya</option>
                  <option value="Menes">Menes</option>
                  <option value="Munjul">Munjul</option>
                  <option value="Pagelaran">Pagelaran</option>
                  <option value="Pandeglang">Pandeglang</option>
                  <option value="Panimbang">Panimbang</option>
                  <option value="Patia">Patia</option>
                  <option value="Picung">Picung</option>
                  <option value="Pulosari">Pulosari</option>
                  <option value="Saketi">Saketi</option>
                  <option value="Sindangresmi">Sindangresmi</option>
                  <option value="Sobang">Sobang</option>
                  <option value="Sukaresmi">Sukaresmi</option>
                  <option value="Sumur">Sumur</option>
                </select>
              </div>
            </div>

            {/* BARU: Input Nama-Nama Anggota Menggunakan Tanda Koma */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nama-Nama Anggota Kelompok (Pisahkan dengan tanda koma)
              </label>
              <textarea
                required
                rows={3}
                value={inputNamaAnggota}
                onChange={handleAnggotaInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600 resize-none"
                placeholder="Urutan ke-1 Otomatis Ketua. Contoh: Ahmad (Ketua), Dani, Yusuf, Siti"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                * Urutan nama pertama yang Anda masukkan otomatis terdaftar
                sebagai **Ketua Kelompok**.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Jumlah Anggota Terdeteksi (Kalkulasi Otomatis)
                </label>
                <input
                  type="number"
                  readOnly
                  disabled
                  value={jumlahAnggota}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md outline-none text-sm text-gray-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tarif Sewa Alat Utama (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={hargaSewa}
                  onChange={(e) => setHargaSewa(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                />
              </div>
            </div>

            {/* Bagian Koordinat Lokasi GPS */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Koordinat Pemetaan Lahan
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locLoading}
                  className="text-[11px] text-white bg-green-700 px-2 py-0.5 rounded border disabled:opacity-50"
                >
                  {locLoading
                    ? "Mencari Satelit GPS..."
                    : "Deteksi Lokasi Otomatis"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  required
                  readOnly
                  value={latitude}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-500 outline-none"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  required
                  readOnly
                  value={longitude}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-500 outline-none"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* Bagian Input Foto Banner */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Unggah Foto Profil/Banner Kelompok
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md transition text-sm disabled:opacity-50"
        >
          {loading ? "Sedang Memproses Pendaftaran..." : "Daftar Akun Sekarang"}
        </button>

        {/* Tombol Simpel ke Halaman Login */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-xs text-green-700 hover:underline"
          >
            Sudah punya akun? Login
          </button>
        </div>
      </form>
    </main>
  );
}
