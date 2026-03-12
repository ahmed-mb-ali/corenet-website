"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CRMShell from "../CRMShell";
import { crmApi, type CRMUser } from "../../lib/crmApi";

function RepRow({
  rep,
  index,
  total,
  onEdit,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  rep: CRMUser;
  index: number;
  total: number;
  onEdit: (rep: CRMUser) => void;
  onToggle: (rep: CRMUser) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${rep.is_active ? "bg-white border-[#ebebeb]" : "bg-[#f7f8fc] border-[#ebebeb] opacity-60"}`}>
      {/* Priority handle / arrows */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f0f4ff] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2L9 7H1L5 2Z" fill="#5c5c5c" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f0f4ff] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 8L1 3H9L5 8Z" fill="#5c5c5c" />
          </svg>
        </button>
      </div>

      {/* Priority badge */}
      <div className="w-6 h-6 rounded-full bg-[#f0f4ff] flex items-center justify-center shrink-0">
        <span className="font-stolzl text-[11px] font-bold text-[#335cff]">{rep.priority}</span>
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#335cff] flex items-center justify-center shrink-0">
        <span className="font-stolzl text-[13px] font-bold text-white">{rep.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-stolzl text-[14px] font-semibold text-[#02022c] truncate">{rep.name}</p>
          {rep.role === "admin" && (
            <span className="shrink-0 font-stolzl text-[10px] font-semibold text-[#335cff] bg-[#eef1ff] rounded-full px-1.5 py-0.5">Admin</span>
          )}
          {!rep.is_active && (
            <span className="shrink-0 font-stolzl text-[10px] font-semibold text-[#5c5c5c] bg-[#f4f4f4] rounded-full px-1.5 py-0.5">Inactive</span>
          )}
        </div>
        <p className="font-stolzl text-[12px] text-[#5c5c5c] truncate">{rep.email}</p>
        {rep.phone && <p className="font-stolzl text-[11px] text-[#5c5c5c]/70 truncate">{rep.phone}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(rep)}
          className="px-3 py-1.5 font-stolzl text-[12px] text-[#335cff] border border-[#335cff]/30 rounded-lg hover:bg-[#f0f4ff] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(rep)}
          className={`px-3 py-1.5 font-stolzl text-[12px] rounded-lg transition-colors ${
            rep.is_active
              ? "text-[#e53e3e] border border-[#e53e3e]/30 hover:bg-red-50"
              : "text-[#3ab874] border border-[#3ab874]/30 hover:bg-green-50"
          }`}
        >
          {rep.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function AddRepModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { name: string; email: string; password: string; phone: string; role: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "rep" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create rep";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-[#ebebeb]">
          <h2 className="font-stolzl text-[18px] font-bold text-[#02022c]">Add Sales Rep</h2>
          <p className="font-stolzl text-[13px] text-[#5c5c5c] mt-0.5">They'll be added with default Sun–Thu 9–5 availability.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff]/60"
              required
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="rep@corenet.sa"
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff]/60"
              required
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min 6 characters"
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff]/60"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+966 5x xxx xxxx"
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff]/60"
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] focus:outline-none focus:border-[#335cff]/60"
            >
              <option value="rep">Sales Rep</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <p className="font-stolzl text-[13px] text-[#e53e3e] bg-red-50 rounded-xl px-3.5 py-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-stolzl text-[14px] font-semibold text-[#5c5c5c] border border-[#ebebeb] rounded-xl hover:bg-[#f7f8fc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 font-stolzl text-[14px] font-semibold text-white bg-[#335cff] rounded-xl hover:bg-[#2348e0] transition-colors disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Rep"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRepModal({
  rep,
  onClose,
  onSave,
}: {
  rep: CRMUser;
  onClose: () => void;
  onSave: (data: Partial<CRMUser>) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: rep.name, email: rep.email, phone: rep.phone || "", role: rep.role });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update rep";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword.trim() || newPassword.length < 6) return;
    setSaving(true);
    setError("");
    setPwSuccess(false);
    try {
      await crmApi.team.resetPassword(rep.id, newPassword);
      setNewPassword("");
      setPwSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-[#ebebeb]">
          <h2 className="font-stolzl text-[18px] font-bold text-[#02022c]">Edit Rep</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] focus:outline-none focus:border-[#335cff]/60"
              required
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] focus:outline-none focus:border-[#335cff]/60"
              required
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] focus:outline-none focus:border-[#335cff]/60"
            />
          </div>
          <div>
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] focus:outline-none focus:border-[#335cff]/60"
            >
              <option value="rep">Sales Rep</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Reset Password section */}
          <div className="border-t border-[#ebebeb] pt-4">
            <label className="font-stolzl text-[12px] font-semibold text-[#02022c] mb-1.5 block">Reset Password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwSuccess(false); }}
                placeholder="New password (min 6 chars)"
                className="flex-1 border border-[#ebebeb] rounded-xl px-3.5 py-2.5 font-stolzl text-[14px] text-[#02022c] placeholder-[#5c5c5c]/50 focus:outline-none focus:border-[#335cff]/60"
                minLength={6}
              />
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={saving || newPassword.length < 6}
                className="px-4 py-2.5 font-stolzl text-[13px] font-semibold text-[#335cff] border border-[#335cff]/30 rounded-xl hover:bg-[#f0f4ff] transition-colors disabled:opacity-40"
              >
                Reset
              </button>
            </div>
            {pwSuccess && (
              <p className="font-stolzl text-[12px] text-[#3ab874] mt-1.5">Password updated successfully</p>
            )}
          </div>

          {error && (
            <p className="font-stolzl text-[13px] text-[#e53e3e] bg-red-50 rounded-xl px-3.5 py-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-stolzl text-[14px] font-semibold text-[#5c5c5c] border border-[#ebebeb] rounded-xl hover:bg-[#f7f8fc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 font-stolzl text-[14px] font-semibold text-white bg-[#335cff] rounded-xl hover:bg-[#2348e0] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const [reps, setReps] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRep, setEditRep] = useState<CRMUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    crmApi.team.list()
      .then(setReps)
      .catch(() => router.push("/crm/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleAdd(data: { name: string; email: string; password: string; phone: string; role: string }) {
    const newRep = await crmApi.team.create(data);
    setReps(prev => [...prev, newRep]);
    setShowAdd(false);
  }

  async function handleEdit(data: Partial<CRMUser>) {
    if (!editRep) return;
    const updated = await crmApi.team.update(editRep.id, data);
    setReps(prev => prev.map(r => r.id === editRep.id ? updated : r));
    setEditRep(null);
  }

  async function handleToggle(rep: CRMUser) {
    if (rep.is_active) {
      await crmApi.team.deactivate(rep.id);
      setReps(prev => prev.map(r => r.id === rep.id ? { ...r, is_active: false } : r));
    } else {
      const updated = await crmApi.team.update(rep.id, { is_active: true });
      setReps(prev => prev.map(r => r.id === rep.id ? updated : r));
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newReps = [...reps];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newReps[index], newReps[swapIndex]] = [newReps[swapIndex], newReps[index]];

    // Reassign priorities 1..N
    const reordered = newReps.map((r, i) => ({ ...r, priority: i + 1 }));
    setReps(reordered);

    setSaving(true);
    try {
      await crmApi.team.reorder(reordered.map(r => ({ id: r.id, priority: r.priority })));
    } finally {
      setSaving(false);
    }
  }

  const activeReps = reps.filter(r => r.is_active);
  const inactiveReps = reps.filter(r => !r.is_active);

  return (
    <CRMShell>
      <div className="p-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-stolzl text-[24px] font-bold text-[#02022c]">Team</h1>
            <p className="font-stolzl text-[14px] text-[#5c5c5c]">
              Manage sales reps and their booking priority
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 font-stolzl text-[14px] font-semibold text-white bg-[#335cff] rounded-xl hover:bg-[#2348e0] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Rep
          </button>
        </div>

        {/* Priority note */}
        <div className="flex items-start gap-2.5 bg-[#f0f4ff] rounded-xl p-3.5 mb-5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="7" stroke="#335cff" strokeWidth="1.5" />
            <path d="M8 7v4M8 5.5v.5" stroke="#335cff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="font-stolzl text-[12px] text-[#335cff]">
            Priority determines booking order — Rep #1 gets assigned first when available. Use arrows to reorder.
            {saving && <span className="ml-2 opacity-60">Saving...</span>}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#335cff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Active reps */}
            <div className="space-y-2 mb-6">
              {activeReps.map((rep, index) => (
                <RepRow
                  key={rep.id}
                  rep={rep}
                  index={index}
                  total={activeReps.length}
                  onEdit={setEditRep}
                  onToggle={handleToggle}
                  onMoveUp={() => {
                    const globalIndex = reps.findIndex(r => r.id === rep.id);
                    handleMove(globalIndex, "up");
                  }}
                  onMoveDown={() => {
                    const globalIndex = reps.findIndex(r => r.id === rep.id);
                    handleMove(globalIndex, "down");
                  }}
                />
              ))}
              {activeReps.length === 0 && (
                <p className="font-stolzl text-[13px] text-[#5c5c5c] text-center py-8">No active reps</p>
              )}
            </div>

            {/* Inactive reps */}
            {inactiveReps.length > 0 && (
              <>
                <p className="font-stolzl text-[12px] font-semibold text-[#5c5c5c] uppercase tracking-wider mb-2">Inactive</p>
                <div className="space-y-2">
                  {inactiveReps.map((rep, index) => (
                    <RepRow
                      key={rep.id}
                      rep={rep}
                      index={index}
                      total={inactiveReps.length}
                      onEdit={setEditRep}
                      onToggle={handleToggle}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddRepModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editRep && (
        <EditRepModal rep={editRep} onClose={() => setEditRep(null)} onSave={handleEdit} />
      )}
    </CRMShell>
  );
}
