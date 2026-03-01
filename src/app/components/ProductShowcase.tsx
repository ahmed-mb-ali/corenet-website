"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

const FEATURES = [
  {
    id: "dashboard",
    label: "Dashboard",
    headline: "Everything at a glance",
    desc: "Get a real-time overview of your hiring pipeline — open roles, candidate stages, team activity, and key metrics all in one place.",
    screenshot: "/images/product-screenshot.png",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "candidates",
    label: "Candidates",
    headline: "Track every applicant",
    desc: "Manage candidates through a visual pipeline. Review CVs, leave notes, assign scores, and move candidates forward — without the spreadsheets.",
    screenshot: "/images/product-screenshot.png",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "jobs",
    label: "Job Listings",
    headline: "Post & manage roles",
    desc: "Create job listings in minutes, publish to multiple channels, and control visibility — all from a single, structured workspace.",
    screenshot: "/images/product-screenshot.png",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="4" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    headline: "Hiring insights that matter",
    desc: "Understand time-to-hire, source quality, team performance, and cost-per-hire with live reports built for decision makers.",
    screenshot: "/images/product-screenshot.png",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 13l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const AUTO_INTERVAL = 3500;

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [prevActive, setPrevActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    if (idx === active || animating) return;
    setPrevActive(active);
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 280);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % FEATURES.length;
        setPrevActive(prev);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 280);
        return next;
      });
    }, AUTO_INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (idx: number) => {
    goTo(idx);
    startTimer(); // reset auto-timer on manual click
  };

  const feature = FEATURES[active];

  return (
    <section
      id="products"
      className="relative w-full bg-gradient-to-b from-navy-deep from-[40%] to-[#0f0f9b] rounded-bl-[60px] rounded-br-[60px] pt-14 pb-16 sm:pt-16 sm:pb-20 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">

        {/* Section header */}
        <header className="text-center mb-10 sm:mb-14">
          <h2 className="font-stolzl text-h1 font-medium text-white">
            Our Products
          </h2>
          <p className="font-stolzl text-body-lg text-hero-muted mt-3 max-w-[480px] mx-auto">
            A modern hiring platform built to scale with your team.
          </p>
        </header>

        {/* Product card */}
        <div className="w-full max-w-[1260px] mx-auto rounded-[30px] overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">

            {/* ── Left panel ── */}
            <div className="flex flex-col gap-8 p-7 sm:p-9 border-b lg:border-b-0 lg:border-r border-white/[0.07]">

              {/* Logo + description */}
              <div className="flex flex-col gap-4">
                <Image
                  src="/images/hires-logo.png"
                  alt="Hires HR"
                  width={100}
                  height={36}
                  className="object-contain"
                />
                <p className="font-stolzl text-caption text-hero-muted leading-relaxed">
                  Hires HR simplifies hiring with a modern platform for managing jobs,
                  tracking candidates, and gaining real-time insights.
                </p>
              </div>

              {/* Feature tabs */}
              <nav className="flex flex-col gap-1">
                {FEATURES.map((f, i) => {
                  const isActive = active === i;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleTabClick(i)}
                      className={`group flex items-center gap-3 text-left px-4 py-3 rounded-[12px] transition-all duration-200 ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-hero-muted hover:bg-white/[0.05] hover:text-white/80"
                      }`}
                    >
                      <span className={`shrink-0 transition-colors duration-200 ${isActive ? "text-white" : "text-hero-muted/60 group-hover:text-hero-muted"}`}>
                        {f.icon}
                      </span>
                      <span className="font-stolzl text-body-sm font-medium">{f.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-brand shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Progress bar */}
              <div className="flex gap-1.5">
                {FEATURES.map((_, i) => (
                  <div key={i} className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                    {active === i && (
                      <div
                        key={active}
                        className="bar-fill h-full rounded-full bg-blue-brand"
                        style={{ "--bar-duration": `${AUTO_INTERVAL}ms` } as React.CSSProperties}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button className="w-fit bg-white text-navy font-stolzl text-body-sm font-medium px-5 py-3 rounded-[var(--radius-button)] hover:bg-blue-brand hover:text-white transition-colors shadow-sm">
                Talk to sales
              </button>
            </div>

            {/* ── Right panel: screenshot ── */}
            <div className="flex flex-col gap-6 p-7 sm:p-9">

              {/* Feature headline + desc */}
              <div
                style={{
                  transition: "opacity 0.28s ease, transform 0.28s ease",
                  opacity: animating ? 0 : 1,
                  transform: animating ? "translateY(6px)" : "translateY(0)",
                }}
              >
                <h3 className="font-stolzl text-h3 font-medium text-white mb-1">
                  {feature.headline}
                </h3>
                <p className="font-stolzl text-caption text-hero-muted leading-relaxed max-w-[520px]">
                  {feature.desc}
                </p>
              </div>

              {/* Screenshot */}
              <div
                className="relative w-full rounded-[16px] overflow-hidden bg-[#1a1a5e]"
                style={{
                  aspectRatio: "16 / 10",
                  transition: "opacity 0.28s ease",
                  opacity: animating ? 0 : 1,
                }}
              >
                {/* Browser chrome strip */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.06] border-b border-white/[0.07]">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="mx-auto font-stolzl text-[11px] text-white/30">
                    app.hireshr.com — {feature.label}
                  </span>
                </div>
                <div className="relative w-full" style={{ aspectRatio: "16 / 9.3" }}>
                  <Image
                    src={feature.screenshot}
                    alt={`${feature.label} screenshot`}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Dot nav */}
              <div className="flex items-center gap-2">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleTabClick(i)}
                    aria-label={`Go to ${FEATURES[i].label}`}
                    className={`rounded-full transition-all duration-300 ${
                      active === i
                        ? "w-5 h-[6px] bg-white"
                        : "w-[6px] h-[6px] bg-white/25 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
