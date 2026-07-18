import React from "react";

const MENUS = [
  { name: "Sewa Traktor", icon: "/icons/ikon1.png" },
  { name: "Penggilingan", icon: "/icons/ikon2.png" },
  { name: "Bibit Unggul", icon: "/icons/ikon3.png" },
  { name: "Pupuk & Obat", icon: "/icons/ikon4.png" },
  { name: "Petani Mandiri", icon: "/icons/ikon5.png" },
  { name: "Poktan Sekitar", icon: "/icons/ikon6.png" },
  { name: "Penyuluhan", icon: "/icons/ikon7.png" },
  { name: "Lahan Jemur", icon: "/icons/ikon8.png" },
];

export default function MainMenu() {
  return (
    <section className="max-w-7xl mx-auto px-4 my-8">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-6 justify-items-center p-2">
        {MENUS.map((menu, i) => {
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2 cursor-pointer relative group"
            >
              {/* Wrapper Icon dengan bg hijau muda */}
              <div className="w-14 h-14 flex items-center justify-center bg-[#008000]/10 rounded-[23px]">
                <img
                  src={menu.icon}
                  alt={menu.name}
                  className="w-10 h-10 object-contain"
                />
              </div>

              {/* Text Label */}
              <span className="text-[13px] font-medium text-gray-700 text-center tracking-tight max-w-[100px] line-clamp-2">
                {menu.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
