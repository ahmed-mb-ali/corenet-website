"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-between transition-all duration-300 ease-out"
      style={{
        top: scrolled ? 8 : 30,
        height: scrolled ? 56 : 70,
        width: scrolled ? "min(1200px, calc(100% - 48px))" : "min(1440px, calc(100% - 24px))",
        paddingLeft: scrolled ? 24 : 32,
        paddingRight: scrolled ? 24 : 32,
        borderRadius: scrolled ? 16 : 20,
        background: scrolled ? "rgba(255,255,255,0.92)" : "#ffffff",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled
          ? "0 8px 32px rgba(2,2,44,0.12), 0 0 0 1px rgba(0,0,0,0.07)"
          : "0 6px 24px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.08)",
      }}
    >
      <Image
        src="/images/logo.png"
        alt="Corenet Logo"
        width={scrolled ? 80 : 94}
        height={scrolled ? 44 : 51}
        className="object-contain transition-all duration-300"
      />

      <div className="flex items-center gap-12 lg:gap-16 font-stolzl text-body-sm text-navy">
        <a href="#about" className="hover:opacity-70 transition-opacity">Our Company</a>
        <a href="#products" className="hover:opacity-70 transition-opacity">Products</a>
        <a href="#contact" className="hover:opacity-70 transition-opacity">Contact</a>
      </div>

      <button className="bg-blue-brand text-white font-stolzl font-medium text-caption px-5 py-2.5 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity">
        Talk to sales
      </button>
    </motion.nav>
  );
}
