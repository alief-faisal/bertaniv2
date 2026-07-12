"use client"; // Wajib menggunakan Client Component

import { ReactNode } from "react";
// PERUBAHAN DI SINI: Impor langsung dari 'lenis/react'
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.15, 
        duration: 0.8, 
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
