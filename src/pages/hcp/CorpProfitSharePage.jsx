import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Crown, Star, Clock, Target, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const TIER_COLORS = { platinum: "#C0C0FF", gold: "#FFD700", silver: "#C0C0C0", bronze: "#CD7F32", ineligible: "#64748B" };
const TIER_ICONS = { platinum: Crown, gold: Star, silver: Star, bronze: Star, ineligible: Users };
const TIER_MULT = { platinum: "10x", gold: "5x", silver: "2.5x", bronze: "1x", ineligible: "0x" };

export default function CorpProfitSharePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTier, setExpandedTier] = useState(null);

  useEffect(() => {
    api.get("/corporate/profit-share").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const { tiers, summary, near_eligible_employees } = data;
  const pieData = Object.entries(tiers).filter(([k]) => k !== "ineligible").map(([k, v]) => ({ name: k, value: v.count, color: TIER_COLORS[k] }));
  const barData = Object.entries(tiers).map(([k, v]) => ({ tier: k.charAt(0).toUpperCase() + k.slice(1), count: v.count, color: TIER_COLORS[k] }));

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-profitshare-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profit-Share <span className="text-emerald-400">Administration</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">{summary.cycle_period} &bull; {summary.cycle_days_remaining} DAYS REMAINING</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Eligible", value: summary.total_eligible, color: "#10B981", icon: Users },
          { label: "Near Eligible", value: summary.near_eligible, color: "#D97706", icon: Target },
          { label: "Total Payout Pool", value: `INR ${(summary.total_payout_inr / 100000).toFixed(1)}L`, color: "#10B981", icon: DollarSign },
          { label: "Base Payout", value: `INR ${summary.base_payout_inr.toLocaleString()}`, color: "#6366F1", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`ps-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "12" }}>
                <s.icon size={12} style={{ color: s.color }} />
              </div>
            </div>
            <p className="font-mono text-xl font-black text-white">{s.value}</p>
            <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="ps-pie">
          <h3 className="font-display text-xs font-bold text-white mb-4">Eligible Tier Distribution</h3>
          <div className="w-40 h-40 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" stroke="none">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3">
            {pieData.map(t => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-mono text-[9px] text-slate-400 capitalize flex-1">{t.name}</span>
                <span className="font-mono text-[10px] font-bold text-white">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Cards */}
        <div className="lg:col-span-8 space-y-3">
          {Object.entries(tiers).map(([tierName, tierData]) => {
            const TIcon = TIER_ICONS[tierName] || Star;
            const isExpanded = expandedTier === tierName;
            const color = TIER_COLORS[tierName];
            return (
              <div key={tierName} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid={`ps-tier-${tierName}`}>
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpandedTier(isExpanded ? null : tierName)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                    <TIcon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-bold capitalize" style={{ color }}>{tierName}</p>
                      <Badge className="font-mono text-[7px]" style={{ backgroundColor: color + "15", color }}>{TIER_MULT[tierName]} Multiplier</Badge>
                    </div>
                    <p className="font-mono text-[8px] text-slate-500">{tierData.count} employees</p>
                  </div>
                  <p className="font-mono text-lg font-black text-white">{tierData.count}</p>
                  <ChevronRight size={14} className={`text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
                {isExpanded && tierData.employees.length > 0 && (
                  <div className="border-t border-white/5 p-3 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      {tierData.employees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                          <div>
                            <p className="font-body text-[11px] text-white">{emp.name}</p>
                            <p className="font-mono text-[7px] text-slate-500">{emp.department}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-xs font-bold" style={{ color }}>{emp.hps}</p>
                            <p className="font-mono text-[6px] text-slate-500">HPS</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Near Eligible */}
      {near_eligible_employees.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5" data-testid="ps-near-eligible">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-amber-400" />
            <h3 className="font-display text-xs font-bold text-amber-400">Near Eligible — {near_eligible_employees.length} employees within 50 HPS of Bronze</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {near_eligible_employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-body text-xs text-white">{emp.name}</p>
                  <p className="font-mono text-[8px] text-slate-500">{emp.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-amber-400">{emp.hps}</p>
                  <p className="font-mono text-[7px] text-slate-500">+{600 - emp.hps} to qualify</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
