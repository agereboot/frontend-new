import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Target, Plus, Play, Check, Clock, Dumbbell, ChevronDown, ChevronRight } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const GOALS = ["longevity", "strength", "hypertrophy", "cardio_fitness", "weight_management", "rehabilitation"];
const PERIODISATION = ["block", "linear", "undulating", "conjugate"];

export default function PFCProgrammesPage() {
  const { user } = useAuth();
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [members, setMembers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ name: "", member_id: "", primary_goal: "longevity", duration_weeks: 12, training_days_per_week: 4, session_duration_min: 45, periodisation: "block", exercises: [] });

  useEffect(() => {
    Promise.all([
      api.get("/coach/pfc/programmes").then(r => setProgrammes(r.data.programmes || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const createProgramme = async () => {
    try {
      const member = members.find(m => m.id === form.member_id);
      const res = await api.post("/coach/pfc/programmes", { ...form, member_name: member?.name || "" });
      setProgrammes(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ name: "", member_id: "", primary_goal: "longevity", duration_weeks: 12, training_days_per_week: 4, session_duration_min: 45, periodisation: "block", exercises: [] });
      toast.success("Programme created");
    } catch { toast.error("Failed to create programme"); }
  };

  const approveProgramme = async (id) => {
    try {
      await api.put(`/coach/pfc/programmes/${id}/approve`);
      setProgrammes(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
      toast.success("Programme activated — member app updated");
    } catch { toast.error("Failed to activate"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="programmes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Exercise <span className="text-emerald-400">Programmes</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">BUILD & MANAGE TRAINING PROGRAMMES</p>
        </div>
        <Button data-testid="create-programme-btn" onClick={() => setShowCreate(!showCreate)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
          <Plus size={14} className="mr-1" /> New Programme
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-emerald-500/20 bg-black/30 p-5 space-y-4" data-testid="programme-form">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Programme Name</label>
              <input data-testid="prog-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none" placeholder="12-Week Longevity Programme" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Member</label>
              <AppSelect data-testid="prog-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none">
                <AppSelectOption value="">Select member</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Goal</label>
              <AppSelect value={form.primary_goal} onChange={e => setForm(p => ({ ...p, primary_goal: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none">
                {GOALS.map(g => <AppSelectOption key={g} value={g}>{g.replace(/_/g, " ")}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Weeks</label>
              <input type="number" value={form.duration_weeks} onChange={e => setForm(p => ({ ...p, duration_weeks: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Days/Week</label>
              <input type="number" value={form.training_days_per_week} onChange={e => setForm(p => ({ ...p, training_days_per_week: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Periodisation</label>
              <AppSelect value={form.periodisation} onChange={e => setForm(p => ({ ...p, periodisation: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none">
                {PERIODISATION.map(p => <AppSelectOption key={p} value={p}>{p}</AppSelectOption>)}
              </AppSelect>
            </div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="save-programme" onClick={createProgramme} disabled={!form.name || !form.member_id} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Save Programme</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 text-slate-300 text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* Programme List */}
      <div className="space-y-3">
        {programmes.map(p => (
          <div key={p.id} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm" data-testid={`prog-${p.id}`}>
            <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Target size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-white">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[8px] text-slate-500">{p.member_name}</span>
                  <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{p.primary_goal?.replace(/_/g, " ")}</Badge>
                  <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{p.duration_weeks}wk / {p.training_days_per_week}d</Badge>
                </div>
              </div>
              <Badge className={`text-[8px] ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{p.status}</Badge>
              {expanded === p.id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>
            {expanded === p.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-[10px]">
                  <div><span className="text-slate-500">Periodisation:</span> <span className="text-white ml-1">{p.periodisation}</span></div>
                  <div><span className="text-slate-500">Session Duration:</span> <span className="text-white ml-1">{p.session_duration_min}min</span></div>
                  <div><span className="text-slate-500">Created:</span> <span className="text-white ml-1">{new Date(p.created_at).toLocaleDateString()}</span></div>
                </div>
                {p.status === "draft" && (
                  <Button data-testid={`activate-${p.id}`} onClick={() => approveProgramme(p.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <Play size={12} className="mr-1" /> Activate Programme
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {programmes.length === 0 && <p className="text-slate-500 text-sm text-center py-12">No programmes created yet. Click "New Programme" to get started.</p>}
      </div>
    </div>
  );
}
