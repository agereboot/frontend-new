import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clipboard, Plus, Loader2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function PSYTherapyProgramsPage() {
  const [members, setMembers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ member_id: "", name: "", type: "Stress Management", duration_weeks: 8, sessions_per_week: 1, goals: [""] });

  useEffect(() => {
    Promise.all([
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
      api.get("/coach-v2/psy/therapy-programs").then(r => setPrograms(r.data.programs || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const createProgram = async () => {
    if (!form.member_id || !form.name) { toast.error("Member and name required"); return; }
    const member = members.find(m => m.id === form.member_id);
    try {
      const res = await api.post("/coach-v2/psy/therapy-programs", { ...form, member_name: member?.name, goals: form.goals.filter(g => g) });
      setPrograms(prev => [res.data, ...prev]);
      setShowForm(false);
      toast.success("Therapy program created");
    } catch { toast.error("Failed"); }
  };

  const TYPES = ["Stress Management", "Depression Treatment (CBT)", "Anxiety Reduction", "Sleep Improvement (CBT-I)", "Trauma Processing", "Behavioral Activation", "Mindfulness-Based", "Custom"];

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="therapy-programs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Therapy <span className="text-indigo-400">Programs</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">STRUCTURED THERAPY PROGRAM BUILDER & TRACKER</p>
        </div>
        <Button data-testid="new-program" onClick={() => setShowForm(!showForm)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs"><Plus size={14} className="mr-1" /> New Program</Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-indigo-500/20 bg-black/30 p-5 space-y-3" data-testid="program-form">
          <div className="grid grid-cols-2 gap-3">
            <AppSelect data-testid="prog-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none">
              <AppSelectOption value="">Select patient</AppSelectOption>
              {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
            </AppSelect>
            <input data-testid="prog-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Program name"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <AppSelect value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none">
              {TYPES.map(t => <AppSelectOption key={t} value={t}>{t}</AppSelectOption>)}
            </AppSelect>
            <input type="number" value={form.duration_weeks} onChange={e => setForm(p => ({ ...p, duration_weeks: Number(e.target.value) }))} placeholder="Weeks"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={form.sessions_per_week} onChange={e => setForm(p => ({ ...p, sessions_per_week: Number(e.target.value) }))} placeholder="Sessions/week"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="font-mono text-[9px] text-slate-400 mb-1 block">Therapy Goals</label>
            {form.goals.map((g, i) => (
              <input key={i} value={g} onChange={e => { const goals = [...form.goals]; goals[i] = e.target.value; setForm(p => ({ ...p, goals })); }} placeholder={`Goal ${i + 1}`}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs mb-1 focus:border-indigo-500 focus:outline-none" />
            ))}
            <button onClick={() => setForm(p => ({ ...p, goals: [...p.goals, ""] }))} className="font-mono text-[10px] text-indigo-400">+ Add goal</button>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-program" onClick={createProgram} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">Create Program</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {programs.map(p => (
          <div key={p.id} className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid={`prog-${p.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clipboard size={14} className="text-indigo-400" />
                <span className="font-display text-sm font-bold text-white">{p.name}</span>
                <Badge className="font-mono text-[7px] bg-indigo-500/10 text-indigo-400">{p.type}</Badge>
                <Badge className={`font-mono text-[7px] ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>{p.status}</Badge>
              </div>
              <span className="font-mono text-[8px] text-slate-500">{p.member_name}</span>
            </div>
            <div className="flex gap-4 font-mono text-[9px] text-slate-400">
              <span>{p.duration_weeks} weeks</span>
              <span>{p.sessions_per_week}x/week</span>
              <span>{p.sessions_completed || 0} sessions done</span>
            </div>
            {p.goals?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">{p.goals.map((g, i) => <Badge key={i} className="font-mono text-[7px] bg-white/5 text-slate-300">{g}</Badge>)}</div>
            )}
          </div>
        ))}
        {programs.length === 0 && <p className="text-slate-500 text-sm text-center py-12">No therapy programs yet. Create one to start structured treatment.</p>}
      </div>
    </div>
  );
}
