# 📝 Dokumentasi Update Fitur Poktan Dashboard

## 🎯 Ringkasan Perubahan

Update ini menambahkan fitur-fitur penting untuk sistem Bertani:

### ✨ Fitur Baru

1. **Multiple Image Upload** - Upload hingga 5 foto galeri tambahan
2. **Image Preview** - Preview real-time sebelum upload
3. **Poktan Dashboard** - Panel manajemen lengkap untuk kelompok tani
4. **Edit Profile** - Ubah nama, kecamatan, harga, diskon, dan foto
5. **Gallery Management** - Tambah/hapus foto galeri dengan mudah
6. **Delete Profile** - Hapus profil beserta semua gambar dari storage
7. **Discount Display** - Tampilan diskon dengan coretan -3 derajat

---

## 📂 File yang Diubah

### 1. **types/index.ts**

```typescript
// Tambahan field baru:
- diskonPersen?: number
- galleryBase64?: string[]
- galleryFileNames?: string[]
```

### 2. **app/register/page.tsx**

**Perubahan:**

- ✅ Multiple file upload untuk galeri (max 5 gambar)
- ✅ Preview gambar banner dan galeri
- ✅ Tombol hapus untuk setiap preview
- ✅ Validasi ukuran dan format gambar
- ✅ Input field untuk diskon persen

**Fitur Baru:**

```tsx
const [diskonPersen, setDiskonPersen] = useState<number>(0);
const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
```

### 3. **app/api/register-poktan/route.ts**

**Perubahan:**

- ✅ Handle multiple gallery images upload
- ✅ Save gallery URLs ke database sebagai array
- ✅ Support diskon_persen field
- ✅ Auto-delete files jika registration gagal

**Upload Logic:**

```typescript
// Upload banner
const filePath = `banners/${user.id}-${Date.now()}.${fileExt}`;

// Upload gallery (loop untuk multiple files)
const filePath = `gallery/${user.id}-${Date.now()}-${i}.${fileExt}`;
```

### 4. **app/poktan/page.tsx** (BARU - Dashboard Lengkap)

**Fitur Utama:**

#### 📊 Dashboard View

- ✅ Tampilkan banner, nama kelompok, kecamatan
- ✅ Info harga dengan diskon (jika ada)
- ✅ Jumlah anggota, status verifikasi
- ✅ Total pesanan

#### ✏️ Edit Mode

- ✅ Ganti banner (upload baru, preview, delete yang lama)
- ✅ Edit nama kelompok
- ✅ Ubah kecamatan (dropdown)
- ✅ Update harga sewa
- ✅ Set diskon persen (0-100%)
- ✅ Tambah foto galeri (multiple)
- ✅ Hapus foto galeri (mark for deletion dengan preview)
- ✅ Tombol Save & Cancel

#### 🗑️ Delete Profile

- ✅ Konfirmasi sebelum delete
- ✅ Hapus semua gambar dari Supabase Storage
- ✅ Hapus record dari database
- ✅ Sign out dan redirect ke home

**UI Components:**

```typescript
- Banner dengan tombol "Ganti Banner"
- Grid galeri 5 kolom responsive
- Status badge (Aktif/Menunggu Verifikasi)
- Error & Success notifications
- Loading states
```

### 5. **components/PoktanCard.tsx**

**Perubahan:**

- ✅ Tampilan diskon dengan efek rotasi -3 derajat
- ✅ Coretan pada harga asli jika ada diskon
- ✅ Badge "Diskon X%"

**Styling Diskon:**

```typescript
<span
  className="text-xs text-red-500 font-medium relative"
  style={{
    textDecoration: 'line-through',
    textDecorationColor: '#EF4444',
    textDecorationThickness: '1.5px',
    transform: 'rotate(-3deg)',
    display: 'inline-block',
  }}
>
  Rp {formatRupiah(hargaSewa)}
</span>
```

---

## 🗄️ Database Schema Changes

### Migration SQL (WAJIB DIJALANKAN!)

Jalankan file `supabase-migration.sql` di Supabase SQL Editor:

```sql
-- 1. Tambah kolom gallery_urls (array)
ALTER TABLE poktan_profiles
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[];

-- 2. Tambah kolom diskon_persen
ALTER TABLE poktan_profiles
ADD COLUMN IF NOT EXISTS diskon_persen INTEGER DEFAULT 0;

-- 3. Constraint untuk diskon (0-100%)
ALTER TABLE poktan_profiles
ADD CONSTRAINT diskon_persen_range
CHECK (diskon_persen >= 0 AND diskon_persen <= 100);
```

**Struktur Tabel poktan_profiles:**

```
- id (uuid)
- user_id (uuid)
- nama_kelompok (text)
- kecamatan (text)
- nama_ketua (text)
- daftar_anggota (text)
- jumlah_anggota (integer)
- harga_sewa (integer)
- diskon_persen (integer) ← BARU
- banner_url (text)
- gallery_urls (text[]) ← BARU
- latitude (numeric)
- longitude (numeric)
- is_active (boolean)
- order_count (integer)
- created_at (timestamp)
```

---

## 🔐 Storage Structure

### Supabase Storage Bucket: `poktan-media`

```
poktan-media/
├── banners/
│   ├── {user_id}-{timestamp}.jpg
│   ├── {user_id}-{timestamp}.png
│   └── {user_id}-{timestamp}.webp
│
└── gallery/
    ├── {user_id}-{timestamp}-0.jpg
    ├── {user_id}-{timestamp}-1.jpg
    ├── {user_id}-{timestamp}-2.png
    └── ...
```

**Auto-delete logic:**

