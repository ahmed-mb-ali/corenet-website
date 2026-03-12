"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CRMShell from "./CRMShell";
import { crmApi, type Lead } from "../lib/crmApi";

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#ebebeb]">
      <p className="font-stolzl text-[13px] text-[#5c5c5c] mb-1">{label}</p>
      <p className={`font-stolzl text-[32px] font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function CRMDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmApi.leads.list({ limit: 100 })
      .then(d => setLeads(d.leads))
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const total = leads.length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = leads.filter(l => l.booking_date?.startsWith(todayStr)).length;
  const recent = leads.slice(0, 8);

  return (
    <CRMShell>
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="font-stolzl text-[24px] font-bold text-[#02022c]">Dashboard</h1>
          <p className="font-stolzl text-[14px] text-[#5c5c5c]">Welcome back. Here&apos;s what&apos;s happening.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Leads" value={total} color="text-[#02022c]" />
              <StatCard label="New Leads" value={newLeads} color="text-[#3ab874]" />
              <StatCard label="Today's Meetings" value={todayBookings} color="text-[#3ab874]" />
              <StatCard label="This Month" value={leads.filter(l => l.created_at?.startsWith(new Date().toISOString().slice(0,7))).length} color="text-[#f59e0b]" />
            </div>

            <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#ebebeb]">
                <h2 className="font-stolzl text-[16px] font-semibold text-[#02022c]">Recent Leads</h2>
                <Link href="/crm/leads" className="font-stolzl text-[13px] text-[#3ab874] hover:underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#ebebeb]">
                      {["Name", "Company", "Status", "Assigned To", "Booked"].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(lead => (
                      <tr key={lead.id} className="border-b border-[#f4f4f4] hover:bg-[#f7f8fc] transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/crm/leads/${lead.id}`} className="font-stolzl text-[14px] font-medium text-[#02022c] hover:text-[#3ab874]">
                            {lead.first_name} {lead.last_name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 font-stolzl text-[14px] text-[#5c5c5c]">{lead.company || "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-stolzl text-[12px] font-medium ${lead.status === "new" ? "bg-[#3ab874]/10 text-[#3ab874]" : "bg-[#f4f4f4] text-[#5c5c5c]"}`}>
                            {lead.stage_name || lead.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-stolzl text-[14px] text-[#5c5c5c]">{lead.assigned_to_name || "—"}</td>
                        <td className="px-5 py-3 font-stolzl text-[13px] text-[#5c5c5c]">
                          {lead.booking_date ? new Date(lead.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </td>
                      </tr>
                    ))}
                    {recent.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-10 text-center font-stolzl text-[14px] text-[#5c5c5c]">No leads yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </CRMShell>
  );
}
