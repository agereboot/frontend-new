import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Flame, TrendingDown, UserMinus, LineChart,
  DollarSign, AlertTriangle, Sparkles, Users, Trophy,
  Calendar, Network, Sliders, ChevronRight, ChevronDown,
  Zap, Target, Shield, BarChart3, Activity,
} from "lucide-react";

const ICON_MAP = {
  flame: Flame, trending_down: TrendingDown, user_minus: UserMinus,
  chart_line: LineChart, dollar: DollarSign, alert: AlertTriangle,
  sparkles: Sparkles, users: Users, trophy: Trophy, calendar: Calendar,
  network: Network, sliders: Sliders,
};
const CAT_COLORS = { risk: "#EF4444", forecast: "#6366F1", detection: "#F97316", optimization: "#8B5CF6" };
const CAT_ICONS = { risk: Shield, forecast: LineChart, detection: AlertTriangle, optimization: Sparkles };

export default function CorpAIHubPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [benchmarks, setBenchmarks] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/corporate/ai-hub").then(r => setData(r.data)),
      api.get("/corporate/analytics/benchmarks").then(r => setBenchmarks(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  if (!data) return null;

  const insights = filterCat === "all" ? data.insights : data.insights.filter(i => i.category === filterCat);

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-ai-hub-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">AI Intelligence <span className="text-purple-400">Hub</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">{data.total_insights} AI-POWERED INSIGHTS &bull; PREDICTIVE ANALYTICS ENGINE</p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-5 gap-3">
        <button onClick={() => setFilterCat("all")} data-testid="ai-filter-all"
          className={`rounded-xl border p-3 text-center transition-all ${filterCat === "all" ? "border-purple-500/30 bg-purple-500/[0.06]" : "border-white/5 bg-black/20 hover:bg-white/[0.02]"}`}>
          <p className="font-mono text-xl font-black text-white">{data.total_insights}</p>
          <p className="font-mono text-[7px] text-slate-500 uppercase">All Insights</p>
        </button>
        {Object.entries(data.categories).map(([k, v]) => {
          const CIcon = CAT_ICONS[k] || Brain;
          return (
            <button key={k} onClick={() => setFilterCat(k)} data-testid={`ai-filter-${k}`}
              className={`rounded-xl border p-3 text-center transition-all ${filterCat === k ? `border-opacity-30 bg-opacity-5` : "border-white/5 bg-black/20 hover:bg-white/[0.02]"}`}
              style={filterCat === k ? { borderColor: CAT_COLORS[k] + "50", backgroundColor: CAT_COLORS[k] + "08" } : {}}>
              <CIcon size={14} style={{ color: CAT_COLORS[k] }} className="mx-auto mb-1" />
              <p className="font-mono text-lg font-black" style={{ color: CAT_COLORS[k] }}>{v.count}</p>
              <p className="font-mono text-[6px] text-slate-500 uppercase">{v.label}</p>
            </button>
          );
        })}
      </div>

      {/* Benchmarks (if available) */}
      {benchmarks && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="ai-benchmarks">
          <h3 className="font-display text-xs font-bold text-white mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-indigo-400" />Industry Benchmarks</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Metric", "Your Company", "Industry Avg", "Top Quartile", "Top Decile"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: "Avg HPS", key: "avg_hps", unit: "" },
                  { metric: "Activation %", key: "activation", unit: "%" },
                  { metric: "Engagement (EHS)", key: "engagement", unit: "" },
                  { metric: "BRI Green %", key: "burnout_green", unit: "%" },
                ].map(row => {
                  const yours = benchmarks.benchmarks.your_company[row.key];
                  const industry = benchmarks.benchmarks.industry_avg[row.key];
                  const topQ = benchmarks.benchmarks.top_quartile[row.key];
                  const topD = benchmarks.benchmarks.top_decile[row.key];
                  const beating = yours > industry;
                  return (
                    <tr key={row.metric} className="border-b border-white/[0.03]">
                      <td className="px-4 py-2 font-mono text-[10px] text-slate-400">{row.metric}</td>
                      <td className="px-4 py-2 font-mono text-xs font-bold" style={{ color: beating ? "#10B981" : "#EF4444" }}>{yours}{row.unit}</td>
                      <td className="px-4 py-2 font-mono text-[10px] text-slate-500">{industry}{row.unit}</td>
                      <td className="px-4 py-2 font-mono text-[10px] text-amber-400">{topQ}{row.unit}</td>
                      <td className="px-4 py-2 font-mono text-[10px] text-purple-400">{topD}{row.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insight Cards */}
      <div className="space-y-3" data-testid="ai-insights">
        {insights.map((insight, idx) => {
          const IIcon = ICON_MAP[insight.icon] || Brain;
          const isOpen = expanded === idx;
          return (
            <div key={insight.id} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden hover:bg-white/[0.01] transition-all" data-testid={`ai-insight-${insight.id}`}>
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : idx)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: insight.color + "12" }}>
                  <IIcon size={18} style={{ color: insight.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-xs font-medium text-white">{insight.title}</p>
                    <Badge className="font-mono text-[6px] capitalize" style={{ backgroundColor: CAT_COLORS[insight.category] + "15", color: CAT_COLORS[insight.category] }}>{insight.category}</Badge>
                  </div>
                  <p className="font-body text-[11px] text-slate-300 mt-0.5">{insight.prediction}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold" style={{ color: insight.color }}>{insight.confidence}%</p>
                  <p className="font-mono text-[6px] text-slate-500">CONFIDENCE</p>
                </div>
                {isOpen ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
              </div>

              {isOpen && (
                <div className="border-t border-white/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <p className="font-mono text-[8px] text-slate-500 uppercase mb-1">Analysis Detail</p>
                    <p className="font-body text-[11px] text-slate-300">{insight.detail}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] text-slate-500 uppercase mb-1.5">Recommended Actions</p>
                    <div className="space-y-1.5">
                      {insight.recommended_actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <Target size={10} style={{ color: insight.color }} className="mt-0.5 shrink-0" />
                          <span className="font-mono text-[9px] text-slate-300">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Projections */}
      {benchmarks?.projections && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="ai-projections">
          <h3 className="font-display text-xs font-bold text-white mb-3">6-Month Predictive Cost Model</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Month", "Projected HPS", "Healthcare Savings", "Productivity Gain"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-mono text-[8px] text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benchmarks.projections.map(p => (
                  <tr key={p.month} className="border-b border-white/[0.03]">
                    <td className="px-4 py-2 font-mono text-[10px] text-slate-400">{p.month}</td>
                    <td className="px-4 py-2 font-mono text-xs font-bold text-indigo-400">{p.projected_hps}</td>
                    <td className="px-4 py-2 font-mono text-[10px] text-emerald-400">INR {(p.healthcare_saving_inr / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-2 font-mono text-[10px] text-amber-400">INR {(p.productivity_gain_inr / 1000).toFixed(0)}K</td>
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
