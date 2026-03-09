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
      <div className="max-w-[800px] mx-auto px-6 sm:px-8">
        {/* Pill-style tabs */}
        <div className="flex justify-center mb-10 sm:mb-14">
          <div className="inline-flex bg-[#eef0f4] rounded-[14px] p-1">
            {TABS.map((tab) => {
              const isActive = active === tab;
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`relative px-8 sm:px-12 py-3 sm:py-3.5 rounded-[12px] font-stolzl font-medium text-body-sm sm:text-body transition-all duration-300 ${
                    isActive
                      ? "bg-white text-navy shadow-[0_2px_12px_rgba(2,2,44,0.08)]"
                      : "text-navy/40 hover:text-navy/60"
                  }`}
                >
                  {CONTENT[tab].heading}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            transition: "opacity 0.26s ease, transform 0.26s ease",
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(10px)" : "translateY(0)",
          }}
        >
          <p className="mission-body font-stolzl text-body-lg sm:text-h3 text-text-muted leading-[1.55] max-w-[720px] mx-auto text-center">
            {content.body}
          </p>

          <ul className="mission-items mt-10 sm:mt-14 flex flex-col gap-5 max-w-[520px] mx-auto">
            {content.items.map((item, i) => (
              <li
                key={item.title}
                className="flex items-start gap-4 bg-white rounded-[16px] p-4 sm:p-5 shadow-[0_2px_8px_rgba(2,2,44,0.05)]"
                style={{
                  transition: "opacity 0.35s ease, transform 0.35s ease",
                  transitionDelay: animating ? "0ms" : `${i * 60}ms`,
                  opacity: animating ? 0 : 1,
                  transform: animating ? "translateY(8px)" : "translateY(0)",
                }}
              >
                <div
                  className="mission-icon w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500"
                  style={{
                    background:
                      active === "mission"
                        ? "var(--color-blue-accent)"
                        : "var(--color-green-cta)",
                  }}
                >
                  <Image src={item.icon} alt={item.title} width={24} height={24} className="sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-col gap-1 pt-0.5">
                  <h4 className="font-stolzl text-body-sm sm:text-h4 font-medium text-navy">
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
    </section>
  );
}
