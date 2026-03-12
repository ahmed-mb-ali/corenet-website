"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { crmApi, type CRMUser } from "../lib/crmApi";

const navItems = [
  {
    href: "/crm",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    href: "/crm/leads",
    label: "Leads",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/crm/pipeline",
    label: "Pipeline",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="3" width="4" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="7" y="6" width="4" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="13" y="9" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    href: "/crm/team",
    label: "Team",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="6.5" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1 16c0-3.038 2.462-5.5 5.5-5.5S12 12.962 12 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="13" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M15.5 15c0-2.485-1.119-4.5-2.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    adminOnly: true,
  },
  {
    href: "/crm/availability",
    label: "Availability",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="6" cy="12" r="1.2" fill="currentColor"/>
        <circle cx="9" cy="12" r="1.2" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function CRMShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CRMUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    if (!token) {
      router.push("/crm/login");
      return;
    }
    crmApi.me()
      .then((u) => { setUser(u); setAuthChecked(true); })
      .catch((err) => {
        const status = (err as { status?: number }).status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("crm_token");
          router.push("/crm/login");
        } else {
          // Network error or server error — don't kick out, just mark checked
          setAuthChecked(true);
        }
      });
  }, [router]);

  function logout() {
    localStorage.removeItem("crm_token");
    router.push("/crm/login");
  }

  const isActive = (href: string) =>
    href === "/crm" ? pathname === "/crm" : pathname.startsWith(href);

  const visibleNav = navItems.filter(item => !item.adminOnly || user?.role === "admin");

  if (!authChecked && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7f8fc]">
        <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f7f8fc] font-stolzl overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-[220px] bg-[#0f3d2e] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <Image src="/images/logo.png" alt="Corenet" width={80} height={46} className="object-contain brightness-0 invert" />
          <p className="font-stolzl text-[11px] text-white/30 mt-1 tracking-wider uppercase">CRM</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-stolzl text-[14px] transition-colors ${
                isActive(item.href)
                  ? "bg-[#3ab874] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#3ab874] flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-stolzl text-[13px] text-white font-medium truncate">{user.name}</p>
                <p className="font-stolzl text-[11px] text-white/50 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors font-stolzl text-[13px]"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M5 13H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2M10 10l3-2.5L10 5M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#ebebeb] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[#f4f4f4] transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="#02022c" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <Image src="/images/logo.png" alt="Corenet" width={64} height={37} className="object-contain" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
