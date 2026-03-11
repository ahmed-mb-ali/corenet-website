"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CRMShell from "../CRMShell";
import { crmApi, type Lead } from "../../lib/crmApi";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    crmApi.leads.list(params)
      .then(d => { setLeads(d.leads); setTotal(d.total); })
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [page, search, router]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <CRMShell>
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-stolzl text-[24px] font-bold text-[#02022c]">Leads</h1>
            <p className="font-stolzl text-[14px] text-[#5c5c5c]">{total} total leads</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, company, email..."
            className="flex-1 bg-white border border-[#e0e0e0] rounded-xl px-4 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder:text-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff] transition-colors"
          />
          <button type="submit" className="px-5 py-2.5 bg-[#335cff] text-white font-stolzl text-[14px] rounded-xl hover:bg-[#2a4fdd] transition-colors">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2.5 bg-[#f4f4f4] text-[#5c5c5c] font-stolzl text-[14px] rounded-xl hover:bg-[#e8e8e8] transition-colors">
              Clear
            </button>
          )}
        </form>

        <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-[#335cff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#ebebeb] bg-[#f7f8fc]">
                      {["Name", "Company", "Email", "Phone", "Stage", "Assigned To", "Booked", "Date"].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-b border-[#f4f4f4] hover:bg-[#f7f8fc] transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Link href={`/crm/leads/${lead.id}`} className="font-stolzl text-[14px] font-medium text-[#02022c] hover:text-[#335cff]">
                            {lead.first_name} {lead.last_name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 font-stolzl text-[14px] text-[#5c5c5c] whitespace-nowrap">{lead.company || "—"}</td>
                        <td className="px-5 py-3 font-stolzl text-[13px] text-[#5c5c5c]">{lead.email}</td>
                        <td className="px-5 py-3 font-stolzl text-[13px] text-[#5c5c5c] whitespace-nowrap">{lead.phone || "—"}</td>
                        <td className="px-5 py-3">
                          {lead.stage_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-stolzl text-[12px]" style={{ backgroundColor: `${lead.stage_color}20`, color: lead.stage_color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lead.stage_color }} />
                              {lead.stage_name}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3 font-stolzl text-[14px] text-[#5c5c5c] whitespace-nowrap">{lead.assigned_to_name || "—"}</td>
                        <td className="px-5 py-3 font-stolzl text-[13px] text-[#5c5c5c] whitespace-nowrap">
                          {lead.booking_date ? new Date(lead.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="px-5 py-3 font-stolzl text-[13px] text-[#5c5c5c] whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={8} className="px-5 py-12 text-center font-stolzl text-[14px] text-[#5c5c5c]">No leads found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-[#ebebeb]">
                  <p className="font-stolzl text-[13px] text-[#5c5c5c]">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-[#e0e0e0] font-stolzl text-[13px] disabled:opacity-40 hover:bg-[#f4f4f4] transition-colors">
                      Previous
                    </button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-[#e0e0e0] font-stolzl text-[13px] disabled:opacity-40 hover:bg-[#f4f4f4] transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </CRMShell>
  );
}
