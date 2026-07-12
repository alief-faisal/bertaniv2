# Setup Supabase Storage untuk Poktan Media

## Langkah 1: Buat Storage Bucket

1. Buka Supabase Dashboard → Storage
2. Klik "New bucket"
3. Nama bucket: `poktan-media`
4. **PENTING**: Centang "Public bucket" agar gambar bisa diakses publik
5. Klik "Create bucket"

## Langkah 2: Setup Storage Policies (RLS)

Jalankan SQL berikut di SQL Editor Supabase:

```sql
-- Allow public read access (untuk melihat gambar)
CREATE POLICY "Public can view poktan media"
ON storage.objects FOR SELECT
USING (bucket_id = 'poktan-media');

-- Allow authenticated users to upload (untuk poktan upload gambar)
CREATE POLICY "Authenticated users can upload poktan media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'poktan-media' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update own poktan media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'poktan-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'poktan-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own poktan media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'poktan-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Langkah 3: Verifikasi Bucket Sudah Public

1. Klik bucket `poktan-media`
2. Klik "Settings" (ikon gear)
3. Pastikan "Public bucket" dalam keadaan ON/aktif
4. Save jika ada perubahan

## Langkah 4: Test Upload

Coba upload gambar secara manual:
1. Masuk ke bucket `poktan-media`
2. Buat folder `test/`
3. Upload gambar
4. Klik gambar → Copy URL
5. Paste URL di browser baru
6. Jika gambar muncul = SUCCESS ✅
7. Jika error 404 atau forbidden = bucket belum public ❌

## Troubleshooting

### Error: "new row violates row-level security policy"
- Pastikan RLS policies sudah dibuat
- Check apakah user sudah authenticated

### Error: "Bucket not found"
- Pastikan nama bucket `poktan-media` (huruf kecil semua)
- Tidak ada typo dalam kode

### Gambar tidak muncul (404)
- Pastikan bucket di-set sebagai Public
- Check URL gambar sudah benar formatnya

### Error saat delete gambar lama
- Ini normal jika gambar sudah tidak ada
- Kode sudah di-handle untuk skip error ini

## Struktur Folder di Bucket

```
poktan-media/
├── banners/
│   ├── {user_id}-{timestamp}.jpg
│   └── {user_id}-{timestamp}.png
└── gallery/
    ├── {user_id}-{timestamp}-0.jpg
    ├── {user_id}-{timestamp}-1.jpg
    └── {user_id}-{timestamp}-2.png
```

## Environment Variables Required

Pastikan di `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
