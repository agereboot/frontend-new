import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  FlaskConical, TrendingUp, Brain, Users, BarChart3,
  Target, Dna, Activity, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";

const ACCENT = "#7B35D8";
const TEAL = "#0F9F8F";
const AMBER = "#F59E0B";
const COLORS = ["#7B35D8", "#0F9F8F", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

function StatCard({ icon: Icon, label, value, sub, color = ACCENT, testId }) {
  return (
    <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminProtocolEffectivenessPage() {
  const [effectiveness, setEffectiveness] = useState(null);
  const [insights, setInsights] = useState(null);
  const [trainingStats, setTrainingStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [effRes, insRes, trainRes] = await Promise.allSettled([
        api.get("/ai/outcome/effectiveness"),
        api.get("/ai/outcome/population-insights"),
        api.get("/data-governance/training-pipeline/stats"),
      ]);
      if (effRes.status === "fulfilled") setEffectiveness(effRes.value.data);
      if (insRes.status === "fulfilled") setInsights(insRes.value.data);
      if (trainRes.status === "fulfilled") setTrainingStats(trainRes.value.data);
    } catch (e) {
      console.error("Failed to fetch effectiveness data", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" />
    </div>
  );

  const eff = effectiveness || {};
  const aiVsRule = eff.ai_vs_rule_based || {};
  const bioChanges = eff.top_biomarker_changes || [];
  const train = trainingStats || {};

  // Chart data
  const aiVsRuleData = [
    { name: "AI-Generated", value: aiVsRule.ai_generated_avg_hps_change || 0, count: aiVsRule.ai_cycles || 0 },
    { name: "Rule-Based", value: aiVsRule.rule_based_avg_hps_change || 0, count: aiVsRule.rule_cycles || 0 },
  ];

  const biomarkerChartData = bioChanges.slice(0, 8).map(b => ({
    name: (b.biomarker || "").replace(/_/g, " ").slice(0, 15),
    change: b.avg_pct_change || 0,
  }));

  const genderData = Object.entries(train.gender_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const ethnicityData = Object.entries(train.ethnicity_distribution || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="space-y-6" data-testid="protocol-effectiveness-page">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <FlaskConical size={24} style={{ color: TEAL }} />
          Protocol Effectiveness Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">Track intervention outcomes and protocol performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard icon={Target} label="Total Cycles" value={eff.total_cycles || 0} color={ACCENT} testId="stat-total-cycles" />
        <StatCard icon={TrendingUp} label="Improved HPS" value={eff.improved_hps_count || 0} sub={`of ${eff.total_cycles || 0} patients`} color={TEAL} testId="stat-improved" />
        <StatCard icon={Activity} label="Avg HPS Change" value={eff.avg_hps_change || 0} color={eff.avg_hps_change >= 0 ? TEAL : "#EF4444"} testId="stat-avg-change" />
        <StatCard icon={Brain} label="AI Protocols" value={aiVsRule.ai_cycles || 0} sub={`vs ${aiVsRule.rule_cycles || 0} rule-based`} color={ACCENT} testId="stat-ai-protocols" />
        <StatCard icon={Dna} label="Training Records" value={train.total_training_records || 0} sub={train.dataset_ready_for_training ? "Ready" : "Collecting"} color={AMBER} testId="stat-training" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* AI vs Rule-Based Effectiveness */}
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Brain size={16} style={{ color: ACCENT }} />
            AI vs Rule-Based Protocol Effectiveness
          </h3>
          {aiVsRuleData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiVsRuleData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1E1E3A", border: "1px solid #2A2A4A", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                <Bar dataKey="value" name="Avg HPS Change" radius={[6, 6, 0, 0]}>
                  {aiVsRuleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-600 text-sm">
              No protocol comparison data yet
            </div>
          )}
          <div className="flex gap-4 mt-2">
            {aiVsRuleData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name}: {d.count} cycles, avg {d.value > 0 ? "+" : ""}{d.value} HPS
              </div>
            ))}
          </div>
        </div>

        {/* Biomarker Changes */}
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} style={{ color: TEAL }} />
            Top Biomarker Changes (% Avg)
          </h3>
          {biomarkerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={biomarkerChartData} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={100} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1E1E3A", border: "1px solid #2A2A4A", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                <Bar dataKey="change" name="% Change" radius={[0, 4, 4, 0]}>
                  {biomarkerChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.change >= 0 ? TEAL : "#EF4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-600 text-sm">
              No biomarker change data yet
            </div>
          )}
        </div>
      </div>

      {/* Training Dataset Demographics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Users size={16} style={{ color: ACCENT }} />
            Training Dataset — Gender Distribution
          </h3>
          {genderData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1E1E3A", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {genderData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[140px] text-slate-600 text-sm">Need training data</div>
          )}
        </div>

        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Dna size={16} style={{ color: TEAL }} />
            Training Dataset — Ethnicity Distribution
          </h3>
          {ethnicityData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={ethnicityData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                    {ethnicityData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1E1E3A", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {ethnicityData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[140px] text-slate-600 text-sm">Need training data</div>
          )}
        </div>
      </div>

      {/* AI Population Insights */}
      {insights && insights.insights && (
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Brain size={16} style={{ color: ACCENT }} />
            AI Population Insights
            <span className="text-[10px] text-slate-600 font-normal ml-2">({insights.data_points || 0} data points)</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {(Array.isArray(insights.insights) ? insights.insights : [insights.insights]).map((ins, i) => (
                <div key={i} className="text-sm text-slate-300 pl-3 border-l-2 border-[#7B35D8]/30 py-1">{ins}</div>
              ))}
            </div>
            <div className="space-y-2">
              {(insights.recommendations || []).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <ArrowUpRight size={12} className="text-[#0F9F8F] mt-1 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Readiness */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Target size={16} style={{ color: AMBER }} />
          AI Model Training Readiness
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="h-3 bg-[#1E1E3A] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, ((train.total_training_records || 0) / 150) * 100)}%`,
                  backgroundColor: (train.total_training_records || 0) >= 150 ? TEAL : (train.total_training_records || 0) >= 50 ? AMBER : ACCENT,
                }} />
            </div>
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {train.total_training_records || 0} / 150 records
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            train.dataset_ready_for_training ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
          }`}>
            {train.estimated_model_viability || "Collecting data"}
          </span>
        </div>
      </div>
    </div>
  );
}
