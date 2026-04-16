import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function NUTNutritionAnalyticsPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState([]);

  useEffect(() => {
    api.get("/cc/members").then(async r => {
      const mems = r.data.members || [];
      setMembers(mems);
      // Fetch compliance for first 10 members
      const compData = [];
      for (const m of mems.slice(0, 10)) {
        try {
          const c = await api.get(`/coach-v2/compliance/${m.id}`);
          compData.push({ name: m.name?.split(" ")[0] || "?", ...c.data });
        } catch {}
      }
      setCompliance(compData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  const avgCompliance = compliance.length > 0 ? Math.round(compliance.reduce((s, c) => s + (c.overall_compliance || 0), 0) / compliance.length) : 0;
  const complianceDist = [
    { name: "High (>70%)", value: compliance.filter(c => c.overall_compliance > 70).length, color: "#10B981" },
    { name: "Medium (40-70%)", value: compliance.filter(c => c.overall_compliance >= 40 && c.overall_compliance <= 70).length, color: "#F59E0B" },
    { name: "Low (<40%)", value: compliance.filter(c => c.overall_compliance < 40).length, color: "#EF4444" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="nutrition-analytics-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Nutrition <span className="text-teal-400">Analytics</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">POPULATION-LEVEL NUTRITION INSIGHTS & ADHERENCE</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Clients", value: members.length, color: "#0F9F8F" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, color: avgCompliance >= 70 ? "#10B981" : "#F59E0B" },
          { label: "High Adherence", value: compliance.filter(c => c.overall_compliance > 70).length, color: "#10B981" },
          { label: "Needs Attention", value: compliance.filter(c => c.overall_compliance < 40).length, color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
            <p className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="font-mono text-[8px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance Bar Chart */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-5">
          <h3 className="font-display text-sm font-bold text-white mb-3">Client Compliance Overview</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compliance}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                <Bar dataKey="overall_compliance" name="Compliance %" fill="#0F9F8F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Distribution Pie */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-5">
          <h3 className="font-display text-sm font-bold text-white mb-3">Adherence Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={complianceDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} strokeWidth={0}>
                  {complianceDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {complianceDist.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="font-mono text-[8px] text-slate-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
