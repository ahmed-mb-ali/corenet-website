"use client";

import Navbar from "../components/Navbar";
import BookingWidget from "../components/BookingWidget";
import { useLanguage } from "../context/LanguageContext";

export default function TalkToSales() {
  const { isRTL } = useLanguage();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#050535" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Gradient strips — same language as hero/footer */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Right green glow strip */}
        <div
          className="absolute top-0 h-full"
          style={{
            right: 0,
            width: "32%",
            background:
              "linear-gradient(180deg, rgba(45,160,95,0.28) 0%, rgba(15,15,155,0.10) 50%, rgba(2,2,39,0.55) 100%)",
          }}
        />
        {/* Teal feather strip */}
        <div
          className="absolute top-0 h-full"
          style={{
            right: "32%",
            width: "14%",
            opacity: 0.55,
            background:
              "linear-gradient(180deg, rgba(35,180,160,0.20) 0%, rgba(15,23,42,0.35) 100%)",
          }}
        />
        {/* Blue feather strip */}
        <div
          className="absolute top-0 h-full"
          style={{
            right: "44%",
            width: "9%",
            opacity: 0.35,
            background:
              "linear-gradient(180deg, rgba(59,130,246,0.16) 0%, transparent 100%)",
          }}
        />
        {/* Bottom vignette */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "35%",
            background: "linear-gradient(to top, rgba(5,5,53,0.9) 0%, transparent 100%)",
          }}
        />
      </div>

      <Navbar />

      <div className="relative flex h-[calc(100dvh-64px)] sm:min-h-screen sm:h-auto items-start sm:items-center justify-center px-2 sm:px-4 pt-2 sm:pt-24 pb-2 sm:pb-10 overflow-hidden sm:overflow-visible">
        <BookingWidget onClose={() => {}} inline />
      </div>
    </div>
  );
}
