"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";

const TABS = ["mission", "vision"] as const;
type Tab = (typeof TABS)[number];

const CONTENT: Record<
  Tab,
  {
    heading: string;
    body: string;
    items: { icon: string; title: string; desc: string }[];
  }
> = {
  mission: {
    heading: "Our Mission",
    body: "To build and scale exceptional technology platforms that empower businesses across the region with modern, efficient, and innovative workforce solutions—backed by world-class infrastructure, strategic vision, and operational excellence.",
    items: [
      {
        icon: "/images/icon-build.svg",
        title: "Build",
        desc: "Creating robust platforms from the ground up with precision and purpose.",
      },
      {
        icon: "/images/icon-empower.svg",
        title: "Empower",
        desc: "Enabling businesses to reach their full potential through technology.",
      },
      {
        icon: "/images/icon-transform.svg",
        title: "Transform",
        desc: "Revolutionising how work gets done across every organisation.",
      },
    ],
  },
  vision: {
    heading: "Our Vision",
    body: "To become the region's most trusted technology ecosystem—where every business, regardless of size, can access world-class workforce tools that accelerate growth, unlock talent, and define the future of work.",
    items: [
      {
        icon: "/images/icon-build.svg",
        title: "Lead",
        desc: "Setting the benchmark for workforce technology across the region and beyond.",
      },
      {
        icon: "/images/icon-empower.svg",
        title: "Connect",
        desc: "Bridging businesses with the talent and tools they need to thrive.",
      },
      {
        icon: "/images/icon-transform.svg",
        title: "Scale",
        desc: "Growing alongside our partners as the ecosystem evolves.",
      },
    ],
  },
};

export default function MissionVision() {
  const [active, setActive] = useState<Tab>("mission");
  const [animating, setAnimating] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const activeRef = useRef<Tab>("mission");

  const switchTab = useCallback(
    (tab: Tab) => {
      if (tab === activeRef.current || animating) return;
      activeRef.current = tab;
      setAnimating(true);
      setTimeout(() => {
        setActive(tab);
        setAnimating(false);
      }, 260);
    },
    [animating]
  );

  // Position-based scroll: track how far the section has moved through the viewport.
  // Switch at the midpoint so the transition feels natural as the user scrolls.
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 = section top at viewport bottom, 1 = section bottom at viewport top
      const progress = (vh - rect.top) / (rect.height + vh);
      if (progress >= 0.52) switchTab("vision");
      else if (progress < 0.48) switchTab("mission");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // run once on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [switchTab]);

  const content = CONTENT[active];

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-bg-light py-16 sm:py-20 lg:py-32 overflow-hidden"
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 w-1 h-full pointer-events-none transition-all duration-700"
        style={{
          background:
            active === "mission"
              ? "linear-gradient(180deg,#335cff,#3ab874)"
              : "linear-gradient(180deg,#3ab874,#335cff)",
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* ── Left: clickable tabs ── */}
          <div className="lg:col-span-4 shrink-0 lg:sticky lg:top-28 lg:self-start flex flex-col gap-2">
            {TABS.map((tab) => {
              const isActive = active === tab;
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`group relative text-left transition-all duration-300 rounded-[14px] px-5 py-4 ${
                    isActive
                      ? "bg-white shadow-[0_4px_20px_rgba(2,2,44,0.08)]"
                      : "hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ${
                      isActive ? "h-8 bg-blue-brand" : "h-0 bg-transparent"
                    }`}
                  />
                  <span
                    className={`font-stolzl text-h1 font-medium transition-all duration-300 ${
                      isActive
                        ? "text-navy"
                        : "text-navy/30 group-hover:text-navy/50"
                    }`}
                  >
                    {CONTENT[tab].heading}
                  </span>
                  {isActive && (
                    <span className="block font-stolzl text-caption text-text-secondary mt-1">
                      {tab === "mission"
                        ? "What we strive to do every day"
                        : "Where we are headed"}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Scroll hint */}
            <p className="font-stolzl text-caption text-text-muted mt-4 pl-5 hidden lg:flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 2v8M3.5 7.5L6 10l2.5-2.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Scroll or click to explore
            </p>
          </div>

          {/* ── Right: animated content ── */}
          <div className="lg:col-span-8">
            <div
              style={{
                transition: "opacity 0.26s ease, transform 0.26s ease",
                opacity: animating ? 0 : 1,
                transform: animating ? "translateY(10px)" : "translateY(0)",
              }}
            >
              <p className="font-stolzl text-h3 text-text-muted leading-[1.55] max-w-[720px]">
                {content.body}
              </p>

              <ul className="mt-12 sm:mt-14 flex flex-col gap-6 max-w-[520px]">
                {content.items.map((item, i) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-4"
                    style={{
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                      transitionDelay: animating ? "0ms" : `${i * 60}ms`,
                      opacity: animating ? 0 : 1,
                      transform: animating ? "translateY(8px)" : "translateY(0)",
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500"
                      style={{
                        background:
                          active === "mission"
                            ? "var(--color-blue-accent)"
                            : "var(--color-green-cta)",
                      }}
                    >
                      <Image src={item.icon} alt={item.title} width={28} height={28} />
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <h4 className="font-stolzl text-h4 font-medium text-navy">
                        {item.title}
                      </h4>
                      <p className="font-stolzl text-caption text-text-secondary leading-[1.5]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Dot indicators */}
              <div className="flex items-center gap-2 mt-10">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => switchTab(tab)}
                    aria-label={`Go to ${tab}`}
                    className={`rounded-full transition-all duration-300 ${
                      active === tab
                        ? "w-6 h-2 bg-blue-brand"
                        : "w-2 h-2 bg-navy/20 hover:bg-navy/40"
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
