import { Badge } from "@/components/ui/badge";
import { CheckCircle, GitBranch, Target } from "lucide-react";

export function CorrelationMatrix({ data }) {
  if (!data) return null;
  const { correlations, red_biomarkers, cascade_impact, best_target } = data;
  const hasCorrelations = correlations?.length > 0;

  return (
    <div className="space-y-5" data-testid="correlation-matrix">
      <div className="glass-premium rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 opacity-[0.03]"
          style={{ background: "radial-gradient(circle at top right, #7B35D8, transparent 70%)" }} />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
            <GitBranch size={26} className="text-cosmic" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="font-display text-xl font-bold text-stellar">Biomarker Correlations</h2>
            <p className="font-body text-xs text-stellar-dim mt-0.5">Neural links between your at-risk markers</p>
          </div>
          {red_biomarkers?.length > 0 && (
            <Badge className="bg-red-500/10 text-red-400 border border-red-500/15 font-mono text-[9px]">{red_biomarkers.length} at risk</Badge>
          )}
        </div>

        {red_biomarkers?.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-5 relative z-10">
            {red_biomarkers.map(code => (
              <span key={code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/8 border border-red-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 status-glow" style={{ color: "#EF4444" }} />
                <span className="font-mono text-[9px] text-red-400">{code}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 mt-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-stellar mb-1">All Biomarkers Healthy</h3>
            <p className="font-body text-sm text-stellar-dim max-w-sm mx-auto">No at-risk biomarkers detected. Correlations appear when markers fall outside optimal ranges.</p>
          </div>
        )}
      </div>

      {best_target && (
        <div className="glass-premium rounded-2xl p-5 relative overflow-hidden" data-testid="best-target">
          <div className="absolute inset-0 bg-gradient-to-r from-cosmic/5 to-transparent" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cosmic rounded-l-2xl" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-cosmic/15 border border-cosmic/25 flex items-center justify-center">
              <Target size={20} className="text-cosmic" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[8px] text-cosmic/60 uppercase tracking-[0.2em]">Priority Target</span>
                <Badge className="bg-cosmic/10 text-cosmic border border-cosmic/15 font-mono text-[7px]">{best_target.connections} cascades</Badge>
              </div>
              <h3 className="font-display text-base font-bold text-stellar">{best_target.name}</h3>
              <p className="font-body text-xs text-stellar-dim mt-0.5">{best_target.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {hasCorrelations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="correlation-links">
          {correlations.map((c, i) => {
            const strengthPct = Math.round(c.strength * 100);
            const isPositive = c.direction === "positive";
            const lineColor = isPositive ? "#D97706" : "#6366F1";
            return (
              <div key={i} data-testid={`correlation-${i}`}
                className="group glass-premium rounded-xl p-4 hover:border-white/15 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0 p-2 rounded-lg bg-white/[0.02]">
                    <div className="w-2 h-2 rounded-full shrink-0 status-glow"
                      style={{ color: c.a_status === "red" ? "#EF4444" : "#0F9F8F", backgroundColor: c.a_status === "red" ? "#EF4444" : "#0F9F8F" }} />
                    <span className="font-body text-xs font-medium text-stellar truncate">{c.name_a}</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
                    <div className="h-[2px] w-8 connector-pulse rounded-full" style={{ backgroundColor: lineColor }} />
                    <span className="font-mono text-[8px] font-bold" style={{ color: lineColor }}>
                      {isPositive ? "+" : "-"}{strengthPct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 p-2 rounded-lg bg-white/[0.02] justify-end">
                    <span className="font-body text-xs font-medium text-stellar truncate">{c.name_b}</span>
                    <div className="w-2 h-2 rounded-full shrink-0 status-glow"
                      style={{ color: c.b_status === "red" ? "#EF4444" : "#0F9F8F", backgroundColor: c.b_status === "red" ? "#EF4444" : "#0F9F8F" }} />
                  </div>
                </div>
                <p className="font-body text-[11px] text-stellar-dim/70 leading-relaxed text-left">{c.insight}</p>
              </div>
            );
          })}
        </div>
      )}

      {cascade_impact && Object.keys(cascade_impact).length > 0 && (
        <div className="glass-premium rounded-2xl p-5" data-testid="cascade-impact">
          <p className="font-mono text-[9px] tracking-[0.25em] text-stellar-dim/50 uppercase mb-4 text-left">Cascade Impact Score</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(cascade_impact).sort((a, b) => b[1] - a[1]).map(([code, count]) => (
              <div key={code} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-mono text-xs font-medium text-stellar">{code}</span>
                <div className="flex-1 flex gap-0.5 justify-end">
                  {Array.from({ length: count }).map((_, j) => (
                    <div key={j} className="w-2.5 h-2.5 rounded-full bg-cosmic/40 status-glow" style={{ color: "rgba(123,53,216,0.3)" }} />
                  ))}
                </div>
                <span className="font-mono text-[8px] text-stellar-dim/40">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
