"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const FEATURES = [
  {
    id: "ai-screening",
    label: "AI Resume Screening",
    headline: "Screen smarter, hire faster",
    desc: "Let AI rank and shortlist candidates automatically — based on skills, experience, and role fit — so your team focuses only on the best matches.",
    screenshot: "/images/feature-ai-screening.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <path d="M9 2l1.5 3.5L14 7l-3.5 1.5L9 12l-1.5-3.5L4 7l3.5-1.5L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 12l.75 1.75L16.5 14l-1.75.75L14 16.5l-.75-1.75L11.5 14l1.75-.75L14 12z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "job-management",
    label: "Job Management",
    headline: "Post & manage roles",
    desc: "Create and publish job listings in minutes across multiple channels. Control visibility, track applications, and manage every open role from one place.",
    screenshot: "/images/feature-candidate-pipeline.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="4" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "candidate-pipeline",
    label: "Candidate Pipeline",
    headline: "Track every applicant",
    desc: "Manage candidates through a visual pipeline. Review CVs, leave notes, assign scores, and move candidates forward — without the spreadsheets.",
    screenshot: "/images/feature-job-management.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "interview-scheduling",
    label: "Interview Scheduling",
    headline: "Schedule interviews instantly",
    desc: "Coordinate interviews across teams with automated scheduling, calendar sync, and reminders — eliminating back-and-forth emails entirely.",
    screenshot: "/images/feature-interview-scheduling.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 2v2M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 7h14" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 10.5h.01M9 10.5h.01M12 10.5h.01M6 13h.01M9 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "career-page",
    label: "Career Page",
    headline: "Your branded careers hub",
    desc: "Launch a fully branded careers page that reflects your employer brand — no code needed. Attract the right talent with a seamless application experience.",
    screenshot: "/images/feature-career-page.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 2c-2 2-3 4.5-3 7s1 5 3 7M9 2c2 2 3 4.5 3 7s-1 5-3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics & Dashboards",
    headline: "Hiring insights that matter",
    desc: "Understand time-to-hire, source quality, team performance, and cost-per-hire with live dashboards built for decision makers.",
    screenshot: "/images/feature-analytics.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <path d="M3 13l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "multi-tenant",
    label: "Multi-tenant & Agency",
    headline: "Built for agencies & enterprises",
    desc: "Run multiple clients or business units from a single platform. Full data isolation, white-labelling, and role-based access for every team.",
    screenshot: "/images/feature-multi-tenant.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="8" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="5" width="6" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8V5a4 4 0 0 1 4-4h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function ProductShowcase() {
  const { t, isRTL } = useLanguage();
  const tabs = t.products.tabs;
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (idx: number) => {
    if (idx === active || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 280);
  };

  const feature = { ...FEATURES[active], ...tabs[active] };

  return (
    <section
      id="products"
      className="relative w-full bg-gradient-to-b from-navy-deep from-[40%] to-[#0f0f9b] rounded-bl-[60px] rounded-br-[60px] pt-14 pb-16 sm:pt-16 sm:pb-20 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">

        {/* Section header */}
        <header className="text-center mb-8 sm:mb-10">
          <h2 className="font-stolzl text-h1 font-medium text-white">{t.products.title}</h2>
          <p className="font-stolzl text-body-lg text-hero-muted mt-3 max-w-[480px] mx-auto">
            {t.products.sub}
          </p>
        </header>

        {/* ── Feature grid above card ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 max-w-[1293px] mx-auto mb-6">
          {FEATURES.map((f, i) => {
            const tLabel = tabs[i]?.label ?? f.label;
            const isActive = active === i;
            return (
              <button
                key={f.id}
                onClick={() => goTo(i)}
                className={`group flex flex-col items-center gap-2.5 px-3 py-4 rounded-[16px] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white/[0.12] ring-1 ring-white/20"
                    : "bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <span className={`transition-colors duration-200 ${isActive ? "text-white" : "text-hero-muted/60 group-hover:text-hero-muted"}`}>
                  {f.icon}
                </span>
                <span className={`font-stolzl text-[12px] leading-[16px] text-center transition-colors duration-200 ${
                  isActive ? "text-white font-medium" : "text-hero-muted group-hover:text-white/70"
                }`}>
                  {tLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Product card ── */}
        <div className="w-full max-w-[1293px] mx-auto bg-blue-product rounded-[30px] overflow-hidden relative">

          {/* Shader gradient background */}
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="/images/shader-gradient-bg.png"
              alt=""
              fill
              className="object-cover opacity-50"
            />
          </div>

          {/* Card content — force LTR grid so columns don't reverse in Arabic */}
          <div dir="ltr" className="relative grid grid-cols-1 lg:grid-cols-[1fr_1fr] min-h-[480px] lg:min-h-[535px]">

            {/* ── Left: info ── */}
            <div dir={isRTL ? "rtl" : "ltr"} className={`flex flex-col p-8 sm:p-10 lg:p-[51px] justify-center ${isRTL ? "gap-5 lg:items-start lg:text-right" : "gap-5"}`}>

              {/* Logo */}
              <Image
                src="/images/hires-logo.png"
                alt="Hires HR"
                width={112}
                height={40}
                className="object-contain"
              />

              {/* Headline */}
              <div
                className={isRTL ? "w-full max-w-[433px]" : ""}
                style={{
                  transition: "opacity 0.28s ease, transform 0.28s ease",
                  opacity: animating ? 0 : 1,
                  transform: animating ? "translateY(6px)" : "translateY(0)",
                }}
              >
                <h3 className="font-stolzl text-h2 font-medium text-white mb-3">
                  {feature.headline}
                </h3>
                <p className={`font-stolzl text-body-sm text-white/80 leading-[30px] ${isRTL ? "max-w-full" : "max-w-[447px]"}`}>
                  {feature.desc}
                </p>
              </div>

              {/* CTA */}
              <Link href="/talk-to-sales" className={`bg-white text-navy-deep font-stolzl text-body-sm font-medium px-[14px] py-[10px] h-[55px] rounded-[12px] shadow-[0px_1px_2px_rgba(10,13,20,0.03)] hover:bg-blue-brand hover:text-white transition-colors inline-flex items-center ${isRTL ? "w-[170px] justify-center" : "w-fit mt-2"}`}>
                {t.products.cta}
              </Link>
            </div>

            {/* ── Right: screenshot — bleeds off right edge ── */}
            <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[450px]">
              <div
                className="absolute top-[42px] bottom-0 left-auto right-0 -mr-[30px] w-[calc(100%+30px)] bg-[#93c5fd] rounded-l-[20px] overflow-hidden"
                style={{
                  transition: "opacity 0.28s ease",
                  opacity: animating ? 0 : 1,
                }}
              >
                <div className="absolute top-[12px] bottom-0 left-[12px] right-0 rounded-tl-[10px] overflow-hidden">
                  <Image
                    src={feature.screenshot}
                    alt={`${feature.label} screenshot`}
                    fill
                    className="object-cover object-left-top"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
