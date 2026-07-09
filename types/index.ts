// 1. Definisikan tipe Role sesuai ENUM di Database Postgres
export type UserRole = "guest" | "user" | "poktan" | "admin";

// 2. Definisikan interface ProfilesRow untuk mencocokkan tabel 'public.profiles'
export interface ProfilesRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

// 3. Definisikan interface PoktanProfile untuk data Kelompok Tani
export interface PoktanProfile {
  id: string;
  user_id?: string;
  nama_kelompok: string;
  kecamatan: string;
  jumlah_anggota: number;
  harga_sewa: number;
  diskon_persen: number;
  banner_url: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  distance?: string; // Opsional jika ada fitur kalkulasi jarak km
}

// Tambahkan interface Banner ini ke dalam file types Anda
export interface Banner {
  id: string;
  image_url: string;
  target_url: string | null;
  urutan: number;
  created_at: string;
}