import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Target, Plus, Trash2, Edit2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const ACCENT = "#F59E0B";
const PRIORITY_C = { critical: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#64748B" };
const STATUS_C = { planned: "#3B82F6", in_progress: "#F59E0B", completed: "#10B981", cancelled: "#64748B" };

export default function CXOInterventionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", target_department: "", expected_hps_improvement: 0, expected_roi_impact: 0, expected_engagement_lift: 0, start_date: "", end_date: "", assigned_to: "" });

  const load = () => api.get("/cxo/interventions").then(r => setItems(r.data.interventions)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await api.post("/cxo/interventions", form); toast.success("Intervention created"); setShowForm(false); setForm({ title: "", description: "", priority: "medium", target_department: "", expected_hps_improvement: 0, expected_roi_impact: 0, expected_engagement_lift: 0, start_date: "", end_date: "", assigned_to: "" }); load(); } catch { toast.error("Failed to create"); }
  };

  const updateStatus = async (id, status) => {
    try { await api.patch(`/cxo/interventions/${id}`, { status }); toast.success(`Status: ${status}`); load(); } catch { toast.error("Failed"); }
  };

  const remove = async (id) => {
    try { await api.delete(`/cxo/interventions/${id}`); toast.success("Deleted"); load(); } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-interventions-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Strategic <span className="text-amber-400">Interventions Planner</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Plan, track, and measure wellness interventions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} data-testid="create-intervention-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
          <Plus size={14} /> New Intervention
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-[#11111a] p-5 animate-in slide-in-from-top-2 duration-300" data-testid="intervention-form">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Create Intervention</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50" data-testid="int-title" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 resize-none" data-testid="int-desc" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Priority</label>
              <AppSelect value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="int-priority">
                {["critical", "high", "medium", "low"].map(p => <AppSelectOption key={p} value={p}>{p}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Department</label>
              <AppSelect value={form.target_department} onChange={e => setForm(f => ({ ...f, target_department: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="int-dept">
                <AppSelectOption value="">Company-wide</AppSelectOption>
                {["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR", "Product", "Support"].map(d => <AppSelectOption key={d} value={d}>{d}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div><label className="text-xs text-slate-400 block mb-1">Expected HPS Lift</label>
              <input type="number" value={form.expected_hps_improvement} onChange={e => setForm(f => ({ ...f, expected_hps_improvement: +e.target.value }))} className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="int-hps" /></div>
            <div><label className="text-xs text-slate-400 block mb-1">Expected ROI Impact (₹)</label>
              <input type="number" value={form.expected_roi_impact} onChange={e => setForm(f => ({ ...f, expected_roi_impact: +e.target.value }))} className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="int-roi" /></div>
            <div><label className="text-xs text-slate-400 block mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="int-start" /></div>
            <div><label className="text-xs text-slate-400 block mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="int-end" /></div>
          </div>
          <button onClick={create} data-testid="save-intervention-btn"
            className="px-6 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">Save Intervention</button>
        </div>
      )}

      {/* Intervention Cards */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No interventions planned yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid={`intervention-${item.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase" style={{ backgroundColor: PRIORITY_C[item.priority] + "15", color: PRIORITY_C[item.priority] }}>{item.priority}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase" style={{ backgroundColor: STATUS_C[item.status] + "15", color: STATUS_C[item.status] }}>{item.status?.replace("_", " ")}</span>
                    {item.target_department && <span className="text-[10px] text-slate-500">{item.target_department}</span>}
                  </div>
                  <h3 className="text-sm font-medium text-white mt-1">{item.title}</h3>
                  {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                    {item.expected_impact?.hps_improvement > 0 && <span>HPS: +{item.expected_impact.hps_improvement}</span>}
                    {item.expected_impact?.roi_impact > 0 && <span>ROI: ₹{(item.expected_impact.roi_impact / 100000).toFixed(1)}L</span>}
                    {item.timeline?.start_date && <span>{item.timeline.start_date} → {item.timeline.end_date}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {item.status === "planned" && <button onClick={() => updateStatus(item.id, "in_progress")} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400" title="Start"><Edit2 size={14} /></button>}
                  {item.status === "in_progress" && <button onClick={() => updateStatus(item.id, "completed")} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400" title="Complete"><CheckCircle size={14} /></button>}
                  <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
