"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CRMShell from "../CRMShell";
import { crmApi, type StageWithLeads, type Lead } from "../../lib/crmApi";

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/crm/leads/${lead.id}`}>
      <div className="bg-white border border-[#ebebeb] rounded-xl p-3.5 hover:border-[#335cff]/40 hover:shadow-sm transition-all cursor-pointer">
        <p className="font-stolzl text-[14px] font-medium text-[#02022c] mb-0.5">
          {lead.first_name} {lead.last_name}
        </p>
        <p className="font-stolzl text-[12px] text-[#5c5c5c] mb-2">{lead.company || "No company"}</p>
        {lead.booking_date && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="#5c5c5c" strokeWidth="1.2"/>
              <path d="M4 1v2M8 1v2M1 5h10" stroke="#5c5c5c" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="font-stolzl text-[11px] text-[#5c5c5c]">
              {new Date(lead.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        )}
        {lead.assigned_to_name && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-4 h-4 rounded-full bg-[#335cff] flex items-center justify-center text-white font-bold text-[8px]">
              {lead.assigned_to_name.charAt(0)}
            </div>
            <span className="font-stolzl text-[11px] text-[#5c5c5c]">{lead.assigned_to_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<StageWithLeads[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmApi.pipeline.get()
      .then(d => setStages(d.stages))
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <CRMShell>
      <div className="p-6 h-full flex flex-col">
        <div className="mb-6 shrink-0">
          <h1 className="font-stolzl text-[24px] font-bold text-[#02022c]">Pipeline</h1>
          <p className="font-stolzl text-[14px] text-[#5c5c5c]">Drag leads between stages to track progress</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#335cff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {stages.map(stage => (
              <div key={stage.id} className="shrink-0 w-[240px] flex flex-col">
                {/* Stage header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="font-stolzl text-[13px] font-semibold text-[#02022c]">{stage.name}</span>
                  <span className="ml-auto font-stolzl text-[12px] text-[#5c5c5c] bg-[#f4f4f4] rounded-full px-2 py-0.5">
                    {stage.leads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 min-h-[120px] bg-[#f7f8fc] rounded-xl p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]">
                  {stage.leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  {stage.leads.length === 0 && (
                    <p className="font-stolzl text-[12px] text-[#5c5c5c]/50 text-center py-6">Empty</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CRMShell>
  );
}
