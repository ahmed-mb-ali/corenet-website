"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAvailability, submitBooking, type BookingPayload } from "../lib/bookingApi";
import { useLanguage } from "../context/LanguageContext";

const ease = [0.22, 1, 0.36, 1] as const;

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_AR = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toMonthKey(y: number, m: number) { return `${y}-${pad(m + 1)}`; }
function formatDisplayDate(dateStr: string, isRTL: boolean) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = isRTL ? MONTHS_AR : MONTHS_EN;
  return isRTL ? `${d} ${months[m - 1]} ${y}` : `${months[m - 1]} ${d}, ${y}`;
}

type Step = "calendar" | "time" | "form" | "success";

interface FormState { name: string; email: string; company: string; phone: string; message: string; }
const emptyForm: FormState = { name: "", email: "", company: "", phone: "", message: "" };

interface Props { onClose: () => void; inline?: boolean; }

export default function BookingWidget({ onClose, inline = false }: Props) {
  const { isRTL } = useLanguage();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("calendar");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{ date: string; time: string } | null>(null);

  const loadMonth = useCallback(async (y: number, m: number) => {
    const key = toMonthKey(y, m);
    setLoadingSlots(true);
    setSlotsError(false);
    try {
      const data = await fetchAvailability(key);
      setAvailability((prev) => ({ ...prev, ...data.slots }));
    } catch {
      setSlotsError(true);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => { loadMonth(viewYear, viewMonth); }, [viewYear, viewMonth, loadMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const isPast = useCallback((dateStr: string) => new Date(dateStr) < new Date(new Date().toDateString()), []);
  const hasSlots = useCallback((dateStr: string) => !!availability[dateStr]?.length, [availability]);

  function buildCalendarDays() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
    }
    return cells;
  }

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setStep("time");
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    setStep("form");
  }

  function validate() {
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = isRTL ? "مطلوب" : "Required";
    if (!form.email.trim()) errs.email = isRTL ? "مطلوب" : "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = isRTL ? "بريد غير صالح" : "Invalid email";
    if (!form.company.trim()) errs.company = isRTL ? "مطلوب" : "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: BookingPayload = {
        date: selectedDate,
        startTime: selectedTime,
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone || undefined,
        message: form.message || undefined,
      };
      await submitBooking(payload);
      setBookingDetails({ date: selectedDate, time: selectedTime });
      setStep("success");
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string }; message?: string };
      if (e?.status === 409) {
        setSubmitError(isRTL ? "هذا الموعد لم يعد متاحاً، يرجى اختيار وقت آخر." : "This slot was just taken. Please choose another time.");
        setStep("time");
      } else {
        setSubmitError(isRTL ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const months = isRTL ? MONTHS_AR : MONTHS_EN;
  const days = isRTL ? DAYS_AR : DAYS_EN;
  const calendarDays = buildCalendarDays();
  const timeSlots = selectedDate ? (availability[selectedDate] || []) : [];

  const inputCls = "w-full bg-white border border-[#e0e0e0] rounded-lg px-3 py-2 text-[#02022c] placeholder:text-[rgba(92,92,92,0.6)] font-stolzl text-[13px] focus:outline-none focus:border-[#335cff] focus:ring-1 focus:ring-[#335cff] transition-colors";
  const labelCls = "block font-stolzl text-[12px] text-[#5c5c5c] mb-1";
  const errorCls = "font-stolzl text-[12px] text-red-500 mt-1";

  function renderBody() {
    return (
      <AnimatePresence mode="wait">
        {/* ── CALENDAR ── */}
        {step === "calendar" && (
          <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease }} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={isRTL ? nextMonth : prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f4] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="#02022c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="font-stolzl text-[15px] font-semibold text-[#02022c]">{months[viewMonth]} {viewYear}</span>
              <button onClick={isRTL ? prevMonth : nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f4] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#02022c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {days.map((d) => <div key={d} className="text-center font-stolzl text-[12px] text-[#5c5c5c] py-1">{d}</div>)}
            </div>
            {loadingSlots ? (
              <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-[#335cff] border-t-transparent rounded-full animate-spin" /></div>
            ) : slotsError ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <p className="font-stolzl text-[14px] text-[#5c5c5c]">{isRTL ? "تعذر تحميل المواعيد" : "Couldn't load availability"}</p>
                <button onClick={() => loadMonth(viewYear, viewMonth)} className="font-stolzl text-[13px] text-[#335cff] hover:underline">{isRTL ? "إعادة المحاولة" : "Retry"}</button>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dateStr, i) => {
                  if (!dateStr) return <div key={i} />;
                  const day = parseInt(dateStr.split("-")[2]);
                  const past = isPast(dateStr);
                  const available = hasSlots(dateStr);
                  const selected = selectedDate === dateStr;
                  return (
                    <button key={dateStr} disabled={past || !available} onClick={() => selectDate(dateStr)}
                      className={`aspect-square flex items-center justify-center rounded-xl font-stolzl text-[14px] transition-all
                        ${selected ? "bg-[#335cff] text-white font-semibold" : ""}
                        ${!selected && available && !past ? "hover:bg-[#335cff]/10 text-[#02022c] cursor-pointer" : ""}
                        ${past || !available ? "text-[#c3c3ca] cursor-not-allowed" : ""}
                      `}>
                      {day}
                      {available && !past && !selected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#335cff]" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#ebebeb]">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#335cff]" /><span className="font-stolzl text-[12px] text-[#5c5c5c]">{isRTL ? "متاح" : "Available"}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#c3c3ca]" /><span className="font-stolzl text-[12px] text-[#5c5c5c]">{isRTL ? "غير متاح" : "Unavailable"}</span></div>
            </div>
          </motion.div>
        )}

        {/* ── TIME SLOTS ── */}
        {step === "time" && selectedDate && (
          <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease }} className="p-5">
            <button onClick={() => setStep("calendar")} className="flex items-center gap-1.5 font-stolzl text-[13px] text-[#335cff] mb-4 hover:underline">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {isRTL ? "تغيير التاريخ" : "Change date"}
            </button>
            <p className="font-stolzl text-[15px] font-semibold text-[#02022c] mb-1">{formatDisplayDate(selectedDate, isRTL)}</p>
            <p className="font-stolzl text-[13px] text-[#5c5c5c] mb-4">{isRTL ? "اختر وقت الاجتماع (30 دقيقة)" : "Select a 30-minute slot"}</p>
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="font-stolzl text-[13px] text-red-600">{submitError}</p>
              </div>
            )}
            {timeSlots.length === 0 ? (
              <p className="font-stolzl text-[14px] text-[#5c5c5c] text-center py-8">{isRTL ? "لا توجد مواعيد متاحة" : "No slots available"}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const [h, m] = time.split(":").map(Number);
                  const suffix = h >= 12 ? (isRTL ? "م" : "PM") : (isRTL ? "ص" : "AM");
                  const label = `${h % 12 || 12}:${pad(m)} ${suffix}`;
                  return (
                    <button key={time} onClick={() => selectTime(time)}
                      className={`py-3 rounded-xl border font-stolzl text-[14px] transition-all
                        ${selectedTime === time ? "bg-[#335cff] border-[#335cff] text-white font-semibold" : "border-[#e0e0e0] text-[#02022c] hover:border-[#335cff] hover:bg-[#335cff]/5"}
                      `}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FORM ── */}
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease }} className="p-5">
            <button onClick={() => setStep("time")} className="flex items-center gap-1.5 font-stolzl text-[13px] text-[#335cff] mb-4 hover:underline">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {isRTL ? "تغيير الوقت" : "Change time"}
            </button>
            {selectedDate && selectedTime && (
              <div className="flex items-center gap-3 bg-[#f4f7ff] rounded-xl px-4 py-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#335cff]/15 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="#335cff" strokeWidth="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="#335cff" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <p className="font-stolzl text-[13px] font-semibold text-[#02022c]">{formatDisplayDate(selectedDate, isRTL)}</p>
                  <p className="font-stolzl text-[12px] text-[#5c5c5c]">
                    {(() => { const [h, m] = selectedTime.split(":").map(Number); const suffix = h >= 12 ? (isRTL ? "م" : "PM") : (isRTL ? "ص" : "AM"); return `${h % 12 || 12}:${pad(m)} ${suffix}`; })()}
                    {" · "}{isRTL ? "30 دقيقة" : "30 min"}{" · "}Arabia Standard Time
                  </p>
                </div>
              </div>
            )}
            {submitError && !submitError.includes("slot") && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="font-stolzl text-[13px] text-red-600">{submitError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <div>
                <label className={labelCls}>{isRTL ? "الاسم الكامل" : "Full name"} *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder={isRTL ? "محمد أحمد" : "John Doe"} className={inputCls} />
                {errors.name && <p className={errorCls}>{errors.name}</p>}
              </div>
              <div>
                <label className={labelCls}>{isRTL ? "البريد الإلكتروني للعمل" : "Work email"} *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@company.com" className={inputCls} />
                {errors.email && <p className={errorCls}>{errors.email}</p>}
              </div>
              <div>
                <label className={labelCls}>{isRTL ? "اسم الشركة" : "Company name"} *</label>
                <input type="text" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder={isRTL ? "شركتك" : "Your company"} className={inputCls} />
                {errors.company && <p className={errorCls}>{errors.company}</p>}
              </div>
              <div>
                <label className={labelCls}>{isRTL ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+966 5XX XXX XXXX" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{isRTL ? "رسالة (اختياري)" : "Message (optional)"}</label>
                <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder={isRTL ? "أخبرنا عن احتياجاتك..." : "Tell us about your needs..."} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full bg-[#335cff] text-white font-stolzl font-medium text-[14px] py-2.5 rounded-lg hover:bg-[#2a4fdd] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isRTL ? "جارٍ الحجز..." : "Booking..."}
                  </span>
                ) : (isRTL ? "تأكيد الحجز" : "Confirm booking")}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} className="p-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#3ab874]/15 flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3ab874" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 className="font-stolzl text-[22px] font-bold text-[#02022c] mb-2">{isRTL ? "تم تأكيد الاجتماع!" : "Meeting confirmed!"}</h3>
            <p className="font-stolzl text-[14px] text-[#5c5c5c] mb-6 max-w-[320px]">
              {isRTL ? "سيتواصل معك فريق المبيعات قريباً. تحقق من بريدك الإلكتروني للتفاصيل." : "Our sales team will reach out shortly. Check your email for details."}
            </p>
            {bookingDetails && (
              <div className="bg-[#f4f7ff] rounded-xl px-5 py-4 mb-6 w-full text-start">
                <p className="font-stolzl text-[13px] text-[#5c5c5c] mb-1">{isRTL ? "تفاصيل الاجتماع" : "Meeting details"}</p>
                <p className="font-stolzl text-[15px] font-semibold text-[#02022c]">{formatDisplayDate(bookingDetails.date, isRTL)}</p>
                <p className="font-stolzl text-[13px] text-[#5c5c5c]">
                  {(() => { const [h, m] = bookingDetails.time.split(":").map(Number); const suffix = h >= 12 ? (isRTL ? "م" : "PM") : (isRTL ? "ص" : "AM"); return `${h % 12 || 12}:${pad(m)} ${suffix}`; })()}
                  {" · "}Arabia Standard Time
                </p>
              </div>
            )}
            {!inline && (
              <button onClick={onClose} className="font-stolzl text-[14px] text-[#335cff] hover:underline">
                {isRTL ? "إغلاق" : "Close"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (inline) {
    return (
      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-[0_8px_40px_rgba(2,2,44,0.18)] overflow-hidden flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#ebebeb]">
          <p className="font-stolzl text-[12px] text-[#5c5c5c]">
            {isRTL ? "احجز موعدك" : "Book a meeting"}
          </p>
          <h2 className="font-stolzl text-[17px] font-bold text-[#02022c] leading-tight">
            {isRTL ? "تحدث مع فريق المبيعات" : "Talk to our sales team"}
          </h2>
        </div>
        {/* Steps + body reuse — rendered below via shared JSX */}
        {step !== "success" && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#ebebeb]">
            {(["calendar", "time", "form"] as Step[]).map((s, i) => {
              const stepIdx = ["calendar", "time", "form"].indexOf(step);
              const done = i < stepIdx;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-stolzl font-semibold transition-colors ${active ? "bg-[#335cff] text-white" : done ? "bg-[#3ab874] text-white" : "bg-[#f4f4f4] text-[#5c5c5c]"}`}>
                    {done ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : i + 1}
                  </div>
                  {i < 2 && <div className={`h-px w-8 transition-colors ${done ? "bg-[#3ab874]" : "bg-[#e0e0e0]"}`} />}
                </div>
              );
            })}
            <span className="font-stolzl text-[13px] text-[#5c5c5c] ml-2">
              {step === "calendar" ? (isRTL ? "اختر التاريخ" : "Pick a date") : step === "time" ? (isRTL ? "اختر الوقت" : "Pick a time") : (isRTL ? "بياناتك" : "Your details")}
            </span>
          </div>
        )}
        <div className="flex-1">{renderBody()}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-10 w-full sm:max-w-[520px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#ebebeb] shrink-0">
          <div>
            <p className="font-stolzl text-[13px] text-[#5c5c5c]">
              {isRTL ? "احجز موعدك" : "Book a meeting"}
            </p>
            <h2 className="font-stolzl text-[18px] font-semibold text-[#02022c] leading-tight">
              {isRTL ? "تحدث مع فريق المبيعات" : "Talk to our sales team"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] transition-colors text-[#5c5c5c]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        {step !== "success" && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-[#ebebeb] shrink-0">
            {(["calendar", "time", "form"] as Step[]).map((s, i) => {
              const stepIdx = ["calendar", "time", "form"].indexOf(step);
              const done = i < stepIdx;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-stolzl font-semibold transition-colors ${active ? "bg-[#335cff] text-white" : done ? "bg-[#3ab874] text-white" : "bg-[#f4f4f4] text-[#5c5c5c]"}`}>
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : i + 1}
                  </div>
                  {i < 2 && <div className={`h-px w-8 transition-colors ${done ? "bg-[#3ab874]" : "bg-[#e0e0e0]"}`} />}
                </div>
              );
            })}
            <span className="font-stolzl text-[13px] text-[#5c5c5c] ml-2">
              {step === "calendar" ? (isRTL ? "اختر التاريخ" : "Pick a date") : step === "time" ? (isRTL ? "اختر الوقت" : "Pick a time") : (isRTL ? "بياناتك" : "Your details")}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {renderBody()}
        </div>
      </motion.div>
    </div>
  );
}

