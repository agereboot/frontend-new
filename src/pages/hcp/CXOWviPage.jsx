import { useState, useEffect } from "react";
import api from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

const ACCENT = "#CFB53B";
const ZONE_COLORS = { improving: "#10B981", stable: "#F59E0B", worsening: "#EF4444" };

function TrendBadge({ dir }) {
  const c = ZONE_COLORS[dir] || "#64748B";
  const Icon = dir === "improving" ? ArrowUpRight : dir === "worsening" ? ArrowDownRight : Minus;
  return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: c + "15", color: c }}><Icon size={10} />{dir}</span>;
}

export default function CXOWviPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/cxo/drill/wvi").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: ACCENT + "30", borderTopColor: ACCENT }} /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load data</div>;

  const { department_breakdown, monthly_trend, peer_benchmark, population_distribution } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-wvi-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Workforce Vitality Index <span style={{ color: ACCENT }}>Deep Dive</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Department breakdown, peer benchmark, population distribution</p>
      </div>

      {/* Department Breakdown */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="wvi-dept-table">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Department WVI Breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs border-b border-white/5">
              <th className="pb-2 font-medium">Department</th><th className="pb-2 font-medium">WVI Score</th><th className="pb-2 font-medium">Avg HPS</th>
              <th className="pb-2 font-medium">Headcount</th><th className="pb-2 font-medium">Bio Age Delta</th><th className="pb-2 font-medium">Trend</th>
            </tr></thead>
            <tbody>{department_breakdown.map(d => (
              <tr key={d.department} className="border-b border-white/[0.03] text-slate-300">
                <td className="py-2.5 font-medium text-white">{d.department}</td>
                <td className="py-2.5"><span className="font-mono font-bold" style={{ color: ACCENT }}>{d.wvi_score}</span></td>
                <td className="py-2.5 font-mono">{d.avg_hps}</td>
                <td className="py-2.5">{d.headcount}</td>
                <td className="py-2.5 font-mono text-emerald-400">{d.bio_age_delta}y</td>
                <td className="py-2.5"><TrendBadge dir={d.trend} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Monthly Trend */}
        <div className="col-span-12 lg:col-span-7 rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="wvi-trend">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">12-Month WVI vs Benchmark</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trend}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="wvi" stroke={ACCENT} fill={ACCENT + "20"} strokeWidth={2} name="Your WVI" />
                <Area type="monotone" dataKey="benchmark" stroke="#64748B" fill="#64748B10" strokeWidth={1} strokeDasharray="4 4" name="Industry Benchmark" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Population Distribution */}
        <div className="col-span-12 lg:col-span-5 rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="wvi-population">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Population HPS Distribution</p>
          {Object.entries(population_distribution).map(([k, v]) => {
            const colors = { optimal: "#10B981", high: "#6366F1", strong: "#3B82F6", healthy: "#F59E0B", developing: "#F97316", baseline: "#EF4444" };
            return (
              <div key={k} className="mb-3">
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-400 capitalize">{k}</span><span className="text-white">{v}%</span></div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: colors[k] || "#64748B" }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peer Benchmark Table */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="wvi-peers">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Peer Benchmark (Top 10)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {peer_benchmark.slice(0, 10).map(p => (
            <div key={p.rank} className={`rounded-lg p-3 border text-center ${p.is_self ? "border-[#CFB53B]/30 bg-[#CFB53B]/5" : "border-white/5"}`}>
              <p className="text-[10px] text-slate-500 font-mono">#{p.rank}</p>
              <p className="text-sm font-medium mt-1" style={p.is_self ? { color: ACCENT } : { color: "#fff" }}>{p.name}</p>
              <p className="text-lg font-bold font-mono mt-1" style={p.is_self ? { color: ACCENT } : { color: "#94A3B8" }}>{p.wvi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
