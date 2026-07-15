import React from "react";
import { motion } from "framer-motion";

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

// 1. Definisikan variasi animasi untuk container induk
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // Mengatur jeda waktu muncul antar item dari kiri ke kanan
      staggerChildren: 0.1,
    },
  },
};

// 2. Definisikan variasi animasi untuk masing-masing item menu
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20, // Muncul sedikit dari bawah agar efek spring lebih terasa
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export default function MainMenu() {
  return (
    <section className="max-w-7xl mx-auto px-4 my-8">
      {/* Container Induk tanpa bg putih, border, dan shadow */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-4 md:grid-cols-8 gap-6 justify-items-center p-2"
      >
        {MENUS.map((menu, i) => {
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex flex-col items-center gap-2 cursor-pointer relative group"
              // Efek macOS Dock saat di-hover
              whileHover={{
                scale: 1.1,
                y: -8,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              {/* Wrapper Icon: Diubah jadi bulat sempurna dengan bg hijau muda */}
              <div className="w-16 h-16 flex items-center justify-center bg-[#008000]/10 rounded-[23px] transition-colors duration-800 group-hover:bg-green-100">
                <img
                  src={menu.icon}
                  alt={menu.name}
                  className="w-10 h-10 object-contain"
                />
              </div>

              {/* Text Label */}
              <span className="text-[14px] font-medium text-gray-700 text-center tracking-tight max-w-[100px] line-clamp-2">
                {menu.name}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
