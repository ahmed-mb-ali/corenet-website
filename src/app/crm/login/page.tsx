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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true);
    setError("");
    try {
      const { token } = await crmApi.login(email.trim());
      localStorage.setItem("crm_token", token);
      router.push("/crm");
    } catch {
      setError("Email not found or access denied.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#02022c] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-[400px]"
      >
        <div className="text-center mb-8">
          <Image src="/images/logo.png" alt="Corenet" width={100} height={58} className="object-contain mx-auto mb-6 brightness-0 invert" />
          <h1 className="font-stolzl text-[24px] font-bold text-white mb-1">CRM Admin</h1>
          <p className="font-stolzl text-[14px] text-white/50">Sign in to manage your leads</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block font-stolzl text-[13px] text-white/60 mb-1.5">Work email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@corenet.sa"
              className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 font-stolzl text-[14px] focus:outline-none focus:border-[#335cff] transition-colors"
            />
          </div>

          {error && (
            <p className="font-stolzl text-[13px] text-red-400">{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-[#335cff] text-white font-stolzl font-medium text-[15px] py-3.5 rounded-xl hover:bg-[#2a4fdd] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
