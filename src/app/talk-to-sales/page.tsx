"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";

const ease = [0.22, 1, 0.36, 1] as const;

interface FormData {
  fullName: string;
  workEmail: string;
  companyName: string;
  phone: string;
  companySize: string;
  message: string;
  heardAbout: string;
}

const initial: FormData = {
  fullName: "",
  workEmail: "",
  companyName: "",
  phone: "",
  companySize: "",
  message: "",
  heardAbout: "",
};

export default function TalkToSales() {
  const { t, isRTL } = useLanguage();
  const s = t.talkToSales;

  const GOOGLE_SHEET_URL =
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ?? "";

  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.fullName.trim()) errs.fullName = s.required;
    if (!form.workEmail.trim()) errs.workEmail = s.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail))
      errs.workEmail = s.invalidEmail;
    if (!form.companyName.trim()) errs.companyName = s.required;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...form,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 font-stolzl text-body-sm focus:outline-none focus:border-blue-brand focus:ring-1 focus:ring-blue-brand transition-colors";
  const labelClass = "block font-stolzl text-caption text-white/70 mb-1.5";
  const errorClass = "font-stolzl text-[12px] text-red-400 mt-1";

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#050535]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="pointer-events-none absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="techGridS" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0v50" fill="none" stroke="#6888c8" strokeWidth="0.8"/>
                <circle cx="0" cy="0" r="2" fill="#6888c8"/>
                <circle cx="50" cy="0" r="2" fill="#6888c8"/>
                <circle cx="0" cy="50" r="2" fill="#6888c8"/>
              </pattern>
              <pattern id="circuitLinesS" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M0 50h40l8-8h30l8 8h114" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
                <path d="M0 150h70l8-8h20l8 8h94" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
                <path d="M50 0v60l-8 8v30l8 8v94" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
                <path d="M150 0v40l8 8v20l-8 8v124" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
                <path d="M100 90l10 10v20l-10 10" fill="none" stroke="#7b9bd4" strokeWidth="0.6"/>
                <circle cx="40" cy="50" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
                <circle cx="86" cy="42" r="2" fill="#7b9bd4" opacity="0.6"/>
                <circle cx="50" cy="60" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
                <circle cx="150" cy="40" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
                <circle cx="70" cy="150" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
                <circle cx="100" cy="100" r="4" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
                <circle cx="100" cy="100" r="1.5" fill="#7b9bd4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#techGridS)"/>
            <rect width="100%" height="100%" fill="url(#circuitLinesS)"/>
          </svg>
          <div
            className="absolute inset-0 animate-[meshMove_12s_ease-in-out_infinite]"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(30,58,138,0.5) 0%, transparent 70%), " +
                "radial-gradient(ellipse 50% 60% at 80% 70%, rgba(59,130,246,0.25) 0%, transparent 70%), " +
                "radial-gradient(ellipse 70% 40% at 50% 10%, rgba(99,102,241,0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 animate-[meshMove2_15s_ease-in-out_infinite]"
            style={{
              background:
                "radial-gradient(ellipse 40% 55% at 70% 20%, rgba(79,70,229,0.3) 0%, transparent 70%), " +
                "radial-gradient(ellipse 55% 45% at 30% 80%, rgba(37,99,235,0.2) 0%, transparent 70%)",
            }}
          />
        </div>
        <style jsx>{`
          @keyframes meshMove {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.05); }
            66% { transform: translate(-20px, 15px) scale(0.97); }
          }
          @keyframes meshMove2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-25px, 20px) scale(1.03); }
            66% { transform: translate(20px, -15px) scale(0.95); }
          }
        `}</style>
        <Navbar />
        <div className="relative flex items-center justify-center min-h-screen px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-stolzl text-h1 font-bold text-white mb-3">
              {s.successTitle}
            </h1>
            <p className="font-stolzl text-body text-white/70 mb-8">
              {s.successMessage}
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-brand text-white font-stolzl font-medium text-body-sm px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              {s.successBack}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050535]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Tech pattern + animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Circuit / tech grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="techGrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0v50" fill="none" stroke="#6888c8" strokeWidth="0.8"/>
              <circle cx="0" cy="0" r="2" fill="#6888c8"/>
              <circle cx="50" cy="0" r="2" fill="#6888c8"/>
              <circle cx="0" cy="50" r="2" fill="#6888c8"/>
            </pattern>
            <pattern id="circuitLines" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Horizontal circuit traces */}
              <path d="M0 50h40l8-8h30l8 8h114" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
              <path d="M0 150h70l8-8h20l8 8h94" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
              {/* Vertical circuit traces */}
              <path d="M50 0v60l-8 8v30l8 8v94" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
              <path d="M150 0v40l8 8v20l-8 8v124" fill="none" stroke="#7b9bd4" strokeWidth="0.8"/>
              {/* Diagonal connector */}
              <path d="M100 90l10 10v20l-10 10" fill="none" stroke="#7b9bd4" strokeWidth="0.6"/>
              {/* Node circles */}
              <circle cx="40" cy="50" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
              <circle cx="86" cy="42" r="2" fill="#7b9bd4" opacity="0.6"/>
              <circle cx="50" cy="60" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
              <circle cx="150" cy="40" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
              <circle cx="70" cy="150" r="3" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
              <circle cx="100" cy="100" r="4" fill="none" stroke="#7b9bd4" strokeWidth="1"/>
              <circle cx="100" cy="100" r="1.5" fill="#7b9bd4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#techGrid)"/>
          <rect width="100%" height="100%" fill="url(#circuitLines)"/>
        </svg>
        {/* Mesh gradient blobs */}
        <div
          className="absolute inset-0 animate-[meshMove_12s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(30,58,138,0.5) 0%, transparent 70%), " +
              "radial-gradient(ellipse 50% 60% at 80% 70%, rgba(59,130,246,0.25) 0%, transparent 70%), " +
              "radial-gradient(ellipse 70% 40% at 50% 10%, rgba(99,102,241,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 animate-[meshMove2_15s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse 40% 55% at 70% 20%, rgba(79,70,229,0.3) 0%, transparent 70%), " +
              "radial-gradient(ellipse 55% 45% at 30% 80%, rgba(37,99,235,0.2) 0%, transparent 70%)",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes meshMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes meshMove2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.03); }
          66% { transform: translate(20px, -15px) scale(0.95); }
        }
      `}</style>

      <Navbar />

      <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-20 pt-32 sm:pt-36 pb-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">

          {/* ── Left: heading + trust ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="lg:w-[420px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-36 lg:self-start"
          >
            <h1 className="font-stolzl text-[40px] sm:text-[48px] font-bold text-white leading-[1.2] tracking-[-1.5px]">
              {s.heading}
            </h1>
            <p className="font-stolzl text-body text-white/60 max-w-[380px]">
              {s.sub}
            </p>
            <ul className="mt-4 space-y-3">
              {s.whyTalkToUs.map((item, i) => {
                const icons = [
                  /* Person – dedicated strategist */
                  <svg key="person" className="w-5 h-5 mt-0.5 shrink-0 text-blue-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                  /* Sparkles – AI matching */
                  <svg key="ai" className="w-5 h-5 mt-0.5 shrink-0 text-blue-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707"/><circle cx="12" cy="12" r="4"/></svg>,
                  /* Arrows – end-to-end support */
                  <svg key="flow" className="w-5 h-5 mt-0.5 shrink-0 text-blue-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m0 0-4-4m4 4-4 4"/></svg>,
                  /* Trending up – flexible scaling */
                  <svg key="scale" className="w-5 h-5 mt-0.5 shrink-0 text-blue-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
                  /* Globe – region-wide network */
                  <svg key="globe" className="w-5 h-5 mt-0.5 shrink-0 text-blue-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                ];
                return (
                  <li key={i} className="flex items-start gap-3">
                    {icons[i]}
                    <span className="font-stolzl text-body-sm text-white/70">{item}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* ── Right: form card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            className="flex-1 max-w-[640px]"
          >
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-[#0c0c4a] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
            >
              {/* Full name + Work email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>{s.fullName} *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={set("fullName")}
                    placeholder={s.fullNamePlaceholder}
                    className={inputClass}
                  />
                  {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
                </div>
                <div>
                  <label className={labelClass}>{s.workEmail} *</label>
                  <input
                    type="email"
                    value={form.workEmail}
                    onChange={set("workEmail")}
                    placeholder={s.workEmailPlaceholder}
                    className={inputClass}
                  />
                  {errors.workEmail && <p className={errorClass}>{errors.workEmail}</p>}
                </div>
              </div>

              {/* Company name + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>{s.companyName} *</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={set("companyName")}
                    placeholder={s.companyNamePlaceholder}
                    className={inputClass}
                  />
                  {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
                </div>
                <div>
                  <label className={labelClass}>{s.phone}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder={s.phonePlaceholder}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Company size */}
              <div>
                <label className={labelClass}>{s.companySize}</label>
                <select
                  value={form.companySize}
                  onChange={set("companySize")}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="" disabled className="bg-[#0a0a2e] text-white/40">
                    {s.companySizePlaceholder}
                  </option>
                  {s.companySizeOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0a0a2e] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className={labelClass}>{s.message}</label>
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  placeholder={s.messagePlaceholder}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* How did you hear */}
              <div>
                <label className={labelClass}>{s.heardAbout}</label>
                <select
                  value={form.heardAbout}
                  onChange={set("heardAbout")}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="" disabled className="bg-[#0a0a2e] text-white/40">
                    {s.heardAboutPlaceholder}
                  </option>
                  {s.heardAboutOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0a0a2e] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-brand text-white font-stolzl font-medium text-body-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : s.submit}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
