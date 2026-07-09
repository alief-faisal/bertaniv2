"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Navbar from "@/components/Navbar";
import { PoktanProfile } from "@/types";

export default function DetailPoktanPage() {
  const params = useParams();
  const id = params?.id as string;
  const [poktan, setPoktan] = useState<PoktanProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const { data, error } = await supabase
          .from("poktan_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setPoktan({
            id: data.id,
            nama_kelompok: data.nama_kelompok,
            kecamatan: data.kecamatan,
            jumlah_anggota: data.jumlah_anggota,
            harga_sewa: Number(data.harga_sewa),
            diskon_persen: data.diskon_persen,
            banner_url: data.banner_url || "",
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            is_active: data.is_active,
            created_at: data.created_at,
            distance: "Terdekat",
          });
        }
      } catch (err) {
        console.error("Gagal memuat detail kelompok tani:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-20 text-sm">
        Memuat detail kelompok tani...
      </div>
    );
  if (!poktan)
    return (
      <div className="text-center py-20 text-sm">Data tidak ditemukan.</div>
    );

  return (
    <>
      <Navbar onFilterChange={() => {}} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
          {poktan.banner_url && (
            <img
              src={poktan.banner_url}
              alt={poktan.nama_kelompok}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {poktan.nama_kelompok}
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Wilayah Operasional: Kec. {poktan.kecamatan}
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
              <div>
                <span className="block text-xs text-gray-400">
                  Jumlah Anggota Aktif
                </span>
                <span className="font-bold text-gray-800">
                  {poktan.jumlah_anggota} Orang
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-400">
                  Tarif Sewa Alat Basah
                </span>
                <span className="font-bold text-green-700">
                  Rp {poktan.harga_sewa.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
