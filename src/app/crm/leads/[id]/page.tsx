"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CRMShell from "../../CRMShell";
import { crmApi, type Lead, type Activity } from "../../../lib/crmApi";

const STAGE_COLORS: Record<string, string> = {
  "New": "#335cff",
  "Contacted": "#f59e0b",
  "Demo Scheduled": "#8b5cf6",
  "Proposal Sent": "#06b6d4",
  "Negotiation": "#f97316",
  "Closed Won": "#3ab874",
  "Closed Lost": "#e53e3e",
};

function ActivityItem({ activity }: { activity: Activity }) {
  const icons: Record<string, string> = {
    note: "📝",
    note_added: "📝",
    call: "📞",
    email: "📧",
    booking: "📅",
    booking_created: "📅",
    stage_change: "🔄",
    stage_changed: "🔄",
    created: "✨",
    lead_created: "✨",
  };

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-[#f4f4f4] flex items-center justify-center shrink-0 text-[13px]">
        {icons[activity.type] || "💬"}
      </div>
      <div className="flex-1 pb-4 border-b border-[#f4f4f4] last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-stolzl text-[13px] font-semibold text-[#02022c] capitalize">
              {activity.type.replace(/_/g, " ")}
              {activity.user_name && <span className="font-normal text-[#5c5c5c]"> by {activity.user_name}</span>}
            </p>
            {activity.note && (
              <p className="font-stolzl text-[13px] text-[#5c5c5c] mt-0.5 whitespace-pre-wrap">{activity.note}</p>
            )}
          </div>
          <span className="font-stolzl text-[11px] text-[#5c5c5c]/60 shrink-0 whitespace-nowrap">
            {new Date(activity.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    crmApi.leads.get(id)
      .then(d => { setLead(d.lead); setActivities(d.activities); })
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !lead) return;
    setSavingNote(true);
    try {
      await crmApi.leads.update(lead.id, { note: note.trim() });
      setNote("");
      // Reload activities
      const d = await crmApi.leads.get(id);
      setActivities(d.activities);
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <CRMShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#335cff] border-t-transparent rounded-full animate-spin" />
        </div>
      </CRMShell>
    );
  }

  if (!lead) {
    return (
      <CRMShell>
        <div className="p-6">
          <p className="font-stolzl text-[14px] text-[#5c5c5c]">Lead not found.</p>
          <Link href="/crm/leads" className="font-stolzl text-[14px] text-[#335cff] hover:underline mt-2 inline-block">← Back to leads</Link>
        </div>
      </CRMShell>
    );
  }

  return (
    <CRMShell>
      <div className="p-6 max-w-[900px]">
        {/* Back */}
        <Link href="/crm/leads" className="inline-flex items-center gap-1.5 font-stolzl text-[13px] text-[#5c5c5c] hover:text-[#335cff] mb-5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Leads
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Lead info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#335cff] flex items-center justify-center shrink-0">
                  <span className="font-stolzl text-[18px] font-bold text-white">
                    {lead.first_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="font-stolzl text-[16px] font-bold text-[#02022c]">
                    {lead.first_name} {lead.last_name}
                  </h1>
                  {lead.company && (
                    <p className="font-stolzl text-[13px] text-[#5c5c5c]">{lead.company}</p>
                  )}
                </div>
              </div>

              {/* Stage badge */}
              {lead.stage_name && (
                <div className="mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-stolzl text-[12px] font-medium"
                    style={{ backgroundColor: `${lead.stage_color || STAGE_COLORS[lead.stage_name] || "#335cff"}20`, color: lead.stage_color || STAGE_COLORS[lead.stage_name] || "#335cff" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lead.stage_color || STAGE_COLORS[lead.stage_name] || "#335cff" }} />
                    {lead.stage_name}
                  </span>
                </div>
              )}

              {/* Contact details */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                    <path d="M2 2h10v10H2V2zM2 5h10" stroke="#5c5c5c" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <a href={`mailto:${lead.email}`} className="font-stolzl text-[13px] text-[#335cff] hover:underline break-all">{lead.email}</a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <path d="M2 2.5C2 2 2.5 1.5 3 1.5h2l1 3-1.5 1A8 8 0 0 0 8.5 9.5L10 8l3 1v2c0 .5-.5 1-1 1C5 12 2 7 2 2.5z" stroke="#5c5c5c" strokeWidth="1.2" />
                    </svg>
                    <a href={`tel:${lead.phone}`} className="font-stolzl text-[13px] text-[#5c5c5c] hover:text-[#335cff]">{lead.phone}</a>
                  </div>
                )}
                {lead.website && (
                  <div className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <circle cx="7" cy="7" r="5.5" stroke="#5c5c5c" strokeWidth="1.2" />
                      <path d="M1.5 7h11M7 1.5c-2 2-2 9 0 11M7 1.5c2 2 2 9 0 11" stroke="#5c5c5c" strokeWidth="1.2" />
                    </svg>
                    <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="font-stolzl text-[13px] text-[#335cff] hover:underline break-all">{lead.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <circle cx="7" cy="7" r="5.5" stroke="#5c5c5c" strokeWidth="1.2" />
                    <path d="M7 4v3l2 1" stroke="#5c5c5c" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span className="font-stolzl text-[12px] text-[#5c5c5c]">
                    {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking info */}
            {lead.booking_date && (
              <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
                <h3 className="font-stolzl text-[13px] font-semibold text-[#02022c] mb-3">Meeting Booked</h3>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <rect x="1" y="2" width="12" height="11" rx="2" stroke="#335cff" strokeWidth="1.2" />
                    <path d="M4 1v2M10 1v2M1 6h12" stroke="#335cff" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span className="font-stolzl text-[13px] text-[#02022c] font-medium">
                    {new Date(lead.booking_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" })}
                  </span>
                </div>
                {lead.booking_start && (
                  <span className="font-stolzl text-[12px] text-[#5c5c5c] ml-5">{lead.booking_start}</span>
                )}
                {lead.assigned_to_name && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-[#335cff] flex items-center justify-center">
                      <span className="font-stolzl text-[9px] font-bold text-white">{lead.assigned_to_name.charAt(0)}</span>
                    </div>
                    <span className="font-stolzl text-[12px] text-[#5c5c5c]">{lead.assigned_to_name}</span>
                  </div>
                )}
                {lead.booking_status && (
                  <span className={`mt-2 inline-block font-stolzl text-[11px] rounded-full px-2 py-0.5 ${
                    lead.booking_status === "confirmed" ? "bg-green-100 text-green-700" :
                    lead.booking_status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-[#f4f4f4] text-[#5c5c5c]"
                  }`}>
                    {lead.booking_status}
                  </span>
                )}
              </div>
            )}

            {/* Message */}
            {lead.message && (
              <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
                <h3 className="font-stolzl text-[13px] font-semibold text-[#02022c] mb-2">Message</h3>
                <p className="font-stolzl text-[13px] text-[#5c5c5c] whitespace-pre-wrap">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Right: Activity feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
              <h2 className="font-stolzl text-[15px] font-bold text-[#02022c] mb-5">Activity</h2>

              {/* Add note form */}
              <form onSubmit={handleAddNote} className="mb-6">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[13px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff]/60 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={savingNote || !note.trim()}
                    className="px-4 py-2 font-stolzl text-[13px] font-semibold text-white bg-[#335cff] rounded-xl hover:bg-[#2348e0] transition-colors disabled:opacity-50"
                  >
                    {savingNote ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </form>

              {/* Timeline */}
              <div className="space-y-0">
                {activities.length === 0 ? (
                  <p className="font-stolzl text-[13px] text-[#5c5c5c] text-center py-6">No activity yet</p>
                ) : (
                  activities.map(a => <ActivityItem key={a.id} activity={a} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CRMShell>
  );
}
