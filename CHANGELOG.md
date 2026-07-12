# Changelog - Bertani Platform

## Fitur Baru & Perbaikan

### ✅ 1. Multiple Images Upload

- **Registrasi Poktan**: Sekarang bisa upload banner utama + hingga 5 foto galeri
- **Preview Gambar**: Real-time preview sebelum upload dengan tombol hapus
- **Validasi**: Maksimal 5MB per file, format JPG/PNG/WEBP

### ✅ 2. Poktan Dashboard yang Lengkap

- **Edit Profil**: Ubah nama kelompok, kecamatan, harga, dan diskon
- **Ganti Banner**: Upload banner baru dengan preview
- **Kelola Galeri**:
  - Tambah foto baru (maksimal 5 total)
  - Hapus foto lama (ditandai dulu sebelum disimpan)
  - Preview real-time
  - Indicator "Baru" untuk foto yang baru ditambah
- **Hapus Profil**: Menghapus profil lengkap dengan semua foto dari storage

### ✅ 3. Sistem Diskon

- **Input Diskon**: Field diskon (%) di form registrasi dan dashboard
- **Tampilan Card**:
  - Harga asli dengan coretan -3deg (rotasi miring)
  - Badge "Diskon X%"
  - Harga setelah diskon lebih prominent
- **Perhitungan Otomatis**: Diskon dihitung otomatis di backend dan frontend

### ✅ 4. Perbaikan Backend

- **Multiple Upload**: API route mendukung upload banner + gallery
- **Auto Delete**: Saat hapus profil, semua file di storage terhapus otomatis
- **Validasi Koordinat**: Perbaikan parsing latitude/longitude
- **Error Handling**: Lebih robust dengan rollback otomatis

### ✅ 5. UI/UX Improvements

- **Responsive Design**: Semua fitur responsive di mobile/tablet/desktop
- **Loading States**: Indicator loading saat proses upload/save
- **Error Messages**: Pesan error yang jelas dan helpful
- **Success Feedback**: Notifikasi sukses setelah operasi berhasil

## File yang Diubah

### Frontend

1. `app/register/page.tsx`
   - Multiple images upload dengan preview
   - Field diskon persen
   - Validasi lebih ketat

2. `app/poktan/page.tsx`
   - Dashboard lengkap dengan CRUD operations
   - Edit profil, ganti banner, kelola galeri
   - Delete profile dengan konfirmasi

3. `components/PoktanCard.tsx`
   - Tampilan diskon dengan coretan -3deg
   - Badge diskon lebih prominent

### Backend

4. `app/api/register-poktan/route.ts`
   - Support multiple images
   - Upload gallery ke storage
   - Diskon persen support

### Types

5. `types/index.ts`
   - RegisterPayload dengan galleryBase64 & galleryFileNames
   - PoktanProfile sudah ada gallery_urls

## Cara Menggunakan

### Sebagai Poktan:

1. **Registrasi**:
   - Upload banner utama (wajib)
   - Upload hingga 5 foto galeri (opsional)
   - Set harga sewa dan diskon

2. **Dashboard**:
   - Klik "Edit Profil" untuk mengubah data
   - Klik "Ganti Banner" untuk upload banner baru
   - Klik "Tambah Foto" untuk menambah galeri
   - Klik icon trash untuk hapus foto (ditandai dulu)
   - Klik "Simpan" untuk konfirmasi perubahan
   - Klik "Batal" untuk membatalkan

3. **Hapus Profil**:
   - Klik "Hapus Profil"
   - Konfirmasi (tidak bisa dibatalkan!)
   - Semua data dan foto akan terhapus

### Sebagai User:

- Lihat diskon di card poktan
- Harga dengan coretan miring untuk harga asli
- Badge diskon yang jelas

## Storage Structure

```
poktan-media/
├── banners/
│   └── {user_id}-{timestamp}.{ext}
└── gallery/
    └── {user_id}-{timestamp}-{index}.{ext}
```

## Database Changes

Tidak ada perubahan schema database yang diperlukan.
`gallery_urls` sudah ada sebagai array di `poktan_profiles`.

## Known Issues & Warnings

- Beberapa ESLint warnings masih ada (non-critical)
- `FormEvent` deprecated warning (React 19)
- `@next/next/no-img-element` warnings (bisa diabaikan untuk preview)

## Testing Checklist

- [x] Upload single banner
- [x] Upload multiple gallery (1-5 images)
- [x] Preview images sebelum upload
- [x] Remove images dari preview
- [x] Edit profile data
- [x] Replace banner
- [x] Add gallery images
- [x] Delete gallery images
- [x] Delete profile completely
- [x] Diskon calculation
- [x] Diskon display di card

## Next Steps (Opsional)

1. Compress images sebelum upload (reduce file size)
2. Lazy loading untuk gallery images
3. Lightbox/modal untuk preview full size
4. Drag & drop untuk reorder gallery
5. Crop tool untuk banner upload
