import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Trophy, Crown, Star, Target, Calendar, Plus,
  ChevronRight, CheckCircle, Clock, X, Zap,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MS_COLORS = { Bronze: "#CD7F32", Silver: "#C0C0C0", Gold: "#FFD700", Platinum: "#C0C0FF" };

export default function CorpSeasonPage() {
  const [seasons, setSeasons] = useState([]);
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tracker");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", qualification_hps: 550, reward_pool_inr: 5000000 });

  useEffect(() => {
    Promise.all([
      api.get("/corporate/seasons").then(r => setSeasons(r.data.seasons || [])),
      api.get("/corporate/qualification-tracker").then(r => setTracker(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const createSeason = async () => {
    if (!form.name) return toast.error("Name required");
    try {
      const { data } = await api.post("/corporate/seasons", form);
      setSeasons(s => [data, ...s]);
      setShowCreate(false);
      toast.success("Season created");
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;

  const activeSeason = seasons.find(s => s.status === "active") || seasons[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-season-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Season <span className="text-amber-400">Management</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">{activeSeason?.name || "No Active Season"}</p>
        </div>
        <Button data-testid="create-season-btn" onClick={() => setShowCreate(true)} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1"><Plus size={14} />New Season</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/30 rounded-lg p-0.5 border border-white/5 w-fit">
        {[{ id: "tracker", label: "Qualification Tracker" }, { id: "seasons", label: "Season Config" }, { id: "milestones", label: "Milestones" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} data-testid={`season-tab-${t.id}`}
            className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all ${tab === t.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tracker" && tracker && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center" data-testid="qual-total">
              <p className="font-mono text-3xl font-black text-white">{tracker.total}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Total Employees</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 text-center" data-testid="qual-qualified">
              <p className="font-mono text-3xl font-black text-emerald-400">{tracker.qualified}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Qualified (550+)</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 text-center">
              <p className="font-mono text-3xl font-black text-amber-400">{tracker.qualification_pct}%</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Qualification Rate</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
              <p className="font-mono text-3xl font-black text-indigo-400">{tracker.total - tracker.qualified}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Remaining</p>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="milestone-bars">
            <h3 className="font-display text-xs font-bold text-white mb-4">Milestone Achievement</h3>
            <div className="space-y-3">
              {tracker.milestone_summary.map(m => (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Star size={12} style={{ color: m.color }} />
                      <span className="font-mono text-[10px] text-slate-300">{m.name} (HPS {m.hps}+)</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-white">{m.reached}/{m.total} ({m.pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Tracker Table */}
          <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid="qual-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Employee", "Dept", "HPS", "Bronze", "Silver", "Gold", "Platinum", "Next Goal", "Gap"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tracker.employees.slice(0, 30).map(emp => (
                    <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-body text-[11px] text-white">{emp.name}</td>
                      <td className="px-3 py-2 font-mono text-[9px] text-slate-400">{emp.department}</td>
                      <td className="px-3 py-2 font-mono text-xs font-bold" style={{ color: emp.hps >= 600 ? "#10B981" : emp.hps >= 400 ? "#D97706" : "#EF4444" }}>{emp.hps}</td>
                      {emp.milestones.map(m => (
                        <td key={m.name} className="px-3 py-2 text-center">
                          {m.reached ? <CheckCircle size={14} style={{ color: MS_COLORS[m.name] }} /> : <div className="w-3.5 h-3.5 rounded-full border border-white/10 mx-auto" />}
                        </td>
                      ))}
                      <td className="px-3 py-2 font-mono text-[9px]" style={{ color: emp.next_milestone ? "#D97706" : "#10B981" }}>
                        {emp.next_milestone ? emp.next_milestone.name : "All Done"}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] font-bold" style={{ color: emp.gap > 0 ? "#EF4444" : "#10B981" }}>
                        {emp.gap > 0 ? `+${emp.gap}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "seasons" && (
        <div className="space-y-3">
          {seasons.map(s => (
            <div key={s.id} className={`rounded-xl border p-5 ${s.status === "active" ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-white/5 bg-black/20"}`} data-testid={`season-${s.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    <h3 className="font-display text-sm font-bold text-white">{s.name}</h3>
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: s.status === "active" ? "#10B98115" : "#64748B15", color: s.status === "active" ? "#10B981" : "#64748B" }}>{s.status}</Badge>
                  </div>
                  <p className="font-mono text-[9px] text-slate-500 mt-1">{s.start_date} to {s.end_date} &bull; Target HPS: {s.qualification_hps} &bull; Pool: INR {(s.reward_pool_inr / 100000).toFixed(1)}L</p>
                </div>
              </div>
              {s.rules && s.rules.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {s.rules.map((r, i) => (
                    <Badge key={i} className="font-mono text-[7px] bg-white/5 text-slate-400">{r.label}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "milestones" && tracker && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5">
          <h3 className="font-display text-xs font-bold text-white mb-4">Milestone Achievement Chart</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tracker.milestone_summary}>
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="reached" radius={[6, 6, 0, 0]} barSize={40}>
                {tracker.milestone_summary.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Create Season Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0D0D12] border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-display text-sm font-bold text-white">Create Season</h3><button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X size={16} /></button></div>
            <input data-testid="season-name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Season name" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="font-mono text-[8px] text-slate-500">Start</label><input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none mt-1" /></div>
              <div><label className="font-mono text-[8px] text-slate-500">End</label><input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none mt-1" /></div>
            </div>
            <Button data-testid="create-season-submit" onClick={createSeason} className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs">Create Season</Button>
          </div>
        </div>
      )}
    </div>
  );
}
