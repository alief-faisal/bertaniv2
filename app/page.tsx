"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import BannerCarousel from "@/components/BannerCarousel";
import MainMenu from "@/components/MainMenu";
import PoktanCard from "@/components/PoktanCard";
import { supabase } from "@/utils/supabase";
import { PoktanProfile } from "@/types";

export default function Home() {
  const [poktanList, setPoktanList] = useState<PoktanProfile[]>([]);
  const [filterKecamatan, setFilterKecamatan] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRealData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("poktan_profiles")
        .select("*")
        .eq("is_active", true);

      if (filterKecamatan) {
        query = query.eq("kecamatan", filterKecamatan);
      }

      if (searchKeyword.trim() !== "") {
        query = query.ilike("nama_kelompok", `%${searchKeyword}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const mappedData: PoktanProfile[] = data.map((item) => ({
          id: item.id,
          nama_kelompok: item.nama_kelompok,
          kecamatan: item.kecamatan,
          jumlah_anggota: item.jumlah_anggota,
          harga_sewa: Number(item.harga_sewa),
          diskon_persen: item.diskon_persen,
          banner_url: item.banner_url || "",
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          is_active: item.is_active,
          created_at: item.created_at,
          distance: "Terdekat",
        }));
        setPoktanList(mappedData);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memuat data";
      console.error("Supabase Error:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filterKecamatan, searchKeyword]);

  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]);

  const handleNavbarFilter = (kecamatan: string, search: string) => {
    setFilterKecamatan(kecamatan);
    setSearchKeyword(search);
  };

  return (
    <>
      <Navbar onFilterChange={handleNavbarFilter} />
      <main className="min-h-screen pb-20 bg-gray-50">
        <BannerCarousel />
        <MainMenu />

        <div className="max-w-7xl mx-auto px-4 mt-8">
          <h2 className="text-base font-bold text-gray-800 mb-6 border-l-4 border-green-600 pl-3">
            Kelompok Tani Terdaftar
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-md" />
              ))}
            </div>
          ) : poktanList.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-md border border-gray-200 text-sm text-gray-400">
              Belum ada data kelompok tani yang sesuai untuk wilayah atau
              pencarian ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {poktanList.map((poktan) => (
                <PoktanCard key={poktan.id} data={poktan} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
