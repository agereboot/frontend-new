import { useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brain, AlertTriangle, CheckCircle, BookOpen,
  Pill, CalendarCheck, Loader2, Shield,
  Heart, Zap, Moon,
} from "lucide-react";

const PILLAR_ICONS = { BR: Heart, PF: Zap, CA: Brain, SR: Moon, BL: Shield };
const PILLAR_COLORS = { BR: "#EF4444", PF: "#0F9F8F", CA: "#7B35D8", SR: "#6366F1", BL: "#D97706" };
const URGENCY_CONFIG = {
  immediate: { color: "#EF4444", label: "Immediate" },
  short_term: { color: "#D97706", label: "Short-Term" },
  medium_term: { color: "#6366F1", label: "Medium-Term" },
};
const IX_SEVERITY = {
  high: { color: "#EF4444", bg: "bg-red-500/10", text: "text-red-400" },
  medium: { color: "#D97706", bg: "bg-amber-500/10", text: "text-amber-400" },
  low: { color: "#475569", bg: "bg-slate-500/10", text: "text-slate-400" },
};

export function CDSSPanel({ memberId, memberName }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cc/cdss/${memberId}`);
      setResult(res.data);
      toast.success("CDSS analysis complete");
    } catch {
      toast.error("CDSS analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="rounded-xl border border-[#7B35D8]/20 bg-black/20 p-8 text-center" data-testid="cdss-trigger">
        <Brain size={40} className="text-[#7B35D8]/30 mx-auto mb-4" />
        <h3 className="font-display text-lg font-bold text-white mb-2">AI Clinical Decision Support</h3>
        <p className="font-body text-sm text-slate-400 max-w-md mx-auto mb-5">
          Analyse {memberName || "this member"}'s full biomarker profile and generate personalised protocol recommendations with evidence citations.
        </p>
        <Button data-testid="cdss-run-btn" onClick={runAnalysis} disabled={loading}
          className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body font-semibold px-8 shadow-[0_0_20px_rgba(123,53,216,0.3)]">
          {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Analysing...</> : <><Brain size={16} className="mr-2" /> Run CDSS Analysis</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="cdss-results">
      {/* Header */}
      <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-[#7B35D8]" />
            <h3 className="font-display text-base font-bold text-white">AgeReboot CDSS Report</h3>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="font-mono text-[8px] bg-[#7B35D8]/15 text-[#7B35D8] border border-[#7B35D8]/25">{result.generated_by}</Badge>
            <span className="font-mono text-[9px] text-slate-500">Confidence: {Math.round((result.confidence_score || 0) * 100)}%</span>
          </div>
        </div>
        <p className="font-body text-sm text-slate-300">{result.risk_summary}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="font-mono text-[9px] text-slate-500">HPS: <span className="text-white font-bold">{result.hps_score}</span></span>
          <span className="font-mono text-[9px] text-slate-500">Tier: <span className="text-white font-bold">{result.tier}</span></span>
          <span className="font-mono text-[9px] text-slate-500">At-risk: <span className="text-red-400 font-bold">{result.at_risk_count}</span></span>
        </div>
      </div>

      {/* Priority Actions */}
      {result.priority_actions?.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="cdss-actions">
          <h4 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" /> Priority Actions
          </h4>
          <div className="space-y-2">
            {result.priority_actions.map((a, i) => {
              const uc = URGENCY_CONFIG[a.urgency] || URGENCY_CONFIG.medium_term;
              const PIcon = PILLAR_ICONS[a.pillar] || Shield;
              const pc = PILLAR_COLORS[a.pillar] || "#7B35D8";
              return (
                <div key={i} data-testid={`cdss-action-${i}`}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-black text-white" style={{ backgroundColor: uc.color + "20", border: `1px solid ${uc.color}30` }}>
                      {a.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-sm font-medium text-white">{a.action}</span>
                        <Badge className="font-mono text-[7px]" style={{ backgroundColor: uc.color + "15", color: uc.color, border: `1px solid ${uc.color}30` }}>{uc.label}</Badge>
                        <PIcon size={12} style={{ color: pc }} />
                      </div>
                      <p className="font-body text-xs text-slate-400">{a.rationale}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="font-mono text-[8px] text-slate-500">Evidence: <span className="text-[#7B35D8]">{a.evidence}</span></span>
                        <span className="font-mono text-[8px] text-emerald-400">HPS impact: {a.hps_impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Protocol Recommendations */}
      {result.protocol_recommendations?.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="cdss-protocols">
          <h4 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-emerald-400" /> Recommended Protocols
          </h4>
          <div className="space-y-2">
            {result.protocol_recommendations.map((p, i) => (
              <div key={i} data-testid={`cdss-protocol-${i}`}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-body text-sm font-medium text-white">{p.protocol_name}</span>
                  <Badge className="font-mono text-[7px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Grade {p.evidence_grade}</Badge>
                  <Badge className={`font-mono text-[7px] ${p.contraindication_check === "safe" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : p.contraindication_check === "caution" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {p.contraindication_check}
                  </Badge>
                </div>
                <p className="font-body text-xs text-slate-400">{p.reason}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="font-mono text-[8px] text-slate-500">Expected: <span className="text-white">{p.expected_outcome}</span></span>
                </div>
                <p className="font-mono text-[8px] text-slate-500 mt-1">Monitoring: {p.monitoring_plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drug Interactions */}
      {result.drug_interactions?.length > 0 && (
        <div className="rounded-xl border border-red-500/10 bg-black/20 p-5" data-testid="cdss-interactions">
          <h4 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Pill size={14} className="text-red-400" /> Drug-Nutraceutical Interactions
          </h4>
          <div className="space-y-2">
            {result.drug_interactions.map((ix, i) => {
              const sc = IX_SEVERITY[ix.severity] || IX_SEVERITY.low;
              return (
                <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`font-mono text-[7px] ${sc.bg} ${sc.text}`}>{ix.severity}</Badge>
                    <span className="font-body text-xs text-white">{ix.interaction}</span>
                  </div>
                  <p className="font-mono text-[8px] text-slate-400">{ix.recommendation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
        <CalendarCheck size={16} className="text-[#6366F1]" />
        <div>
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Recommended Follow-up</span>
          <p className="font-body text-sm text-white">{result.follow_up_schedule}</p>
        </div>
      </div>

      <Button data-testid="cdss-rerun" onClick={runAnalysis} disabled={loading} variant="outline"
        className="border-[#7B35D8]/20 text-[#7B35D8] hover:bg-[#7B35D8]/10 font-mono text-xs">
        {loading ? "Re-analysing..." : "Re-run Analysis"}
      </Button>
    </div>
  );
}
