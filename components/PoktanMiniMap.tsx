// 📁 Simpan sebagai: components/PoktanMiniMap.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Maximize2, Minimize2, MapPin, Users, Navigation } from "lucide-react";
import L from "leaflet";
import { PoktanProfile } from "@/types";
import { formatDistance } from "@/utils/distance";

// Fix icon marker Leaflet wajib di Next.js/React
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper function untuk format Rupiah
function formatRupiah(value: number): string {
  return value.toLocaleString("id-ID");
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500";

/**
 * Komponen Marker dengan popup detail
 */
interface AnimatedMarkerProps {
  poktan: PoktanProfile;
  position: [number, number];
}

function AnimatedMarker({ poktan, position }: AnimatedMarkerProps) {
  // Hitung harga & diskon
  const hargaSewa = Number(poktan.harga_sewa) || 0;
  const diskonPersen = Number(poktan.diskon_persen) || 0;
  const hargaDiskon =
    diskonPersen > 0 ? hargaSewa - (hargaSewa * diskonPersen) / 100 : hargaSewa;
  const hasDistance =
    typeof poktan.distanceKm === "number" && Number.isFinite(poktan.distanceKm);

  return (
    <Marker position={position} icon={customIcon}>
      <Popup maxWidth={420} minWidth={380} className="custom-popup">
        {/* Mini Card Poktan - Horizontal Layout */}
        <div className="flex overflow-hidden rounded-lg bg-white shadow-sm">
          {/* Image Banner - Sisi Kiri */}
          <div className="relative w-40 shrink-0 bg-gray-100">
            <img
              src={poktan.banner_url || FALLBACK_IMAGE}
              alt={poktan.nama_kelompok}
              className="h-full w-full object-cover"
            />
            {hasDistance && (
              <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-700 text-white font-semibold text-[9px] px-2 py-1 rounded-md shadow-sm">
                <Navigation className="w-2.5 h-2.5" />
                {formatDistance(poktan.distanceKm as number)}
              </span>
            )}
          </div>

          {/* Content - Sisi Kanan */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            {/* Header */}
            <div className="space-y-1.5">
              {/* Nama Kelompok */}
              <h4 className="font-bold text-gray-800 text-xl leading-tight line-clamp-2 min-h-[2.5rem]">
                {poktan.nama_kelompok}
              </h4>

              {/* Lokasi & Anggota */}
              <div className="flex items-center gap-3 text-[10px] text-slate-700">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Kec. {poktan.kecamatan}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {Number(poktan.jumlah_anggota) || 0}
                </span>
              </div>
            </div>

            {/* Harga & Button */}
            <div className="space-y-2 mt-2">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[9px] text-slate-700">Tarif Jasa</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-700">
                      Rp {formatRupiah(hargaDiskon)}
                    </span>
                    <span className="text-[8px] text-slate-700">/ Hari</span>
                  </div>

                  {diskonPersen > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-500 line-through">
                        Rp {formatRupiah(hargaSewa)}
                      </span>
                      <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1 py-0.5 rounded">
                        -{diskonPersen}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Button Lihat Detail - Compact */}
                <a
                  href={`/detail/${poktan.id}`}
                  className="inline-flex items-center justify-center bg-white text-white text-[10px] font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                >
                  Detail →
                </a>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Controller pembantu untuk menangani:
 * 1. Auto-fit bounds koordinat
 * 2. Pembaruan ukuran kontainer peta (invalidateSize)
 */
function MapController({
  positions,
  isExpanded,
}: {
  positions: [number, number][];
  isExpanded: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        if (positions.length === 1) {
          map.setView(positions[0], isExpanded ? 15 : 12);
        } else {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [positions, map, isExpanded]);

  return null;
}

interface PoktanMiniMapProps {
  data: PoktanProfile[];
}

export default function PoktanMiniMap({ data }: PoktanMiniMapProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Filter defensif koordinat
  const validPoktans = useMemo(() => {
    return data.filter(
      (p) =>
        p.latitude !== undefined &&
        p.longitude !== undefined &&
        p.latitude !== null &&
        Number(p.latitude) !== 0 &&
        Number(p.longitude) !== 0,
    );
  }, [data]);

  const positions = useMemo(() => {
    return validPoktans.map(
      (p) => [Number(p.latitude), Number(p.longitude)] as [number, number],
    );
  }, [validPoktans]);

  const defaultCenter: [number, number] = [-6.3112, 106.1044];

  // Prevent body scroll saat modal terbuka
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isExpanded]);

  return (
    <>
      {/* Mini Map - Versi Kecil */}
      <div className="w-full h-44 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100 group">
        {/* Button Perbesar di Atas Peta */}
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-3 right-3 z-[600] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-gray-200 text-gray-700 hover:scale-105 active:scale-95 transition-all"
          title="Perbesar peta"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        {/* Indikator Info Gaya Leaflet Contributor */}
        <div className="absolute bottom-0 right-0 z-[500] pointer-events-auto select-none m-0">
          <div className="bg-white/80 text-[10px] text-[#333] px-2 py-0.5 font-sans leading-normal flex items-center gap-1 shadow-[-1px_-1px_3px_rgba(0,0,0,0.15)] whitespace-nowrap">
            {/* Logo Kabupaten Pandeglang (Simetris & Presisi) */}
            <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
              <img
                src="/logo/logopandeglang.png"
                alt="Logo Pandeglang"
                className="w-full h-full object-contain max-w-none"
              />
            </div>

            {/* Teks dengan Warna Khas Leaflet (Hitam & Biru) */}
            <span className="text-[#333]">
              Peta Persebaran Poktan di{" "}
              <span className="text-[#0051b4] hover:underline cursor-pointer font-normal">
                Kabupaten Pandeglang
              </span>
            </span>
          </div>
        </div>
        <MapContainer
          center={positions[0] || defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          touchZoom={true}
          className="w-full h-full"
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marker tanpa animasi & popup untuk mini map */}
          {validPoktans.map((poktan) => (
            <Marker
              key={poktan.id}
              position={[Number(poktan.latitude), Number(poktan.longitude)]}
              icon={customIcon}
            />
          ))}

          <MapController positions={positions} isExpanded={false} />
        </MapContainer>
      </div>

      {/* Fullscreen Modal Popup - Rendered using Portal to ensure it's on top */}
      {isExpanded &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-modal-title"
            className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ zIndex: 999999 }}
            onClick={() => setIsExpanded(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsExpanded(false);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative"
              style={{
                height: "calc(100vh - 120px)",
                marginTop: "80px",
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200  shrink-0">
                <div>
                  <h3
                    id="map-modal-title"
                    className="text-lg font-bold text-gray-800"
                  >
                    Peta Persebaran Poktan
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Menampilkan semua lokasi kelompok tani di Kabupaten
                    Pandeglang
                  </p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-gray-700 hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md border border-gray-200"
                  title="Perkecil peta"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Map Container */}
              <div className="flex-1 relative">
                <MapContainer
                  center={positions[0] || defaultCenter}
                  zoom={12}
                  scrollWheelZoom={true}
                  dragging={true}
                  className="w-full h-full"
                  attributionControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Markers dengan Custom Card Popup */}
                  {validPoktans.map((poktan) => (
                    <AnimatedMarker
                      key={poktan.id}
                      poktan={poktan}
                      position={[
                        Number(poktan.latitude),
                        Number(poktan.longitude),
                      ]}
                    />
                  ))}

                  <MapController positions={positions} isExpanded={true} />
                </MapContainer>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
