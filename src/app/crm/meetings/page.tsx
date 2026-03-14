"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CRMShell from "../CRMShell";
import { crmApi, type Meeting } from "../../lib/crmApi";

type FilterTab = "all" | "upcoming" | "cancelled";

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const data = await crmApi.bookings.list();
      setMeetings(data.meetings);
    } catch {
      router.push("/crm/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    setCancelling(true);
    try {
      await crmApi.bookings.cancel(id);
      await loadMeetings();
      setConfirmCancel(null);
    } finally {
      setCancelling(false);
    }
  }

  async function openReschedule(id: string) {
    setRescheduleId(id);
    setRescheduleDate("");
    setRescheduleTime("");
    setActionId(null);
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
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      await crmApi.bookings.reschedule(rescheduleId, rescheduleDate, rescheduleTime);
      await loadMeetings();
      setRescheduleId(null);
    } finally {
      setRescheduling(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const filtered = meetings.filter(m => {
    if (tab === "upcoming") return m.status !== "cancelled" && m.date >= today;
    if (tab === "cancelled") return m.status === "cancelled";
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "cancelled", label: "Cancelled" },
  ];

  if (loading) {
    return (
      <CRMShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
        </div>
      </CRMShell>
    );
  }

  return (
    <CRMShell>
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-stolzl text-[18px] lg:text-[22px] font-bold text-[#02022c]">Meetings</h1>
          <span className="font-stolzl text-[13px] text-[#5c5c5c]">{filtered.length} meeting{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 bg-[#f4f4f4] rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg font-stolzl text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-[#02022c] shadow-sm"
                  : "text-[#5c5c5c] hover:text-[#02022c]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-2xl border border-[#ebebeb] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                <th className="text-left px-5 py-3.5 font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3.5 font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider">Time</th>
                <th className="text-left px-5 py-3.5 font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider">Rep</th>
                <th className="text-left px-5 py-3.5 font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider">Meet</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center font-stolzl text-[14px] text-[#5c5c5c]">No meetings found</td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr
                    key={m.id}
                    className="border-b border-[#ebebeb] last:border-0 hover:bg-[#f7f8fc] transition-colors cursor-pointer"
                    onClick={() => router.push(`/crm/leads/${m.lead_id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-stolzl text-[13px] font-semibold text-[#02022c]">{m.client_name}</p>
                      <p className="font-stolzl text-[11px] text-[#5c5c5c]">{m.client_email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-stolzl text-[13px] text-[#02022c]">
                      {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 font-stolzl text-[13px] text-[#02022c]">{m.start_time}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#3ab874] flex items-center justify-center">
                          <span className="font-stolzl text-[10px] font-bold text-white">{m.rep_name.charAt(0)}</span>
                        </div>
                        <span className="font-stolzl text-[13px] text-[#02022c]">{m.rep_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-stolzl text-[11px] rounded-full px-2 py-0.5 ${
                        m.status === "confirmed" ? "bg-green-100 text-green-700" :
                        m.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-[#f4f4f4] text-[#5c5c5c]"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      {m.google_meet_url && m.status !== "cancelled" && (
                        <a href={m.google_meet_url} target="_blank" rel="noopener noreferrer"
                          className="font-stolzl text-[12px] text-[#3ab874] hover:underline font-semibold">
                          Join
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      {m.status !== "cancelled" && (
                        <div className="relative">
                          <button
                            onClick={() => setActionId(actionId === m.id ? null : m.id)}
                            className="p-1.5 rounded-lg hover:bg-[#f4f4f4] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="#5c5c5c"/><circle cx="7" cy="7" r="1" fill="#5c5c5c"/><circle cx="7" cy="11" r="1" fill="#5c5c5c"/></svg>
                          </button>
                          {actionId === m.id && (
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-[#ebebeb] py-1 min-w-[140px]">
                              <button
                                onClick={() => openReschedule(m.id)}
                                className="w-full text-left px-4 py-2 font-stolzl text-[13px] text-[#f59e0b] hover:bg-[#f4f4f4] transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => { setConfirmCancel(m.id); setActionId(null); }}
                                className="w-full text-left px-4 py-2 font-stolzl text-[13px] text-[#e53e3e] hover:bg-[#f4f4f4] transition-colors"
                              >
                                Cancel Meeting
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-8 text-center">
              <p className="font-stolzl text-[14px] text-[#5c5c5c]">No meetings found</p>
            </div>
          ) : (
            filtered.map(m => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-[#ebebeb] p-4"
                onClick={() => router.push(`/crm/leads/${m.lead_id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-stolzl text-[14px] font-semibold text-[#02022c]">{m.client_name}</p>
                    <p className="font-stolzl text-[12px] text-[#5c5c5c]">{m.client_email}</p>
                  </div>
                  <span className={`font-stolzl text-[11px] rounded-full px-2 py-0.5 ${
                    m.status === "confirmed" ? "bg-green-100 text-green-700" :
                    m.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-[#f4f4f4] text-[#5c5c5c]"
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-stolzl text-[12px] text-[#02022c]">
                    {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <span className="font-stolzl text-[12px] text-[#5c5c5c]">{m.start_time}</span>
                  <span className="font-stolzl text-[12px] text-[#5c5c5c]">{m.rep_name}</span>
                </div>
                {m.status !== "cancelled" && (
                  <div className="flex gap-2 pt-2 border-t border-[#ebebeb]" onClick={e => e.stopPropagation()}>
                    {m.google_meet_url && (
                      <a href={m.google_meet_url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 font-stolzl text-[11px] font-semibold text-[#3ab874] bg-green-50 rounded-lg">
                        Join Meet
                      </a>
                    )}
                    <button
                      onClick={() => openReschedule(m.id)}
                      className="px-3 py-1.5 font-stolzl text-[11px] font-semibold text-[#f59e0b] bg-amber-50 rounded-lg"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setConfirmCancel(m.id)}
                      className="px-3 py-1.5 font-stolzl text-[11px] font-semibold text-[#e53e3e] bg-red-50 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cancel confirm overlay */}
        {confirmCancel && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmCancel(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-stolzl text-[15px] font-bold text-[#02022c] mb-2">Cancel Meeting?</h3>
              <p className="font-stolzl text-[13px] text-[#5c5c5c] mb-5">
                The calendar event will be deleted and the client will be notified by email.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCancel(confirmCancel)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-white bg-[#e53e3e] rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
                <button
                  onClick={() => setConfirmCancel(null)}
                  className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-[#5c5c5c] bg-[#f4f4f4] rounded-xl hover:bg-[#ebebeb] transition-colors"
                >
                  Keep Meeting
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule overlay */}
        {rescheduleId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRescheduleId(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-stolzl text-[15px] font-bold text-[#02022c] mb-4">Reschedule Meeting</h3>
              <div className="space-y-3">
                <div>
                  <label className="font-stolzl text-[12px] font-semibold text-[#5c5c5c] mb-1 block">New Date</label>
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
                    className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60"
                  />
                </div>
                {rescheduleDate && availableSlots[rescheduleDate] && (
                  <div>
                    <label className="font-stolzl text-[12px] font-semibold text-[#5c5c5c] mb-1.5 block">Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots[rescheduleDate].map(slot => (
                        <button
                          key={slot}
                          onClick={() => setRescheduleTime(slot)}
                          className={`px-3 py-2 rounded-xl font-stolzl text-[13px] font-medium border transition-colors ${
                            rescheduleTime === slot
                              ? "bg-[#3ab874] text-white border-[#3ab874]"
                              : "bg-white text-[#02022c] border-[#ebebeb] hover:border-[#3ab874]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {rescheduleDate && !availableSlots[rescheduleDate] && (
                  <p className="font-stolzl text-[13px] text-[#5c5c5c] text-center py-2">No available slots on this date</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleReschedule}
                    disabled={rescheduling || !rescheduleDate || !rescheduleTime}
                    className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-white bg-[#3ab874] rounded-xl hover:bg-[#2da062] transition-colors disabled:opacity-50"
                  >
                    {rescheduling ? "Rescheduling..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setRescheduleId(null)}
                    className="flex-1 px-4 py-2.5 font-stolzl text-[13px] font-semibold text-[#5c5c5c] bg-[#f4f4f4] rounded-xl hover:bg-[#ebebeb] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMShell>
  );
}
