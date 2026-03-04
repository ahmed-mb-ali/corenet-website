"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import SavingsCalculator from "./components/SavingsCalculator";
import MissionVision from "./components/MissionVision";
import ProductShowcase from "./components/ProductShowcase";
import Navbar from "./components/Navbar";
import HeroBackground from "./components/HeroBackground";
import { useLanguage } from "./context/LanguageContext";

// Shared easing — premium deceleration curve
const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease, delay },
});

const staggerContainer = {
  initial: {},
  whileInView: {},
  viewport: { once: true, margin: "-80px" },
  transition: { staggerChildren: 0.12 },
};

const staggerChild = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease },
};

export default function Home() {
  const { t, isRTL } = useLanguage();
  return (
    <div className="relative w-full bg-white overflow-x-hidden">

      {/* ========== NAVBAR ========== */}
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-[98%] mx-auto mt-[10px] min-h-[580px] sm:min-h-[640px] lg:h-[867px] bg-navy-dark rounded-[32px] sm:rounded-[40px] lg:rounded-[50px] overflow-hidden flex flex-col lg:block"
      >
        {/* WebGL animated background */}
        <HeroBackground />

        {/* Mobile/tablet: portrait as faded background */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <Image
            src="/images/businessman.png"
            alt=""
            fill
            className="object-cover object-top opacity-20"
            style={{ objectPosition: isRTL ? "left top" : "right top" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/50 via-transparent to-navy-dark/80" />
        </div>

        {/* Desktop: gradient strips */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <div className="absolute top-0 w-[28%] h-full opacity-90" style={{ [isRTL ? "left" : "right"]: 0, background: "linear-gradient(180deg, rgba(58, 184, 116, 0.35) 0%, rgba(15, 15, 155, 0.12) 50%, rgba(2, 2, 39, 0.6) 100%)" }} />
          <div className="absolute top-0 w-[12%] h-full opacity-70" style={{ [isRTL ? "left" : "right"]: "28%", background: "linear-gradient(180deg, rgba(45, 212, 191, 0.25) 0%, rgba(15, 23, 42, 0.4) 100%)" }} />
          <div className="absolute top-0 w-[8%] h-full opacity-50" style={{ [isRTL ? "left" : "right"]: "38%", background: "linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%)" }} />
        </div>

        {/* Desktop: portrait */}
        <div className="hidden lg:block absolute top-[50px] w-[654px] h-[870px]" style={{ [isRTL ? "left" : "right"]: 0 }}>
          <Image src="/images/businessman.png" alt="Professional portrait" fill className="object-cover object-top" />
        </div>


        {/* Hero content */}
        <div
          className={`relative z-10 flex flex-col gap-5 sm:gap-6 px-6 sm:px-10 pt-28 sm:pt-32 pb-14 items-center text-center lg:absolute lg:px-0 lg:pt-0 lg:pb-0 lg:top-1/2 lg:-translate-y-1/2 lg:mt-[42px] lg:max-w-[675px] ${isRTL ? "lg:right-[92px] lg:items-start lg:text-right" : "lg:left-[92px] lg:items-start lg:text-left"}`}
        >
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.2 }}
            className="font-stolzl text-display sm:text-[96px] sm:leading-[100px] sm:tracking-[-3.84px] font-bold text-white"
          >
            {t.hero.headline1}{" "}
            <span className="bg-blue-brand px-1.5 pb-1 pt-0.5 rounded-[6px] inline-block">
              {t.hero.highlight}
            </span>{" "}
            {t.hero.headline2}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.4 }}
            className="font-stolzl text-body sm:text-body-lg text-hero-muted max-w-[520px] lg:max-w-[652px]"
          >
            {t.hero.sub}
          </motion.p>

          <Link href="/talk-to-sales">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.6 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block w-fit bg-blue-brand text-white font-stolzl font-medium text-body-sm px-8 py-4 rounded-xl hover:bg-[#2a4fdd] transition-colors shadow-lg"
            >
              {t.hero.cta}
            </motion.span>
          </Link>
        </div>
      </motion.section>

      {/* ========== WHAT WE DO SECTION ========== */}
      <section id="about" className="relative w-full bg-white rounded-t-[60px] -mt-[60px] pt-16 pb-20 sm:pt-20 sm:pb-24">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">

          <motion.header
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="text-center max-w-[580px] mx-auto mb-14 sm:mb-16"
          >
            <h2 className="font-stolzl text-h1 font-medium text-navy">{t.whatWeDo.title}</h2>
            <p className="font-stolzl text-body-sm text-text-secondary mt-3 max-w-[480px] mx-auto">
              {t.whatWeDo.sub}
            </p>
          </motion.header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {(["-top-[24px] -left-[22px]", "-top-[24px] -left-[147px]", "-top-[141px] -left-[23px]"] as const)
              .map((imgOffset, i) => ({ imgOffset, ...t.whatWeDo.cards[i] }))
              .map(({ imgOffset, title, desc }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease, delay: i * 0.13 }}
                whileHover={{ y: -4, boxShadow: "0 12px 36px rgba(2,2,44,0.09)" }}
                className="flex flex-col items-center text-center gap-6 p-8 lg:p-10 rounded-[var(--radius-card)] bg-bg-light/50 border border-border-soft/80"
              >
                <div className="w-[100px] h-[101px] relative overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/icons-sprite.png" alt={title} className={`absolute ${imgOffset} w-[278px] h-[278px] max-w-none`} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-stolzl text-h4 font-medium text-navy">{title}</h3>
                  <p className="font-stolzl text-caption text-text-muted leading-6">{desc}</p>
                </div>
              </motion.article>
            ))}
          </div>

        </div>
      </section>

      {/* ========== OUR PRODUCTS SECTION ========== */}
      <ProductShowcase />

      {/* ========== SAVINGS CALCULATOR SECTION ========== */}
      <SavingsCalculator />

      {/* ========== OUR MISSION / VISION SECTION ========== */}
      <MissionVision />

      {/* ========== CTA SECTION ========== */}
      <motion.section
        {...fadeUp(0)}
        id="contact"
        className="relative z-10 w-full pt-10 pb-0 lg:-mb-[205px]"
      >
        <div className="w-full max-w-[min(1287px,calc(100%-40px))] mx-auto">

          {/* ── Mobile / Tablet CTA (hidden on lg+) ── */}
          <div className="lg:hidden bg-[#3ab874] rounded-[28px] sm:rounded-[32px] p-7 sm:p-10 flex flex-col gap-6">
            <h2 className="font-stolzl text-[32px] sm:text-[40px] font-bold text-white leading-[1.3] tracking-[-1.2px]"
              style={{ textAlign: isRTL ? "right" : "left" }}>
              {t.cta.title}
            </h2>
            <div className="flex flex-wrap gap-2" style={{ justifyContent: isRTL ? "flex-end" : "flex-start" }}>
              {t.cta.pills.map((pill) => (
                <div key={pill} className="flex items-center gap-2 bg-[#85d3a9] rounded-[30px] px-4 py-2">
                  <Image src="/images/check.svg" alt="" width={16} height={16} />
                  <span className="font-stolzl text-body-sm text-white font-medium">{pill}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: isRTL ? "right" : "left" }}>
              <Link href="/talk-to-sales" className="inline-block bg-white text-text-secondary font-stolzl font-medium text-body-sm px-5 py-3 rounded-[var(--radius-button)] border border-border-subtle hover:bg-gray-50 transition-colors">
                {t.cta.button}
              </Link>
            </div>
          </div>

          {/* ── Desktop CTA (hidden on mobile/tablet) ── */}
          <div className="hidden lg:block relative w-full h-[410px] bg-[#3ab874] rounded-[40px] overflow-hidden">

            {/* Headline + CTA button */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="absolute top-[72px] w-[604px] flex flex-col gap-9"
              style={{ [isRTL ? "right" : "left"]: 64 }}
            >
              <h2 className="font-stolzl text-[51px] font-bold text-white leading-[1.35] tracking-[-2.04px]">
                {t.cta.title}
              </h2>
              <Link href="/talk-to-sales">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-block w-fit bg-white text-text-secondary font-stolzl font-medium text-body-sm px-5 py-3 rounded-[var(--radius-button)] border border-border-subtle shadow-[0px_1px_2px_rgba(10,13,20,0.03)] hover:bg-gray-50 transition-colors"
                >
                  {t.cta.button}
                </motion.span>
              </Link>
            </motion.div>

            {/* Bordered card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
              className="absolute top-[53px] w-[589px] h-[450px] border border-white rounded-[20px] overflow-hidden"
              style={{ [isRTL ? "right" : "left"]: 728 }}
            >
              <p
                className="absolute top-[-1px] font-stolzl text-[24px] text-white leading-[69px] tracking-[-0.96px] whitespace-nowrap"
                style={{ [isRTL ? "right" : "left"]: 23 }}
              >
                {t.cta.rightTitle}
              </p>
              <div
                className="absolute top-[145px] w-[176px] h-[102px] bg-white rounded-[70px] flex items-center justify-center"
                style={{ [isRTL ? "right" : "left"]: 205 }}
              >
                <Image src="/images/logo.png" alt="Corenet" width={94} height={51} className="object-contain" />
              </div>
            </motion.div>

            {/* Feature pills */}
            {(
              [
                { label: t.cta.pills[0], top: 162, width: 176, delay: 0.25 },
                { label: t.cta.pills[1], top: 216, width: 130, delay: 0.38 },
                { label: t.cta.pills[2], top: 269, width: 213, delay: 0.51 },
              ] as const
            ).map(({ label, top, width, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: isRTL ? 24 : -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease, delay }}
                className="absolute flex items-center bg-[#85d3a9] rounded-[30px] overflow-hidden"
                style={{ [isRTL ? "right" : "left"]: 666, top, width, height: 40 }}
              >
                <div className="relative shrink-0 w-8 h-8 ml-[7px]">
                  <Image src="/images/ellipse-check.svg" alt="" fill className="object-contain" />
                  <Image src="/images/check.svg" alt="" width={24} height={24} className="absolute left-1 top-1" />
                </div>
                <span className="font-stolzl text-[24px] text-white tracking-[-0.96px] whitespace-nowrap leading-none ml-3">
                  {label}
                </span>
              </motion.div>
            ))}

          </div>
        </div>
      </motion.section>

      {/* ========== FOOTER ========== */}
      <footer className="relative w-full bg-navy-deep rounded-[28px] sm:rounded-[40px] overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero-bg.png" alt="" fill className="object-cover opacity-30" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20 pt-14 sm:pt-16 lg:pt-[260px] pb-12 sm:pb-16 lg:pb-20"
        >
          <div className="mb-10 sm:mb-12">
            <Image src="/images/logo.png" alt="Corenet" width={134} height={78} className="object-contain brightness-0 invert" />
          </div>

          <p className="font-stolzl text-body text-white/95 max-w-[465px] mb-6">
            {t.footer.desc}
          </p>

          <div className="flex items-center gap-2 mb-12 sm:mb-14">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-60">
              <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5s4.5-4.75 4.5-8.5c0-2.485-2.015-4.5-4.5-4.5Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
              <circle cx="8" cy="6" r="1.5" stroke="white" strokeWidth="1.3"/>
            </svg>
            <span className="font-stolzl text-caption text-white/60">{t.footer.location}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <p className="text-white font-medium text-caption">{t.footer.copy}</p>
            <div className="flex items-center gap-2">
              {[
                { href: "#", label: "Facebook", src: "/images/facebook.svg", size: 18 },
                { href: "#", label: "Instagram", src: "/images/instagram.svg", size: 18 },
                { href: "#", label: "Twitter", src: "/images/twitter-x.svg", size: 16 },
              ].map(({ href, label, src, size }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-9 h-9 rounded-full border border-white/80 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label={label}
                >
                  <Image src={src} alt="" width={size} height={size} />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </footer>

    </div>
  );
}
