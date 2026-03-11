"use client";

import Navbar from "../components/Navbar";
import BookingWidget from "../components/BookingWidget";
import { useLanguage } from "../context/LanguageContext";

export default function TalkToSales() {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-[#02022c]" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <div className="flex items-start justify-center pt-24 pb-16 px-4">
        <BookingWidget onClose={() => {}} inline />
      </div>
    </div>
  );
}