- ✅ Saat ganti banner → hapus banner lama
- ✅ Saat hapus galeri → hapus dari storage
- ✅ Saat delete profile → hapus semua files

---

## 🚀 Cara Menggunakan

### Untuk Poktan (Kelompok Tani):

#### 1. Registrasi

```
1. Pilih role "Kelompok Tani"
2. Upload banner (wajib)
3. Upload galeri (opsional, max 5)
4. Set harga sewa
5. Set diskon (opsional, 0-100%)
6. Preview semua gambar sebelum submit
```

#### 2. Dashboard Poktan

```
Akses: /poktan

View Mode:
- Lihat profil lengkap
- Info harga dengan diskon
- Galeri foto

Edit Mode (klik "Edit Profil"):
- Ganti banner
- Edit nama kelompok
- Ubah kecamatan
- Update harga & diskon
- Kelola galeri:
  * Tambah foto (max 5 total)
  * Hapus foto (klik ikon trash)
  * Preview perubahan
- Klik "Simpan" atau "Batal"

Delete Profile:
- Klik "Hapus Profil"
- Konfirmasi
- Semua data & gambar terhapus
- Auto sign out
```

---

## 🎨 UI/UX Improvements

### Preview Images

- ✅ Real-time preview saat upload
- ✅ Thumbnail grid responsive
- ✅ Delete button dengan icon X
- ✅ Hover effects

### Gallery Management

- ✅ Grid layout 2-3-5 kolom (mobile-tablet-desktop)
- ✅ Mark for deletion dengan opacity
- ✅ Undo delete sebelum save
- ✅ Badge "Baru" untuk foto baru
- ✅ Badge "Akan Dihapus" untuk marked items

### Discount Display

- ✅ Coretan -3 derajat pada harga asli
- ✅ Warna merah untuk harga coret
- ✅ Badge diskon di pojok kanan
- ✅ Harga hijau untuk harga setelah diskon

---

## ⚠️ Validasi & Error Handling

### Validasi Upload:

```typescript
✅ Format: JPG, JPEG, PNG, WEBP
✅ Ukuran max: 5MB per file
✅ Galeri max: 5 foto total
✅ Banner: wajib untuk poktan
```

### Error States:

```typescript
✅ File terlalu besar
✅ Format tidak didukung
✅ Gagal upload
✅ Gagal update database
✅ Session expired
```

### Success States:

```typescript
✅ Profil berhasil diperbarui
✅ Gambar berhasil diunggah
✅ Perubahan tersimpan
```

---

## 🔧 Technical Details

### State Management (Poktan Dashboard)

```typescript
- profile: PoktanProfile | null
- isEditing: boolean
- newBanner: File | null
- newGallery: File[]
- galleryToDelete: string[]
- error: string
- success: string
- loading: boolean
```

### File Upload Flow:

```
1. User pilih file → Validasi client-side
2. Convert to base64 → Kirim ke API
3. API upload ke Supabase Storage
4. Get public URL
5. Save URL ke database
6. Return success/error
```

### Delete Flow:

```
1. Mark items for deletion (state)
2. User klik Save
3. Delete from storage (API)
4. Update database (remove URLs)
5. Refresh profile
```

---

## 📱 Responsive Design

### Breakpoints:

```css
Mobile:  grid-cols-2
Tablet:  grid-cols-3
Desktop: grid-cols-5

Banner Height:
Mobile:  h-48
Desktop: h-64
```

---

## 🐛 Known Issues & Solutions

### Issue: ESLint warnings tentang img tag

**Solution:** Sudah ditambahkan `eslint-disable-next-line` untuk preview images

### Issue: Array index sebagai key

**Solution:** Menggunakan unique ID dari file properties (name + size + lastModified)

### Issue: fetchProfile dipanggil sebelum defined

**Solution:** Pindahkan function definition sebelum useEffect

---

## 📋 Checklist Testing

### ✅ Registration Flow

- [ ] Upload banner berhasil
- [ ] Upload multiple gallery berhasil
- [ ] Preview gambar muncul
- [ ] Hapus preview berhasil
- [ ] Set diskon berhasil
- [ ] Validasi file size & format
- [ ] Submit form berhasil

### ✅ Dashboard View

- [ ] Profile data tampil lengkap
- [ ] Banner tampil
- [ ] Galeri tampil (jika ada)
- [ ] Harga & diskon kalkulasi benar
- [ ] Status badge benar

### ✅ Edit Mode

- [ ] Toggle edit mode
- [ ] Ganti banner
- [ ] Edit semua field
- [ ] Tambah galeri
- [ ] Hapus galeri
- [ ] Cancel restore state
- [ ] Save update database

### ✅ Delete Profile

- [ ] Konfirmasi muncul
- [ ] Semua files terhapus dari storage
- [ ] Database record terhapus
- [ ] Sign out berhasil
- [ ] Redirect ke home

---

## 🔮 Future Improvements

1. **Image Optimization**
   - Compress images sebelum upload
   - Generate thumbnails
   - Lazy loading

2. **Drag & Drop**
   - Upload dengan drag & drop
   - Reorder galeri

3. **Crop & Filter**
   - Crop image sebelum upload
   - Apply filters

4. **Batch Operations**
   - Delete multiple galeri sekaligus
   - Bulk upload

---

## 📞 Support

Jika ada masalah atau pertanyaan:

1. Check console untuk error details
2. Verify database schema sudah di-migrate
3. Check Supabase Storage policies (RLS)
4. Pastikan environment variables lengkap

---

**Version:** 2.0.0  
**Last Updated:** 2026-07-12  
**Author:** AI Assistant + alief-faisal
