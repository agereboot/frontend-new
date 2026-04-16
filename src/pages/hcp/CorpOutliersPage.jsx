import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, HeartPulse, Activity, Zap, Users, ChevronDown, ChevronUp } from "lucide-react";

const RISK_COLORS = ["#10B981", "#84CC16", "#D97706", "#F97316", "#EF4444"];

function getRiskColor(score) {
  if (score >= 75) return "#EF4444";
  if (score >= 50) return "#F97316";
  if (score >= 35) return "#D97706";
  return "#10B981";
}

export default function CorpOutliersPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("/corporate/outliers").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const outliers = data.outliers || [];
  const critical = outliers.filter(o => o.risk_score >= 60);
  const watch = outliers.filter(o => o.risk_score >= 35 && o.risk_score < 60);
  const low = outliers.filter(o => o.risk_score < 35);

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-outliers-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Outlier <span className="text-red-400">Detection</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">MULTI-FACTOR AT-RISK IDENTIFICATION &bull; {data.total} OUTLIERS DETECTED</p>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4" data-testid="outlier-critical">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="font-mono text-[8px] text-red-400 uppercase tracking-wider">Critical</span>
          </div>
          <p className="font-mono text-3xl font-black text-red-400">{critical.length}</p>
          <p className="font-mono text-[7px] text-slate-500">Risk score 60+</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4" data-testid="outlier-watch">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-orange-400" />
            <span className="font-mono text-[8px] text-orange-400 uppercase tracking-wider">Watch List</span>
          </div>
          <p className="font-mono text-3xl font-black text-orange-400">{watch.length}</p>
          <p className="font-mono text-[7px] text-slate-500">Risk score 35-59</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4" data-testid="outlier-low">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-amber-400" />
            <span className="font-mono text-[8px] text-amber-400 uppercase tracking-wider">Low Concern</span>
          </div>
          <p className="font-mono text-3xl font-black text-amber-400">{low.length}</p>
          <p className="font-mono text-[7px] text-slate-500">Risk score &lt;35</p>
        </div>
      </div>

      {/* Outlier List */}
      <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid="outlier-list">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-display text-xs font-bold text-white">All Flagged Employees (sorted by risk)</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {outliers.map((o, idx) => {
            const isExpanded = expanded === idx;
            const riskColor = getRiskColor(o.risk_score);
            return (
              <div key={o.id} className="hover:bg-white/[0.02] transition-all" data-testid={`outlier-${o.id}`}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : idx)}>
                  {/* Risk Bar */}
                  <div className="w-10 text-center shrink-0">
                    <div className="font-mono text-lg font-black" style={{ color: riskColor }}>{o.risk_score}</div>
                    <p className="font-mono text-[6px] text-slate-500">RISK</p>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs text-white">{o.name}</p>
                    <p className="font-mono text-[8px] text-slate-500">{o.department}</p>
                  </div>
                  {/* Metrics */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="font-mono text-xs font-bold" style={{ color: o.hps_score >= 600 ? "#10B981" : o.hps_score >= 400 ? "#D97706" : "#EF4444" }}>{o.hps_score}</p>
                      <p className="font-mono text-[6px] text-slate-500">HPS</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-xs font-bold" style={{ color: o.ehs_score >= 60 ? "#10B981" : "#D97706" }}>{o.ehs_score}</p>
                      <p className="font-mono text-[6px] text-slate-500">EHS</p>
                    </div>
                    <div className="text-center">
                      <Badge className="font-mono text-[7px] capitalize" style={{ backgroundColor: `${riskColor}15`, color: riskColor }}>{o.bri_tier}</Badge>
                      <p className="font-mono text-[6px] text-slate-500">BRI</p>
                    </div>
                  </div>
                  {/* Reasons */}
                  <div className="flex gap-1 shrink-0">
                    {o.reasons.map((r, i) => (
                      <Badge key={i} className="font-mono text-[6px] bg-white/5 text-slate-400">{r}</Badge>
                    ))}
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 grid grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                    {[
                      { label: "HPS Score", value: o.hps_score, tier: o.hps_tier, icon: HeartPulse },
                      { label: "EHS Score", value: o.ehs_score, tier: `EHS ${o.ehs_score >= 60 ? "Engaged" : "At-Risk"}`, icon: Activity },
                      { label: "BRI Score", value: o.bri_score, tier: o.bri_tier, icon: Zap },
                      { label: "Risk Composite", value: o.risk_score, tier: o.risk_score >= 60 ? "Critical" : "Watch", icon: AlertTriangle },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <m.icon size={10} className="text-slate-500" />
                          <span className="font-mono text-[7px] text-slate-500 uppercase">{m.label}</span>
                        </div>
                        <p className="font-mono text-lg font-bold text-white">{m.value}</p>
                        <p className="font-mono text-[7px] capitalize" style={{ color: riskColor }}>{m.tier}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
