// 📁 Simpan sebagai: components/PoktanMiniMap.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import L from "leaflet";
import { PoktanProfile } from "@/types";

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

/**
 * Controller pembantu untuk menangani:
 * 1. Klik pada area kosong peta untuk otomatis memperbesar (tanpa menghalangi drag/marker)
 * 2. Auto-fit bounds koordinat
 * 3. Pembaruan ukuran kontainer peta (invalidateSize)
 */
function MapController({
  positions,
  isExpanded,
  onExpand,
}: {
  positions: [number, number][];
  isExpanded: boolean;
  onExpand: () => void;
}) {
  const map = useMap();

  // Menangkap event klik langsung pada peta Leaflet
  useMapEvents({
    click: (e) => {
      // Jika peta belum membesar dan yang diklik adalah area kosong peta (bukan marker)
      if (
        (!isExpanded &&
          e.originalEvent.target ===
            map.getContainer().querySelector(".leaflet-tile-container")) ||
        e.originalEvent.target === map.getContainer()
      ) {
        onExpand();
      }
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        if (positions.length === 1) {
          map.setView(positions[0], isExpanded ? 14 : 12);
        } else {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    }, 300); // Sinkron dengan durasi transisi CSS (duration-300)

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

  return (
    <div
      className={`w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-10 relative bg-gray-100 transition-all duration-300 ease-in-out ${
        isExpanded ? "h-96 ring-2 ring-[#008000]/20" : "h-44"
      }`}
    >
      {/* Indikator Info & Tombol Aksi di Atas Peta */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-[500]">
        <span className="bg-white/95 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm text-gray-700 border border-gray-100">
          📍 {validPoktans.length} Lokasi Kelompok
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Mencegah bubbling event ke peta
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? "Perkecil peta" : "Perbesar peta"}
          className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-md bg-white/95 backdrop-blur-sm shadow-sm border border-gray-100 text-gray-600 hover:text-[#008000] hover:scale-105 active:scale-95 transition"
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      <MapContainer
        center={positions[0] || defaultCenter}
        zoom={12}
        scrollWheelZoom={isExpanded} // Scroll roda mouse hanya aktif saat membesar agar tidak mengganggu scroll page
        dragging={true} // Peta SEGERA bisa digeser/drag kapan saja baik kecil maupun besar
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validPoktans.map((poktan) => (
          <Marker
            key={poktan.id}
            position={[Number(poktan.latitude), Number(poktan.longitude)]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-0.5 min-w-[130px]">
                <h4 className="font-bold text-gray-800 text-xs m-0 line-clamp-1">
                  {poktan.nama_kelompok}
                </h4>
                <p className="text-[10px] text-gray-500 m-0 mt-0.5">
                  Kec. {poktan.kecamatan}
                </p>
                <a
                  href={`/detail/${poktan.id}`}
                  className="text-[10px] text-green-600 font-bold block mt-1 hover:underline"
                >
                  Lihat Detail →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Controller adaptif menggunakan useMapEvents */}
        <MapController
          positions={positions}
          isExpanded={isExpanded}
          onExpand={() => setIsExpanded(true)}
        />
      </MapContainer>
    </div>
  );
}
