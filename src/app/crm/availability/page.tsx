"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CRMShell from "../CRMShell";
import { crmApi, type CRMUser, type WorkingHour, type BlockedDate, type HourEntry } from "../../lib/crmApi";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Generate time options in 30-min increments: 07:00 – 21:00
const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 21) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

function buildDefaultHours(workingHours: WorkingHour[]): HourEntry[] {
  return DAYS.map((_, i) => {
    const existing = workingHours.find(w => w.day_of_week === i);
    return {
      dayOfWeek: i,
      startTime: existing?.start_time?.slice(0, 5) ?? "09:00",
      endTime: existing?.end_time?.slice(0, 5) ?? "17:00",
      enabled: !!existing,
    };
  });
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-[#ebebeb] rounded-lg px-2.5 py-1.5 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60 bg-white"
    >
      {TIME_OPTIONS.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [me, setMe] = useState<CRMUser | null>(null);
  const [reps, setReps] = useState<CRMUser[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>("");

  const [hours, setHours] = useState<HourEntry[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Block date form
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);

  // Load current user + reps list (admin only)
  useEffect(() => {
    crmApi.me()
      .then(user => {
        setMe(user);
        setSelectedRepId(user.id);
        if (user.role === "admin") {
          return crmApi.team.list().then(setReps);
        }
      })
      .catch(() => router.push("/crm/login"));
  }, [router]);

  const loadAvailability = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const data = await crmApi.availability.get(userId === me?.id ? undefined : userId);
      setHours(buildDefaultHours(data.workingHours));
      setBlockedDates(data.blockedDates);
    } finally {
      setLoading(false);
    }
  }, [me?.id]);

  useEffect(() => {
    if (selectedRepId) loadAvailability(selectedRepId);
  }, [selectedRepId, loadAvailability]);

  async function handleSaveHours() {
    setSaving(true);
    setSaveMsg("");
    try {
      const targetId = selectedRepId !== me?.id ? selectedRepId : undefined;
      await crmApi.availability.saveHours(hours, targetId);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDate) return;
    setAddingBlock(true);
    try {
      const targetId = selectedRepId !== me?.id ? selectedRepId : undefined;
      const row = await crmApi.availability.addBlock(blockDate, blockReason, targetId);
      setBlockedDates(prev => [...prev, row].sort((a, b) => a.block_date.localeCompare(b.block_date)));
      setBlockDate("");
      setBlockReason("");
    } finally {
      setAddingBlock(false);
    }
  }

  async function handleRemoveBlock(id: string) {
    await crmApi.availability.removeBlock(id);
    setBlockedDates(prev => prev.filter(b => b.id !== id));
  }

  function toggleDay(i: number) {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, enabled: !h.enabled } : h));
  }

  function updateHour(i: number, field: "startTime" | "endTime", val: string) {
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  }

  const selectedRep = reps.find(r => r.id === selectedRepId) ?? me;
  const isAdmin = me?.role === "admin";

  return (
    <CRMShell>
      <div className="p-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-stolzl text-[24px] font-bold text-[#02022c]">Availability</h1>
          <p className="font-stolzl text-[14px] text-[#5c5c5c]">Set working hours and blocked dates for booking slots</p>
        </div>

        {/* Rep selector (admin only) */}
        {isAdmin && reps.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#ebebeb] p-4 mb-5">
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-2 block">Editing schedule for:</label>
            <div className="flex flex-wrap gap-2">
              {reps.filter(r => r.is_active).map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedRepId(rep.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-stolzl text-[13px] font-medium transition-all ${
                    selectedRepId === rep.id
                      ? "bg-[#3ab874] text-white"
                      : "bg-[#f7f8fc] text-[#02022c] hover:bg-[#eef8f3] border border-[#ebebeb]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedRepId === rep.id ? "bg-white/20 text-white" : "bg-[#3ab874] text-white"}`}>
                    {rep.name.charAt(0).toUpperCase()}
                  </div>
                  {rep.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#3ab874] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Working hours */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-stolzl text-[15px] font-bold text-[#02022c]">Working Hours</h2>
                {selectedRep && (
                  <span className="font-stolzl text-[12px] text-[#5c5c5c]">{selectedRep.name}</span>
                )}
              </div>

              <div className="space-y-2">
                {hours.map((h, i) => (
                  <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${h.enabled ? "bg-[#f7f8fc]" : "opacity-50"}`}>
                    {/* Day toggle */}
                    <button
                      onClick={() => toggleDay(i)}
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-stolzl text-[11px] font-bold transition-colors ${
                        h.enabled ? "bg-[#3ab874] text-white" : "bg-[#f0f0f0] text-[#5c5c5c]"
                      }`}
                    >
                      {DAY_SHORT[i].charAt(0)}
                    </button>

                    <span className="font-stolzl text-[13px] text-[#02022c] w-[80px] shrink-0">{DAYS[i]}</span>

                    {h.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <TimeSelect value={h.startTime} onChange={v => updateHour(i, "startTime", v)} />
                        <span className="font-stolzl text-[12px] text-[#5c5c5c]">to</span>
                        <TimeSelect value={h.endTime} onChange={v => updateHour(i, "endTime", v)} />
                      </div>
                    ) : (
                      <span className="font-stolzl text-[13px] text-[#5c5c5c]/50 flex-1">Off</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#f4f4f4]">
                <button
                  onClick={handleSaveHours}
                  disabled={saving}
                  className="px-5 py-2.5 font-stolzl text-[14px] font-semibold text-white bg-[#3ab874] rounded-xl hover:bg-[#2da062] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Hours"}
                </button>
                {saveMsg && (
                  <span className="font-stolzl text-[13px] text-[#3ab874] font-semibold">{saveMsg}</span>
                )}
              </div>
            </div>

            {/* Blocked dates */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-5">
              <h2 className="font-stolzl text-[15px] font-bold text-[#02022c] mb-4">Blocked Dates</h2>

              {/* Add block form */}
              <form onSubmit={handleAddBlock} className="flex gap-2 mb-4 flex-wrap">
                <input
                  type="date"
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                  className="border border-[#ebebeb] rounded-xl px-3.5 py-2 font-stolzl text-[13px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60"
                />
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 min-w-[140px] border border-[#ebebeb] rounded-xl px-3.5 py-2 font-stolzl text-[13px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#3ab874]/60"
                />
                <button
                  type="submit"
                  disabled={addingBlock || !blockDate}
                  className="px-4 py-2 font-stolzl text-[13px] font-semibold text-white bg-[#02022c] rounded-xl hover:bg-[#0d0d3d] transition-colors disabled:opacity-50"
                >
                  {addingBlock ? "Adding..." : "Block Date"}
                </button>
              </form>

              {/* Blocked dates list */}
              {blockedDates.length === 0 ? (
                <p className="font-stolzl text-[13px] text-[#5c5c5c]/60 py-4 text-center">No blocked dates</p>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map(b => (
                    <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#fff5f5] border border-[#ffd0d0] rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                          <rect x="1" y="2" width="12" height="11" rx="2" stroke="#e53e3e" strokeWidth="1.2" />
                          <path d="M4 1v2M10 1v2M1 6h12" stroke="#e53e3e" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <span className="font-stolzl text-[13px] font-medium text-[#02022c]">
                          {new Date(b.block_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        {b.block_reason && (
                          <span className="font-stolzl text-[12px] text-[#5c5c5c]">— {b.block_reason}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveBlock(b.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#ffc0c0] transition-colors shrink-0"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 2l6 6M8 2L2 8" stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </CRMShell>
  );
}
