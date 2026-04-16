import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Plus, Users, Target, Loader2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function PFCChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", type: "steps", target: 10000, target_unit: "steps", duration_days: 7, participants: [] });

  useEffect(() => {
    Promise.all([
      api.get("/coach-v2/challenges").then(r => setChallenges(r.data.challenges || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const createChallenge = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    try {
      const res = await api.post("/coach-v2/challenges", form);
      setChallenges(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ name: "", description: "", type: "steps", target: 10000, target_unit: "steps", duration_days: 7, participants: [] });
      toast.success("Challenge created!");
    } catch { toast.error("Failed"); }
  };

  const TYPE_COLORS = { steps: "#10B981", sleep: "#7B35D8", hydration: "#3B82F6", exercise: "#D97706", nutrition: "#0F9F8F" };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="challenges-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Challenge <span className="text-amber-400">Management</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">GAMIFIED HEALTH CHALLENGES & LEADERBOARDS</p>
        </div>
        <Button data-testid="new-challenge" onClick={() => setShowForm(!showForm)} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs">
          <Plus size={14} className="mr-1" /> New Challenge
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-black/30 p-5 space-y-3" data-testid="challenge-form">
          <div className="grid grid-cols-2 gap-3">
            <input data-testid="ch-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Challenge name"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
            <AppSelect value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none">
              <AppSelectOption value="steps">Steps</AppSelectOption><AppSelectOption value="sleep">Sleep</AppSelectOption><AppSelectOption value="hydration">Hydration</AppSelectOption>
              <AppSelectOption value="exercise">Exercise</AppSelectOption><AppSelectOption value="nutrition">Nutrition</AppSelectOption>
            </AppSelect>
          </div>
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: Number(e.target.value) }))} placeholder="Target"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
            <input value={form.target_unit} onChange={e => setForm(p => ({ ...p, target_unit: e.target.value }))} placeholder="Unit"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
            <input type="number" value={form.duration_days} onChange={e => setForm(p => ({ ...p, duration_days: Number(e.target.value) }))} placeholder="Days"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-challenge" onClick={createChallenge} className="bg-amber-500 hover:bg-amber-600 text-black text-xs">Create Challenge</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {challenges.map(ch => (
          <div key={ch.id} className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid={`ch-${ch.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Trophy size={18} style={{ color: TYPE_COLORS[ch.type] || "#D97706" }} />
                <div>
                  <p className="font-display text-sm font-bold text-white">{ch.name}</p>
                  <p className="font-mono text-[8px] text-slate-500">{ch.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-[7px]" style={{ backgroundColor: (TYPE_COLORS[ch.type] || "#D97706") + "15", color: TYPE_COLORS[ch.type] || "#D97706" }}>{ch.type}</Badge>
                <Badge className={`font-mono text-[7px] ${ch.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>{ch.status}</Badge>
              </div>
            </div>
            <div className="flex gap-4 font-mono text-[9px] text-slate-400">
              <span>Target: {ch.target} {ch.target_unit}</span>
              <span>Duration: {ch.duration_days} days</span>
              <span>Created: {new Date(ch.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {challenges.length === 0 && <p className="text-slate-500 text-sm text-center py-12">No challenges yet. Create one to engage your clients!</p>}
      </div>
    </div>
  );
}
