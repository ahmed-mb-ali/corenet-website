"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CRMShell from "../../CRMShell";
import { crmApi, type Lead, type Activity, type Stage, type CRMUser } from "../../../lib/crmApi";

const STAGE_COLORS: Record<string, string> = {
  "New":             "#3ab874",
  "Contacted":       "#8b5cf6",
  "Qualified":       "#06b6d4",
  "Proposal":        "#f59e0b",
  "Won":             "#10b981",
  "Lost":            "#ef4444",
};

function formatTime12h(raw: string) {
  if (!raw) return "";
  const parts = raw.split(":");
  const h = parseInt(parts[0]), m = parts[1];
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}

function relativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  note_added:          { icon: "📝", color: "#8b5cf6", bg: "#8b5cf620" },
  note:                { icon: "📝", color: "#8b5cf6", bg: "#8b5cf620" },
  call:                { icon: "📞", color: "#06b6d4", bg: "#06b6d420" },
  email:               { icon: "📧", color: "#3ab874", bg: "#3ab87420" },
  booking_created:     { icon: "📅", color: "#3ab874", bg: "#3ab87420" },
  booking:             { icon: "📅", color: "#3ab874", bg: "#3ab87420" },
  booking_cancelled:   { icon: "❌", color: "#e53e3e", bg: "#e53e3e20" },
  booking_rescheduled: { icon: "🔄", color: "#f59e0b", bg: "#f59e0b20" },
  stage_changed:       { icon: "📊", color: "#06b6d4", bg: "#06b6d420" },
  stage_change:        { icon: "📊", color: "#06b6d4", bg: "#06b6d420" },
  created:             { icon: "✨", color: "#3ab874", bg: "#3ab87420" },
  lead_created:        { icon: "✨", color: "#3ab874", bg: "#3ab87420" },
};

