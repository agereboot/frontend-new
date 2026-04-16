import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Salad, Plus, Play, Check, Clock, ChevronDown, ChevronRight, Apple } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function NUTMealPlansPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ name: "", member_id: "", duration_days: 7, target_kcal: 2000, macros: { protein_g: 130, carb_g: 250, fat_g: 65 }, eating_window: "16:8" });

  useEffect(() => {
    Promise.all([
      api.get("/coach/nut/meal-plans").then(r => setPlans(r.data.plans || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const createPlan = async () => {
    try {
      const member = members.find(m => m.id === form.member_id);
      const res = await api.post("/coach/nut/meal-plans", { ...form, member_name: member?.name || "" });
      setPlans(prev => [res.data, ...prev]);
      setShowCreate(false);
      toast.success("Meal plan created");
    } catch { toast.error("Failed to create plan"); }
  };

  const approvePlan = async (id) => {
    try {
      await api.put(`/coach/nut/meal-plans/${id}/approve`);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
      toast.success("Meal plan activated — client app updated");
    } catch { toast.error("Failed to activate"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="meal-plans-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Meal <span className="text-teal-400">Plans</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">BUILD & MANAGE CLIENT NUTRITION PLANS</p>
        </div>
        <Button data-testid="create-plan-btn" onClick={() => setShowCreate(!showCreate)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
          <Plus size={14} className="mr-1" /> New Meal Plan
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-teal-500/20 bg-black/30 p-5 space-y-4" data-testid="meal-plan-form">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Plan Name</label>
              <input data-testid="plan-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 focus:outline-none" placeholder="7-Day Longevity Plan" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Client</label>
              <AppSelect data-testid="plan-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 focus:outline-none">
                <AppSelectOption value="">Select client</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Days</label>
              <input type="number" value={form.duration_days} onChange={e => setForm(p => ({ ...p, duration_days: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Target kcal</label>
              <input type="number" value={form.target_kcal} onChange={e => setForm(p => ({ ...p, target_kcal: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Protein (g)</label>
              <input type="number" value={form.macros.protein_g} onChange={e => setForm(p => ({ ...p, macros: { ...p.macros, protein_g: +e.target.value } }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Carbs (g)</label>
              <input type="number" value={form.macros.carb_g} onChange={e => setForm(p => ({ ...p, macros: { ...p.macros, carb_g: +e.target.value } }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">IF Window</label>
              <AppSelect value={form.eating_window} onChange={e => setForm(p => ({ ...p, eating_window: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none">
                <AppSelectOption value="">None</AppSelectOption>
                <AppSelectOption value="16:8">16:8</AppSelectOption>
                <AppSelectOption value="18:6">18:6</AppSelectOption>
                <AppSelectOption value="20:4">20:4</AppSelectOption>
              </AppSelect>
            </div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="save-plan" onClick={createPlan} disabled={!form.name || !form.member_id} className="bg-teal-600 hover:bg-teal-700 text-white text-xs">Save Plan</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 text-slate-300 text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* Plan List */}
      <div className="space-y-3">
        {plans.map(p => (
          <div key={p.id} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm" data-testid={`plan-${p.id}`}>
            <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-all">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Salad size={18} className="text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-white">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[8px] text-slate-500">{p.member_name}</span>
                  <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{p.target_kcal} kcal</Badge>
                  <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{p.duration_days}d</Badge>
                  {p.eating_window && <Badge className="font-mono text-[7px] bg-teal-500/10 text-teal-400">IF {p.eating_window}</Badge>}
                </div>
              </div>
              <Badge className={`text-[8px] ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{p.status}</Badge>
              {expanded === p.id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>
            {expanded === p.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3">
                <div className="grid grid-cols-3 gap-3 text-[10px] mb-3">
                  <div className="rounded-lg bg-white/[0.02] p-2 text-center border border-white/5">
                    <p className="text-teal-400 font-bold text-lg">{p.macros?.protein_g || "—"}g</p>
                    <p className="text-slate-500 font-mono text-[8px]">Protein</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] p-2 text-center border border-white/5">
                    <p className="text-blue-400 font-bold text-lg">{p.macros?.carb_g || "—"}g</p>
                    <p className="text-slate-500 font-mono text-[8px]">Carbs</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] p-2 text-center border border-white/5">
                    <p className="text-amber-400 font-bold text-lg">{p.macros?.fat_g || "—"}g</p>
                    <p className="text-slate-500 font-mono text-[8px]">Fat</p>
                  </div>
                </div>
                {p.status === "draft" && (
                  <Button data-testid={`activate-plan-${p.id}`} onClick={() => approvePlan(p.id)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                    <Play size={12} className="mr-1" /> Activate Plan
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {plans.length === 0 && <p className="text-slate-500 text-sm text-center py-12">No meal plans created yet. Click "New Meal Plan" to get started.</p>}
      </div>
    </div>
  );
}
