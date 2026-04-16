import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Target, Plus, ChevronRight, Star, X } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const RATING_COLORS = { outstanding: "text-emerald-400", exceeds_expectations: "text-blue-400", meets_expectations: "text-amber-400", needs_improvement: "text-orange-400", unsatisfactory: "text-red-400" };

export default function AdminHRMSPerformancePage() {
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tab, setTab] = useState("cycles");
  const [loading, setLoading] = useState(true);
  const [showCreateCycle, setShowCreateCycle] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/admin/hrms/performance/cycles"),
      api.get("/admin/hrms/performance/reviews?limit=50"),
      api.get("/admin/hrms/performance/goals"),
    ]).then(([c, r, g]) => {
      setCycles(c.data.cycles || []);
      setReviews(r.data.reviews || []);
      setGoals(g.data.goals || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5" data-testid="admin-hrms-performance-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Management</h1>
          <p className="text-sm text-slate-500 mt-1">Review cycles, goals, and ratings</p>
        </div>
        <button onClick={() => setShowCreateCycle(true)} data-testid="create-cycle-btn" className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg"><Plus size={16} /> New Cycle</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#11111a] rounded-lg p-1 w-fit">
        {[["cycles", "Review Cycles"], ["reviews", "Reviews"], ["goals", "Goals"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === k ? "bg-[#7B35D8] text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "cycles" && (
        <div className="space-y-3">
          {cycles.length === 0 ? <p className="text-slate-500 text-center py-8">No review cycles created yet</p> : cycles.map(c => (
            <div key={c.id} className="bg-[#11111a] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div><h3 className="text-sm font-medium text-white">{c.title}</h3><p className="text-[10px] text-slate-500 mt-1">{c.cycle_type} | {c.year}{c.quarter ? ` Q${c.quarter}` : ""} | {c.starts_at} to {c.ends_at || "ongoing"}</p></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{c.status?.replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-white/5">
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Employee</th>
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Department</th>
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Self Rating</th>
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Manager Rating</th>
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Status</th>
          </tr></thead><tbody>
            {reviews.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-slate-500">No reviews yet</td></tr> : reviews.map(r => (
              <tr key={r.id} className="border-b border-white/[0.03]">
                <td className="px-4 py-3 text-sm text-white">{r.employee_name}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{r.department}</td>
                <td className="px-4 py-3"><span className={`text-xs ${RATING_COLORS[r.self_rating] || "text-slate-500"}`}>{r.self_rating?.replace(/_/g, " ") || "—"}</span></td>
                <td className="px-4 py-3"><span className={`text-xs ${RATING_COLORS[r.manager_rating] || "text-slate-500"}`}>{r.manager_rating?.replace(/_/g, " ") || "—"}</span></td>
                <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7B35D8]/10 text-[#7B35D8]">{r.status?.replace(/_/g, " ")}</span></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {tab === "goals" && (
        <div className="space-y-2">
          {goals.length === 0 ? <p className="text-slate-500 text-center py-8">No goals set yet</p> : goals.map(g => (
            <div key={g.id} className="bg-[#11111a] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div><h3 className="text-sm text-white font-medium">{g.title}</h3><p className="text-[10px] text-slate-500">{g.employee_name} | Weight: {g.weight_pct}% | Due: {g.target_date || "—"}</p></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>{g.status}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2"><div className="h-2 rounded-full bg-[#7B35D8] transition-all" style={{ width: `${g.progress_pct}%` }} /></div>
              <p className="text-[10px] text-slate-500 mt-1">{g.progress_pct}% complete</p>
            </div>
          ))}
        </div>
      )}

      {showCreateCycle && <CreateCycleModal onClose={() => setShowCreateCycle(false)} onCreated={() => { api.get("/admin/hrms/performance/cycles").then(r => setCycles(r.data.cycles || [])); setShowCreateCycle(false); }} />}
    </div>
  );
}

function CreateCycleModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", cycle_type: "annual", year: 2026, starts_at: "", ends_at: "" });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post("/admin/hrms/performance/cycles", form); onCreated(); } catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">New Review Cycle</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Cycle Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.cycle_type} onChange={e => setForm(f => ({ ...f, cycle_type: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              <AppSelectOption value="annual">Annual</AppSelectOption><AppSelectOption value="quarterly">Quarterly</AppSelectOption><AppSelectOption value="midyear">Mid-Year</AppSelectOption>
            </AppSelect>
            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
            <input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
