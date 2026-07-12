# Setup Supabase Realtime untuk Favorit

## ⚠️ PENTING: Aktifkan Realtime di Supabase Dashboard

Untuk membuat notifikasi favorit bekerja secara realtime, Anda **HARUS** mengaktifkan Realtime di Supabase Dashboard.

### Langkah-langkah:

#### 1. Buka Supabase Dashboard

- Login ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Pilih project Anda

#### 2. Aktifkan Realtime untuk Tabel `user_favorites`

1. Di sidebar kiri, klik **Database**
2. Klik **Replication** (atau **Publications**)
3. Cari tabel `user_favorites`
4. **Centang checkbox** untuk mengaktifkan Realtime
5. Pastikan opsi berikut tercentang:
   - ✅ **INSERT**
   - ✅ **UPDATE**
   - ✅ **DELETE**

#### 3. Aktifkan Realtime untuk Tabel `orders` (opsional)

1. Ulangi langkah yang sama untuk tabel `orders`
2. Centang INSERT, UPDATE, DELETE

### Atau via SQL:

Jalankan query berikut di SQL Editor:

```sql
-- Aktifkan realtime untuk user_favorites
ALTER PUBLICATION supabase_realtime ADD TABLE user_favorites;

-- Aktifkan realtime untuk orders (opsional)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

### Verifikasi:

Setelah mengaktifkan:

1. Refresh halaman aplikasi Anda
2. Buka Console Browser (F12)
3. Cari log berikut:
   - `📡 useFavorites subscription status: SUBSCRIBED`
   - `📡 Navbar subscription status: SUBSCRIBED`
4. Saat menambah/hapus favorit, Anda akan lihat:
   - `🔄 Realtime update detected in useFavorites:`
   - `🔔 Navbar realtime update (favorites):`

### Troubleshooting:

#### Status: `CHANNEL_ERROR` atau `TIMED_OUT`

- ✅ Pastikan tabel sudah ditambahkan ke publication
- ✅ Periksa koneksi internet
- ✅ Pastikan Supabase project aktif

#### Badge tidak update otomatis

- ✅ Cek apakah ada error di Console
- ✅ Pastikan user sudah login
- ✅ Clear cache browser dan refresh

#### Realtime hanya bekerja di tab yang sama

- Ini normal! Realtime akan broadcast ke semua tab yang terbuka
- Pastikan subscription berhasil di setiap tab

### Cara Kerja:

```
User klik favorit
    ↓
Optimistic Update (instant)
    ↓
Supabase Insert/Delete
    ↓
Postgres Broadcast Change
    ↓
All Subscribed Components Update:
  - useFavorites hook ✓
  - Navbar badge ✓
  - PoktanCard icons ✓
```

---

## 🎯 Expected Behavior:

✅ Klik button favorit → Icon langsung berubah (optimistic)  
✅ Badge di navbar langsung berubah (realtime)  
✅ Buka 2 tab → perubahan sync di kedua tab  
✅ Jika gagal → rollback otomatis

## 🚀 Performance:

- Realtime menggunakan WebSocket (efisien)
- Hanya listen perubahan untuk `user_id` yang login
- Auto cleanup saat component unmount
