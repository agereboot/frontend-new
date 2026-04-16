import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle, Target, TrendingUp } from "lucide-react";
import { PILLAR_META, RATING_CONFIG } from "./constants";

export function BenchmarkDashboard({ data }) {
  if (!data || !data.benchmarks?.length) return (
    <div className="glass-premium rounded-2xl p-10 text-center" data-testid="benchmark-empty">
      <BarChart3 size={48} className="text-cosmic/30 mx-auto mb-4" />
      <h2 className="font-display text-xl font-bold text-stellar mb-2">No Benchmarking Data</h2>
      <p className="font-body text-sm text-stellar-dim">Add biomarker readings to see how you compare against your cohort.</p>
    </div>
  );

  const { benchmarks, cohort_label, cohort_size, overall_health_percentile, top_strengths, areas_to_improve } = data;

  return (
    <div className="space-y-5" data-testid="benchmark-dashboard">
      <div className="glass-premium rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.04]"
          style={{ background: "radial-gradient(circle at top right, #7B35D8, transparent 70%)" }} />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
            <div className="text-center">
              <p className="font-mono text-3xl font-black text-cosmic">{Math.round(overall_health_percentile)}</p>
              <p className="font-mono text-[7px] text-cosmic/60 uppercase">Percentile</p>
            </div>
          </div>
          <div className="flex-1 text-left">
            <h2 className="font-display text-xl font-bold text-stellar">Health Benchmarking</h2>
            <p className="font-body text-xs text-stellar-dim mt-0.5">
              Your biomarkers vs. <span className="text-cosmic">{cohort_size}</span> participants in your cohort
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-white/5 text-stellar-dim font-mono text-[8px] border border-white/5">{cohort_label}</Badge>
              <Badge className="bg-white/5 text-stellar-dim font-mono text-[8px] border border-white/5">{benchmarks.length} biomarkers ranked</Badge>
            </div>
          </div>
          <div className="hidden md:block">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#7B35D8" strokeWidth="6"
                strokeDasharray={`${(overall_health_percentile / 100) * 213.6} 213.6`}
                strokeLinecap="round" transform="rotate(-90 40 40)" className="ring-progress" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-premium rounded-2xl p-5" data-testid="benchmark-strengths">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <h3 className="font-display text-sm font-bold text-stellar">Top Strengths</h3>
          </div>
          {top_strengths.length > 0 ? top_strengths.map((b, i) => (
            <div key={b.code} className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-lg font-black text-emerald-400 w-10 text-left">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-stellar truncate text-left">{b.name}</p>
                <p className="font-mono text-[8px] text-stellar-dim/50 text-left">{b.user_value} {b.unit}</p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-mono text-sm font-bold text-emerald-400">P{Math.round(b.health_percentile)}</p>
                <Badge className={`font-mono text-[7px] ${RATING_CONFIG[b.rating].bg} ${RATING_CONFIG[b.rating].border}`} style={{ color: RATING_CONFIG[b.rating].color }}>{RATING_CONFIG[b.rating].label}</Badge>
              </div>
            </div>
          )) : (
            <p className="font-body text-xs text-stellar-dim py-4 text-center">Keep tracking to discover your strengths.</p>
          )}
        </div>

        <div className="glass-premium rounded-2xl p-5" data-testid="benchmark-improvements">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <Target size={16} className="text-red-400" />
            </div>
            <h3 className="font-display text-sm font-bold text-stellar">Areas to Improve</h3>
          </div>
          {areas_to_improve.length > 0 ? areas_to_improve.map((b) => (
            <div key={b.code} className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-2 h-2 rounded-full bg-red-400 status-glow shrink-0" style={{ color: "#EF4444" }} />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-stellar truncate text-left">{b.name}</p>
                <p className="font-mono text-[8px] text-stellar-dim/50 text-left">You: {b.user_value} | Cohort avg: {b.cohort_mean} {b.unit}</p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-mono text-sm font-bold text-red-400">P{Math.round(b.health_percentile)}</p>
                <Badge className={`font-mono text-[7px] ${RATING_CONFIG[b.rating].bg} ${RATING_CONFIG[b.rating].border}`} style={{ color: RATING_CONFIG[b.rating].color }}>{RATING_CONFIG[b.rating].label}</Badge>
              </div>
            </div>
          )) : (
            <div className="flex items-center gap-3 py-4 justify-center">
              <CheckCircle size={16} className="text-emerald-400" />
              <p className="font-body text-sm text-emerald-400">All biomarkers within healthy range!</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-5" data-testid="benchmark-full-list">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold text-stellar">Full Percentile Ranking</h3>
          <Badge className="bg-white/5 text-stellar-dim font-mono text-[8px] border border-white/5">{benchmarks.length} biomarkers</Badge>
        </div>
        <div className="space-y-1.5">
          {benchmarks.map((b) => {
            const rc = RATING_CONFIG[b.rating] || RATING_CONFIG.average;
            const barWidth = Math.max(4, b.health_percentile);
            return (
              <div key={b.code} className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all" data-testid={`benchmark-${b.code}`}>
                <div className="w-36 min-w-[90px] truncate text-left">
                  <p className="font-body text-xs font-medium text-stellar truncate">{b.name}</p>
                  <p className="font-mono text-[7px] text-stellar-dim/40">{PILLAR_META[b.pillar]?.short || b.pillar}</p>
                </div>
                <div className="flex-1 relative h-5 rounded-full bg-white/[0.03] overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%`, backgroundColor: rc.color + "30" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/10"
                    style={{ left: `${Math.min(b.cohort_p25 ? (b.cohort_p25 / (b.cohort_mean * 2)) * 100 : 25, 90)}%`, width: `${Math.max(10, Math.min(30, (b.cohort_p75 - b.cohort_p25) / (b.cohort_mean || 1) * 50))}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 z-10"
                    style={{ left: `calc(${Math.min(barWidth, 95)}% - 5px)`, backgroundColor: rc.color, borderColor: "#080518" }} />
                </div>
                <div className="flex items-center gap-2 shrink-0 w-28">
                  <div className="text-left">
                    <span className="font-mono text-xs font-bold" style={{ color: rc.color }}>{b.user_value}</span>
                    <span className="font-mono text-[7px] text-stellar-dim/40 ml-0.5">{b.unit}</span>
                  </div>
                  <Badge className={`font-mono text-[7px] w-8 justify-center ${rc.bg} ${rc.border}`} style={{ color: rc.color }}>
                    P{Math.round(b.health_percentile)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
