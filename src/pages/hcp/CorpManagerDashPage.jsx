import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, HeartPulse, Activity, Zap,
  AlertTriangle, TrendingUp, ChevronRight,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const BRI_COLORS = { green: "#10B981", yellow: "#D97706", orange: "#F97316", red: "#EF4444" };

export default function CorpManagerDashPage() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/corporate/departments").then(r => {
      const depts = r.data.departments || [];
      setDepartments(depts);
      if (depts.length > 0) loadDept(depts[0].name);
    }).finally(() => setLoading(false));
  }, []);

  const loadDept = async (name) => {
    setSelectedDept(name);
    try {
      const { data } = await api.get(`/corporate/manager-view/${encodeURIComponent(name)}`);
      setManagerData(data);
    } catch { setManagerData(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-manager-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Manager <span className="text-indigo-400">Dashboard</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">CONFIGURABLE WIDGET-BASED VIEW OF DIRECT REPORTS</p>
      </div>

      {/* Department Selector */}
      <div className="flex gap-2 flex-wrap" data-testid="dept-selector">
        {departments.map(d => (
          <button key={d.name} onClick={() => loadDept(d.name)} data-testid={`dept-btn-${d.name}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${selectedDept === d.name ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-white/[0.02] text-slate-500 border border-white/5 hover:bg-white/[0.04]"}`}>
            {d.name} <span className="text-[8px] opacity-60">({d.employee_count})</span>
          </button>
        ))}
      </div>

      {managerData && (
        <>
          {/* Widget Row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Team Size", value: managerData.team_size, icon: Users, color: "#6366F1" },
              { label: "Avg HPS", value: managerData.avg_hps, icon: HeartPulse, color: managerData.avg_hps >= 600 ? "#10B981" : "#D97706" },
              { label: "Avg EHS", value: managerData.widgets.engagement.avg_ehs, icon: Activity, color: "#10B981" },
              { label: "At-Risk", value: managerData.widgets.burnout.at_risk_count, icon: AlertTriangle, color: "#EF4444" },
            ].map(w => (
              <div key={w.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center" data-testid={`mgr-widget-${w.label.toLowerCase().replace(/\s/g, "-")}`}>
                <w.icon size={16} style={{ color: w.color }} className="mx-auto mb-1" />
                <p className="font-mono text-2xl font-black" style={{ color: w.color }}>{w.value}</p>
                <p className="font-mono text-[7px] text-slate-500 uppercase">{w.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Radar */}
            <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="mgr-radar">
              <h3 className="font-display text-xs font-bold text-white mb-3">Department Health Profile</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={[
                  { metric: "HPS", value: Math.min(managerData.avg_hps / 10, 100) },
                  { metric: "EHS", value: managerData.widgets.engagement.avg_ehs },
                  { metric: "Low BRI", value: Math.max(0, 100 - (managerData.at_risk.length / Math.max(managerData.team_size, 1)) * 100) },
                  { metric: "HPS Min", value: Math.min(managerData.widgets.hps_summary.min / 10, 100) },
                  { metric: "HPS Max", value: Math.min(managerData.widgets.hps_summary.max / 10, 100) },
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94A3B8", fontSize: 9, fontFamily: "monospace" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Team List */}
            <div className="lg:col-span-8 rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid="mgr-team">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-display text-xs font-bold text-white">Team Members ({managerData.team_size})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Employee", "HPS", "Tier", "EHS", "BRI", "Last Active"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {managerData.team.map(m => (
                      <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-3 py-2">
                          <p className="font-body text-[11px] text-white">{m.name}</p>
                          <p className="font-mono text-[7px] text-slate-500">{m.email}</p>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-bold" style={{ color: m.hps >= 600 ? "#10B981" : m.hps >= 400 ? "#D97706" : "#EF4444" }}>{m.hps}</td>
                        <td className="px-3 py-2"><Badge className="font-mono text-[6px] bg-white/5 text-slate-400">{m.hps_tier}</Badge></td>
                        <td className="px-3 py-2 font-mono text-[10px]" style={{ color: m.ehs >= 60 ? "#10B981" : "#D97706" }}>{m.ehs}</td>
                        <td className="px-3 py-2"><Badge className="font-mono text-[7px] capitalize" style={{ backgroundColor: (BRI_COLORS[m.bri_tier] || "#64748B") + "15", color: BRI_COLORS[m.bri_tier] || "#64748B" }}>{m.bri_tier}</Badge></td>
                        <td className="px-3 py-2 font-mono text-[8px] text-slate-500">{m.last_activity ? new Date(m.last_activity).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* At-Risk */}
          {managerData.at_risk.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4" data-testid="mgr-at-risk">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <h3 className="font-display text-xs font-bold text-red-400">At-Risk Team Members ({managerData.at_risk.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {managerData.at_risk.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex-1"><p className="font-body text-[11px] text-white">{m.name}</p><p className="font-mono text-[7px] text-slate-500">BRI: {m.bri} | EHS: {m.ehs}</p></div>
                    <Badge className="font-mono text-[7px] capitalize" style={{ backgroundColor: BRI_COLORS[m.bri_tier] + "15", color: BRI_COLORS[m.bri_tier] }}>{m.bri_tier}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
