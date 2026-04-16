import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Building2, HeartPulse, Activity, Zap, Trophy, DollarSign, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const HPS_TIER_COLORS = { CENTENARIAN: "#C0C0FF", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1", VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626" };

export default function CorpDepartmentsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/corporate/departments").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const depts = data.departments || [];
  const sel = selected !== null ? depts[selected] : null;

  const radarData = sel ? [
    { metric: "HPS", value: Math.min(sel.avg_hps / 10, 100) },
    { metric: "EHS", value: sel.avg_ehs },
    { metric: "BRI (inv)", value: Math.max(0, 100 - sel.avg_bri) },
    { metric: "Participation", value: sel.participation_rate },
    { metric: "Activation", value: sel.activation_rate },
  ] : [];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-departments-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Department <span className="text-amber-400">Analytics</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">{depts.length} DEPARTMENTS &bull; COMPARATIVE ANALYSIS</p>
      </div>

      {/* Ranking Chart */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="dept-chart">
        <h3 className="font-display text-xs font-bold text-white mb-3">Department HPS Ranking</h3>
        <ResponsiveContainer width="100%" height={Math.max(200, depts.length * 50)}>
          <BarChart data={depts} layout="vertical" margin={{ left: 120 }}>
            <XAxis type="number" domain={[0, 1000]} tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#CBD5E1", fontSize: 10, fontFamily: "monospace" }} axisLine={false} width={120} />
            <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Bar dataKey="avg_hps" radius={[0, 6, 6, 0]} barSize={22}>
              {depts.map((d, i) => {
                const color = d.avg_hps >= 700 ? "#10B981" : d.avg_hps >= 500 ? "#6366F1" : d.avg_hps >= 300 ? "#D97706" : "#EF4444";
                return <rect key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dept Table + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid="dept-table">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["#", "Department", "Employees", "Avg HPS", "Avg EHS", "Avg BRI", "Profit-Share", "Participation"].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map((d, i) => (
                <tr key={d.name} onClick={() => setSelected(i)}
                  className={`border-b border-white/[0.03] cursor-pointer transition-all ${selected === i ? "bg-amber-500/5 border-l-2 border-l-amber-500" : "hover:bg-white/[0.02]"}`}
                  data-testid={`dept-row-${i}`}>
                  <td className="px-3 py-2.5">
                    <div className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500"}`}>{i + 1}</div>
                  </td>
                  <td className="px-3 py-2.5 font-body text-xs text-white">{d.name}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-300">{d.employee_count}</td>
                  <td className="px-3 py-2.5 font-mono text-xs font-bold" style={{ color: d.avg_hps >= 600 ? "#10B981" : d.avg_hps >= 400 ? "#D97706" : "#EF4444" }}>{d.avg_hps}</td>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: d.avg_ehs >= 60 ? "#10B981" : "#D97706" }}>{d.avg_ehs}</td>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: d.avg_bri >= 50 ? "#EF4444" : "#10B981" }}>{d.avg_bri}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-emerald-400">{d.profit_share_eligible}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-300">{d.participation_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="dept-detail">
          {sel ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-bold text-white">{sel.name}</h3>
                <p className="font-mono text-[8px] text-slate-500">{sel.employee_count} employees</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Avg HPS", value: sel.avg_hps, color: sel.avg_hps >= 600 ? "#10B981" : "#D97706" },
                  { label: "Avg EHS", value: sel.avg_ehs, color: sel.avg_ehs >= 60 ? "#10B981" : "#D97706" },
                  { label: "Avg BRI", value: sel.avg_bri, color: sel.avg_bri < 50 ? "#10B981" : "#EF4444" },
                  { label: "Activation", value: `${sel.activation_rate}%`, color: "#6366F1" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                    <p className="font-mono text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-mono text-[6px] text-slate-500 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Radar */}
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#94A3B8", fontSize: 9, fontFamily: "monospace" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#D97706" fill="#D97706" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* HPS Tier Distribution */}
              {sel.hps_tier_distribution && Object.keys(sel.hps_tier_distribution).length > 0 && (
                <div>
                  <p className="font-mono text-[8px] text-slate-500 mb-2 uppercase">HPS Tier Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(sel.hps_tier_distribution).map(([tier, count]) => (
                      <div key={tier} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: HPS_TIER_COLORS[tier] || "#64748B" }} />
                        <span className="font-mono text-[9px] text-slate-400 flex-1">{tier}</span>
                        <span className="font-mono text-[10px] font-bold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p className="font-mono text-xs text-center">Click a department row to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
