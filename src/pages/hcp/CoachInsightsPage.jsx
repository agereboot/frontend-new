import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Target, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CoachInsightsPage() {
  const [perf, setPerf] = useState(null);
  const [compliance, setCompliance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/coach-v2/performance").then(r => setPerf(r.data)),
      api.get("/cc/members").then(async r => {
        const mems = r.data.members || [];
        setMembers(mems);
        const compData = [];
        for (const m of mems.slice(0, 12)) {
          try {
            const c = await api.get(`/coach-v2/compliance/${m.id}`);
            compData.push({ name: m.name?.split(" ")[0] || "?", compliance: c.data.overall_compliance, habits: c.data.habit_completion_rate, sessions: c.data.session_adherence });
          } catch {}
        }
        setCompliance(compData);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="coach-insights-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Coach <span className="text-emerald-400">Insights</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">YOUR PERFORMANCE METRICS & CLIENT OUTCOMES</p>
      </div>

      {/* Performance KPIs */}
      {perf && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="perf-kpis">
          {[
            { label: "Total Clients", value: perf.total_clients, icon: Users, color: "#10B981" },
            { label: "Total Sessions", value: perf.total_sessions, icon: BarChart3, color: "#6366F1" },
            { label: "Goals Created", value: perf.goals_created, icon: Target, color: "#D97706" },
            { label: "Goals Completed", value: perf.goals_completed, icon: CheckCircle2, color: "#0F9F8F" },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <k.icon size={14} style={{ color: k.color }} />
                <p className="font-mono text-[8px] text-slate-500 uppercase">{k.label}</p>
              </div>
              <p className="font-mono text-2xl font-black text-white">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {perf && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-black/20 p-5 text-center">
            <p className="font-mono text-4xl font-black" style={{ color: perf.completion_rate >= 70 ? "#10B981" : "#F59E0B" }}>{perf.completion_rate}%</p>
            <p className="font-mono text-[8px] text-slate-500 uppercase mt-1">Goal Completion Rate</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-5 text-center">
            <p className="font-mono text-4xl font-black" style={{ color: perf.avg_session_compliance >= 70 ? "#10B981" : "#F59E0B" }}>{perf.avg_session_compliance}%</p>
            <p className="font-mono text-[8px] text-slate-500 uppercase mt-1">Avg Session Compliance</p>
          </div>
        </div>
      )}

      {/* Client Compliance Chart */}
      {compliance.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5">
          <h3 className="font-display text-sm font-bold text-white mb-3">Client Compliance Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compliance}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                <Bar dataKey="compliance" name="Overall" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="habits" name="Habits" fill="#6366F1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#D97706" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
