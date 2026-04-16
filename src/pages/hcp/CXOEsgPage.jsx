import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Globe, Shield, Leaf } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const ACCENT = "#0F9F8F";

export default function CXOEsgPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/cxo/drill/esg").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const { gri_403_breakdown, brsr_p3_breakdown, quarterly_trend, sdg_contributions, carbon_health_equivalent } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-esg-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">ESG <span className="text-teal-400">Intelligence Module</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">GRI 403, BRSR P3, SDG Contributions, Carbon-Health Equivalence</p>
      </div>

      {/* SDG + Carbon */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.15em]">SDG 3: Good Health</p>
          <p className="font-display text-3xl font-bold text-teal-400 mt-2">{sdg_contributions.sdg_3.score}%</p>
          <p className="text-xs text-slate-400 mt-1">{sdg_contributions.sdg_3.initiatives} initiatives</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.15em]">SDG 8: Decent Work</p>
          <p className="font-display text-3xl font-bold text-blue-400 mt-2">{sdg_contributions.sdg_8.score}%</p>
          <p className="text-xs text-slate-400 mt-1">{sdg_contributions.sdg_8.initiatives} initiatives</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.15em]">CO2 Equivalent</p>
          <p className="font-display text-3xl font-bold text-emerald-400 mt-2">{carbon_health_equivalent.tonnes_co2_equivalent}</p>
          <p className="text-xs text-slate-400 mt-1">tonnes offset</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.15em]">Healthy Work Years</p>
          <p className="font-display text-3xl font-bold text-amber-400 mt-2">{carbon_health_equivalent.healthy_work_years_added}</p>
          <p className="text-xs text-slate-400 mt-1">years added</p>
        </div>
      </div>

      {/* Quarterly Trend */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="esg-trend">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Quarterly ESG Composite vs Peers</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={quarterly_trend}>
              <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="composite" stroke={ACCENT} fill={ACCENT + "20"} strokeWidth={2} name="Your Score" />
              <Area type="monotone" dataKey="peer_avg" stroke="#64748B" fill="#64748B10" strokeWidth={1} strokeDasharray="4 4" name="Peer Average" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRI 403 */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="gri-table">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">GRI 403 — Occupational Health & Safety</p>
        <div className="space-y-3">
          {gri_403_breakdown.map(item => (
            <div key={item.code} className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-500 w-20 flex-shrink-0">{item.code}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{item.name}</span><span className="text-white font-medium">{item.score}%</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.status === "compliant" ? "#10B981" : "#F59E0B" }} /></div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${item.status === "compliant" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BRSR P3 */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="brsr-table">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">BRSR Principle 3 — Employee Wellbeing</p>
        <div className="space-y-3">
          {brsr_p3_breakdown.map(item => (
            <div key={item.principle} className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-500 w-16 flex-shrink-0">{item.principle}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{item.name}</span><span className="text-white font-medium">{item.score}%</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.score}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
