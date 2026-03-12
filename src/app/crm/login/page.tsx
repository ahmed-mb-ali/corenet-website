"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { crmApi } from "../../lib/crmApi";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CRMLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }
    setLoading(true);
    setError("");
    try {
      const { token } = await crmApi.login(email.trim(), password);
      localStorage.setItem("crm_token", token);
      router.push("/crm");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.06)] border border-[#ebebeb] p-8">
          {/* Logo & heading */}
          <div className="text-center mb-8">
            <Image src="/images/logo.png" alt="Corenet" width={90} height={52} className="object-contain mx-auto mb-5" />
            <h1 className="font-stolzl text-[22px] font-bold text-[#02022c] mb-1">Corenet CRM</h1>
            <p className="font-stolzl text-[13px] text-[#5c5c5c]">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@corenet.sa"
                className="w-full bg-[#f7f8fc] border border-[#e0e0e0] rounded-xl px-4 py-3 text-[#02022c] placeholder:text-[#5c5c5c]/40 font-stolzl text-[14px] focus:outline-none focus:border-[#3ab874] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#f7f8fc] border border-[#e0e0e0] rounded-xl px-4 py-3 pr-11 text-[#02022c] placeholder:text-[#5c5c5c]/40 font-stolzl text-[14px] focus:outline-none focus:border-[#3ab874] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c5c5c]/50 hover:text-[#5c5c5c] transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <circle cx="7" cy="7" r="6" stroke="#e53e3e" strokeWidth="1.3"/>
                  <path d="M7 4.5v3M7 9v.5" stroke="#e53e3e" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="font-stolzl text-[13px] text-[#e53e3e]">{error}</p>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-[#3ab874] text-white font-stolzl font-semibold text-[15px] py-3.5 rounded-xl hover:bg-[#2da062] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center font-stolzl text-[11px] text-[#5c5c5c]/50 mt-6">
          Corenet Business Solutions
        </p>
      </motion.div>
    </div>
  );
}
