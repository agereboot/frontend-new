import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Users, TrendingUp, AlertTriangle, Star,
  ChevronRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const EHS_COLORS = { Champion: "#10B981", Engaged: "#6366F1", Moderate: "#D97706", "At-Risk": "#EF4444", Critical: "#DC2626" };

export default function CorpEngagementPage() {
  const [data, setData] = useState(null);
  const [inactive, setInactive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    Promise.all([
      api.get("/corporate/engagement/overview"),
      api.get("/corporate/engagement/inactive"),
    ]).then(([ov, inact]) => {
      setData(ov.data);
      setInactive(inact.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load data</div>;

  const ehsPieData = Object.entries(data.tier_distribution).map(([k, v]) => ({ name: k, value: v, color: EHS_COLORS[k] || "#64748B" }));

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-engagement-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Engagement <span className="text-emerald-400">Health Score</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">REAL-TIME ENGAGEMENT MONITORING ACROSS {data.total_employees} EMPLOYEES</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-black/30 rounded-lg p-0.5 border border-white/5 w-fit">
        {[{ id: "overview", label: "Overview" }, { id: "heatmap", label: "Dept Heatmap" }, { id: "inactive", label: "Inactive" }].map(t => (
          <button key={t.id} data-testid={`eng-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all ${tab === t.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center" data-testid="ehs-avg">
              <p className="font-mono text-3xl font-black text-emerald-400">{data.avg_ehs}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Average EHS</p>
            </div>
            {Object.entries(data.tier_distribution).map(([tier, count]) => (
              <div key={tier} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                <p className="font-mono text-2xl font-black" style={{ color: EHS_COLORS[tier] }}>{count}</p>
                <p className="font-mono text-[7px] text-slate-500 uppercase">{tier}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribution Pie */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="ehs-pie">
              <h3 className="font-display text-xs font-bold text-white mb-3">EHS Tier Distribution</h3>
              <div className="flex gap-6">
                <div className="w-36 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={ehsPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" stroke="none">
                      {ehsPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 justify-center flex flex-col">
                  {ehsPieData.map(t => (
                    <div key={t.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-mono text-[10px] text-slate-400 flex-1">{t.name}</span>
                      <span className="font-mono text-xs font-bold text-white">{t.value}</span>
                      <span className="font-mono text-[8px] text-slate-500">{data.total_employees ? Math.round((t.value / data.total_employees) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="ehs-trend">
              <h3 className="font-display text-xs font-bold text-white mb-3">Weekly EHS Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.weekly_trend}>
                  <defs><linearGradient id="ehsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient></defs>
                  <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis domain={[30, 80]} tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} labelStyle={{ color: "#64748B", fontSize: 10 }} />
                  <Area type="monotone" dataKey="avg_ehs" stroke="#10B981" fill="url(#ehsGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === "heatmap" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="dept-heatmap">
            <h3 className="font-display text-xs font-bold text-white mb-4">Department Engagement Heatmap</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, data.department_heatmap.length * 50)}>
              <BarChart data={data.department_heatmap} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 8, fontFamily: "monospace" }} axisLine={false} />
                <YAxis type="category" dataKey="department" tick={{ fill: "#CBD5E1", fontSize: 10, fontFamily: "monospace" }} axisLine={false} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Bar dataKey="avg_ehs" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail Table */}
          <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Department", "Employees", "Avg EHS", "Champions", "Critical", "Participation"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.department_heatmap.map(d => (
                  <tr key={d.department} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-body text-xs text-white">{d.department}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{d.employee_count}</td>
                    <td className="px-4 py-2.5"><span className="font-mono text-xs font-bold" style={{ color: d.avg_ehs >= 60 ? "#10B981" : d.avg_ehs >= 40 ? "#D97706" : "#EF4444" }}>{d.avg_ehs}</span></td>
                    <td className="px-4 py-2.5 font-mono text-xs text-emerald-400">{d.champions}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-red-400">{d.critical}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{d.participation_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "inactive" && inactive && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
              <p className="font-mono text-2xl font-black text-red-400">{inactive.total_inactive}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Total Inactive</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
              <p className="font-mono text-2xl font-black text-amber-400">{inactive.inactive_7d.length}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">7-Day Inactive</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
              <p className="font-mono text-2xl font-black text-orange-400">{inactive.inactive_14d.length}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">14-Day Inactive</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
              <p className="font-mono text-2xl font-black text-red-400">{inactive.inactive_30d.length}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">30+ Day Inactive</p>
            </div>
          </div>

          {[{ label: "30+ Days Inactive", items: inactive.inactive_30d, color: "#EF4444" },
            { label: "14-Day Inactive", items: inactive.inactive_14d, color: "#F97316" },
            { label: "7-Day Inactive", items: inactive.inactive_7d, color: "#D97706" },
          ].filter(g => g.items.length > 0).map(g => (
            <div key={g.label} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <h3 className="font-display text-xs font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: g.color }} />{g.label}
                <Badge className="font-mono text-[7px]" style={{ backgroundColor: g.color + "15", color: g.color }}>{g.items.length}</Badge>
              </h3>
              <div className="space-y-2">
                {g.items.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="font-body text-xs text-white">{emp.name}</p>
                      <p className="font-mono text-[8px] text-slate-500">{emp.department} &bull; {emp.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold" style={{ color: g.color }}>{emp.days_inactive}d</p>
                      <p className="font-mono text-[7px] text-slate-500">inactive</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
