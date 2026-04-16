import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TrendingUp, Plus, Target, CheckCircle2, Circle, Loader2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function GoalsPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "general", target_value: "", unit: "", deadline: "", notes: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/cc/members").then(r => { setMembers(r.data.members || []); setLoading(false); }); }, []);
  useEffect(() => { if (selectedId) api.get(`/coach-v2/goals/${selectedId}`).then(r => setGoals(r.data.goals || [])); }, [selectedId]);

  const createGoal = async () => {
    if (!form.title || !selectedId) { toast.error("Title and member required"); return; }
    const member = members.find(m => m.id === selectedId);
    try {
      const res = await api.post("/coach-v2/goals", { ...form, member_id: selectedId, member_name: member?.name, target_value: Number(form.target_value) || 0 });
      setGoals(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ title: "", category: "general", target_value: "", unit: "", deadline: "", notes: "" });
      toast.success("Goal created");
    } catch { toast.error("Failed"); }
  };

  const updateProgress = async (goalId, current, target) => {
    const val = prompt("Enter current value:", current);
    if (val === null) return;
    try {
      await api.put(`/coach-v2/goals/${goalId}/progress`, { current_value: Number(val), target_value: target });
      api.get(`/coach-v2/goals/${selectedId}`).then(r => setGoals(r.data.goals || []));
      toast.success("Progress updated");
    } catch { toast.error("Failed"); }
  };

  const CAT_COLORS = { general: "#64748B", fitness: "#10B981", weight: "#D97706", sleep: "#7B35D8", stress: "#EF4444", nutrition: "#0F9F8F", hps: "#7B35D8" };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="goals-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Client <span className="text-emerald-400">Goals</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">SMART GOAL SETTING & PROGRESS TRACKING</p>
        </div>
        <div className="flex items-center gap-3">
          <AppSelect data-testid="goal-member" value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none min-w-[200px]">
            <AppSelectOption value="">Select member</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          {selectedId && <Button data-testid="new-goal" onClick={() => setShowForm(!showForm)} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"><Plus size={14} className="mr-1" /> New Goal</Button>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-emerald-500/20 bg-black/30 p-5 space-y-3" data-testid="goal-form">
          <input data-testid="goal-title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Goal title (e.g., Reduce body fat to 18%)"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none" />
          <div className="grid grid-cols-4 gap-3">
            <AppSelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none">
              <AppSelectOption value="general">General</AppSelectOption><AppSelectOption value="fitness">Fitness</AppSelectOption><AppSelectOption value="weight">Weight</AppSelectOption>
              <AppSelectOption value="sleep">Sleep</AppSelectOption><AppSelectOption value="stress">Stress</AppSelectOption><AppSelectOption value="nutrition">Nutrition</AppSelectOption><AppSelectOption value="hps">Improve HPS</AppSelectOption>
            </AppSelect>
            <input type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="Target"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none" />
            <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="Unit (%,kg,score)"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none" />
            <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-goal" onClick={createGoal} className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs">Create Goal</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {goals.map(g => {
          const color = CAT_COLORS[g.category] || "#64748B";
          return (
            <div key={g.id} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`goal-${g.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {g.status === "completed" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} style={{ color }} />}
                  <p className="font-body text-sm font-medium text-white">{g.title}</p>
                  <Badge className="font-mono text-[7px]" style={{ backgroundColor: color + "15", color }}>{g.category}</Badge>
                </div>
                <Button size="sm" onClick={() => updateProgress(g.id, g.current_value, g.target_value)} className="bg-white/5 text-white text-[9px] h-6 px-2">Update</Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${g.progress_pct || 0}%`, backgroundColor: color }} />
                </div>
                <span className="font-mono text-xs font-bold" style={{ color }}>{g.progress_pct || 0}%</span>
                <span className="font-mono text-[8px] text-slate-500">{g.current_value || 0}/{g.target_value} {g.unit}</span>
              </div>
              {g.deadline && <p className="font-mono text-[8px] text-slate-500 mt-1">Deadline: {g.deadline}</p>}
            </div>
          );
        })}
        {!selectedId && <p className="text-slate-500 text-sm text-center py-12">Select a member to view goals</p>}
      </div>
    </div>
  );
}
