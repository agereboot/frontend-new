import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { STATUS_COLORS, SOURCE_META } from "./constants";

export function BiomarkerBlade({ bm, predictions, expanded, onToggle }) {
  const statusColor = STATUS_COLORS[bm.status] || "#475569";
  const pred = predictions?.predictions?.find(pr => pr.code === bm.code);
  const srcMeta = SOURCE_META[bm.data_source] || SOURCE_META.manual;
  const SrcIcon = srcMeta.icon;

  return (
    <div className="group relative rounded-xl overflow-hidden transition-all duration-300 bg-white/[0.015] border border-white/[0.06] hover:border-white/[0.12]"
      data-testid={`biomarker-${bm.code}`}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-1 rounded-l-xl"
        style={{ backgroundColor: statusColor }} />

      <button className="w-full flex items-center justify-between py-3.5 pl-5 pr-4 transition-colors"
        data-testid={`biomarker-btn-${bm.code}`} onClick={onToggle}>
        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-stellar truncate text-left">{bm.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[8px] text-stellar-dim/40 text-left">{bm.domain}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-md bg-white/[0.03] border border-white/[0.04]" data-testid={`source-${bm.code}`}>
                <SrcIcon size={8} style={{ color: srcMeta.color }} />
                <span className="font-mono text-[7px]" style={{ color: srcMeta.color }}>{srcMeta.label}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {!expanded && bm.history?.length > 2 && (
            <div className="w-16 h-6 opacity-50 hidden md:block">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bm.history.slice(-6)}>
                  <defs>
                    <linearGradient id={`spark-${bm.code}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={statusColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={statusColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke={statusColor} strokeWidth={1.5} fill={`url(#spark-${bm.code})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {bm.value !== null ? (
            <div className="text-left min-w-[80px]">
              <span className="font-mono text-lg font-bold" style={{ color: statusColor }}>{bm.value}</span>
              <span className="font-mono text-[8px] text-stellar-dim/50 ml-1">{bm.unit}</span>
            </div>
          ) : (
            <Badge variant="outline" className="border-white/8 text-stellar-dim/50 font-mono text-[8px]">No data</Badge>
          )}
          <span className="font-mono text-[7px] text-stellar-dim/30 w-16 text-left hidden sm:block">{bm.optimal_low}-{bm.optimal_high}</span>
          <div className="w-5 flex justify-center">
            {expanded ? <ChevronUp size={14} className="text-stellar-dim/40" /> : <ChevronDown size={14} className="text-stellar-dim/40" />}
          </div>
        </div>
      </button>

      {expanded && bm.history?.length > 0 && (
        <div className="blade-expand border-t border-white/5 px-5 py-4 bg-white/[0.01]">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...bm.history, ...(pred ? pred.predictions.map((pr) => ({ value: pr.value, date: `+${pr.month}mo` })) : [])]}>
                <defs>
                  <linearGradient id={`grad-${bm.code}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={statusColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={statusColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
                {bm.optimal_low && <ReferenceLine y={bm.optimal_low} stroke="#0F9F8F" strokeDasharray="4 4" strokeOpacity={0.3} />}
                {bm.optimal_high && <ReferenceLine y={bm.optimal_high} stroke="#0F9F8F" strokeDasharray="4 4" strokeOpacity={0.3} />}
                <Area type="monotone" dataKey="value" stroke={statusColor} strokeWidth={2} fill={`url(#grad-${bm.code})`} dot={{ fill: statusColor, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: statusColor, strokeWidth: 2, fill: "#080518" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {pred && (
            <div className="mt-3 p-3 bg-cosmic/5 border border-cosmic/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={12} className="text-cosmic" />
                <span className="font-mono text-[9px] text-cosmic uppercase tracking-[0.15em]">3-Month Prediction</span>
                <Badge variant="outline" className="border-cosmic/20 text-cosmic font-mono text-[7px] ml-auto">{pred.compliance_score}% compliance</Badge>
              </div>
              <div className="flex gap-6">
                {pred.predictions.map((pr) => (
                  <div key={pr.month} className="text-left">
                    <p className="font-mono text-base font-bold text-stellar">{pr.value}</p>
                    <p className="font-mono text-[7px] text-stellar-dim/50">Month {pr.month}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
