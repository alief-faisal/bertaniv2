import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { RegisterPayload, RegistrableRole } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ ERROR: Supabase URL atau Service Role Key tidak ditemukan di environment variables!",
  );
}

// Admin client: HANYA dipakai di server. Kunci ini tidak boleh pernah
// dikirim ke browser.
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { success: false, error: "Konfigurasi server belum lengkap." },
      { status: 500 },
    );
  }

  let createdUserId: string | null = null;
  let uploadedFilePath: string | null = null;

  try {
    const body = (await request.json()) as Partial<RegisterPayload>;

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
      bannerBase64,
      bannerFileName,
      latitude,
      longitude,
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

    // PENTING (keamanan): role yang boleh dipilih dari form publik HANYA
    // 'user' atau 'poktan'. 'admin' tidak pernah valid di sini, apapun yang
    // dikirim client — ini mencegah privilege escalation lewat request langsung.
    const role: RegistrableRole = selectedRole === "poktan" ? "poktan" : "user";

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
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -11 ||
        latitude > 6 ||
        longitude < 95 ||
        longitude > 141
      ) {
        // Rentang kasar wilayah Indonesia — mencegah input koordinat acak/salah.
        return badRequest("Koordinat lokasi tidak valid.");
      }
      if (!bannerBase64 || !bannerFileName) {
        return badRequest("Foto banner kelompok wajib diunggah.");
      }
    }

    // ---------- 3. DAFTARKAN USER (Admin Auth API, bypass RLS auth) ----------
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName.trim(), chosen_role: role },
      });

    if (authError) {
      console.error("❌ Auth Error:", authError.message);
      // Jangan bocorkan detail internal ke client.
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

    // ---------- 4. UPLOAD BANNER (server-side, service role) ----------
    let bannerUrl: string | null = null;

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

      uploadedFilePath = filePath;

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("poktan-media")
        .getPublicUrl(filePath);

      bannerUrl = publicUrlData.publicUrl;
    }

    // ---------- 5. INSERT DATA PROFIL POKTAN ----------
    // Catatan: baris public.profiles dibuat OTOMATIS oleh trigger database
    // (on_auth_user_created) berdasarkan user_metadata.chosen_role di atas.
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
            diskon_persen: 0,
            banner_url: bannerUrl,
            latitude,
            longitude,
            is_active: false,
          },
        ]);

      if (profileError) {
        console.error("❌ Database Insert Error:", profileError.message);
        // Rollback: hapus file yang sudah terupload dan akun auth yang menggantung.
        if (uploadedFilePath) {
          await supabaseAdmin.storage
            .from("poktan-media")
            .remove([uploadedFilePath]);
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

    // Rollback terakhir jika user auth sudah sempat terbuat sebelum error tak terduga.
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
