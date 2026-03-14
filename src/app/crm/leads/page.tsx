"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CRMShell from "../CRMShell";
import { crmApi, type Lead, type CRMUser } from "../../lib/crmApi";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CRMUser | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    crmApi.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  async function handleDeleteLead(leadId: string) {
    setDeleting(true);
    try {
      await crmApi.leads.delete(leadId);
      load();
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <CRMShell>
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div>
            <h1 className="font-stolzl text-[20px] lg:text-[24px] font-bold text-[#02022c]">Leads</h1>
            <p className="font-stolzl text-[13px] lg:text-[14px] text-[#5c5c5c]">{total} total leads</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4 lg:mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, company, email..."
            className="flex-1 bg-white border border-[#e0e0e0] rounded-xl px-3 lg:px-4 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder:text-[#5c5c5c]/50 focus:outline-none focus:border-[#3ab874] transition-colors"
          />
          <button type="submit" className="px-4 lg:px-5 py-2.5 bg-[#3ab874] text-white font-stolzl text-[14px] rounded-xl hover:bg-[#2da062] transition-colors">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-3 lg:px-4 py-2.5 bg-[#f4f4f4] text-[#5c5c5c] font-stolzl text-[14px] rounded-xl hover:bg-[#e8e8e8] transition-colors">
              Clear
            </button>
          )}
        </form>

        <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-[#ebebeb] bg-[#f7f8fc]">
                      <th className="w-[14%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Name</th>
                      <th className="w-[11%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Company</th>
                      <th className="w-[18%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Email</th>
                      <th className="w-[10%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Phone</th>
                      <th className="w-[12%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Website</th>
                      <th className="w-[10%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Stage</th>
                      <th className="w-[11%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Assigned To</th>
                      <th className="w-[7%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Booked</th>
                      <th className="w-[7%] px-4 py-3 text-left font-stolzl text-[12px] text-[#5c5c5c] font-medium">Date</th>
                      {isAdmin && <th className="w-[4%] px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-b border-[#f4f4f4] hover:bg-[#f7f8fc] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/crm/leads/${lead.id}`} className="font-stolzl text-[13px] font-medium text-[#02022c] hover:text-[#3ab874] truncate block">
                            {lead.first_name} {lead.last_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-stolzl text-[13px] text-[#5c5c5c] truncate">{lead.company || "—"}</td>
                        <td className="px-4 py-3 font-stolzl text-[13px] text-[#5c5c5c] truncate">{lead.email}</td>
                        <td className="px-4 py-3 font-stolzl text-[13px] text-[#5c5c5c] truncate">{lead.phone || "—"}</td>
                        <td className="px-4 py-3 font-stolzl text-[13px] truncate">
                          {lead.website ? (
                            <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-[#3ab874] hover:underline">{lead.website.replace(/^https?:\/\//, "")}</a>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {lead.stage_name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-stolzl text-[11px] whitespace-nowrap" style={{ backgroundColor: `${lead.stage_color}20`, color: lead.stage_color }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: lead.stage_color }} />
                              {lead.stage_name}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 font-stolzl text-[13px] text-[#5c5c5c] truncate">{lead.assigned_to_name || "—"}</td>
                        <td className="px-4 py-3 font-stolzl text-[12px] text-[#5c5c5c]">
                          {lead.booking_date ? new Date(lead.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="px-4 py-3 font-stolzl text-[12px] text-[#5c5c5c]">
                          {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpen(menuOpen === lead.id ? null : lead.id)}
                                className="p-1.5 rounded-lg hover:bg-[#f4f4f4] transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="#5c5c5c"/><circle cx="7" cy="7" r="1" fill="#5c5c5c"/><circle cx="7" cy="11" r="1" fill="#5c5c5c"/></svg>
                              </button>
                              {menuOpen === lead.id && (
                                <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-[#ebebeb] py-1 min-w-[140px]">
                                  <button
                                    onClick={() => { setConfirmDelete(lead.id); setMenuOpen(null); }}
                                    className="w-full text-left px-4 py-2 font-stolzl text-[13px] text-[#e53e3e] hover:bg-[#f4f4f4] transition-colors"
                                  >
                                    Delete Lead
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={isAdmin ? 10 : 9} className="px-4 py-12 text-center font-stolzl text-[14px] text-[#5c5c5c]">No leads found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="lg:hidden divide-y divide-[#f4f4f4]">
                {leads.map(lead => (
                  <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f7f8fc] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#3ab874] flex items-center justify-center shrink-0">
                      <span className="font-stolzl text-[13px] font-bold text-white">{lead.first_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-stolzl text-[13px] font-medium text-[#02022c] truncate">{lead.first_name} {lead.last_name}</p>
                      <p className="font-stolzl text-[11px] text-[#5c5c5c] truncate">{lead.company || lead.email}</p>
                    </div>
                    {lead.stage_name ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-stolzl text-[10px]" style={{ backgroundColor: `${lead.stage_color}20`, color: lead.stage_color }}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: lead.stage_color }} />
                        {lead.stage_name}
                      </span>
                    ) : null}
                  </Link>
                ))}
                {leads.length === 0 && (
                  <p className="px-4 py-12 text-center font-stolzl text-[13px] text-[#5c5c5c]">No leads found</p>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-t border-[#ebebeb]">
                  <p className="font-stolzl text-[12px] lg:text-[13px] text-[#5c5c5c]">Page {page} of {totalPages}</p>
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
        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-stolzl text-[15px] font-bold text-[#02022c] mb-2">Delete Lead?</h3>
              <p className="font-stolzl text-[13px] text-[#5c5c5c] mb-5">
                This will permanently delete the lead, all activities, and cancel any associated meetings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteLead(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-white bg-[#e53e3e] rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-[#5c5c5c] bg-[#f4f4f4] rounded-xl hover:bg-[#ebebeb] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMShell>
  );
}
