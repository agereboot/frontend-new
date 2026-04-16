import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, Users, Shield, Activity, HeartPulse } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";

const BRI_COLORS = { green: "#10B981", yellow: "#D97706", orange: "#F97316", red: "#EF4444" };
const BRI_LABELS = { green: "Low Risk", yellow: "Moderate", orange: "High Risk", red: "Critical" };

export default function CorpBurnoutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/corporate/burnout/overview").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load data</div>;

  const pieData = Object.entries(data.tier_distribution).map(([k, v]) => ({ name: BRI_LABELS[k], value: v, color: BRI_COLORS[k] }));
  const total = Object.values(data.tier_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-burnout-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Burnout <span className="text-orange-400">Risk Index</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">MULTI-DIMENSIONAL BURNOUT DETECTION ENGINE &bull; {data.total_at_risk} AT-RISK EMPLOYEES</p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(data.tier_distribution).map(([tier, count]) => (
          <div key={tier} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`bri-tier-${tier}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRI_COLORS[tier] }} />
              <span className="font-mono text-[8px] text-slate-400 uppercase tracking-wider">{BRI_LABELS[tier]}</span>
            </div>
            <p className="font-mono text-3xl font-black" style={{ color: BRI_COLORS[tier] }}>{count}</p>
            <p className="font-mono text-[7px] text-slate-500">{total ? Math.round((count / total) * 100) : 0}% of workforce</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="bri-pie">
          <h3 className="font-display text-xs font-bold text-white mb-3">Risk Distribution</h3>
          <div className="flex gap-6 items-center">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map(t => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-mono text-[10px] text-slate-400 flex-1">{t.name}</span>
                  <span className="font-mono text-xs font-bold text-white">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="bri-trend">
          <h3 className="font-display text-xs font-bold text-white mb-3">12-Week Burnout Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.weekly_trend}>
              <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="green" stackId="1" stroke="#10B981" fill="#10B98130" />
              <Area type="monotone" dataKey="yellow" stackId="1" stroke="#D97706" fill="#D9770630" />
              <Area type="monotone" dataKey="orange" stackId="1" stroke="#F97316" fill="#F9731630" />
              <Area type="monotone" dataKey="red" stackId="1" stroke="#EF4444" fill="#EF444430" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Burnout */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="bri-dept">
        <h3 className="font-display text-xs font-bold text-white mb-3">Department Burnout Ranking</h3>
        <ResponsiveContainer width="100%" height={Math.max(180, data.department_burnout.length * 45)}>
          <BarChart data={data.department_burnout} layout="vertical" margin={{ left: 100 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} />
            <YAxis type="category" dataKey="department" tick={{ fill: "#CBD5E1", fontSize: 10, fontFamily: "monospace" }} axisLine={false} width={100} />
            <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Bar dataKey="avg_bri" radius={[0, 4, 4, 0]} barSize={18}>
              {data.department_burnout.map((d, i) => (
                <Cell key={i} fill={d.avg_bri >= 50 ? "#EF4444" : d.avg_bri >= 25 ? "#D97706" : "#10B981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* At-Risk Employees */}
      {data.at_risk_employees.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5" data-testid="bri-at-risk">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-400" />
            <h3 className="font-display text-xs font-bold text-red-400">At-Risk Employees ({data.at_risk_employees.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Employee", "Dept", "BRI", "Tier", "Physiological", "Behavioural", "Psychological", "Organisational"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.at_risk_employees.map(emp => (
                  <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-body text-xs text-white">{emp.name}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">{emp.department}</td>
                    <td className="px-3 py-2 font-mono text-xs font-bold" style={{ color: BRI_COLORS[emp.bri_tier] }}>{emp.bri_score}</td>
                    <td className="px-3 py-2"><Badge className="font-mono text-[7px] capitalize" style={{ backgroundColor: BRI_COLORS[emp.bri_tier] + "15", color: BRI_COLORS[emp.bri_tier] }}>{emp.bri_tier}</Badge></td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">{emp.physiological}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">{emp.behavioural}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">{emp.psychological}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">{emp.organisational}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
