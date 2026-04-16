import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Activity, Zap, Users, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const BRI = { green: "#10B981", yellow: "#EAB308", orange: "#F97316", red: "#EF4444" };
const RISK_C = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };

function Badge({ level }) {
  const c = RISK_C[level] || "#64748B";
  return <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: c + "15", color: c }}>{level}</span>;
}

export default function CXOOperationsPage() {
  const [tab, setTab] = useState("engagement");
  const [eng, setEng] = useState(null);
  const [bri, setBri] = useState(null);
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/cxo/drill/engagement").then(r => setEng(r.data)),
      api.get("/cxo/drill/burnout").then(r => setBri(r.data)),
      api.get("/cxo/drill/operations").then(r => setOps(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  const tabs = [
    { key: "engagement", label: "Engagement", icon: Activity },
    { key: "burnout", label: "Burnout Risk", icon: Zap },
    { key: "operations", label: "Workforce Ops", icon: Users },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-operations-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Operations <span className="text-blue-400">Excellence Centre</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Engagement, Burnout Risk, Workforce Availability</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" data-testid="ops-tabs">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`ops-tab-${t.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${tab === t.key ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-slate-400 border border-white/5 hover:bg-white/5"}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Engagement Tab */}
      {tab === "engagement" && eng && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 rounded-xl border border-white/5 bg-[#11111a] p-5">
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Weekly Engagement Score</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={eng.weekly_trend}>
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="score" stroke="#6366F1" fill="#6366F120" strokeWidth={2} name="Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5 rounded-xl border border-white/5 bg-[#11111a] p-5">
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Feature Adoption</p>
              {eng.feature_adoption?.map(f => (
                <div key={f.feature} className="mb-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{f.feature}</span><span className="text-white">{f.usage_pct}%</span></div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${f.usage_pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Engagement by Department</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500 text-xs border-b border-white/5">
                  <th className="pb-2">Department</th><th className="pb-2">Score</th><th className="pb-2">Active %</th><th className="pb-2">Sessions/wk</th>
                </tr></thead>
                <tbody>{eng.by_department?.map(d => (
                  <tr key={d.department} className="border-b border-white/[0.03] text-slate-300">
                    <td className="py-2 text-white font-medium">{d.department}</td>
                    <td className="py-2 font-mono text-indigo-400">{d.score}</td>
                    <td className="py-2">{d.active_pct}%</td>
                    <td className="py-2 font-mono">{d.sessions_week}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Burnout Tab */}
      {tab === "burnout" && bri && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">BRI Trend (12 weeks)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bri.weekly_trend}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="green_pct" stackId="1" stroke="#10B981" fill="#10B98130" name="Green %" />
                  <Area type="monotone" dataKey="yellow_pct" stackId="1" stroke="#EAB308" fill="#EAB30830" name="Yellow %" />
                  <Area type="monotone" dataKey="orange_pct" stackId="1" stroke="#F97316" fill="#F9731630" name="Orange %" />
                  <Area type="monotone" dataKey="red_pct" stackId="1" stroke="#EF4444" fill="#EF444430" name="Red %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Department BRI Heatmap</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {bri.by_department?.map(d => (
                <div key={d.department} className="rounded-lg border border-white/5 p-3">
                  <p className="text-xs text-white font-medium">{d.department}</p>
                  <p className="text-lg font-bold font-mono text-slate-300 mt-1">{d.avg_score}</p>
                  <div className="flex gap-1 mt-2">{Object.entries(d.zones).map(([z, c]) => (
                    <div key={z} className="flex-1 h-2 rounded-full" style={{ backgroundColor: BRI[z], opacity: c > 0 ? 1 : 0.2 }} />
                  ))}</div>
                  <div className="flex items-center gap-1 mt-2">
                    {d.trajectory === "improving" ? <ArrowUpRight size={12} className="text-emerald-400" /> : d.trajectory === "worsening" ? <ArrowDownRight size={12} className="text-red-400" /> : <Minus size={12} className="text-slate-500" />}
                    <span className="text-[10px] text-slate-500 capitalize">{d.trajectory}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-3">Risk Factors Impact</p>
            {bri.risk_factors?.map(f => (
              <div key={f.factor} className="mb-3">
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{f.factor}</span><span className="text-white">{f.impact_score}/10</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-red-500" style={{ width: `${f.impact_score * 10}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {tab === "operations" && ops && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Absenteeism Rate", value: `${ops.workforce_availability?.absenteeism_rate}%` },
              { label: "Presenteeism Est.", value: ops.workforce_availability?.presenteeism_estimate },
              { label: "Productive Capacity", value: `${ops.workforce_availability?.productive_capacity_pct}%` },
              { label: "HPS-Productivity r²", value: ops.correlation_coefficient },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-white/5 bg-[#11111a] p-4 text-center">
                <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.15em]">{m.label}</p>
                <p className="font-display text-2xl font-bold text-white mt-2">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">HPS Band vs Productivity Index</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ops.productivity_correlation}>
                  <XAxis dataKey="hps_band" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="avg_output_index" radius={[4, 4, 0, 0]} name="Output Index">
                    {ops.productivity_correlation?.map((_, i) => <Cell key={i} fill={i < 2 ? "#10B981" : i < 4 ? "#F59E0B" : "#EF4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Department Risk Matrix</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500 text-xs border-b border-white/5">
                  <th className="pb-2">Department</th><th className="pb-2">Risk</th><th className="pb-2">Absenteeism</th><th className="pb-2">BRI Red %</th><th className="pb-2">90d Forecast</th>
                </tr></thead>
                <tbody>{ops.department_risk_matrix?.map(d => (
                  <tr key={d.department} className="border-b border-white/[0.03] text-slate-300">
                    <td className="py-2 text-white font-medium">{d.department}</td>
                    <td className="py-2"><Badge level={d.risk_level} /></td>
                    <td className="py-2 font-mono">{d.absenteeism}%</td>
                    <td className="py-2 font-mono text-red-400">{d.bri_red_pct}%</td>
                    <td className="py-2 capitalize text-xs">{d["90d_forecast"]}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
