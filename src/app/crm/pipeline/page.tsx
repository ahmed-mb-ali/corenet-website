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
      className="bg-white border border-[#ebebeb] rounded-xl p-3.5 hover:border-[#335cff]/40 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
    >
      <Link href={`/crm/leads/${lead.id}`}>
        <p className="font-stolzl text-[14px] font-medium text-[#02022c] mb-0.5">
          {lead.first_name} {lead.last_name}
        </p>
        <p className="font-stolzl text-[12px] text-[#5c5c5c] mb-2">{lead.company || "No company"}</p>
      </Link>
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
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<StageWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const draggedLead = useRef<Lead | null>(null);

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
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
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
            {stages.map(stage => {
              const isOver = dragOverStage === stage.id;
              return (
                <div key={stage.id} className="shrink-0 w-[240px] flex flex-col">
                  {/* Stage header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="font-stolzl text-[13px] font-semibold text-[#02022c]">{stage.name}</span>
                    <span className="ml-auto font-stolzl text-[12px] text-[#5c5c5c] bg-[#f4f4f4] rounded-full px-2 py-0.5">
                      {stage.leads.length}
                    </span>
                  </div>

                  {/* Cards / drop zone */}
                  <div
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className={`flex-1 min-h-[120px] rounded-xl p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] transition-colors ${
                      isOver
                        ? "bg-[#335cff]/10 border-2 border-dashed border-[#335cff]/40"
                        : "bg-[#f7f8fc]"
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
                      <p className="font-stolzl text-[12px] text-[#5c5c5c]/50 text-center py-6">
                        {isOver ? "Drop here" : "Empty"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CRMShell>
  );
}
