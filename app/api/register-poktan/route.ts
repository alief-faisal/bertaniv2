import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validasi saat runtime server agar langsung tahu jika key kosong
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ ERROR: Supabase URL atau Service Role Key tidak ditemukan di environment variables!",
  );
}

// Inisialisasi Supabase Admin dengan konfigurasi bypass auth yang ketat
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface RegisterPoktanBody {
  email?: string;
  password?: string;
  fullName?: string;
  selectedRole?: "user" | "poktan";
  namaKelompok?: string;
  kecamatan?: string;
  namaKetua?: string;
  daftarAnggota?: string;
  jumlahAnggota?: number;
  hargaSewa?: number;
  bannerUrl?: string;
  latitude?: number;
  longitude?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPoktanBody;

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
      bannerUrl,
      latitude,
      longitude,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi." },
        { status: 400 },
      );
    }

    // 1. Daftarkan User lewat Admin Auth API (Bypass RLS Auth)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, chosen_role: selectedRole },
      });

    if (authError) {
      console.error("❌ Auth Error:", authError.message);
      throw authError;
    }

    const user = authData?.user;
    if (!user) throw new Error("Gagal membuat user auth.");

    // 2. Insert Data Profil menggunakan Admin Client (PASTI BYPASS RLS)
    if (selectedRole === "poktan") {
      const { error: profileError } = await supabaseAdmin
        .from("poktan_profiles")
        .insert([
          {
            user_id: user.id,
            nama_kelompok: namaKelompok || fullName,
            kecamatan,
            nama_ketua: namaKetua,
            daftar_anggota: daftarAnggota,
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
        console.error("❌ Database Insert Error:", {
          message: profileError.message,
          code: (profileError as unknown as { code?: string }).code,
          details: (profileError as unknown as { details?: string }).details,
          hint: (profileError as unknown as { hint?: string }).hint,
        });
        throw profileError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil!",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 },
    );
  }
}
