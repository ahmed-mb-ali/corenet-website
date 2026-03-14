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

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  blocks: { startTime: string; endTime: string }[];
}

function buildDaySchedules(workingHours: WorkingHour[]): DaySchedule[] {
  return DAYS.map((_, i) => {
    const existing = workingHours.filter(w => w.day_of_week === i);
    if (existing.length > 0) {
      return {
        dayOfWeek: i,
        enabled: true,
        blocks: existing.map(w => ({
          startTime: w.start_time?.slice(0, 5) ?? "09:00",
          endTime: w.end_time?.slice(0, 5) ?? "17:00",
        })).sort((a, b) => a.startTime.localeCompare(b.startTime)),
      };
    }
    return {
      dayOfWeek: i,
      enabled: false,
      blocks: [{ startTime: "09:00", endTime: "17:00" }],
    };
  });
}

function schedulesToHourEntries(schedules: DaySchedule[]): HourEntry[] {
  const entries: HourEntry[] = [];
  for (const day of schedules) {
    for (const block of day.blocks) {
      entries.push({
        dayOfWeek: day.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        enabled: day.enabled,
      });
    }
  }
  return entries;
}

function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-[#ebebeb] rounded-lg px-2 py-1.5 font-stolzl text-[12px] text-[#02022c] focus:outline-none focus:border-[#3ab874]/60 bg-white cursor-pointer"
    >
      {TIME_OPTIONS.map(t => (
        <option key={t} value={t}>{formatTime12h(t)}</option>
      ))}
    </select>
  );
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [me, setMe] = useState<CRMUser | null>(null);
  const [reps, setReps] = useState<CRMUser[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>("");

  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
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
      setSchedules(buildDaySchedules(data.workingHours));
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
      await crmApi.availability.saveHours(schedulesToHourEntries(schedules), targetId);
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

  function toggleDay(dayIdx: number) {
    setSchedules(prev => prev.map(s =>
      s.dayOfWeek === dayIdx ? { ...s, enabled: !s.enabled } : s
    ));
  }

  function updateBlock(dayIdx: number, blockIdx: number, field: "startTime" | "endTime", val: string) {
    setSchedules(prev => prev.map(s => {
      if (s.dayOfWeek !== dayIdx) return s;
      const newBlocks = s.blocks.map((b, i) => i === blockIdx ? { ...b, [field]: val } : b);
      return { ...s, blocks: newBlocks };
    }));
  }

  function addBlock(dayIdx: number) {
    setSchedules(prev => prev.map(s => {
      if (s.dayOfWeek !== dayIdx) return s;
      // Find the last block's end time to use as the new block's start
      const lastBlock = s.blocks[s.blocks.length - 1];
      const newStart = lastBlock?.endTime ?? "13:00";
      // Default the new block end to 2 hours after start, capped at 21:00
      const [h] = newStart.split(":").map(Number);
      const newEnd = `${String(Math.min(h + 2, 21)).padStart(2, "0")}:00`;
      return { ...s, blocks: [...s.blocks, { startTime: newStart, endTime: newEnd }] };
    }));
  }

  function removeBlock(dayIdx: number, blockIdx: number) {
    setSchedules(prev => prev.map(s => {
      if (s.dayOfWeek !== dayIdx) return s;
      if (s.blocks.length <= 1) return s; // Keep at least one block
      return { ...s, blocks: s.blocks.filter((_, i) => i !== blockIdx) };
    }));
  }

  const selectedRep = reps.find(r => r.id === selectedRepId) ?? me;
  const isAdmin = me?.role === "admin";

  const enabledCount = schedules.filter(s => s.enabled).length;
  const totalBlocks = schedules.reduce((sum, s) => sum + (s.enabled ? s.blocks.length : 0), 0);

  return (
    <CRMShell>
      <div className="p-4 lg:p-6 max-w-2xl">
        {/* Header */}
        <div className="mb-4 lg:mb-6">
          <h1 className="font-stolzl text-[20px] lg:text-[24px] font-bold text-[#02022c]">Availability</h1>
          <p className="font-stolzl text-[13px] lg:text-[14px] text-[#5c5c5c]">
            Set working hours and blocked dates for booking slots
          </p>
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
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-4 lg:p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-stolzl text-[15px] font-bold text-[#02022c]">Working Hours</h2>
                  <p className="font-stolzl text-[11px] text-[#5c5c5c] mt-0.5">
                    {enabledCount} day{enabledCount !== 1 ? "s" : ""} active · {totalBlocks} time block{totalBlocks !== 1 ? "s" : ""}
                  </p>
                </div>
                {selectedRep && (
                  <span className="font-stolzl text-[12px] text-[#5c5c5c]">{selectedRep.name}</span>
                )}
              </div>

              <div className="space-y-1">
                {schedules.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className={`rounded-xl transition-colors ${day.enabled ? "bg-[#f7f8fc]" : "bg-[#fafafa]"}`}
                  >
                    {/* Day header row */}
                    <div className="flex items-center gap-2 lg:gap-3 px-2.5 lg:px-3 py-2">
                      {/* Toggle switch */}
                      <button
                        onClick={() => toggleDay(day.dayOfWeek)}
                        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${
                          day.enabled ? "bg-[#3ab874]" : "bg-[#d0d0d0]"
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          day.enabled ? "left-[18px]" : "left-0.5"
                        }`} />
                      </button>

                      <span className={`font-stolzl text-[13px] w-[80px] shrink-0 ${
                        day.enabled ? "text-[#02022c] font-medium" : "text-[#5c5c5c]/60"
                      }`}>
                        {DAYS[day.dayOfWeek]}
                      </span>

                      {day.enabled ? (
                        <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                          {/* First block inline */}
                          <div className="flex items-center gap-1.5">
                            <TimeSelect
                              value={day.blocks[0].startTime}
                              onChange={v => updateBlock(day.dayOfWeek, 0, "startTime", v)}
                            />
                            <span className="font-stolzl text-[11px] text-[#5c5c5c]">–</span>
                            <TimeSelect
                              value={day.blocks[0].endTime}
                              onChange={v => updateBlock(day.dayOfWeek, 0, "endTime", v)}
                            />
                          </div>

                          {day.blocks.length === 1 && (
                            <button
                              onClick={() => addBlock(day.dayOfWeek)}
                              className="ml-1 w-6 h-6 rounded-full flex items-center justify-center bg-[#3ab874]/10 hover:bg-[#3ab874]/20 transition-colors"
                              title="Add time block"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M5 1v8M1 5h8" stroke="#3ab874" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="font-stolzl text-[13px] text-[#5c5c5c]/40 flex-1">Day off</span>
                      )}
                    </div>

                    {/* Additional blocks */}
                    {day.enabled && day.blocks.length > 1 && (
                      <div className="pb-2 pl-[118px] lg:pl-[126px] pr-3 space-y-1.5">
                        {day.blocks.slice(1).map((block, bIdx) => (
                          <div key={bIdx + 1} className="flex items-center gap-1.5">
                            <TimeSelect
                              value={block.startTime}
                              onChange={v => updateBlock(day.dayOfWeek, bIdx + 1, "startTime", v)}
                            />
                            <span className="font-stolzl text-[11px] text-[#5c5c5c]">–</span>
                            <TimeSelect
                              value={block.endTime}
                              onChange={v => updateBlock(day.dayOfWeek, bIdx + 1, "endTime", v)}
                            />
                            <button
                              onClick={() => removeBlock(day.dayOfWeek, bIdx + 1)}
                              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                              title="Remove block"
                            >
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1 4h6" stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addBlock(day.dayOfWeek)}
                          className="flex items-center gap-1.5 font-stolzl text-[11px] text-[#3ab874] hover:text-[#2da062] transition-colors"
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M4 0v8M0 4h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                          Add break block
                        </button>
                      </div>
                    )}

                    {/* Remove first block button when multiple exist */}
                    {day.enabled && day.blocks.length > 1 && (
                      <div className="pl-[118px] lg:pl-[126px] pb-1 -mt-1">
                        {/* visual connector handled by spacing */}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#f4f4f4]">
                <button
                  onClick={handleSaveHours}
                  disabled={saving}
                  className="px-5 py-2.5 font-stolzl text-[13px] font-semibold text-white bg-[#3ab874] rounded-xl hover:bg-[#2da062] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Schedule"}
                </button>
                {saveMsg && (
                  <span className="font-stolzl text-[13px] text-[#3ab874] font-semibold animate-pulse">{saveMsg}</span>
                )}
              </div>
            </div>

            {/* Blocked dates */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-4 lg:p-5">
              <div className="mb-4">
                <h2 className="font-stolzl text-[15px] font-bold text-[#02022c]">Blocked Dates</h2>
                <p className="font-stolzl text-[11px] text-[#5c5c5c] mt-0.5">
                  Block full days from receiving bookings
                </p>
              </div>

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
