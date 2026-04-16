import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Crown, Target, Users, Calendar, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function CorpFranchisePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/corporate/franchise").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const { season, franchise, dept_league, striking_range } = data;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-franchise-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Franchise & <span className="text-amber-400">League</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">{season.name} &bull; {season.days_remaining} DAYS REMAINING &bull; DEADLINE {season.qualification_deadline}</p>
      </div>

      {/* Franchise Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-6 text-center" data-testid="franchise-status">
          <Crown size={32} className="text-amber-400 mx-auto mb-2" />
          <p className="font-mono text-[10px] text-amber-400/60 uppercase tracking-widest mb-1">Franchise Ranking</p>
          <p className="font-display text-5xl font-black text-white">#{franchise.ranking}</p>
          <p className="font-mono text-[9px] text-slate-500">of {franchise.total_franchises} franchises</p>
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="font-mono text-[8px] text-slate-400">Qualification ({franchise.target_hps} HPS Target)</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: franchise.qualification_pct >= 100 ? "#10B981" : "#D97706" }}>{franchise.qualification_pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all" style={{ width: `${Math.min(franchise.qualification_pct, 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div>
              <p className="font-mono text-lg font-black text-white">{franchise.avg_hps}</p>
              <p className="font-mono text-[6px] text-slate-500 uppercase">Avg HPS</p>
            </div>
            <div>
              <p className="font-mono text-lg font-black text-emerald-400">{franchise.qualified_550}</p>
              <p className="font-mono text-[6px] text-slate-500 uppercase">Qualified 550+</p>
            </div>
            <div>
              <p className="font-mono text-lg font-black text-amber-400">{season.days_remaining}d</p>
              <p className="font-mono text-[6px] text-slate-500 uppercase">Remaining</p>
            </div>
          </div>
        </div>

        {/* Dept League Table */}
        <div className="lg:col-span-8 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="dept-league">
          <h3 className="font-display text-xs font-bold text-white mb-4 flex items-center gap-2"><Trophy size={14} className="text-amber-400" />Department League Standings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Rank", "Department", "Members", "Avg HPS", "Qualified", "Points"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dept_league.map((d, i) => (
                  <tr key={d.department} className="border-b border-white/[0.03] hover:bg-white/[0.02]" data-testid={`league-row-${i}`}>
                    <td className="px-3 py-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${i < 3 ? "" : "bg-white/5 text-slate-500"}`}
                        style={i < 3 ? { backgroundColor: RANK_COLORS[i] + "20", color: RANK_COLORS[i] } : {}}>
                        {i < 3 ? <Crown size={12} /> : d.rank}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-white">{d.department}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-300">{d.members}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold" style={{ color: d.avg_hps >= 600 ? "#10B981" : d.avg_hps >= 450 ? "#D97706" : "#EF4444" }}>{d.avg_hps}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-emerald-400">{d.qualified_members}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-amber-400">{d.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* League Chart */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="league-chart">
        <h3 className="font-display text-xs font-bold text-white mb-3">Points by Department</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dept_league}>
            <XAxis dataKey="department" tick={{ fill: "#94A3B8", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Bar dataKey="points" radius={[6, 6, 0, 0]} barSize={30}>
              {dept_league.map((d, i) => (
                <Cell key={i} fill={i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#64748B80"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Striking Range */}
      {striking_range.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5" data-testid="striking-range">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-emerald-400" />
            <h3 className="font-display text-xs font-bold text-emerald-400">Striking Range — {striking_range.length} employees within 50 HPS of qualifying</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {striking_range.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-body text-xs text-white">{emp.name}</p>
                  <p className="font-mono text-[8px] text-slate-500">Current: {emp.hps}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-emerald-400">+{emp.gap.toFixed(0)}</p>
                  <p className="font-mono text-[7px] text-slate-500">to qualify</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
