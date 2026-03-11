"use client";

import { useState, useEffect, useRef, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CRMShell from "../CRMShell";
import { crmApi, type StageWithLeads, type Lead } from "../../lib/crmApi";

interface LeadCardProps {
  lead: Lead;
  onDragStart: (e: DragEvent, lead: Lead) => void;
  onDragEnd: (e: DragEvent) => void;
}

function LeadCard({ lead, onDragStart, onDragEnd }: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      className="group bg-white rounded-xl p-3 border border-[#e8e8ee] hover:border-[#335cff]/30 hover:shadow-[0_2px_8px_rgba(51,92,255,0.08)] transition-all cursor-grab active:cursor-grabbing active:shadow-lg"
    >
      <Link href={`/crm/leads/${lead.id}`} className="block">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-stolzl text-[13px] font-semibold text-[#02022c] leading-tight group-hover:text-[#335cff] transition-colors">
            {lead.first_name} {lead.last_name}
          </p>
        </div>
        <p className="font-stolzl text-[11px] text-[#8b8b9e] leading-snug">{lead.company || "—"}</p>
      </Link>

      <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[#f0f0f5]">
        {lead.booking_date && (
          <div className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="#a0a0b8" strokeWidth="1.1"/>
              <path d="M4 1v2M8 1v2M1 5h10" stroke="#a0a0b8" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            <span className="font-stolzl text-[10px] text-[#8b8b9e]">
              {new Date(lead.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        )}
        {lead.assigned_to_name && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-[18px] h-[18px] rounded-full bg-[#335cff] flex items-center justify-center text-white font-bold text-[8px] shrink-0">
              {lead.assigned_to_name.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<StageWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const draggedLead = useRef<Lead | null>(null);

  const totalLeads = stages.reduce((sum, s) => sum + s.leads.length, 0);

  useEffect(() => {
    crmApi.pipeline.get()
      .then(d => setStages(d.stages))
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleDragStart(e: DragEvent, lead: Lead) {
    draggedLead.current = lead;
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.4";
      e.currentTarget.style.transform = "scale(0.97)";
    }
  }

  function handleDragEnd(e: DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
      e.currentTarget.style.transform = "scale(1)";
    }
    setDragOverStage(null);
    draggedLead.current = null;
  }

  function handleDragOver(e: DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }

  function handleDragLeave(e: DragEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverStage(null);
    }
  }

  async function handleDrop(e: DragEvent, targetStageId: string) {
    e.preventDefault();
    setDragOverStage(null);

    const lead = draggedLead.current;
    if (!lead || lead.stage_id === targetStageId) return;

    const oldStageId = lead.stage_id;

    setStages(prev => prev.map(stage => {
      if (stage.id === oldStageId) {
        return { ...stage, leads: stage.leads.filter(l => l.id !== lead.id) };
      }
      if (stage.id === targetStageId) {
        return { ...stage, leads: [...stage.leads, { ...lead, stage_id: targetStageId }] };
      }
      return stage;
    }));

    try {
      await crmApi.leads.update(lead.id, { stage_id: targetStageId });
    } catch {
      setStages(prev => prev.map(stage => {
        if (stage.id === targetStageId) {
          return { ...stage, leads: stage.leads.filter(l => l.id !== lead.id) };
        }
        if (stage.id === oldStageId) {
          return { ...stage, leads: [...stage.leads, lead] };
        }
        return stage;
      }));
    }
  }

  return (
    <CRMShell>
      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="px-6 pt-5 pb-4 border-b border-[#ebebeb] bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-stolzl text-[20px] font-bold text-[#02022c]">Pipeline</h1>
              <p className="font-stolzl text-[13px] text-[#8b8b9e] mt-0.5">
                {totalLeads} lead{totalLeads !== 1 ? "s" : ""} across {stages.length} stages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-stolzl text-[11px] text-[#8b8b9e] bg-[#f4f4f7] rounded-lg px-3 py-1.5">
                Drag cards to move
              </span>
            </div>
          </div>
        </div>

        {/* Board */}
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-[#335cff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 p-4 h-full min-w-max">
              {stages.map(stage => {
                const isOver = dragOverStage === stage.id;
                return (
                  <div
                    key={stage.id}
                    className="w-[260px] flex flex-col shrink-0 h-full"
                  >
                    {/* Column header */}
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="font-stolzl text-[12px] font-semibold text-[#02022c] uppercase tracking-wide">
                        {stage.name}
                      </span>
                      <span className="font-stolzl text-[11px] font-medium text-[#8b8b9e] bg-[#f0f0f5] rounded-md px-1.5 py-0.5 min-w-[20px] text-center">
                        {stage.leads.length}
                      </span>
                    </div>

                    {/* Column body / drop zone */}
                    <div
                      onDragOver={(e) => handleDragOver(e, stage.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stage.id)}
                      className={`flex-1 rounded-xl p-2 space-y-2 overflow-y-auto transition-all ${
                        isOver
                          ? "bg-[#335cff]/8 ring-2 ring-[#335cff]/25 ring-inset"
                          : "bg-[#f4f4f7]/60"
                      }`}
                    >
                      {stage.leads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                      {stage.leads.length === 0 && (
                        <div className={`flex flex-col items-center justify-center py-10 rounded-lg border border-dashed transition-colors ${
                          isOver ? "border-[#335cff]/40 bg-[#335cff]/5" : "border-[#e0e0e8]"
                        }`}>
                          {isOver ? (
                            <p className="font-stolzl text-[12px] text-[#335cff] font-medium">Drop here</p>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mb-1.5 opacity-30">
                                <rect x="2" y="4" width="16" height="12" rx="2" stroke="#8b8b9e" strokeWidth="1.3"/>
                                <path d="M7 10h6M10 7v6" stroke="#8b8b9e" strokeWidth="1.3" strokeLinecap="round"/>
                              </svg>
                              <p className="font-stolzl text-[11px] text-[#8b8b9e]/60">No leads</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CRMShell>
  );
}
