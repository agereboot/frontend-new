import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Users, Heart, Zap, Brain, Moon, Shield,
  AlertTriangle, TrendingUp, BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const PILLAR_META = {
  BR: { name: "Bio Resilience", icon: Heart, color: "#EF4444" },
  PF: { name: "Fitness", icon: Zap, color: "#0F9F8F" },
  CA: { name: "Cognitive", icon: Brain, color: "#7B35D8" },
  SR: { name: "Sleep", icon: Moon, color: "#6366F1" },
  BL: { name: "Lifestyle", icon: Shield, color: "#D97706" },
};
const TIER_COLORS = {
  CENTENARIAN: "#0F9F8F", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1",
  VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626",
};

export default function HCPPopulationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/cc/population-health").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
  );
  if (!data) return <div className="text-slate-400 text-center p-20">No data available.</div>;

  const tierData = Object.entries(data.tier_distribution).map(([name, value]) => ({ name, value, color: TIER_COLORS[name] || "#475569" }));
  const distData = Object.entries(data.hps_distribution).map(([range, count]) => ({ range, count }));
  const radarData = Object.entries(data.pillar_averages).map(([code, avg]) => ({
    pillar: PILLAR_META[code]?.name || code, score: Math.round(avg), fullMark: 200,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-population-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Population <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#6366F1]">Health Intelligence</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Aggregate Cohort Analytics</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="population-kpis">
        {[
          { label: "Total Members", value: data.total_members, icon: Users, color: "#7B35D8" },
          { label: "Scored", value: data.scored_members, icon: BarChart3, color: "#6366F1" },
          { label: "Avg HPS", value: Math.round(data.avg_hps), icon: TrendingUp, color: "#0F9F8F" },
          { label: "At-Risk", value: data.at_risk_members, icon: AlertTriangle, color: "#EF4444" },
          { label: "Optimal", value: data.optimal_members, icon: Heart, color: "#10B981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.15em]">{label}</span>
            </div>
            <p className="font-mono text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Distribution */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="tier-distribution">
          <h3 className="font-display text-sm font-bold text-white mb-4">Tier Distribution</h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                  {tierData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tierData.map(t => (
              <div key={t.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-mono text-[9px] text-slate-400">{t.name}: {t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HPS Distribution */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="hps-distribution">
          <h3 className="font-display text-sm font-bold text-white mb-4">HPS Score Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData}>
                <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px" }} />
                <Bar dataKey="count" fill="#7B35D8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pillar Radar */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="pillar-radar">
          <h3 className="font-display text-sm font-bold text-white mb-4">Pillar Averages</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="pillar" tick={{ fill: "#94A3B8", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Radar name="Score" dataKey="score" stroke="#7B35D8" fill="#7B35D8" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Biomarker Concerns */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="biomarker-concerns">
        <h3 className="font-display text-sm font-bold text-white mb-4">Top Biomarker Concerns Across Cohort</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.top_biomarker_concerns.map((c, i) => (
            <div key={c.biomarker} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-lg font-black text-white">{i + 1}</span>
                <div>
                  <p className="font-body text-sm font-medium text-white">{c.biomarker.replace(/_/g, " ")}</p>
                  <p className="font-mono text-[8px] text-slate-500">{c.count} alerts, {c.critical} critical/high</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(c.count * 10, 100)}%`,
                  background: c.critical > 0 ? "linear-gradient(90deg, #EF4444, #D97706)" : "#6366F1",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
