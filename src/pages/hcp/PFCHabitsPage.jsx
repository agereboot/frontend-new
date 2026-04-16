import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Activity, Plus, Check, X, Flame, Loader2, Target } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function PFCHabitsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [habits, setHabits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [newHabit, setNewHabit] = useState({ habit_name: "", category: "exercise", frequency: "daily" });

  useEffect(() => {
    Promise.all([
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
      api.get("/coach-v2/habits/templates").then(r => setTemplates(r.data.templates || [])),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) api.get(`/coach-v2/habits/${selectedId}`).then(r => setHabits(r.data.habits || []));
  }, [selectedId]);

  const assignHabit = async (name, category) => {
    if (!selectedId) { toast.error("Select a member first"); return; }
    try {
      await api.post("/coach-v2/habits/assign", { member_id: selectedId, habit_name: name, category });
      api.get(`/coach-v2/habits/${selectedId}`).then(r => setHabits(r.data.habits || []));
      toast.success("Habit assigned");
    } catch { toast.error("Failed"); }
  };

  const logHabit = async (habitId, completed) => {
    try {
      await api.post("/coach-v2/habits/log", { habit_id: habitId, member_id: selectedId, completed });
      api.get(`/coach-v2/habits/${selectedId}`).then(r => setHabits(r.data.habits || []));
      toast.success(completed ? "Completed!" : "Logged");
    } catch { toast.error("Failed"); }
  };

  const CAT_COLORS = { exercise: "#10B981", activity: "#0F9F8F", mindfulness: "#6366F1", hydration: "#3B82F6", sleep: "#7B35D8", nutrition: "#D97706", recovery: "#EF4444", general: "#64748B" };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="habits-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Habit <span className="text-emerald-400">Tracking</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">ASSIGN, MONITOR & TRACK CLIENT HABIT ADHERENCE</p>
        </div>
        <AppSelect data-testid="habit-member-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none min-w-[200px]">
          <AppSelectOption value="">Select member</AppSelectOption>
          {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
        </AppSelect>
      </div>

      {selectedId && (
        <>
          {/* Active habits */}
          <div className="space-y-2">
            {habits.map(h => (
              <div key={h.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-center gap-4" data-testid={`habit-${h.id}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (CAT_COLORS[h.category] || "#64748B") + "15" }}>
                  <Activity size={18} style={{ color: CAT_COLORS[h.category] || "#64748B" }} />
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-white">{h.habit_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: (CAT_COLORS[h.category] || "#64748B") + "15", color: CAT_COLORS[h.category] || "#64748B" }}>{h.category}</Badge>
                    <span className="font-mono text-[8px] text-slate-500">{h.frequency}</span>
                  </div>
                </div>
                <div className="text-center px-3">
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-orange-400" />
                    <span className="font-mono text-lg font-black text-white">{h.streak}</span>
                  </div>
                  <p className="font-mono text-[7px] text-slate-500">streak</p>
                </div>
                <div className="text-center px-3">
                  <p className="font-mono text-lg font-black" style={{ color: h.completion_rate >= 70 ? "#10B981" : h.completion_rate >= 40 ? "#F59E0B" : "#EF4444" }}>{h.completion_rate}%</p>
                  <p className="font-mono text-[7px] text-slate-500">rate</p>
                </div>
                {/* Heatmap mini */}
                <div className="flex gap-0.5">
                  {(h.recent_logs || []).slice(0, 7).map((l, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: l.completed ? "#10B981" : "#1E1B3A" }} title={l.date} />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => logHabit(h.id, true)} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 h-7 px-2 text-[10px]"><Check size={12} /></Button>
                  <Button size="sm" onClick={() => logHabit(h.id, false)} className="bg-red-500/10 text-red-400 border border-red-500/20 h-7 px-2 text-[10px]"><X size={12} /></Button>
                </div>
              </div>
            ))}
          </div>

          {/* Assign from templates */}
          <div className="rounded-xl border border-white/5 bg-black/20 p-5">
            <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2"><Target size={14} className="text-emerald-400" /> Assign Habits</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {templates.map(t => (
                <button key={t.id} data-testid={`assign-${t.id}`} onClick={() => assignHabit(t.name, t.category)}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center hover:bg-white/5 transition-all">
                  <p className="font-body text-xs text-white">{t.name}</p>
                  <Badge className="font-mono text-[6px] mt-1" style={{ backgroundColor: (CAT_COLORS[t.category] || "#64748B") + "15", color: CAT_COLORS[t.category] }}>{t.category}</Badge>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedId && <p className="text-slate-500 text-sm text-center py-16">Select a member to view and manage habits</p>}
    </div>
  );
}
