import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, Users, HeartPulse, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from "recharts";

export default function CorpAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/corporate/analytics/roi").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const { roi, impact, monthly_trend, total_employees, avg_hps } = data;
  const isPositiveROI = roi.roi_pct > 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-analytics-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Analytics & <span className="text-indigo-400">ROI</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">{total_employees} EMPLOYEES &bull; FINANCIAL & HEALTH IMPACT ANALYSIS</p>
      </div>

      {/* ROI Summary */}
      <div className="rounded-xl border border-white/5 bg-gradient-to-r from-black/40 to-indigo-950/20 p-6" data-testid="roi-summary">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ROI Gauge */}
          <div className="text-center flex flex-col justify-center items-center">
            <p className="font-mono text-[8px] text-slate-500 uppercase tracking-widest mb-2">Return on Investment</p>
            <div className={`font-display text-5xl font-black ${isPositiveROI ? "text-emerald-400" : "text-red-400"}`}>
              {roi.roi_pct > 0 ? "+" : ""}{roi.roi_pct}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {isPositiveROI ? <ArrowUpRight size={12} className="text-emerald-400" /> : <ArrowDownRight size={12} className="text-red-400" />}
              <span className="font-mono text-[9px] text-slate-400">Year over Year</span>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            {[
              { label: "Annual Investment", value: `INR ${(roi.annual_investment_inr / 100000).toFixed(1)}L`, color: "#6366F1", icon: DollarSign, sub: `INR ${roi.cost_per_hps_point.toLocaleString()}/HPS pt` },
              { label: "Healthcare Savings", value: `INR ${(roi.healthcare_savings_inr / 100000).toFixed(1)}L`, color: "#10B981", icon: HeartPulse, sub: `${impact.absenteeism_reduction_pct}% absenteeism reduction` },
              { label: "Productivity Value", value: `INR ${(roi.productivity_value_inr / 100000).toFixed(1)}L`, color: "#D97706", icon: TrendingUp, sub: `${impact.productivity_gain_pct}% productivity gain` },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-black/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "12" }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                </div>
                <p className="font-mono text-lg font-black text-white">{s.value}</p>
                <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
                <p className="font-mono text-[8px] mt-1" style={{ color: s.color }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Avg HPS", value: avg_hps, color: "#6366F1", desc: "Company average" },
          { label: "Absenteeism Reduction", value: `${impact.absenteeism_reduction_pct}%`, color: "#10B981", desc: "vs. baseline" },
          { label: "Productivity Gain", value: `${impact.productivity_gain_pct}%`, color: "#D97706", desc: "vs. baseline" },
          { label: "Profit-Share Ready", value: `${impact.profit_share_eligible_pct}%`, color: "#10B981", desc: "of workforce" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center" data-testid={`impact-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
            <p className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
            <p className="font-mono text-[7px] mt-0.5" style={{ color: s.color }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Investment vs Savings */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="roi-trend">
          <h3 className="font-display text-xs font-bold text-white mb-3">Monthly Investment vs. Returns</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => `INR ${v.toLocaleString()}`} />
              <Bar dataKey="investment" fill="#6366F130" stroke="#6366F1" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={20} name="Investment" />
              <Bar dataKey="savings" fill="#10B98130" stroke="#10B981" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={20} name="Returns" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* HPS Trend */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="hps-trend">
          <h3 className="font-display text-xs font-bold text-white mb-3">Company HPS Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly_trend}>
              <defs><linearGradient id="hpsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis domain={["dataMin - 30", "dataMax + 30"]} tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="avg_hps" stroke="#6366F1" fill="url(#hpsGrad)" strokeWidth={2} dot={{ r: 3, fill: "#6366F1" }} name="Avg HPS" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROI Waterfall */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="roi-waterfall">
        <h3 className="font-display text-xs font-bold text-white mb-4">ROI Waterfall</h3>
        <div className="space-y-3">
          {[
            { label: "Annual Investment", value: -roi.annual_investment_inr, color: "#EF4444" },
            { label: "Healthcare Cost Savings", value: roi.healthcare_savings_inr, color: "#10B981" },
            { label: "Productivity Value", value: roi.productivity_value_inr, color: "#10B981" },
            { label: "Net Benefit", value: roi.total_benefit_inr - roi.annual_investment_inr, color: isPositiveROI ? "#10B981" : "#EF4444" },
          ].map(item => {
            const maxVal = Math.max(roi.annual_investment_inr, roi.total_benefit_inr);
            const pct = Math.abs(item.value) / maxVal * 100;
            return (
              <div key={item.label} className="flex items-center gap-4">
                <span className="font-mono text-[9px] text-slate-400 w-40 shrink-0 text-right">{item.label}</span>
                <div className="flex-1 h-6 bg-white/[0.02] rounded overflow-hidden relative">
                  <div className="h-full rounded transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color + "30", borderRight: `2px solid ${item.color}` }} />
                </div>
                <span className="font-mono text-[10px] font-bold shrink-0 w-20" style={{ color: item.color }}>
                  {item.value >= 0 ? "+" : ""}INR {(Math.abs(item.value) / 100000).toFixed(1)}L
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
