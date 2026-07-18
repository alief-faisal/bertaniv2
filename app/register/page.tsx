"use client";

import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { RegisterPayload, RegisterResponse, RegistrableRole } from "@/types";

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

// Ubah File menjadi base64 di browser, tanpa menyentuh Supabase Storage
// sama sekali dari client (uploadnya dilakukan di server, lihat route.ts).
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
    reader.readAsDataURL(file);
  });
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  // --- Kredensial Akun Utama ---
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RegistrableRole>("user");

  // --- Data Spesifik Kelompok Tani (Poktan) ---
  const [namaKelompok, setNamaKelompok] = useState<string>("");
  const [kecamatan, setKecamatan] = useState<string>("Pandeglang");
  const [inputNamaAnggota, setInputNamaAnggota] = useState<string>("");
  const [jumlahAnggota, setJumlahAnggota] = useState<number>(0);
  const [hargaSewa, setHargaSewa] = useState<number>(0);
  const [diskonPersen, setDiskonPersen] = useState<number>(0);
  const [latitude, setLatitude] = useState<number | string>(-6.3112);
  const [longitude, setLongitude] = useState<number | string>(105.8385);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [locLoading, setLocLoading] = useState<boolean>(false);

  const handleAnggotaInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputNamaAnggota(value);

    if (!value.trim()) {
      setJumlahAnggota(0);
      return;
    }

    const listAnggota = value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    setJumlahAnggota(listAnggota.length);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Browser Anda tidak mendukung deteksi lokasi otomatis GPS.");
      return;
    }

    setLocLoading(true);
    setFormError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        setFormError(
          "Gagal mendeteksi lokasi. Pastikan izin akses lokasi aktif.",
        );
        setLocLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_IMAGE_EXT.includes(ext)) {
      setFormError(
        "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.",
      );
      e.target.value = "";
      setImageFile(null);
      return;
    }
    if (file.size > MAX_BANNER_MB * 1024 * 1024) {
      setFormError(`Ukuran gambar maksimal ${MAX_BANNER_MB}MB.`);
      e.target.value = "";
      setImageFile(null);
      return;
    }

    setFormError("");
    setImageFile(file);
  };

  const handleGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validasi setiap file
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_IMAGE_EXT.includes(ext)) {
        setFormError(
          "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.",
        );
        e.target.value = "";
        return;
      }
      if (file.size > MAX_BANNER_MB * 1024 * 1024) {
        setFormError(`Ukuran gambar maksimal ${MAX_BANNER_MB}MB.`);
        e.target.value = "";
        return;
      }
    }

    // Batasi maksimal 5 gambar
    if (galleryFiles.length + files.length > 5) {
      setFormError("Maksimal 5 gambar galeri.");
      return;
    }

    setFormError("");
    setGalleryFiles([...galleryFiles, ...files]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
  };

  const removeBannerImage = () => {
    setImageFile(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 6) {
      setFormError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (selectedRole === "poktan" && !imageFile) {
      setFormError("Foto profil/banner kelompok wajib diunggah.");
      return;
    }

    setLoading(true);

    try {
      let bannerBase64: string | undefined;
      let bannerFileName: string | undefined;
      let galleryBase64: string[] | undefined;
      let galleryFileNames: string[] | undefined;

      if (selectedRole === "poktan" && imageFile) {
        bannerBase64 = await fileToBase64(imageFile);
        bannerFileName = imageFile.name;
      }

      // Process gallery images
      if (selectedRole === "poktan" && galleryFiles.length > 0) {
        galleryBase64 = await Promise.all(
          galleryFiles.map((file) => fileToBase64(file)),
        );
        galleryFileNames = galleryFiles.map((file) => file.name);
      }

      const arrayNamaBersih = inputNamaAnggota
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n !== "");

      const namaKetua =
        arrayNamaBersih.length > 0 ? arrayNamaBersih[0] : fullName;

      const payload: RegisterPayload = {
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
        diskonPersen,
        latitude: latitude ? latitude.toString().replace(",", ".") : "0",
        longitude: longitude ? longitude.toString().replace(",", ".") : "0",
        bannerBase64,
        bannerFileName,
        galleryBase64,
        galleryFileNames,
      };

      const response = await fetch("/api/register-poktan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as RegisterResponse;

      if (!result.success) {
        throw new Error(result.error || "Registrasi gagal.");
      }

      router.push("/login?registered=1");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 my-10">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-lg bg-white p-6 rounded-md shadow-sm border border-gray-200 space-y-4"
        aria-describedby={formError ? "form-error" : undefined}
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">Form Pendaftaran</h1>
          <p className="text-xs text-gray-400 mt-1">
            Silakan lengkapi form pendaftaran di bawah ini
          </p>
        </div>

        {formError && (
          <div
            id="form-error"
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {formError}
          </div>
        )}

        {/* --- AKUN UTAMA --- */}
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border-0 p-0 m-0">
          <legend className="sr-only">Data akun utama</legend>

          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-semibold text-gray-600 mb-1"
            >
              Nama Lengkap Anda
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="Masukkan Nama Anda"
            />
          </div>

          <div>
            <label
              htmlFor="selectedRole"
              className="block text-xs font-semibold text-gray-600 mb-1"
            >
              Daftar Sebagai :
            </label>
            <select
              id="selectedRole"
              name="selectedRole"
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(e.target.value as RegistrableRole)
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
            >
              <option value="user">Pengguna</option>
              <option value="poktan">Kelompok Tani</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border-0 p-0 m-0">
          <legend className="sr-only">Kredensial login</legend>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-gray-600 mt-2 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="Masukkan Email Anda"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-600 mt-2 mb-1"
            >
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
              placeholder="Minimal 6 karakter"
            />
          </div>
        </fieldset>

        {/* --- form kelompok tani --- */}
        {selectedRole === "poktan" && (
          <fieldset className="border-t border-dashed border-gray-200 pt-1 space-y-1">


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="namaKelompok"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Nama Kelompok Tani
                </label>
                <input
                  id="namaKelompok"
                  name="namaKelompok"
                  type="text"
                  required
                  minLength={3}
                  value={namaKelompok}
                  onChange={(e) => setNamaKelompok(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                  placeholder="Masukkan Nama Poktan"
                />
              </div>

              <div>
                <label
                  htmlFor="kecamatan"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Wilayah Kecamatan
                </label>
                <select
                  id="kecamatan"
                  name="kecamatan"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className="w-full px-3 py-2 max-h-90 bg-white border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                >
                  {KECAMATAN_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="inputNamaAnggota"
                className="block text-xs font-semibold text-gray-600 mb-1"
              >
                Nama-Nama Anggota Kelompok
              </label>
              <textarea
                id="inputNamaAnggota"
                name="inputNamaAnggota"
                required
                rows={3}
                value={inputNamaAnggota}
                onChange={handleAnggotaInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600 resize-none"
                placeholder="Pisahkan dengan tanda koma, urutan pertama otomatis menjadi ketua kelompok."
                aria-describedby="anggota-hint"
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jumlahAnggota"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Jumlah Anggota Otomatis
                </label>
                <output
                  id="jumlahAnggota"
                  htmlFor="inputNamaAnggota"
                  className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 font-bold"
                >
                  {jumlahAnggota}
                </output>
              </div>

              <div>
                <label
                  htmlFor="hargaSewa"
                  className="block text-xs font-semibold text-gray-600 "
                >
                  Tarif Jasa (IDR)
                </label>
                <input
                  id="hargaSewa"
                  name="hargaSewa"
                  type="number"
                  required
                  min={0}
                  value={hargaSewa}
                  onChange={(e) => setHargaSewa(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="diskonPersen"
                className="block text-xs font-semibold text-gray-600 mb-1"
              >
                Diskon (%) - Opsional
              </label>
              <input
                id="diskonPersen"
                name="diskonPersen"
                type="number"
                min={0}
                max={100}
                value={diskonPersen}
                onChange={(e) => setDiskonPersen(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none text-sm focus:border-green-600"
                placeholder="Contoh: 10 untuk diskon 10%"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="block text-xs font-semibold text-gray-600">
                  Koordinat Kelompok Tani
                </span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locLoading}
                  className="text-[13px] text-white bg-green-700 px-1 py-1 rounded-md border disabled:opacity-50"
                >
                  {locLoading
                    ? "Medeteksi lokasi perangkat..."
                    : "Deteksi Koordinat Otomatis"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="sr-only">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 outline-none focus:border-green-600"
                    placeholder="Latitude"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="sr-only">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)} // <-- Sekarang bisa diketik manual
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 outline-none focus:border-green-600"
                    placeholder="Longitude"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="bannerFile"
                className="block text-xs font-semibold text-gray-600 mb-1"
              >
                Unggah Foto Profil/Banner Kelompok (JPG/PNG/WEBP, maks{" "}
                {MAX_BANNER_MB}MB)
              </label>
              <input
                id="bannerFile"
                name="bannerFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              {imageFile && (
                <div className="mt-3 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview Banner"
                    className="w-full h-48 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeBannerImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                    aria-label="Hapus banner"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="galleryFiles"
                className="block text-xs font-semibold text-gray-600 mb-1"
              >
                Galeri Foto Tambahan (Maksimal 5 foto, JPG/PNG/WEBP)
              </label>
              <input
                id="galleryFiles"
                name="galleryFiles"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleGalleryChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {galleryFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {galleryFiles.map((file, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={index} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        aria-label={`Hapus gambar ${index + 1}`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md transition text-sm disabled:opacity-50 mt-5"
        >
          {loading ? "Sedang Memproses Pendaftaran..." : "Daftar"}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-xs text-green-700 hover:underline block mx-auto mb-2"
          >
            Sudah punya akun? Login
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs text-gray-500 hover:underline block mx-auto"
          >
            Kembali ke Beranda
          </button>
        </div>
      </form>
    </main>
  );
}
