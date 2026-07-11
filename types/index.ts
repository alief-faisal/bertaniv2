// 📁 Simpan sebagai: types/index.ts

// 1. Role sesuai ENUM public.user_role di Postgres.
//    "admin" TIDAK PERNAH dikirim dari form pendaftaran publik — hanya
//    dipakai untuk menampilkan/membaca role yang sudah ada di database.
export type UserRole = "user" | "poktan" | "admin";

// Role yang boleh DIPILIH saat mendaftar lewat form publik.
export type RegistrableRole = "user" | "poktan";

// 2. Mencocokkan tabel public.profiles
export interface ProfilesRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

// 3. Mencocokkan tabel public.poktan_profiles
export interface PoktanProfile {
  id: string;
  user_id?: string;
  nama_kelompok: string;
  kecamatan: string;
  nama_ketua?: string | null;
  daftar_anggota?: string | null;
  jumlah_anggota: number;
  harga_sewa: number;
  diskon_persen: number;
  banner_url: string;
  gallery_urls?: string[];
  order_count?: number;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  distance?: string; // Label badge jarak yang sudah diformat, mis. "1.2 km"
  // ⬇️ BARU: jarak mentah dalam kilometer (belum diformat), dipakai untuk
  // mengurutkan daftar poktan dari yang terdekat ke terjauh setelah GPS
  // pengguna terdeteksi di Navbar. `distance` (string) tetap dipakai untuk
  // teks badge yang ditampilkan, `distanceKm` (number) untuk kebutuhan
  // sorting/komputasi supaya tidak perlu parse ulang string.
  distanceKm?: number;
}

// 6. Mencocokkan tabel public.user_favorites
export interface UserFavorite {
  id: string;
  user_id: string;
  poktan_id: string;
  created_at: string;
}

// 7. Mencocokkan tabel public.orders (sistem pemesanan & pembayaran)
//    Hanya role "user" yang boleh membuat baris di tabel ini — admin/poktan
//    diblokir di level UI (tombol Order) DAN sebaiknya juga di RLS Supabase.
export type OrderStatus = "pending" | "paid" | "cancelled" | "completed";

export interface OrderRow {
  id: string;
  user_id: string;
  poktan_id: string;
  tanggal_mulai: string; // format date "YYYY-MM-DD"
  jumlah_hari: number;
  harga_satuan: number; // harga sewa per hari setelah diskon, dikunci saat order dibuat
  total_harga: number; // harga_satuan * jumlah_hari
  status: OrderStatus;
  metode_bayar?: string | null;
  created_at: string;
}

// Dipakai di halaman Riwayat Pembayaran: hasil join orders + poktan_profiles
export interface OrderWithPoktan extends OrderRow {
  poktan_profiles: {
    nama_kelompok: string;
    kecamatan: string;
    banner_url: string;
  } | null;
}

// 4. Banner untuk carousel
export interface Banner {
  id: string;
  image_url: string;
  target_url: string | null;
  urutan: number;
  created_at: string;
}

// 5. Payload dipakai bersama antara register/page.tsx <-> api/register-poktan/route.ts
//    Dipisah agar kedua sisi (client & server) selalu sinkron.
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  selectedRole: RegistrableRole;
  // Field di bawah hanya wajib diisi jika selectedRole === "poktan"
  namaKelompok?: string;
  kecamatan?: string;
  namaKetua?: string;
  daftarAnggota?: string;
  jumlahAnggota?: number;
  hargaSewa?: number;
  latitude?: number;
  longitude?: number;
  // Banner dikirim sebagai base64 supaya upload dilakukan di SERVER
  // (service role), bukan dari browser — menghindari RLS storage.
  bannerBase64?: string;
  bannerFileName?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
}
