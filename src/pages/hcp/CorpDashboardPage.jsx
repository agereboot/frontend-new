import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, AlertTriangle, TrendingUp, Trophy,
  Activity, Zap, Target, BarChart3, Building2,
  HeartPulse, DollarSign, ArrowUpRight, ChevronRight,
  Clock, Shield, Flame, Star, Crown,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar } from "recharts";

const CHCS_COLORS = {
  "Platinum Health": "#C0C0FF", "Gold Health": "#FFD700", "Silver Health": "#C0C0C0",
  "Bronze Health": "#CD7F32", "At-Risk": "#EF4444",
};
const HPS_TIER_COLORS = {
  CENTENARIAN: "#C0C0FF", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1",
  VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626",
};
const EHS_TIER_COLORS = {
  Champion: "#10B981", Engaged: "#6366F1", Moderate: "#D97706", "At-Risk": "#EF4444", Critical: "#DC2626",
};
const BRI_COLORS = { green: "#10B981", yellow: "#D97706", orange: "#F97316", red: "#EF4444" };
const NF_ICONS = {
  morning_briefing: LayoutDashboard, profit_share_countdown: DollarSign,
  department_anomaly: AlertTriangle, licence_waste_alert: Users, win_notification: Star,
};
const NF_PRIORITY = { critical: "#EF4444", high: "#D97706", medium: "#6366F1", info: "#64748B" };

