import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const ACCENT = "#10B981";
const COMP_COLORS = { healthcare_cost_reduction: "#10B981", absenteeism_avoidance: "#6366F1", productivity_value: "#F59E0B", talent_cost_avoidance: "#8B5CF6", presenteeism_reduction: "#3B82F6", esg_premium: "#0F9F8F" };
const COMP_LABELS = { healthcare_cost_reduction: "Healthcare", absenteeism_avoidance: "Absenteeism", productivity_value: "Productivity", talent_cost_avoidance: "Talent", presenteeism_reduction: "Presenteeism", esg_premium: "ESG Premium" };

function fmt(v) { return v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`; }

export default function CXOFinancialPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/cxo/drill/financial").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load data</div>;

  const { programmes, healthcare, absenteeism, projection_6m, payback_analysis } = data;
  const progData = programmes.map(p => ({ name: p.name, roi: p.roi_ratio, cost: p.cost, return: p.return }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-financial-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Financial <span className="text-emerald-400">Performance Engine</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Programme ROI, Healthcare Cost Attribution, Projections</p>
      </div>

      {/* Payback Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center" data-testid="payback-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.15em]">Break-Even</p>
          <p className="font-display text-3xl font-bold text-emerald-400 mt-2">Month {payback_analysis.current_month}</p>
          <p className="text-xs text-slate-400 mt-1">{payback_analysis.months_since_breakeven} months in profit</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.15em]">Healthcare Savings</p>
          <p className="font-display text-3xl font-bold text-white mt-2">{fmt(healthcare.delta)}</p>
          <p className="text-xs text-slate-400 mt-1">Premium reduction: {healthcare.premium_reduction_pct}%</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.15em]">Absenteeism Saved</p>
          <p className="font-display text-3xl font-bold text-white mt-2">{fmt(absenteeism.total_savings)}</p>
          <p className="text-xs text-slate-400 mt-1">{absenteeism.pre_days_per_emp}d → {absenteeism.post_days_per_emp}d/employee</p>
        </div>
      </div>

      {/* Programme ROI */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="programme-roi">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Per-Programme ROI Attribution</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs border-b border-white/5">
              <th className="pb-2 font-medium">Programme</th><th className="pb-2 font-medium">Cost</th><th className="pb-2 font-medium">Return</th>
              <th className="pb-2 font-medium">ROI</th><th className="pb-2 font-medium">Participants</th>
            </tr></thead>
            <tbody>{programmes.map(p => (
              <tr key={p.name} className="border-b border-white/[0.03] text-slate-300">
                <td className="py-2.5 font-medium text-white">{p.name}</td>
                <td className="py-2.5 font-mono">{fmt(p.cost)}</td>
                <td className="py-2.5 font-mono text-emerald-400">{fmt(p.return)}</td>
                <td className="py-2.5"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">{p.roi_ratio}x</span></td>
                <td className="py-2.5">{p.participants}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* 6-Month Projection */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="projection-chart">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">6-Month ROI Projection (Conservative / Expected / Optimistic)</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection_6m}>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}x`} />
              <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="optimistic" stroke="#10B981" fill="#10B98110" strokeWidth={1} strokeDasharray="4 4" name="Optimistic" />
              <Area type="monotone" dataKey="projected_roi" stroke="#CFB53B" fill="#CFB53B15" strokeWidth={2} name="Expected" />
              <Area type="monotone" dataKey="conservative" stroke="#64748B" fill="#64748B10" strokeWidth={1} strokeDasharray="4 4" name="Conservative" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
