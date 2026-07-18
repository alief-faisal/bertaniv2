import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
// 1. Impor komponen SmoothScroll yang akan kita buat di langkah kedua
import SmoothScroll from "@/components/SmoothScroll";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Pencarian & Pemetaan Kelompok Tani Pandeglang",
  description:
    "Platform pemetaan, pemesanan layanan, dan interaksi Kelompok Tani Tani di Kabupaten Pandeglang",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Menyisipkan FontAwesome via cdnjs */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${roboto.variable} font-sans bg-[#fcfcfc] text-gray-900 antialiased`}
      >
        {/* 2. Bungkus children dengan SmoothScroll agar seluruh halaman menjadi smooth */}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
