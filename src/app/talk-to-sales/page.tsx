"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
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
    "w-full bg-white border border-border-soft rounded-xl px-4 py-3 text-navy placeholder:text-text-muted font-stolzl text-body-sm focus:outline-none focus:border-blue-brand focus:ring-1 focus:ring-blue-brand transition-colors";
  const labelClass = "block font-stolzl text-caption text-text-secondary mb-1.5";
  const errorClass = "font-stolzl text-[12px] text-red-500 mt-1";

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="relative min-h-screen bg-white" dir={isRTL ? "rtl" : "ltr"}>
        <Navbar />
        <div className="relative flex items-center justify-center min-h-screen px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-cta/15 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-green-cta)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-stolzl text-h2 font-bold text-navy mb-3">
              {s.successTitle}
            </h1>
            <p className="font-stolzl text-body text-text-secondary mb-8">
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
    <div className="relative min-h-screen bg-bg-light" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div className="relative max-w-[640px] mx-auto px-6 sm:px-8 pt-28 sm:pt-32 pb-16">
        {/* Logo + heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-8 sm:mb-10"
        >
          <Image
            src="/images/logo.png"
            alt="Corenet"
            width={80}
            height={46}
            className="object-contain mx-auto mb-5"
          />
          <h1 className="font-stolzl text-h2 sm:text-h1 font-bold text-navy mb-2">
            {s.heading}
          </h1>
          <p className="font-stolzl text-body-sm text-text-secondary max-w-[420px] mx-auto">
            {s.sub}
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white border border-border-subtle rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_4px_24px_rgba(2,2,44,0.06)]"
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
                <option value="" disabled>
                  {s.companySizePlaceholder}
                </option>
                {s.companySizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
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
                <option value="" disabled>
                  {s.heardAboutPlaceholder}
                </option>
                {s.heardAboutOptions.map((opt) => (
                  <option key={opt} value={opt}>
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
  );
}
