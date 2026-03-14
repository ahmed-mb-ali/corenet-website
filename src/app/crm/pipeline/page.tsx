"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CRMShell from "../CRMShell";
import { crmApi, type StageWithLeads, type Lead, type CRMUser } from "../../lib/crmApi";

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<StageWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string | null>(null); // null = "All"
  const [movingLead, setMovingLead] = useState<string | null>(null);
  const [user, setUser] = useState<CRMUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      crmApi.pipeline.get(),
      crmApi.me(),
    ])
      .then(([d, u]) => { setStages(d.stages); setUser(u); })
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const allLeads = stages.flatMap(s => s.leads.map(l => ({ ...l, _stageName: s.name, _stageColor: s.color })));
  const totalLeads = allLeads.length;
  const filteredLeads = activeStage
    ? allLeads.filter(l => l.stage_id === activeStage)
    : allLeads;

  const activeLabel = activeStage
    ? stages.find(s => s.id === activeStage)?.name || "All"
    : "All";

  async function handleDeleteLead(leadId: string) {
    setDeleting(true);
    try {
      await crmApi.leads.delete(leadId);
      const d = await crmApi.pipeline.get();
      setStages(d.stages);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const isAdmin = user?.role === "admin";

  async function moveToStage(lead: Lead & { _stageName: string; _stageColor: string }, targetStageId: string) {
    if (lead.stage_id === targetStageId) return;
    setMovingLead(lead.id);
    try {
      await crmApi.leads.update(lead.id, { stage_id: targetStageId });
      // Reload pipeline
      const d = await crmApi.pipeline.get();
      setStages(d.stages);
    } finally {
      setMovingLead(null);
    }
  }

  return (
    <CRMShell>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 lg:mb-6">
          <h1 className="font-stolzl text-[20px] lg:text-[24px] font-bold text-[#02022c]">Pipeline</h1>
          <p className="font-stolzl text-[13px] lg:text-[14px] text-[#5c5c5c]">
            {totalLeads} total lead{totalLeads !== 1 ? "s" : ""} across {stages.length} stages
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Funnel stages */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-3 lg:p-4 mb-4 lg:mb-5">
              <div className="flex items-center gap-1 overflow-x-auto lg:flex-wrap no-scrollbar">
                {/* All button */}
                <button
                  onClick={() => setActiveStage(null)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-stolzl text-[13px] font-medium transition-all ${
                    activeStage === null
                      ? "bg-[#02022c] text-white"
                      : "text-[#5c5c5c] hover:bg-[#f4f4f4]"
                  }`}
                >
                  All
                  <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${
                    activeStage === null ? "bg-white/20" : "bg-[#f4f4f4]"
                  }`}>
                    {totalLeads}
                  </span>
                </button>

                {stages.map((stage, i) => (
                  <div key={stage.id} className="flex items-center">
                    {/* Arrow separator */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mx-0.5 text-[#e0e0e0]">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <button
                      onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-stolzl text-[13px] font-medium transition-all ${
                        activeStage === stage.id
                          ? "text-white"
                          : "text-[#5c5c5c] hover:bg-[#f4f4f4]"
                      }`}
                      style={activeStage === stage.id ? { backgroundColor: stage.color } : undefined}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: activeStage === stage.id ? "white" : stage.color }}
                      />
                      {stage.name}
                      {stage.leads.length > 0 && (
                        <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${
                          activeStage === stage.id ? "bg-white/20" : "bg-[#f4f4f4]"
                        }`}>
                          {stage.leads.length}
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads table */}
            <div className="bg-white rounded-2xl border border-[#ebebeb]">
              <div className="px-4 lg:px-5 py-3 lg:py-3.5 border-b border-[#f4f4f4] flex items-center justify-between">
                <h2 className="font-stolzl text-[14px] font-semibold text-[#02022c]">
                  {activeLabel} {activeStage ? `(${filteredLeads.length})` : ""}
                </h2>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-stolzl text-[13px] text-[#5c5c5c]/60">No leads in this stage</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#f4f4f4]">
                          {["Name", "Company", "Stage", "Assigned To", "Date", "Move to", ...(isAdmin ? [""] : [])].map((h, i) => (
                            <th key={i} className="px-5 py-3 text-left font-stolzl text-[11px] font-semibold text-[#5c5c5c] uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => (
                          <tr key={lead.id} className="border-b border-[#f4f4f4] last:border-0 hover:bg-[#fafbfd] transition-colors">
                            <td className="px-5 py-3.5">
                              <Link href={`/crm/leads/${lead.id}`} className="font-stolzl text-[13px] font-medium text-[#02022c] hover:text-[#3ab874] transition-colors">
                                {lead.first_name} {lead.last_name}
                              </Link>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-stolzl text-[13px] text-[#5c5c5c]">{lead.company || "—"}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-stolzl text-[11px] font-medium"
                                style={{ backgroundColor: `${lead._stageColor}15`, color: lead._stageColor }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lead._stageColor }} />
                                {lead._stageName}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {lead.assigned_to_name ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-[#3ab874] flex items-center justify-center">
                                    <span className="font-stolzl text-[9px] font-bold text-white">{lead.assigned_to_name.charAt(0)}</span>
                                  </div>
                                  <span className="font-stolzl text-[13px] text-[#5c5c5c]">{lead.assigned_to_name}</span>
                                </div>
                              ) : (
                                <span className="font-stolzl text-[13px] text-[#5c5c5c]/40">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-stolzl text-[12px] text-[#5c5c5c]">
                                {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <select
                                value={lead.stage_id || ""}
                                onChange={e => moveToStage(lead, e.target.value)}
                                disabled={movingLead === lead.id}
                                className="border border-[#ebebeb] rounded-lg px-2.5 py-1.5 font-stolzl text-[12px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60 bg-white disabled:opacity-50 cursor-pointer"
                              >
                                {stages.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            {isAdmin && (
                              <td className="px-5 py-3.5">
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
                                        onClick={() => { router.push(`/crm/leads/${lead.id}`); setMenuOpen(null); }}
                                        className="w-full text-left px-4 py-2 font-stolzl text-[13px] text-[#02022c] hover:bg-[#f4f4f4] transition-colors"
                                      >
                                        View Lead
                                      </button>
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
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="lg:hidden divide-y divide-[#f4f4f4]">
                    {filteredLeads.map(lead => (
                      <div key={lead.id} className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${lead._stageColor}20` }}>
                            <span className="font-stolzl text-[12px] font-bold" style={{ color: lead._stageColor }}>{lead.first_name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/crm/leads/${lead.id}`} className="font-stolzl text-[13px] font-medium text-[#02022c] truncate block">
                              {lead.first_name} {lead.last_name}
                            </Link>
                            <p className="font-stolzl text-[11px] text-[#5c5c5c] truncate">{lead.company || "—"}</p>
                          </div>
                          <span
                            className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-stolzl text-[10px] font-medium"
                            style={{ backgroundColor: `${lead._stageColor}15`, color: lead._stageColor }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: lead._stageColor }} />
                            {lead._stageName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-11">
                          <select
                            value={lead.stage_id || ""}
                            onChange={e => moveToStage(lead, e.target.value)}
                            disabled={movingLead === lead.id}
                            className="flex-1 border border-[#ebebeb] rounded-lg px-2.5 py-1.5 font-stolzl text-[12px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60 bg-white disabled:opacity-50"
                          >
                            {stages.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <span className="font-stolzl text-[11px] text-[#5c5c5c] shrink-0">
                            {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

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
