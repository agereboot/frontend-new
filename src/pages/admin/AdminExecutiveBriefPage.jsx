import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target,
  RefreshCw, Clock, Users, Activity, Zap, Shield, ChevronRight,
} from "lucide-react";

const ACCENT = "#7B35D8";
const TEAL = "#0F9F8F";

function ScoreGauge({ score, label }) {
  const color = score >= 80 ? TEAL : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex flex-col items-center" data-testid="exec-health-score">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1E1E3A" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{score}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">{label}</p>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, trend, color = "text-white" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-slate-500" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${color}`}>{value}</span>
        {trend && (
          <span className={`text-[10px] ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminExecutiveBriefPage() {
  const [brief, setBrief] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBrief = useCallback(async () => {
    try {
      const [briefRes, metricsRes] = await Promise.all([
        api.get("/ai/executive-brief/latest"),
        api.get("/ai/executive-brief/metrics"),
      ]);
      setBrief(briefRes.data.brief);
      setMetrics(metricsRes.data.metrics);
    } catch (e) {
      console.error("Failed to fetch brief", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBrief(); }, [fetchBrief]);

  const generateNew = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/ai/executive-brief/generate");
      setBrief(res.data.brief);
    } catch (e) {
      console.error("Failed to generate brief", e);
    } finally { setGenerating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" />
    </div>
  );

  const b = brief?.brief || {};
  const m = metrics || {};

  return (
    <div className="space-y-6" data-testid="executive-brief-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Brain size={24} style={{ color: ACCENT }} />
            AI Executive Brief
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {brief ? `Generated ${new Date(brief.created_at).toLocaleString()}` : "No brief generated yet"}
          </p>
        </div>
        <button onClick={generateNew} disabled={generating} data-testid="generate-brief-btn"
          className="flex items-center gap-2 bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating..." : "Generate Brief"}
        </button>
      </div>

      {/* Headline + Score */}
      {b.headline && (
        <div className="bg-gradient-to-r from-[#7B35D8]/10 to-[#0F9F8F]/10 border border-[#7B35D8]/20 rounded-2xl p-6 flex items-center gap-6" data-testid="exec-headline">
          <ScoreGauge score={b.health_score || 75} label="Platform Health" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{b.headline}</h2>
            {b.outlook && <p className="text-sm text-slate-400 mt-2">{b.outlook}</p>}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      {m.users && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-4">
            <MetricRow icon={Users} label="Total Users" value={m.users?.total || 0} />
            <MetricRow icon={TrendingUp} label="New (7d)" value={m.users?.new_7d || 0} color="text-emerald-400" />
          </div>
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-4">
            <MetricRow icon={Activity} label="Avg HPS" value={m.hps?.avg_score || 0} />
            <MetricRow icon={Target} label="Patients Scored" value={m.hps?.total_scored || 0} />
          </div>
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-4">
            <MetricRow icon={Zap} label="Challenges (7d)" value={m.engagement?.challenges_7d || 0} />
            <MetricRow icon={Clock} label="Lab Bookings" value={m.engagement?.bookings_7d || 0} />
          </div>
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-4">
            <MetricRow icon={Shield} label="Open Tickets" value={m.support?.open_tickets || 0} color={m.support?.open_tickets > 5 ? "text-amber-400" : "text-white"} />
            <MetricRow icon={CheckCircle} label="Resolved (7d)" value={m.support?.resolved_7d || 0} color="text-emerald-400" />
          </div>
        </div>
      )}

      {/* Brief Content */}
      {b.key_wins && (
        <div className="grid grid-cols-2 gap-4">
          {/* Key Wins */}
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
              <CheckCircle size={16} /> Key Wins
            </h3>
            <div className="space-y-2">
              {(b.key_wins || []).map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <TrendingUp size={12} className="text-emerald-400 mt-1 flex-shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attention Needed */}
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
              <AlertTriangle size={16} /> Attention Needed
            </h3>
            <div className="space-y-2">
              {(b.attention_needed || []).map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <TrendingDown size={12} className="text-amber-400 mt-1 flex-shrink-0" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights + Actions */}
      {b.recommended_actions && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-bold text-[#7B35D8] flex items-center gap-2 mb-3">
              <Brain size={16} /> AI Insights
            </h3>
            <div className="space-y-2">
              {(b.ai_insights || []).map((ins, i) => (
                <div key={i} className="text-sm text-slate-300 pl-3 border-l-2 border-[#7B35D8]/30 py-1">{ins}</div>
              ))}
            </div>
            {b.risk_summary && (
              <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <p className="text-xs text-red-300">{b.risk_summary}</p>
              </div>
            )}
          </div>

          <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-bold text-[#0F9F8F] flex items-center gap-2 mb-3">
              <Target size={16} /> Recommended Actions
            </h3>
            <div className="space-y-2">
              {(b.recommended_actions || []).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <ChevronRight size={12} className="text-[#0F9F8F] flex-shrink-0" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No brief yet */}
      {!b.headline && (
        <div className="text-center py-16 bg-[#11111a] border border-white/5 rounded-xl">
          <Brain size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Executive Brief Yet</h3>
          <p className="text-sm text-slate-500 mb-4">Click "Generate Brief" to create an AI-powered daily summary</p>
        </div>
      )}
    </div>
  );
}
