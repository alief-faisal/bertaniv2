import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { RegistrableRole } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Admin client: HANYA dipakai di server. Kunci ini tidak boleh pernah
// dikirim ke browser.
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const VALID_KECAMATAN = new Set([
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
]);

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const MAX_BANNER_BYTES = 5 * 1024 * 1024; // 5 MB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: "Konfigurasi server belum lengkap." },
      { status: 500 },
    );
  }

  let createdUserId: string | null = null;

  try {
    const body = await request.json();

    const {
      email,
      password,
      fullName,
      selectedRole,
      namaKelompok,
      kecamatan,
      namaKetua,
      daftarAnggota,
      jumlahAnggota,
      hargaSewa,
      diskonPersen,
      bannerBase64,
      bannerFileName,
      galleryBase64,
      galleryFileNames,
    } = body;

    // ---------- 1. VALIDASI DASAR (berlaku untuk semua role) ----------
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return badRequest("Format email tidak valid.");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return badRequest("Kata sandi minimal 6 karakter.");
    }
    if (
      !fullName ||
      typeof fullName !== "string" ||
      fullName.trim().length < 2
    ) {
      return badRequest("Nama lengkap wajib diisi.");
    }

    const role: RegistrableRole = selectedRole === "poktan" ? "poktan" : "user";

    // Variabel penampung koordinat murni angka
    let parsedLatitude: number = 0;
    let parsedLongitude: number = 0;

    // ---------- 2. VALIDASI KHUSUS POKTAN ----------
    if (role === "poktan") {
      if (!namaKelompok || namaKelompok.trim().length < 3) {
        return badRequest(
          "Nama kelompok tani wajib diisi (minimal 3 karakter).",
        );
      }
      if (!kecamatan || !VALID_KECAMATAN.has(kecamatan)) {
        return badRequest("Kecamatan tidak valid.");
      }
      if (
        typeof jumlahAnggota !== "number" ||
        !Number.isFinite(jumlahAnggota) ||
        jumlahAnggota < 1
      ) {
        return badRequest("Jumlah anggota tidak valid.");
      }
      if (
        typeof hargaSewa !== "number" ||
        !Number.isFinite(hargaSewa) ||
        hargaSewa < 0
      ) {
        return badRequest("Tarif sewa tidak valid.");
      }

      // === BAGIAN KOORDINAT YANG DIGANTI & DIPERBAIKI ===
      // 1. Ambil data mentah, ubah ke string, dan pastikan tanda koma ditukar menjadi titik desimal
      const rawLat = String(body.latitude ?? "")
        .trim()
        .replace(",", ".");
      const rawLng = String(body.longitude ?? "")
        .trim()
        .replace(",", ".");

      // 2. Konversi ke tipe data angka murni
      parsedLatitude = Number(rawLat);
      parsedLongitude = Number(rawLng);

      // LOG UNTUK DEBUGGING (Cek terminal VS Code Anda jika error berlanjut)
      console.log("--- DEBUG KOORDINAT ---");
      console.log(
        "Mentah dari client -> Lat:",
        body.latitude,
        " | Lng:",
        body.longitude,
      );
      console.log(
        "Hasil Parsing Angka -> Lat:",
        parsedLatitude,
        " | Lng:",
        parsedLongitude,
      );

      // 3. Validasi jika kolom kosong atau bukan angka desimal yang valid
      if (
        rawLat === "" ||
        rawLng === "" ||
        Number.isNaN(parsedLatitude) ||
        Number.isNaN(parsedLongitude) ||
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude)
      ) {
        return badRequest(
          "Koordinat lokasi harus diisi dengan angka desimal (gunakan titik, misal: -6.3112).",
        );
      }

      // 4. Validasi batas wilayah Indonesia
      if (
        parsedLatitude < -11 ||
        parsedLatitude > 6 ||
        parsedLongitude < 95 ||
        parsedLongitude > 141
      ) {
        return badRequest(
          `Koordinat (${parsedLatitude}, ${parsedLongitude}) berada di luar jangkauan wilayah Indonesia.`,
        );
      }
      // === END BAGIAN YANG DIGANTI ===

      if (!bannerBase64 || !bannerFileName) {
        return badRequest("Foto banner kelompok wajib diunggah.");
      }

      // --- PERBAIKAN DI SINI: Paksa konversi string dari input manual ke tipe Number murni ---
      parsedLatitude = Number(body.latitude);
      parsedLongitude = Number(body.longitude);

      if (
        Number.isNaN(parsedLatitude) ||
        Number.isNaN(parsedLongitude) ||
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude) ||
        parsedLatitude < -11 ||
        parsedLatitude > 6 ||
        parsedLongitude < 95 ||
        parsedLongitude > 141
      ) {
        // Rentang kasar wilayah Indonesia — mencegah koordinat acak/kosong.
        return badRequest(
          "Koordinat lokasi tidak valid atau di luar jangkauan wilayah.",
        );
      }

      if (!bannerBase64 || !bannerFileName) {
        return badRequest("Foto banner kelompok wajib diunggah.");
      }
    }

    // ---------- 3. DAFTARKAN USER (Admin Auth API) ----------
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName.trim(), chosen_role: role },
      });

    if (authError) {
      console.error("❌ Auth Error:", authError.message);
      const message = authError.message.toLowerCase().includes("already")
        ? "Email sudah terdaftar."
        : "Gagal mendaftarkan akun.";
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 },
      );
    }

    const user = authData?.user;
    if (!user) throw new Error("Gagal membuat user auth.");
    createdUserId = user.id;

    // ---------- 4. UPLOAD BANNER (Server Side Storage) ----------
    let bannerUrl: string | null = null;
    const galleryUrls: string[] = [];
    const uploadedFilePaths: string[] = [];

    if (role === "poktan" && bannerBase64 && bannerFileName) {
      const fileExt = (bannerFileName.split(".").pop() || "").toLowerCase();
      const contentType = ALLOWED_IMAGE_TYPES[fileExt];

      if (!contentType) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return badRequest(
          "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.",
        );
      }

      const base64Payload = bannerBase64.includes(",")
        ? bannerBase64.split(",")[1]
        : bannerBase64;
      const buffer = Buffer.from(base64Payload, "base64");

      if (buffer.byteLength === 0 || buffer.byteLength > MAX_BANNER_BYTES) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return badRequest("Ukuran gambar tidak valid (maksimal 5MB).");
      }

      const filePath = `banners/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("poktan-media")
        .upload(filePath, buffer, { contentType, upsert: true });

      if (uploadError) {
        console.error("❌ Storage Upload Error:", uploadError.message);
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return NextResponse.json(
          { success: false, error: "Gagal mengunggah foto banner." },
          { status: 400 },
        );
      }

      uploadedFilePaths.push(filePath);

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("poktan-media")
        .getPublicUrl(filePath);

      bannerUrl = publicUrlData.publicUrl;
    }

    // Upload gallery images
    if (
      role === "poktan" &&
      galleryBase64 &&
      galleryFileNames &&
      Array.isArray(galleryBase64)
    ) {
      for (let i = 0; i < galleryBase64.length; i++) {
        const base64 = galleryBase64[i];
        const fileName = galleryFileNames[i];

        if (!base64 || !fileName) continue;

        const fileExt = (fileName.split(".").pop() || "").toLowerCase();
        const contentType = ALLOWED_IMAGE_TYPES[fileExt];

        if (!contentType) continue;

        const base64Payload = base64.includes(",")
          ? base64.split(",")[1]
          : base64;
        const buffer = Buffer.from(base64Payload, "base64");

        if (buffer.byteLength === 0 || buffer.byteLength > MAX_BANNER_BYTES)
          continue;

        const filePath = `gallery/${user.id}-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("poktan-media")
          .upload(filePath, buffer, { contentType, upsert: true });

        if (!uploadError) {
          uploadedFilePaths.push(filePath);
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("poktan-media")
            .getPublicUrl(filePath);
          galleryUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    // ---------- 5. INSERT DATA PROFIL POKTAN ----------
    if (role === "poktan") {
      const { error: profileError } = await supabaseAdmin
        .from("poktan_profiles")
        .insert([
          {
            user_id: user.id,
            nama_kelompok: namaKelompok!.trim(),
            kecamatan,
            nama_ketua: namaKetua?.trim() || null,
            daftar_anggota: daftarAnggota || null,
            jumlah_anggota: jumlahAnggota,
            harga_sewa: hargaSewa,
            diskon_persen: diskonPersen || 0,
            banner_url: bannerUrl,
            gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            is_active: false,
          },
        ]);

      if (profileError) {
        console.error("❌ Database Insert Error:", profileError.message);
        // Hapus semua file yang sudah diupload
        if (uploadedFilePaths.length > 0) {
          await supabaseAdmin.storage
            .from("poktan-media")
            .remove(uploadedFilePaths);
        }
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return NextResponse.json(
          { success: false, error: "Gagal menyimpan data kelompok tani." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          role === "poktan"
            ? "Registrasi berhasil! Akun Anda menunggu verifikasi admin."
            : "Registrasi berhasil!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Unexpected register error:", error);

    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => {});
    }

    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}
