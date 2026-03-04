"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const MIN = 50;
const MAX = 5000;
const SAVINGS_PER_HIRE = 13301;

function formatSR(n: number) {
  return "SR " + n.toLocaleString("en-US");
}

export default function SavingsCalculator() {
  const { t, isRTL } = useLanguage();
  const c = t.calculator;
  const [hires, setHires] = useState(750);

  const pct = ((hires - MIN) / (MAX - MIN)) * 100;
  const totalSavings = hires * SAVINGS_PER_HIRE;

  return (
    <section className="relative w-full bg-white py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">

        {/* Header */}
        <header className="text-center max-w-[560px] mx-auto mb-14">
          <p className="font-stolzl text-caption font-medium text-blue-brand uppercase tracking-widest mb-3">
            {c.eyebrow}
          </p>
          <h2 className="font-stolzl text-h1 font-medium text-navy">{c.title}</h2>
          <p className="font-stolzl text-body-sm text-text-secondary mt-3">{c.sub}</p>
        </header>

        {/* Dark card */}
        <div className="max-w-[1100px] mx-auto bg-navy-deep rounded-[32px] shadow-[0_24px_64px_rgba(2,2,44,0.18)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* ── Left: slider ── */}
            <div className="flex flex-col justify-center gap-10 p-8 sm:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/[0.07]">

              <div>
                <p className="font-stolzl text-caption text-hero-muted uppercase tracking-widest mb-3">
                  {c.volumeLabel}
                </p>
                <div className="flex items-end gap-3">
                  <span
                    className="font-stolzl font-bold text-white tabular-nums"
                    style={{ fontSize: 60, lineHeight: 1, letterSpacing: "-2px" }}
                  >
                    {hires.toLocaleString()}
                  </span>
                  <span className="font-stolzl text-h3 text-hero-muted mb-1">{c.hiresUnit}</span>
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-3" dir="ltr">
                <div className="relative h-[6px] rounded-full bg-white/10">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-blue-brand transition-all duration-100"
                    style={{ width: `${pct}%` }}
                  />
                  <input
                    type="range"
                    min={MIN}
                    max={MAX}
                    step={10}
                    value={hires}
                    onChange={(e) => setHires(Number(e.target.value))}
                    className="calc-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Number of hires per year"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-blue-brand shadow-[0_0_0_4px_rgba(51,92,255,0.25)] pointer-events-none"
                    style={{ left: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between font-stolzl text-caption text-hero-muted/50">
                  <span>{MIN.toLocaleString()}</span>
                  <span>{MAX.toLocaleString()}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2 border-t border-white/[0.07]">
                <p className="font-stolzl text-caption text-hero-muted mb-4">{c.expertSub}</p>
                <button className="flex items-center gap-2 bg-white text-navy font-stolzl text-body-sm font-medium px-5 py-3 rounded-[var(--radius-button)] hover:bg-blue-brand hover:text-white transition-colors">
                  {c.expertCta}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.917 7h8.166M7.583 4l3.5 3-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Right: savings output ── */}
            <div className="flex flex-col justify-center gap-8 p-8 sm:p-12 lg:p-14">

              {/* Big number */}
              <div>
                <p className="font-stolzl text-caption text-hero-muted uppercase tracking-widest mb-3">
                  {c.savingsLabel}
                </p>
                <p
                  className="font-stolzl font-bold text-white tabular-nums"
                  style={{ fontSize: 48, lineHeight: 1.1, letterSpacing: "-2px" }}
                >
                  {formatSR(totalSavings)}
                </p>
                <p className="font-stolzl text-caption text-hero-muted mt-2">
                  {c.forLabel}{" "}
                  <span className="text-white font-medium">{hires.toLocaleString()} {c.hiresUnit}</span>{" "}
                  {c.vsLabel}
                </p>
              </div>

              {/* Three stats */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.07]">
                {[
                  { label: c.stats[0], value: formatSR(SAVINGS_PER_HIRE) },
                  { label: c.stats[1], value: `${Math.round((totalSavings / (hires * 1699)) * 100)}%` },
                  { label: c.stats[2], value: c.payback },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <span className="font-stolzl text-caption text-hero-muted">
                      {s.label}
                    </span>
                    <span className="font-stolzl text-body-sm font-medium text-white">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <p className="text-center font-stolzl text-caption text-text-muted mt-5">{c.disclaimer}</p>
      </div>
    </section>
  );
}
