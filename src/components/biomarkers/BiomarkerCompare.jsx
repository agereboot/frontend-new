import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GitBranch, Layers } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "@/lib/api";
import { PILLAR_META } from "./constants";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export function BiomarkerCompare({ allBiomarkers }) {
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const doCompare = async () => {
    if (!codeA || !codeB || codeA === codeB) { toast.error("Select two different biomarkers"); return; }
    setLoading(true);
    try {
      const res = await api.post("/biomarkers/compare", { code_a: codeA, code_b: codeB });
      setComparison(res.data);
    } catch (err) { toast.error("Comparison failed"); } finally { setLoading(false); }
  };

  const chartData = useMemo(() => {
    if (!comparison) return [];
    const a = comparison.biomarker_a.history || [];
    const b = comparison.biomarker_b.history || [];
    const allDates = [...new Set([...a.map(d => d.date), ...b.map(d => d.date)])].sort();
    const aMap = Object.fromEntries(a.map(d => [d.date, d.value]));
    const bMap = Object.fromEntries(b.map(d => [d.date, d.value]));
    return allDates.map(date => ({
      date: date.slice(5),
      [comparison.biomarker_a.name]: aMap[date] ?? null,
      [comparison.biomarker_b.name]: bMap[date] ?? null,
    }));
  }, [comparison]);

  const bmOptions = allBiomarkers.filter(b => b.value !== null);
  const corr = comparison?.correlation;

  return (
    <div className="space-y-5" data-testid="biomarker-compare">
      <div className="glass-premium rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
            <Layers size={22} className="text-cosmic" />
          </div>
          <div className="text-left">
            <h2 className="font-display text-xl font-bold text-stellar">Compare Biomarkers</h2>
            <p className="font-body text-xs text-stellar-dim">Select two biomarkers to overlay their trends</p>
          </div>
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block text-left">Biomarker A</label>
            <AppSelect value={codeA} onChange={e => setCodeA(e.target.value)} data-testid="compare-select-a"
              className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
              <AppSelectOption value="">Select...</AppSelectOption>
              {bmOptions.map(b => <AppSelectOption key={b.code} value={b.code}>{b.name} ({b.value} {b.unit})</AppSelectOption>)}
            </AppSelect>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block text-left">Biomarker B</label>
            <AppSelect value={codeB} onChange={e => setCodeB(e.target.value)} data-testid="compare-select-b"
              className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
              <AppSelectOption value="">Select...</AppSelectOption>
              {bmOptions.filter(b => b.code !== codeA).map(b => <AppSelectOption key={b.code} value={b.code}>{b.name} ({b.value} {b.unit})</AppSelectOption>)}
            </AppSelect>
          </div>
          <Button data-testid="compare-btn" onClick={doCompare} disabled={!codeA || !codeB || codeA === codeB || loading}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs h-10 px-6 rounded-lg">
            {loading ? "Loading..." : "Compare"}
          </Button>
        </div>
      </div>

      {comparison && (
        <>
          {corr && (
            <div className="glass-premium rounded-2xl p-5 relative overflow-hidden" data-testid="compare-correlation">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: corr.direction === "positive" ? "#D97706" : "#6366F1" }} />
              <div className="flex items-center gap-4">
                <GitBranch size={20} style={{ color: corr.direction === "positive" ? "#D97706" : "#6366F1" }} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stellar-dim/60">Known Correlation</span>
                    <Badge className="font-mono text-[8px]" style={{
                      backgroundColor: (corr.direction === "positive" ? "#D97706" : "#6366F1") + "15",
                      color: corr.direction === "positive" ? "#D97706" : "#6366F1",
                      border: `1px solid ${corr.direction === "positive" ? "#D97706" : "#6366F1"}30`,
                    }}>
                      {corr.direction === "positive" ? "+" : "-"}{Math.round(corr.strength * 100)}% strength
                    </Badge>
                  </div>
                  <p className="font-body text-sm text-stellar">{corr.insight}</p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-premium rounded-2xl p-6" data-testid="compare-chart">
            <h3 className="font-display text-sm font-bold text-stellar mb-4 text-left">Trend Overlay</h3>
            {chartData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="a" orientation="left" tick={{ fill: PILLAR_META[comparison.biomarker_a.pillar]?.color || "#EF4444", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={40} />
                    <YAxis yAxisId="b" orientation="right" tick={{ fill: PILLAR_META[comparison.biomarker_b.pillar]?.color || "#6366F1", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
                    <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "10px" }} />
                    <Line yAxisId="a" type="monotone" dataKey={comparison.biomarker_a.name} stroke={PILLAR_META[comparison.biomarker_a.pillar]?.color || "#EF4444"} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                    <Line yAxisId="b" type="monotone" dataKey={comparison.biomarker_b.name} stroke={PILLAR_META[comparison.biomarker_b.pillar]?.color || "#6366F1"} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-stellar-dim text-xs text-center py-8">Not enough data points to chart.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4" data-testid="compare-stats">
            {[comparison.biomarker_a, comparison.biomarker_b].map((bm) => {
              const pillarMeta = PILLAR_META[bm.pillar] || {};
              const latestVal = bm.history?.[bm.history.length - 1]?.value;
              return (
                <div key={bm.code} className="glass-premium rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pillarMeta.color || "#7B35D8" }} />
                    <h4 className="font-display text-sm font-bold text-stellar">{bm.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="font-mono text-[9px] text-stellar-dim text-left">Current</span><span className="font-mono text-sm font-bold text-stellar text-left">{latestVal ?? "--"} {bm.unit}</span></div>
                    <div className="flex justify-between"><span className="font-mono text-[9px] text-stellar-dim text-left">Optimal Range</span><span className="font-mono text-xs text-stellar-dim text-left">{bm.optimal_low}-{bm.optimal_high} {bm.unit}</span></div>
                    <div className="flex justify-between"><span className="font-mono text-[9px] text-stellar-dim text-left">Data Points</span><span className="font-mono text-xs text-stellar-dim text-left">{bm.history?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="font-mono text-[9px] text-stellar-dim text-left">Pillar</span><span className="font-mono text-xs text-left" style={{ color: pillarMeta.color }}>{pillarMeta.name || bm.pillar}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!comparison && (
        <div className="glass-premium rounded-2xl p-10 text-center">
          <Layers size={48} className="text-cosmic/20 mx-auto mb-4" />
          <p className="font-body text-sm text-stellar-dim">Select two biomarkers above to see their trends side-by-side with correlation data.</p>
        </div>
      )}
    </div>
  );
}
