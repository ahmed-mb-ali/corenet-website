"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

const TABS = ["mission", "vision"] as const;
type Tab = (typeof TABS)[number];

const ICONS = {
  mission: ["/images/icon-build.svg", "/images/icon-empower.svg", "/images/icon-transform.svg"],
  vision:  ["/images/icon-build.svg", "/images/icon-empower.svg", "/images/icon-transform.svg"],
};

export default function MissionVision() {
  const { t } = useLanguage();
  const CONTENT = {
    mission: { ...t.mission.content.mission, items: t.mission.content.mission.items.map((item, i) => ({ ...item, icon: ICONS.mission[i] })) },
    vision:  { ...t.mission.content.vision,  items: t.mission.content.vision.items.map((item, i) => ({ ...item, icon: ICONS.vision[i] })) },
  };
  const [active, setActive] = useState<Tab>("mission");
  const [animating, setAnimating] = useState(false);

  const switchTab = useCallback(
    (tab: Tab) => {
      if (tab === active || animating) return;
      setAnimating(true);
      setTimeout(() => {
        setActive(tab);
        setAnimating(false);
      }, 260);
    },
    [active, animating]
  );

  const content = CONTENT[active];

  return (
    <section
      className="mission-section relative w-full bg-bg-light py-16 sm:py-20 lg:py-32 overflow-hidden"
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
        <div className="mission-grid grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* ── Left: clickable tabs ── */}
          <div className="mission-tabs lg:col-span-4 shrink-0 lg:sticky lg:top-28 lg:self-start flex flex-col gap-2">
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
                      {tab === "mission" ? t.mission.missionSub : t.mission.visionSub}
                    </span>
                  )}
                </button>
              );
            })}

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
              <p className="mission-body font-stolzl text-h3 text-text-muted leading-[1.55] max-w-[720px]">
                {content.body}
              </p>

              <ul className="mission-items mt-12 sm:mt-14 flex flex-col gap-6 max-w-[520px]">
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
                      className="mission-icon w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500"
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

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
