import { useState } from "react";
import api from "@/lib/api";
import { Sliders, Play, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const ACCENT = "#8B5CF6";

function fmt(v) { return v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`; }

export default function CXOSimulatorPage() {
  const [params, setParams] = useState({
    investment_change_pct: 20, target_department: "", programme_type: "",
    participation_rate_pct: 70, duration_months: 12,
  });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const r = await api.post("/cxo/simulator/what-if", params);
      setResult(r.data);
    } catch { }
    setRunning(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-simulator-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">What-If <span className="text-violet-400">Simulator</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Model investment scenarios and project outcomes</p>
      </div>

      {/* Input Panel */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-6" data-testid="sim-inputs">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Simulation Parameters</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Investment Change %</label>
            <input type="number" value={params.investment_change_pct} onChange={e => setParams(p => ({ ...p, investment_change_pct: +e.target.value }))}
              className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-violet-500/50 outline-none" data-testid="sim-investment" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Participation Rate %</label>
            <input type="number" value={params.participation_rate_pct} onChange={e => setParams(p => ({ ...p, participation_rate_pct: +e.target.value }))}
              className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-violet-500/50 outline-none" data-testid="sim-participation" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Duration (months)</label>
            <input type="number" value={params.duration_months} onChange={e => setParams(p => ({ ...p, duration_months: +e.target.value }))}
              className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-violet-500/50 outline-none" data-testid="sim-duration" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Target Department</label>
            <AppSelect value={params.target_department} onChange={e => setParams(p => ({ ...p, target_department: e.target.value }))}
              className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-violet-500/50 outline-none" data-testid="sim-dept">
              <AppSelectOption value="">All Departments</AppSelectOption>
              {["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR", "Product", "Support"].map(d => <AppSelectOption key={d} value={d}>{d}</AppSelectOption>)}
            </AppSelect>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={running} data-testid="sim-run-btn"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 disabled:opacity-50">
              {running ? <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Play size={14} />}
              Run Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Projected ROI", value: `${result.projected.roi}x`, color: "#10B981" },
              { label: "HPS Lift", value: `+${result.projected.hps_lift}`, color: ACCENT },
              { label: "Engagement Lift", value: `+${result.projected.engagement_lift}%`, color: "#6366F1" },
              { label: "Total Return Delta", value: fmt(result.projected.total_return_delta), color: "#F59E0B" },
              { label: "Break-Even Month", value: result.breakeven_month, color: "#0F9F8F" },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-white/5 bg-[#11111a] p-4 text-center">
                <p className="font-mono text-[8px] text-slate-500 uppercase">{m.label}</p>
                <p className="font-display text-2xl font-bold mt-2" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Scenarios */}
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="sim-scenarios">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Scenario Comparison</p>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(result.scenarios).map(([k, v]) => (
                <div key={k} className={`rounded-lg border p-4 ${k === "expected" ? "border-violet-500/20 bg-violet-500/5" : "border-white/5"}`}>
                  <p className="text-xs text-slate-400 capitalize font-medium">{k}</p>
                  <p className="text-xl font-bold text-white mt-2">{v.roi}x <span className="text-sm text-slate-400">ROI</span></p>
                  <p className="text-xs text-slate-500 mt-1">HPS: +{v.hps_lift} &middot; Return: {fmt(v.total_return_delta)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Projection */}
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="sim-chart">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Monthly Projection</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.monthly_projection}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} yAxisId="left" tickFormatter={v => fmt(v)} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} yAxisId="right" orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                  <Area yAxisId="left" type="monotone" dataKey="cumulative_impact" stroke={ACCENT} fill={ACCENT + "20"} strokeWidth={2} name="Cumulative Impact" />
                  <Area yAxisId="right" type="monotone" dataKey="hps_projected" stroke="#10B981" fill="#10B98110" strokeWidth={1} name="HPS Projected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Breakdown */}
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="sim-breakdown">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Projected Savings Breakdown</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Healthcare", value: result.projected.healthcare_savings, color: "#10B981" },
                { label: "Absenteeism", value: result.projected.absenteeism_savings, color: "#6366F1" },
                { label: "Productivity", value: result.projected.productivity_gain, color: "#F59E0B" },
                { label: "Talent", value: result.projected.talent_savings, color: "#8B5CF6" },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-white/5 p-3 text-center">
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold font-mono mt-1" style={{ color: s.color }}>{fmt(s.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-4">
            <p className="text-sm text-violet-300">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
