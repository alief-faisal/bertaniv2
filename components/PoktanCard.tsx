import React from "react";
import { MapPin, Users, ShoppingCart } from "lucide-react";

interface PoktanProps {
  id: string;
  nama: string;
  kecamatan: string;
  anggota: number;
  orderCount: number;
  harga: number;
  diskon?: number;
  distanceBadge?: string; // Diisi jika fungsi deteksi lokasi aktif
}

export default function PoktanCard({ data }: { data: PoktanProps }) {
  const hargaDiskon = data.diskon
    ? data.harga - (data.harga * data.diskon) / 100
    : data.harga;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col w-full max-w-xs">
      <div className="relative h-44 w-full bg-gray-100">
        <img
          src="https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500"
          alt={data.nama}
          className="w-full h-full object-cover"
        />
        {data.distanceBadge && (
          <span className="absolute top-2 left-2 bg-green-600 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full shadow">
            {data.distanceBadge}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 min-h-[40px]">
          {data.nama}
        </h3>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" /> Kec. {data.kecamatan}
        </p>

        <div className="flex items-center gap-4 my-3 text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {data.anggota} Anggota
          </span>
          <span className="flex items-center gap-1">
            <ShoppingCart className="w-3.5 h-3.5" /> {data.orderCount}x Order
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 block font-medium">
            Tarif Sewa / Jasa
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-green-700">
              Rp {hargaDiskon.toLocaleString("id-ID")}
            </span>
            {data.diskon && data.diskon > 0 && (
              <span
                className="text-xs text-red-400 line-through font-normal inline-block transform -rotate-3"
                style={{ transform: "rotate(-3deg)" }}
              >
                Rp {data.harga.toLocaleString("id-ID")}
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-normal">
              / Hari
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
