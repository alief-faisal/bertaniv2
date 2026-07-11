/**
 * utils/distance.ts
 * -----------------------------------------------------------------------
 * Helper murni (tanpa side-effect) untuk menghitung & menampilkan jarak
 * antara koordinat GPS pengguna dan koordinat kelompok tani (poktan).
 * Dipakai oleh app/page.tsx (untuk menghitung + mengurutkan) dan
 * components/PoktanCard.tsx (untuk menampilkan badge jarak).
 */

/**
 * Menghitung jarak great-circle antara dua titik koordinat menggunakan
 * rumus Haversine. Hasil dalam kilometer.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return Infinity;
  }

  const R = 6371; // jari-jari bumi dalam km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format angka km menjadi label yang enak dibaca di badge card.
 * < 1 km ditampilkan dalam meter, selebihnya dalam km 1 desimal.
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}