export default function CorpDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/corporate/dashboard").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="corp-dash-loading">
      <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load dashboard</div>;

  const { chcs, stats, hps_tier_distribution, ehs_tiers, bri_summary, departments, profit_share, franchise, newsfeed } = data;
  const isCWH = user?.role === "corporate_wellness_head";
  const roleLabel = isCWH ? "Wellness Head" : "Corporate HR Admin";
  const accentColor = isCWH ? "#0F9F8F" : "#D97706";

  const hpsPieData = Object.entries(hps_tier_distribution).map(([k, v]) => ({ name: k, value: v, color: HPS_TIER_COLORS[k] || "#64748B" }));
  const ehsPieData = Object.entries(ehs_tiers).map(([k, v]) => ({ name: k, value: v, color: EHS_TIER_COLORS[k] || "#64748B" }));
  const briPieData = Object.entries(bri_summary).map(([k, v]) => ({ name: k, value: v, color: BRI_COLORS[k] }));

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-dashboard">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Corporate <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, #6366F1)` }}>Health Command Centre</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">AgeReboot {roleLabel} Operations Portal</p>
        </div>
        <div className="font-mono text-xs text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>

      {/* CHCS Card + Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CHCS Gauge */}
        <div className="lg:col-span-3 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5 flex flex-col items-center justify-center" data-testid="chcs-card">
          <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.2em] mb-2">Corporate Health Credit Score</p>
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={[{ value: chcs.score, fill: CHCS_COLORS[chcs.tier] || "#D97706" }]} startAngle={180} endAngle={0} barSize={10}>
                <RadialBar background clockWise dataKey="value" cornerRadius={5} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-mono text-3xl font-black text-white">{chcs.score}</p>
              <p className="font-mono text-[7px] uppercase tracking-wider" style={{ color: CHCS_COLORS[chcs.tier] || "#D97706" }}>{chcs.tier}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full mt-3">
            {[
              { label: "Avg HPS", value: chcs.components.avg_hps },
              { label: "Activation", value: `${chcs.components.activation_rate}%` },
              { label: "Avg EHS", value: chcs.components.avg_ehs },
            ].map(c => (
              <div key={c.label} className="text-center">
                <p className="font-mono text-xs font-bold text-white">{c.value}</p>
                <p className="font-mono text-[6px] text-slate-500 uppercase">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {[
            { label: "Total Employees", value: stats.total_employees, icon: Users, color: accentColor, sub: `${stats.activation_rate}% active` },
            { label: "Avg HPS", value: stats.avg_hps, icon: HeartPulse, color: "#6366F1", sub: `${Object.keys(hps_tier_distribution).length} tiers` },
            { label: "Licence Usage", value: `${stats.licence_utilization}%`, icon: Shield, color: "#0F9F8F", sub: `${stats.used_licences}/${stats.total_licences}` },
            { label: "Inactive (30d)", value: stats.inactive_30d, icon: AlertTriangle, color: "#EF4444", sub: `+${stats.inactive_14d} (14d)` },
            { label: "Profit-Share Ready", value: profit_share.eligible, icon: DollarSign, color: "#10B981", sub: `${profit_share.near_eligible} near` },
            { label: "Franchise Rank", value: `#${franchise.ranking}`, icon: Trophy, color: "#D97706", sub: `of ${franchise.total_franchises}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-3 hover:bg-white/[0.03] transition-all group" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "12", border: `1px solid ${s.color}25` }}>
                  <s.icon size={12} style={{ color: s.color }} />
                </div>
              </div>
              <p className="font-mono text-xl font-black text-white group-hover:brightness-125 transition-all">{s.value}</p>
              <p className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className="font-mono text-[7px] mt-0.5" style={{ color: s.color }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* AI Newsfeed */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="ai-newsfeed">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} style={{ color: accentColor }} />
            <span className="font-display text-xs font-bold text-white">Health Intelligence Feed</span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {newsfeed.map(item => {
              const NFIcon = NF_ICONS[item.type] || Activity;
              const pColor = NF_PRIORITY[item.priority] || "#64748B";
              return (
                <div key={item.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer" data-testid={`nf-${item.id}`}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: pColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[11px] font-medium text-white">{item.title}</p>
                      <p className="font-mono text-[8px] text-slate-500 mt-0.5">{item.detail}</p>
                      <Badge className="font-mono text-[6px] mt-1" style={{ backgroundColor: pColor + "15", color: pColor }}>{item.action}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Escalation Alert Banner */}
      {data.escalation_summary && data.escalation_summary.pending > 0 && (
        <div className="rounded-xl border bg-black/20 backdrop-blur-sm p-4 flex items-center justify-between"
          style={{ borderColor: data.escalation_summary.critical > 0 ? "#EF444430" : "#D9770630" }}
          data-testid="escalation-banner">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${data.escalation_summary.critical > 0 ? "bg-red-500/10" : "bg-amber-500/10"}`}>
              <AlertTriangle size={16} className={data.escalation_summary.critical > 0 ? "text-red-400" : "text-amber-400"} />
            </div>
            <div>
              <p className="font-body text-xs text-white">
                <span className="font-bold">{data.escalation_summary.pending} pending</span> coach escalations
                {data.escalation_summary.critical > 0 && <span className="text-red-400 font-bold"> ({data.escalation_summary.critical} critical/high)</span>}
              </p>
              <p className="font-mono text-[8px] text-slate-500">{data.escalation_summary.total} total escalations across organization</p>
            </div>
          </div>
          <button onClick={() => navigate("/hcp/escalations")} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1">
            View All <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* HPS Distribution + EHS + BRI Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* HPS Tier Distribution */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="hps-distribution">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><HeartPulse size={14} className="text-[#6366F1]" /><h3 className="font-display text-xs font-bold text-white">HPS Population</h3></div>
            <button onClick={() => navigate("/hcp/corp-employees")} className="font-mono text-[8px] text-[#6366F1] hover:text-[#818CF8] flex items-center gap-0.5">Details <ChevronRight size={10} /></button>
          </div>
          <div className="flex gap-4">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={hpsPieData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" stroke="none">
                  {hpsPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {hpsPieData.map(t => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="font-mono text-[9px] text-slate-400 flex-1 truncate">{t.name}</span>
                  <span className="font-mono text-[10px] font-bold text-white">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EHS Tiers */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="ehs-distribution">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Activity size={14} className="text-[#10B981]" /><h3 className="font-display text-xs font-bold text-white">Engagement Health</h3></div>
            <button onClick={() => navigate("/hcp/corp-engagement")} className="font-mono text-[8px] text-[#10B981] hover:text-[#34D399] flex items-center gap-0.5">Details <ChevronRight size={10} /></button>
          </div>
          <div className="flex gap-4">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={ehsPieData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" stroke="none">
                  {ehsPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {ehsPieData.map(t => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="font-mono text-[9px] text-slate-400 flex-1">{t.name}</span>
                  <span className="font-mono text-[10px] font-bold text-white">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BRI Tiers */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="bri-distribution">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Zap size={14} className="text-[#F97316]" /><h3 className="font-display text-xs font-bold text-white">Burnout Risk</h3></div>
            <button onClick={() => navigate("/hcp/corp-burnout")} className="font-mono text-[8px] text-[#F97316] hover:text-[#FB923C] flex items-center gap-0.5">Details <ChevronRight size={10} /></button>
          </div>
          <div className="flex gap-4">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={briPieData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" stroke="none">
                  {briPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {briPieData.map(t => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="font-mono text-[9px] text-slate-400 flex-1 capitalize">{t.name}</span>
                  <span className="font-mono text-[10px] font-bold text-white">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department Rankings + Franchise + Profit-Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dept Rankings */}
        <div className="lg:col-span-5 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="dept-rankings">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Building2 size={14} style={{ color: accentColor }} /><h3 className="font-display text-xs font-bold text-white">Department Rankings</h3></div>
            <button onClick={() => navigate("/hcp/corp-departments")} className="font-mono text-[8px]" style={{ color: accentColor }}>All Depts</button>
          </div>
          <div className="space-y-2">
            {departments.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold" style={{ backgroundColor: i === 0 ? "#FFD70015" : "#ffffff05", color: i === 0 ? "#FFD700" : "#64748B" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[11px] text-white truncate">{d.name}</p>
                  <p className="font-mono text-[7px] text-slate-500">{d.employees} employees</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-white">{d.avg_hps}</p>
                  <p className="font-mono text-[7px] text-slate-500">Avg HPS</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Franchise Widget */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="franchise-widget">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Trophy size={14} className="text-[#D97706]" /><h3 className="font-display text-xs font-bold text-white">Franchise Status</h3></div>
            <button onClick={() => navigate("/hcp/corp-franchise")} className="font-mono text-[8px] text-[#D97706]">Full View</button>
          </div>
          <div className="text-center mb-4">
            <p className="font-mono text-[9px] text-slate-500 uppercase">{franchise.season}</p>
            <Badge className="font-mono text-[8px] mt-1" style={{ backgroundColor: franchise.status === "Qualifying" ? "#10B98115" : "#EF444415", color: franchise.status === "Qualifying" ? "#10B981" : "#EF4444" }}>{franchise.status}</Badge>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[8px] text-slate-400">Qualification Progress</span>
                <span className="font-mono text-[10px] font-bold text-white">{franchise.qualification_pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] transition-all" style={{ width: `${Math.min(franchise.qualification_pct, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                <p className="font-mono text-lg font-black text-white">#{franchise.ranking}</p>
                <p className="font-mono text-[6px] text-slate-500 uppercase">Rank</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                <p className="font-mono text-lg font-black text-white">{franchise.current_avg}</p>
                <p className="font-mono text-[6px] text-slate-500 uppercase">Avg HPS</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                <p className="font-mono text-lg font-black text-amber-400">{franchise.days_remaining}d</p>
                <p className="font-mono text-[6px] text-slate-500 uppercase">Left</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profit-Share Widget */}
        <div className="lg:col-span-3 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="profitshare-widget">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><DollarSign size={14} className="text-emerald-400" /><h3 className="font-display text-xs font-bold text-white">Profit-Share</h3></div>
            <button onClick={() => navigate("/hcp/corp-profitshare")} className="font-mono text-[8px] text-emerald-400">Details</button>
          </div>
          <div className="text-center space-y-3">
            <div>
              <p className="font-mono text-3xl font-black text-emerald-400">{profit_share.eligible}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">Eligible Employees</p>
            </div>
            <div className="h-px bg-white/5" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-amber-400">{profit_share.near_eligible}</p>
                <p className="font-mono text-[6px] text-slate-500 uppercase">Near Eligible</p>
              </div>
              <div>
                <p className="font-mono text-sm font-bold text-white">INR {(profit_share.total_pool_inr / 100000).toFixed(1)}L</p>
                <p className="font-mono text-[6px] text-slate-500 uppercase">Pool Size</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
