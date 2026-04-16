import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function CorporateWellnessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/coach-v2/corporate-wellness").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  const franchiseData = data?.franchises ? Object.entries(data.franchises).map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + "..." : name, count })) : [];
  const PIE_COLORS = ["#10B981", "#6366F1", "#D97706", "#EF4444", "#0F9F8F", "#7B35D8"];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corporate-wellness-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Corporate <span className="text-indigo-400">Wellness</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">ORGANIZATION-WIDE HEALTH PROGRAM ANALYTICS</p>
      </div>

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3" data-testid="corp-kpis">
            {[
              { label: "Total Employees", value: data.total_employees, color: "#6366F1" },
              { label: "Avg HPS Score", value: data.avg_hps, color: data.avg_hps >= 500 ? "#10B981" : "#D97706" },
              { label: "At Risk", value: data.at_risk_count, color: "#EF4444" },
              { label: "Participation", value: `${data.participation_rate}%`, color: "#0F9F8F" },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-white/5 bg-black/20 p-5 text-center">
                <p className="font-mono text-3xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="font-mono text-[8px] text-slate-500 uppercase mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Franchise Distribution */}
            {franchiseData.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="font-display text-sm font-bold text-white mb-3">Employees by Franchise</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={franchiseData} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                      <XAxis type="number" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                      <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Risk Summary */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-5">
              <h3 className="font-display text-sm font-bold text-white mb-3">Program Health</h3>
              <div className="space-y-4 pt-4">
                {[
                  { label: "Active Participants", pct: data.participation_rate, color: "#10B981" },
                  { label: "Healthy Range (HPS > 400)", pct: Math.round((data.total_employees - data.at_risk_count) / Math.max(data.total_employees, 1) * 100), color: "#6366F1" },
                  { label: "At Risk (HPS < 400)", pct: Math.round(data.at_risk_count / Math.max(data.total_employees, 1) * 100), color: "#EF4444" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[9px] text-slate-400">{item.label}</span>
                      <span className="font-mono text-xs font-bold" style={{ color: item.color }}>{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