function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const cfg = ACTIVITY_CONFIG[activity.type] || { icon: "💬", color: "#5c5c5c", bg: "#f4f4f4" };

  return (
    <div className="flex gap-3.5 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[14px] top-[32px] bottom-0 w-[1.5px] bg-[#ebebeb]" />
      )}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[13px] z-10 relative"
        style={{ backgroundColor: cfg.bg }}
      >
        {cfg.icon}
      </div>
      <div className={`flex-1 ${isLast ? "" : "pb-5"}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-stolzl text-[13px] font-semibold text-[#02022c] capitalize">
              {activity.type.replace(/_/g, " ")}
              {activity.user_name && <span className="font-normal text-[#5c5c5c]"> by {activity.user_name}</span>}
            </p>
            {activity.note && (
              <p className="font-stolzl text-[13px] text-[#5c5c5c] mt-0.5 whitespace-pre-wrap leading-relaxed">{activity.note}</p>
            )}
          </div>
          <span className="font-stolzl text-[11px] text-[#5c5c5c]/50 shrink-0 whitespace-nowrap mt-0.5">
            {relativeTime(activity.created_at)}
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
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [user, setUser] = useState<CRMUser | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", company: "", website: "", stage_id: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Booking actions
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);

  useEffect(() => {
    Promise.all([
      crmApi.leads.get(id),
      crmApi.pipeline.get(),
      crmApi.me(),
    ])
      .then(([d, p, u]) => {
        setLead(d.lead);
        setActivities(d.activities);
        setStages(p.stages);
        setUser(u);
      })
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const isAdmin = user?.role === "admin";

  function startEditing() {
    if (!lead) return;
    setEditForm({
      first_name: lead.first_name,
      last_name: lead.last_name || "",
      email: lead.email,
      phone: lead.phone || "",
      company: lead.company || "",
      website: lead.website || "",
      stage_id: lead.stage_id || "",
    });
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!lead) return;
    setSavingEdit(true);
    try {
      await crmApi.leads.update(lead.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
        company: editForm.company,
        website: editForm.website,
        stage_id: editForm.stage_id,
      });
      const d = await crmApi.leads.get(id);
      setLead(d.lead);
      setActivities(d.activities);
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCancelBooking() {
    if (!lead?.booking_id) return;
    setCancellingBooking(true);
    try {
      await crmApi.bookings.cancel(lead.booking_id);
      const d = await crmApi.leads.get(id);
      setLead(d.lead);
      setActivities(d.activities);
      setShowCancelConfirm(false);
    } finally {
      setCancellingBooking(false);
    }
  }

  async function openReschedule() {
    setShowReschedule(true);
    setRescheduleDate("");
    setRescheduleTime("");
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/booking/availability?month=${month}`);
      const data = await res.json();
      setAvailableSlots(data.slots || {});
    } catch { /* ignore */ }
  }

  async function loadMonthSlots(monthStr: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/booking/availability?month=${monthStr}`);
      const data = await res.json();
      setAvailableSlots(prev => ({ ...prev, ...(data.slots || {}) }));
    } catch { /* ignore */ }
  }

  async function handleReschedule() {
    if (!lead?.booking_id || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      await crmApi.bookings.reschedule(lead.booking_id, rescheduleDate, rescheduleTime);
      const d = await crmApi.leads.get(id);
      setLead(d.lead);
      setActivities(d.activities);
      setShowReschedule(false);
    } finally {
      setRescheduling(false);
    }
  }

  async function handleDeleteLead() {
    if (!lead) return;
    setDeletingLead(true);
    try {
      await crmApi.leads.delete(lead.id);
      router.push("/crm/leads");
    } finally {
      setDeletingLead(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !lead) return;
    setSavingNote(true);
    try {
      await crmApi.leads.update(lead.id, { note: note.trim() });
      setNote("");
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
          <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
        </div>
      </CRMShell>
    );
  }

  if (!lead) {
    return (
      <CRMShell>
        <div className="p-6">
          <p className="font-stolzl text-[14px] text-[#5c5c5c]">Lead not found.</p>
          <Link href="/crm/leads" className="font-stolzl text-[14px] text-[#3ab874] hover:underline mt-2 inline-block">← Back to leads</Link>
        </div>
      </CRMShell>
    );
  }

  const stageColor = lead.stage_color || STAGE_COLORS[lead.stage_name || ""] || "#3ab874";
  const bookingPast = lead.booking_date ? new Date(lead.booking_date) < new Date(new Date().toDateString()) : false;

  return (
    <CRMShell>
      <div className="p-4 lg:p-6 max-w-[1100px]">
        {/* Top bar: breadcrumb + actions */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/crm/leads" className="font-stolzl text-[13px] text-[#5c5c5c] hover:text-[#3ab874] transition-colors shrink-0">
              Leads
            </Link>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[#d0d0d0]">
              <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-stolzl text-[13px] text-[#02022c] font-medium truncate">
              {lead.first_name} {lead.last_name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={startEditing}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f4f4f4] hover:bg-[#ebebeb] text-[#5c5c5c] transition-colors"
              title="Edit lead"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 1.5l2 2L4.5 11.5l-3 1 1-3 8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8.5 3.5l2 2" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f4f4f4] hover:bg-red-50 hover:text-[#e53e3e] text-[#5c5c5c] transition-colors"
                title="Delete lead"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M11 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* Left: Lead info */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden">
              {editing ? (
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-stolzl text-[14px] font-bold text-[#02022c]">Edit Lead</h3>
                    <button onClick={() => setEditing(false)} className="font-stolzl text-[12px] text-[#5c5c5c] hover:text-[#e53e3e] transition-colors">Cancel</button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">First Name</label>
                      <input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60" />
                    </div>
                    <div>
                      <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">Last Name</label>
                      <input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60" />
                    </div>
                  </div>

                  <div>
                    <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60" />
                  </div>
                  <div>
                    <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60" />
                  </div>
                  <div>
                    <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">Company</label>
                    <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60" />
                  </div>
                  <div>
                    <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">Website</label>
                    <input value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] placeholder-[#5c5c5c]/40 focus:outline-none focus:border-[#3ab874]/60" />
                  </div>
                  <div>
                    <label className="font-stolzl text-[11px] font-semibold text-[#5c5c5c] mb-1 block">Stage</label>
                    <select value={editForm.stage_id} onChange={e => setEditForm(f => ({ ...f, stage_id: e.target.value }))} className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60 bg-white">
                      <option value="">— None —</option>
                      {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit || !editForm.first_name.trim() || !editForm.email.trim()}
                    className="w-full mt-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-white bg-[#3ab874] rounded-xl hover:bg-[#2da062] transition-colors disabled:opacity-50"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <>
                  {/* Profile header with colored accent */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: stageColor }} />
                  <div className="p-5">
                    <div className="flex items-start gap-3.5 mb-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${stageColor}18` }}
                      >
                        <span className="font-stolzl text-[20px] font-bold" style={{ color: stageColor }}>
                          {lead.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h1 className="font-stolzl text-[17px] font-bold text-[#02022c] leading-tight">
                          {lead.first_name} {lead.last_name}
                        </h1>
                        {lead.company && (
                          <p className="font-stolzl text-[13px] text-[#5c5c5c] mt-0.5">{lead.company}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {lead.stage_name && (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-stolzl text-[11px] font-medium"
                              style={{ backgroundColor: `${stageColor}15`, color: stageColor }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageColor }} />
                              {lead.stage_name}
                            </span>
                          )}
                          {lead.source && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-stolzl text-[10px] font-medium bg-[#f4f4f4] text-[#5c5c5c]">
                              {lead.source === "booking_widget" ? "Booking Widget" : lead.source.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-[#f4f4f4]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#f4f4f4] flex items-center justify-center shrink-0">
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="#5c5c5c" strokeWidth="1.2"/><path d="M1 4.5l6 4 6-4" stroke="#5c5c5c" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        </div>
                        <a href={`mailto:${lead.email}`} className="font-stolzl text-[13px] text-[#3ab874] hover:underline break-all">{lead.email}</a>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#f4f4f4] flex items-center justify-center shrink-0">
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2.5C2 2 2.5 1.5 3 1.5h2l1 3-1.5 1A8 8 0 0 0 8.5 9.5L10 8l3 1v2c0 .5-.5 1-1 1C5 12 2 7 2 2.5z" stroke="#5c5c5c" strokeWidth="1.2"/></svg>
                          </div>
                          <a href={`tel:${lead.phone}`} className="font-stolzl text-[13px] text-[#5c5c5c] hover:text-[#3ab874]">{lead.phone}</a>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#f4f4f4] flex items-center justify-center shrink-0">
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#5c5c5c" strokeWidth="1.2"/><path d="M1.5 7h11M7 1.5c-2 2-2 9 0 11M7 1.5c2 2 2 9 0 11" stroke="#5c5c5c" strokeWidth="1.2"/></svg>
                          </div>
                          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="font-stolzl text-[13px] text-[#3ab874] hover:underline break-all">{lead.website.replace(/^https?:\/\//, "")}</a>
                        </div>
                      )}
                    </div>

                    {/* Assigned & Created */}
                    <div className="mt-4 pt-4 border-t border-[#f4f4f4] space-y-2.5">
                      {lead.assigned_to_name && (
                        <div className="flex items-center justify-between">
                          <span className="font-stolzl text-[11px] text-[#5c5c5c]/70 uppercase tracking-wider">Assigned</span>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#3ab874] flex items-center justify-center">
                              <span className="font-stolzl text-[9px] font-bold text-white">{lead.assigned_to_name.charAt(0)}</span>
                            </div>
                            <span className="font-stolzl text-[12px] text-[#02022c] font-medium">{lead.assigned_to_name}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-stolzl text-[11px] text-[#5c5c5c]/70 uppercase tracking-wider">Created</span>
                        <span className="font-stolzl text-[12px] text-[#5c5c5c]">
                          {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Booking info */}
            {lead.booking_date && (
              <div className="bg-white rounded-2xl border border-[#ebebeb] overflow-hidden">
                <div className={`px-5 py-3.5 flex items-center justify-between ${
                  lead.booking_status === "cancelled" ? "bg-red-50" :
                  bookingPast ? "bg-[#f4f4f4]" : "bg-[#0f3d2e]"
                }`}>
                  <h3 className={`font-stolzl text-[13px] font-semibold ${
                    lead.booking_status === "cancelled" ? "text-red-700" :
                    bookingPast ? "text-[#5c5c5c]" : "text-white"
                  }`}>
                    {lead.booking_status === "cancelled" ? "Meeting Cancelled" :
                     bookingPast ? "Past Meeting" : "Upcoming Meeting"}
                  </h3>
                  {lead.booking_status && (
                    <span className={`font-stolzl text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide ${
                      lead.booking_status === "confirmed" ? "bg-white/20 text-white" :
                      lead.booking_status === "cancelled" ? "bg-red-200 text-red-700" :
                      "bg-white/20 text-white/70"
                    }`}>
                      {lead.booking_status}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      lead.booking_status === "cancelled" ? "bg-red-50" : "bg-[#3ab874]/10"
                    }`}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="2" y="3" width="14" height="13" rx="2" stroke={lead.booking_status === "cancelled" ? "#e53e3e" : "#3ab874"} strokeWidth="1.4"/>
                        <path d="M5 1v3M13 1v3M2 8h14" stroke={lead.booking_status === "cancelled" ? "#e53e3e" : "#3ab874"} strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className={`font-stolzl text-[14px] font-semibold ${lead.booking_status === "cancelled" ? "text-[#5c5c5c] line-through" : "text-[#02022c]"}`}>
                        {new Date(lead.booking_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      {lead.booking_start && (
                        <p className={`font-stolzl text-[13px] ${lead.booking_status === "cancelled" ? "text-[#5c5c5c]/60 line-through" : "text-[#5c5c5c]"}`}>
                          {formatTime12h(lead.booking_start)} (AST)
                        </p>
                      )}
                    </div>
                  </div>

                  {lead.google_meet_url && lead.booking_status !== "cancelled" && (
                    <a
                      href={lead.google_meet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2.5 bg-[#0f3d2e] text-white font-stolzl text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0a2e22] transition-colors w-full justify-center"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      Join Google Meet
                    </a>
                  )}

                  {/* Cancel / Reschedule buttons */}
                  {lead.booking_id && lead.booking_status !== "cancelled" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[#ebebeb]">
                      <button
                        onClick={openReschedule}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-stolzl text-[12px] font-semibold text-[#f59e0b] bg-[#f59e0b]/10 rounded-xl hover:bg-[#f59e0b]/20 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 7a6 6 0 1 1 1.5 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1 11V8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Reschedule
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-stolzl text-[12px] font-semibold text-[#e53e3e] bg-[#e53e3e]/10 rounded-xl hover:bg-[#e53e3e]/20 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M11 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Cancel confirmation dialog */}
                  {showCancelConfirm && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                      <p className="font-stolzl text-[12px] text-red-700 mb-3">
                        Cancel this meeting? The calendar event will be deleted and the client will be notified.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelBooking}
                          disabled={cancellingBooking}
                          className="flex-1 px-3 py-2 font-stolzl text-[12px] font-semibold text-white bg-[#e53e3e] rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {cancellingBooking ? "Cancelling..." : "Yes, Cancel"}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 px-3 py-2 font-stolzl text-[12px] font-semibold text-[#5c5c5c] bg-white border border-[#ebebeb] rounded-lg hover:bg-[#f4f4f4] transition-colors"
                        >
                          Keep Meeting
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reschedule modal */}
                  {showReschedule && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="font-stolzl text-[12px] font-semibold text-amber-700 mb-3">Reschedule Meeting</p>
                      <div className="space-y-2">
                        <div>
                          <label className="font-stolzl text-[11px] text-[#5c5c5c] mb-1 block">Date</label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={e => {
                              setRescheduleDate(e.target.value);
                              setRescheduleTime("");
                              if (e.target.value) {
                                const month = e.target.value.substring(0, 7);
                                if (!availableSlots[e.target.value]) {
                                  loadMonthSlots(month);
                                }
                              }
                            }}
                            className="w-full border border-[#ebebeb] rounded-lg px-3 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        {rescheduleDate && availableSlots[rescheduleDate] && (
                          <div>
                            <label className="font-stolzl text-[11px] text-[#5c5c5c] mb-1 block">Time</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {availableSlots[rescheduleDate].map(slot => (
                                <button
                                  key={slot}
                                  onClick={() => setRescheduleTime(slot)}
                                  className={`px-2 py-1.5 rounded-lg font-stolzl text-[12px] border transition-colors ${
                                    rescheduleTime === slot
                                      ? "bg-amber-500 text-white border-amber-500"
                                      : "bg-white text-[#02022c] border-[#ebebeb] hover:border-amber-400"
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {rescheduleDate && !availableSlots[rescheduleDate] && (
                          <p className="font-stolzl text-[12px] text-[#5c5c5c]">No available slots on this date</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleReschedule}
                            disabled={rescheduling || !rescheduleDate || !rescheduleTime}
                            className="flex-1 px-3 py-2 font-stolzl text-[12px] font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                          >
                            {rescheduling ? "Rescheduling..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setShowReschedule(false)}
                            className="flex-1 px-3 py-2 font-stolzl text-[12px] font-semibold text-[#5c5c5c] bg-white border border-[#ebebeb] rounded-lg hover:bg-[#f4f4f4] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            {lead.message && (
              <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
                <h3 className="font-stolzl text-[12px] font-semibold text-[#5c5c5c]/70 uppercase tracking-wider mb-2">Message</h3>
                <p className="font-stolzl text-[13px] text-[#02022c] whitespace-pre-wrap leading-relaxed">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Right: Activity feed */}
          <div>
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-stolzl text-[15px] font-bold text-[#02022c]">Activity</h2>
                <span className="font-stolzl text-[12px] text-[#5c5c5c]/60">{activities.length} event{activities.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Add note form */}
              <form onSubmit={handleAddNote} className="mb-6">
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[13px] text-[#02022c] placeholder-[#5c5c5c]/40 focus:outline-none focus:border-[#3ab874]/60 resize-none pr-20"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !note.trim()}
                    className="absolute right-2 bottom-2 px-3.5 py-1.5 font-stolzl text-[12px] font-semibold text-white bg-[#3ab874] rounded-lg hover:bg-[#2da062] transition-colors disabled:opacity-40"
                  >
                    {savingNote ? "..." : "Add"}
                  </button>
                </div>
              </form>

              {/* Timeline */}
              <div>
                {activities.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-[#f4f4f4] flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="#d0d0d0" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <p className="font-stolzl text-[13px] text-[#5c5c5c]/60">No activity yet</p>
                    <p className="font-stolzl text-[11px] text-[#5c5c5c]/40 mt-0.5">Add a note to get started</p>
                  </div>
                ) : (
                  activities.map((a, i) => (
                    <ActivityItem key={a.id} activity={a} isLast={i === activities.length - 1} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-stolzl text-[15px] font-bold text-[#02022c] mb-2">Delete Lead?</h3>
              <p className="font-stolzl text-[13px] text-[#5c5c5c] mb-5">
                This will permanently delete <strong>{lead.first_name} {lead.last_name}</strong>, all activities, and cancel any associated meetings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteLead}
                  disabled={deletingLead}
                  className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-white bg-[#e53e3e] rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deletingLead ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
