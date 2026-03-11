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
      {/* Override navbar to gray on this page */}
      <style>{`
        .nav-bar {
          background: rgba(42, 42, 60, 0.92) !important;
          backdrop-filter: blur(14px) !important;
          -webkit-backdrop-filter: blur(14px) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.07) !important;
        }
        .nav-bar a, .nav-bar span, .nav-bar button {
          color: rgba(255,255,255,0.88) !important;
        }
        .nav-bar button:hover, .nav-bar a:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .nav-bar button[class*="border"] {
          border-color: rgba(255,255,255,0.18) !important;
        }
        .nav-menu-panel .rounded-\\[20px\\] {
          background: rgba(32,32,52,0.98) !important;
        }
        .nav-menu-panel a, .nav-menu-panel span {
          color: rgba(255,255,255,0.88) !important;
        }
      `}</style>

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

      {/* Widget shifted up — pt-16 instead of pt-20, slight negative offset */}
      <div className="relative flex min-h-screen items-center justify-center px-4 pt-14 pb-10 -mt-6">
        <BookingWidget onClose={() => {}} inline />
      </div>
    </div>
  );
}
