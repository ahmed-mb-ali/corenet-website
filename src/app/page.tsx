"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import SavingsCalculator from "./components/SavingsCalculator";
import MissionVision from "./components/MissionVision";
import ProductShowcase from "./components/ProductShowcase";
import Navbar from "./components/Navbar";
import HeroBackground from "./components/HeroBackground";

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
  return (
    <div className="relative w-full bg-white overflow-x-hidden">

      {/* ========== NAVBAR ========== */}
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-[98%] mx-auto mt-[10px] h-[867px] bg-navy-dark rounded-[50px] overflow-hidden"
      >
        {/* WebGL animated background */}
        <HeroBackground />

        {/* Gradient strips — sit above WebGL */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-[28%] h-full opacity-90" style={{ background: "linear-gradient(180deg, rgba(58, 184, 116, 0.35) 0%, rgba(15, 15, 155, 0.12) 50%, rgba(2, 2, 39, 0.6) 100%)" }} />
          <div className="absolute right-[28%] top-0 w-[12%] h-full opacity-70" style={{ background: "linear-gradient(180deg, rgba(45, 212, 191, 0.25) 0%, rgba(15, 23, 42, 0.4) 100%)" }} />
          <div className="absolute right-[38%] top-0 w-[8%] h-full opacity-50" style={{ background: "linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%)" }} />
        </div>

        {/* Portrait — static, no entrance animation */}
        <div className="absolute right-0 top-[50px] w-[654px] h-[870px]">
          <Image src="/images/businessman.png" alt="Professional portrait" fill className="object-cover object-top" />
        </div>

        {/* Gradient accent line — wipe reveal */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease, delay: 0.4 }}
          style={{ originX: 0 }}
          className="absolute left-[93px] top-[350px] w-[630px] h-[60px] bg-gradient-to-r from-[#405af0] to-[#020230]"
        />

        {/* Hero content — staggered */}
        <div className="absolute left-[92px] top-1/2 -translate-y-1/2 mt-[42px] max-w-[675px] flex flex-col gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.2 }}
            className="font-stolzl text-display font-bold text-white"
          >
            Building the{" "}
            <span className="bg-blue-brand px-1.5 pb-1 pt-0.5 rounded-[6px] inline-block">
              Modern Workforce
            </span>{" "}
            Technology
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.4 }}
            className="font-stolzl text-body-lg text-hero-muted max-w-[652px]"
          >
            Corenet is a technology holding company building and scaling
            platforms that power modern workforce solutions across the region and beyond.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-fit bg-blue-brand text-white font-stolzl font-medium text-body-sm px-8 py-4 rounded-xl hover:bg-[#2a4fdd] transition-colors shadow-lg"
          >
            Talk to sales
          </motion.button>
        </div>
      </motion.section>

      {/* ========== WHAT WE DO SECTION ========== */}
      <section id="about" className="relative w-full bg-white rounded-t-[60px] -mt-[60px] pt-16 pb-20 sm:pt-20 sm:pb-24">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">

          <motion.header
            {...fadeUp(0)}
            className="text-center max-w-[580px] mx-auto mb-14 sm:mb-16"
          >
            <h2 className="font-stolzl text-h1 font-medium text-navy">What we do?</h2>
            <p className="font-stolzl text-body-sm text-text-secondary mt-3 max-w-[480px] mx-auto">
              The strategic, technical, and operational backbone behind every product we build.
            </p>
          </motion.header>

          <motion.div
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.13 } },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10"
          >
            {[
              {
                imgOffset: "-top-[24px] -left-[22px]",
                title: "Product Strategy & Innovation",
                desc: "We define product vision, roadmap alignment, and market positioning to ensure every platform delivers measurable value.",
              },
              {
                imgOffset: "-top-[24px] -left-[147px]",
                title: "Engineering & Technology Infrastructure",
                desc: "Shared architecture, security frameworks, DevOps, and scalable cloud infrastructure across all portfolio products.",
              },
              {
                imgOffset: "-top-[141px] -left-[23px]",
                title: "Governance & Compliance",
                desc: "Structured oversight, risk management, and regulatory alignment to ensure long-term sustainability.",
              },
            ].map(({ imgOffset, title, desc }) => (
              <motion.article
                key={title}
                variants={{
                  hidden: { opacity: 0, y: 36 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
                }}
                whileHover={{ y: -4, boxShadow: "0 12px 36px rgba(2,2,44,0.09)" }}
                transition={{ duration: 0.25 }}
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
          </motion.div>

          {/* ── Features panel ── */}
          <motion.div
            {...fadeUp(0.1)}
            className="mt-12 lg:mt-16 rounded-[20px] overflow-hidden"
            style={{ background: "#1a1f3c" }}
          >
            {/* macOS traffic-light dots */}
            <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>

            {/* Feature list */}
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 px-8 py-6"
            >
              {[
                {
                  title: "AI Resume Screening",
                  desc: "Bulk upload CVs and let AI score, rank, and extract candidate data — in English and Arabic.",
                },
                {
                  title: "Job Management",
                  desc: "Create jobs with AI-generated descriptions, set requirements, and publish to your career page.",
                },
                {
                  title: "Candidate Pipeline",
                  desc: "Track every candidate from Applied to Hired with stage management and team approvals.",
                },
                {
                  title: "Interview Scheduling",
                  desc: "Schedule phone, video, on-site, and panel interviews with automated confirmations.",
                },
                {
                  title: "Career Page",
                  desc: "Branded bilingual career page with custom domain — candidates apply and answer screening questions directly.",
                },
                {
                  title: "Analytics & Dashboards",
                  desc: "Customizable dashboards with hiring trends, pipeline health, and custom charts.",
                },
                {
                  title: "Multi-Tenant & Agency Support",
                  desc: "Manage multiple employers from one account with role-based access and bilingual Arabic/English UI.",
                },
              ].map(({ title, desc }) => (
                <motion.div
                  key={title}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
                  }}
                  className="py-5 border-b border-white/10 last:border-0"
                >
                  <p className="font-stolzl font-medium text-[15px] text-[#6b7fff] mb-1">{title}</p>
                  <p className="font-stolzl text-[13px] text-white/60 leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

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
        className="relative z-10 w-full pt-10 pb-0 -mb-[205px]"
      >
        <div className="w-full max-w-[min(1287px,calc(100%-40px))] mx-auto">
          <div className="relative w-full h-[410px] bg-[#3ab874] rounded-[40px] overflow-hidden">

            {/* Left: headline + CTA button */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
              className="absolute left-[64px] top-[72px] w-[604px] flex flex-col gap-9"
            >
              <h2 className="font-stolzl text-[51px] font-bold text-white leading-[1.35] tracking-[-2.04px]">
                Ready to know more about Corenet?
              </h2>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="w-fit bg-white text-text-secondary font-stolzl font-medium text-body-sm px-5 py-3 rounded-[var(--radius-button)] border border-border-subtle shadow-[0px_1px_2px_rgba(10,13,20,0.03)] hover:bg-gray-50 transition-colors"
              >
                Talk to sales
              </motion.button>
            </motion.div>

            {/* Right: bordered card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
              className="absolute left-[728px] top-[53px] w-[589px] h-[450px] border border-white rounded-[20px] overflow-hidden"
            >
              <p className="absolute top-[-1px] left-[23px] font-stolzl text-[24px] text-white leading-[69px] tracking-[-0.96px] whitespace-nowrap">
                Building the workforce suite
              </p>
              <div className="absolute left-[205px] top-[145px] w-[176px] h-[102px] bg-white rounded-[70px] flex items-center justify-center">
                <Image src="/images/logo.png" alt="Corenet" width={94} height={51} className="object-contain" />
              </div>
            </motion.div>

            {/* Feature pills — staggered slide in */}
            {(
              [
                { label: "Manage",  top: 162, width: 176, delay: 0.25 },
                { label: "Hire",    top: 216, width: 130, delay: 0.38 },
                { label: "Analyze", top: 269, width: 213, delay: 0.51 },
              ] as const
            ).map(({ label, top, width, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease, delay }}
                className="absolute flex items-center bg-[#85d3a9] rounded-[30px] overflow-hidden"
                style={{ left: 666, top, width, height: 40 }}
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
      <footer className="relative w-full bg-navy-deep rounded-[40px] overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero-bg.png" alt="" fill className="object-cover opacity-30" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20 pt-[260px] pb-16 sm:pb-20"
        >
          <div className="mb-10 sm:mb-12">
            <Image src="/images/logo.png" alt="Corenet" width={134} height={78} className="object-contain brightness-0 invert" />
          </div>

          <p className="font-stolzl text-body text-white/95 max-w-[465px] mb-12 sm:mb-14">
            Corenet is a technology holding company building and scaling
            platforms that power modern workforce solutions across the region and beyond.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <p className="text-white font-medium text-caption">2026 Corenet — All rights reserved</p>
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
