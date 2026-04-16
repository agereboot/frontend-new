import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, Activity, Shield, HeartPulse,
  Bell, CalendarClock, Clock, ArrowRight, ArrowUpRight,
  Users, FlaskConical, Pill, Video, Stethoscope,
  BarChart3, UserCheck, ClipboardCheck, Star,
  AlertTriangle, CheckCircle, ChevronRight, Brain,
  Dumbbell, Apple, Workflow, FileText,
  Flame, Zap, Target,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const ICON_MAP = {
  AlertTriangle, FlaskConical, Pill, FileText, Users, ClipboardCheck,
  CalendarClock, Brain, Activity, TrendingUp, HeartPulse,
  Target, CheckCircle, Stethoscope, Dumbbell, Apple, Star, Flame, Zap,
};
const TIER_COLORS = {
  CENTENARIAN: "#0F9F8F", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1",
  VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626",
};
const STREAM_COLORS = { op_consultation: "#7B35D8", telehealth: "#6366F1", lab_orders: "#0F9F8F", pharmacy: "#D97706" };
const STREAM_ICONS = { op_consultation: Stethoscope, telehealth: Video, lab_orders: FlaskConical, pharmacy: Pill };
const REF_STATUS_COLORS = { pending: "#D97706", in_progress: "#6366F1", completed: "#10B981" };

export default function HCPDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roleDash, setRoleDash] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [popHealth, setPopHealth] = useState(null);
  const [priorityFeed, setPriorityFeed] = useState(null);
  const [topAlerts, setTopAlerts] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [escalations, setEscalations] = useState([]);

  const isPhysician = ["longevity_physician", "clinician", "medical_director"].includes(user?.role);

  useEffect(() => {
    const promises = [
      api.get("/cc/role-dashboard").then(r => setRoleDash(r.data)),
      api.get("/cc/dashboard").then(r => { setTopAlerts(r.data.top_alerts || []); setAgenda(r.data.agenda || []); }),
      api.get("/cc/revenue-analytics").then(r => setRevenue(r.data)).catch(() => {}),
      api.get("/cc/clinical-kpis").then(r => setKpis(r.data)).catch(() => {}),
      api.get("/cc/referrals").then(r => setReferrals(r.data)).catch(() => {}),
      api.get("/cc/population-health").then(r => setPopHealth(r.data)).catch(() => {}),
      api.get("/cc/ai-priority-feed").then(r => setPriorityFeed(r.data)).catch(() => {}),
    ];
    if (isPhysician) {
      promises.push(api.get("/coach-v2/escalations/received").then(r => setEscalations((r.data.escalations || []).filter(e => e.status === "pending"))).catch(() => {}));
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [isPhysician]);

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="cc-dashboard-loading">
      <div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" />
    </div>
  );

  const role = roleDash?.role || "longevity_physician";
  const roleLabel = roleDash?.role_label || "Healthcare Professional";
  const widgets = roleDash?.widgets || [];
  const statWidgets = widgets.filter(w => w.type === "stat");
  const pieData = revenue ? Object.entries(revenue.streams).map(([k, v]) => ({ name: v.label, value: v.revenue, color: STREAM_COLORS[k] })) : [];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="cc-dashboard">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            {roleLabel.split(" ")[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#4F46E5]">{roleLabel.split(" ").slice(1).join(" ") || "Portal"}</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">AgeReboot Healthcare Professional Command Centre</p>
        </div>
        <div className="font-mono text-xs text-slate-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* AgeReboot Priority Feed */}
      {priorityFeed?.actions?.length > 0 && (
        <div className="rounded-xl border border-[#7B35D8]/15 bg-gradient-to-r from-[#7B35D8]/5 to-transparent p-4" data-testid="ai-priority-feed">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-[#7B35D8]" />
            <span className="font-display text-xs font-bold text-white">AgeReboot Priority Actions for Today</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {priorityFeed.actions.map((a, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer" data-testid={`priority-${i}`}>
                <div className={`w-1 rounded-full shrink-0 ${a.priority === "high" ? "bg-red-400" : a.priority === "medium" ? "bg-amber-400" : "bg-[#6366F1]"}`} />
                <div className="min-w-0">
                  <p className="font-body text-xs font-medium text-white truncate">{a.title}</p>
                  <p className="font-mono text-[8px] text-slate-500 mt-0.5 truncate">{a.detail}</p>
                  {a.member_name && <p className="font-mono text-[7px] text-[#7B35D8] mt-0.5">{a.member_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach Escalations (Physician only) */}
      {isPhysician && escalations.length > 0 && (
        <div className="rounded-xl border border-red-500/15 bg-gradient-to-r from-red-500/5 to-transparent p-4" data-testid="escalation-panel">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={14} className="text-red-400" />
              <span className="font-display text-xs font-bold text-white">Coach Escalations</span>
              <Badge className="font-mono text-[7px] bg-red-500/15 text-red-400 border-red-500/20">{escalations.length} pending</Badge>
            </div>
            <button onClick={() => navigate("/hcp/escalations")} className="font-mono text-[8px] text-red-400 hover:text-red-300 flex items-center gap-1">View All <ChevronRight size={10} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {escalations.slice(0, 3).map(esc => {
              const sevColor = esc.severity === "critical" ? "#FF0055" : esc.severity === "high" ? "#EF4444" : esc.severity === "medium" ? "#F59E0B" : "#6366F1";
              return (
                <div key={esc.id} onClick={() => navigate("/hcp/escalations")}
                  className="flex gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-red-500/5 transition-all cursor-pointer" data-testid={`esc-dash-${esc.id}`}>
                  <div className="w-1.5 rounded-full shrink-0" style={{ backgroundColor: sevColor, boxShadow: `0 0 8px ${sevColor}50` }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge className="font-mono text-[6px]" style={{ backgroundColor: sevColor + "15", color: sevColor }}>{esc.severity}</Badge>
                      <Badge className="font-mono text-[6px] bg-white/5 text-slate-400">{(esc.category || "").replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="font-body text-[11px] text-white truncate">{esc.member_name}</p>
                    <p className="font-mono text-[8px] text-slate-500 truncate">{esc.handoff_note?.clinical_summary?.slice(0, 60) || "No summary"}</p>
                    <p className="font-mono text-[7px] text-slate-600 mt-0.5">From: {esc.coach_name} | SLA: {esc.sla_hours}h</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Agenda — Top Row */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="agenda-panel">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><CalendarClock size={14} className="text-[#6366F1]" /><h3 className="font-display text-xs font-bold text-white">Today's Agenda</h3></div>
          <button onClick={() => navigate("/hcp/appointments")} className="font-mono text-[8px] text-[#7B35D8] hover:text-[#9B60E8]">All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2">
          {agenda.length > 0 ? agenda.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all" data-testid={`agenda-${s.id}`}>
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center shrink-0">
                <span className="font-mono text-[10px] font-bold text-[#6366F1]">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[11px] text-white truncate">{s.member_name || "Member"}</p>
                <Badge className="font-mono text-[6px] bg-[#6366F1]/10 text-[#6366F1]">{s.session_type}</Badge>
              </div>
            </div>
          )) : <p className="text-slate-500 font-mono text-[10px] text-center py-3 col-span-full">No appointments today</p>}
        </div>
      </div>

      {/* Role-Specific KPI Stat Cards */}
      <div className={`grid gap-3 ${statWidgets.length <= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-" + Math.min(statWidgets.length, 6)}`} data-testid="kpi-row">
        {statWidgets.map((w) => {
          const WIcon = ICON_MAP[w.icon] || Activity;
          return (
            <div key={w.key} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 hover:bg-white/[0.03] hover:border-white/10 transition-all group" data-testid={`kpi-${w.key}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: (w.color || "#7B35D8") + "12", border: `1px solid ${w.color || "#7B35D8"}25` }}>
                  <WIcon size={14} style={{ color: w.color || "#7B35D8" }} />
                </div>
              </div>
              <p className="font-mono text-xl font-black text-white group-hover:text-[#7B35D8] transition-colors">{w.value}</p>
              <p className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{w.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid — Physician/Nurse get revenue + clinical, others get specialized panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue Breakdown — only for physician/nurse */}
        {(role === "longevity_physician" || role === "clinician" || role === "nurse_navigator") && revenue && (
          <div className="lg:col-span-5 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="revenue-breakdown">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" />
                <h3 className="font-display text-sm font-bold text-white">Revenue Breakdown</h3>
              </div>
              <Badge className="font-mono text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">MTD</Badge>
            </div>
            <div className="flex gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" stroke="none">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {Object.entries(revenue.streams).map(([key, s]) => {
                  const SIcon = STREAM_ICONS[key] || Activity;
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STREAM_COLORS[key] }} />
                      <SIcon size={12} style={{ color: STREAM_COLORS[key] }} className="shrink-0" />
                      <div className="flex-1 min-w-0"><p className="font-body text-[11px] text-white truncate">{s.label}</p></div>
                      <span className="font-mono text-xs font-bold text-white">${(s.revenue / 1000).toFixed(1)}K</span>
                      <span className="font-mono text-[8px] text-emerald-400 flex items-center"><ArrowUpRight size={8} /> {s.trend}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {revenue.monthly_trend && (
              <div className="mt-4 h-20 border-t border-white/5 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue.monthly_trend}>
                    <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "9px" }} formatter={(v) => [`$${(v / 1000).toFixed(1)}K`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={1.5} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Clinical Outcomes */}
        <div className={`${(role === "longevity_physician" || role === "clinician" || role === "nurse_navigator") && revenue ? "lg:col-span-4" : "lg:col-span-6"} rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5`} data-testid="clinical-outcomes">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse size={16} className="text-[#0F9F8F]" />
            <h3 className="font-display text-sm font-bold text-white">Clinical Outcomes</h3>
          </div>
          {kpis && (
            <div className="space-y-3.5">
              {[
                { label: "Biomarker Improvement", value: kpis.biomarker_improvement_pct, color: "#10B981" },
                { label: "Protocol Compliance", value: kpis.protocol_compliance_pct, color: "#6366F1" },
                { label: "Follow-up Adherence", value: kpis.follow_up_adherence_pct, color: "#7B35D8" },
                { label: "Lab Completion", value: kpis.lab_completion_rate, color: "#0F9F8F" },
                { label: "Referral Completion", value: kpis.referral_completion_rate, color: "#D97706" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">{label}</span>
                    <span className="font-mono text-xs font-bold" style={{ color }}>{value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="font-mono text-lg font-black text-white">{kpis.total_encounters}</p>
                  <p className="font-mono text-[7px] text-slate-500 uppercase">Encounters</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-lg font-black text-white">{kpis.patient_satisfaction}<span className="text-xs text-slate-500">/5</span></p>
                  <p className="font-mono text-[7px] text-slate-500 uppercase">Satisfaction</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alert Queue */}
        <div className={`${(role === "longevity_physician" || role === "clinician" || role === "nurse_navigator") && revenue ? "lg:col-span-3" : "lg:col-span-6"} space-y-5`}>
          <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="alert-queue-mini">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Bell size={14} className="text-red-400" /><h3 className="font-display text-xs font-bold text-white">Alert Queue</h3></div>
              <button data-testid="view-all-alerts" onClick={() => navigate("/hcp/alerts")} className="font-mono text-[8px] text-[#7B35D8] hover:text-[#9B60E8]">All</button>
            </div>
            <div className="space-y-1.5">
              {topAlerts.length > 0 ? topAlerts.slice(0, 4).map(a => {
                const c = a.severity === "CRITICAL" ? "#EF4444" : a.severity === "HIGH" ? "#D97706" : "#6366F1";
                return (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]" onClick={() => navigate("/hcp/alerts")} data-testid={`alert-mini-${a.id}`}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[11px] text-white truncate">{a.member_name || "Member"}</p>
                      <p className="font-mono text-[7px] text-slate-500">{a.biomarker}: {a.value}</p>
                    </div>
                    <Badge className="font-mono text-[6px] shrink-0" style={{ backgroundColor: c + "15", color: c }}>{a.severity}</Badge>
                  </div>
                );
              }) : <p className="text-slate-500 font-mono text-[10px] text-center py-3">No alerts</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Tracker + Population Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="referral-tracker">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><UserCheck size={16} className="text-[#6366F1]" /><h3 className="font-display text-sm font-bold text-white">Referral Tracker</h3></div>
            {/* <div className="flex gap-2">
              {referrals && Object.entries(referrals.stats).filter(([k]) => k !== "total").map(([status, count]) => (
                <Badge key={status} className="font-mono text-[7px]" style={{ backgroundColor: (REF_STATUS_COLORS[status] || "#475569") + "15", color: REF_STATUS_COLORS[status] || "#475569" }}>
                  {status.replace("_", " ")}: {count}
                </Badge>
              ))}
            </div> */}
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {referrals?.referrals?.slice(0, 8).map(ref => (
              <div key={ref.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all" data-testid={`referral-${ref.id}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: (REF_STATUS_COLORS[ref.status] || "#475569") + "15", color: REF_STATUS_COLORS[ref.status] || "#475569" }}>
                  {(ref.member_name || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-xs font-medium text-white truncate">{ref.member_name}</p>
                    <Badge className="font-mono text-[6px]" style={{ backgroundColor: (REF_STATUS_COLORS[ref.status] || "#475569") + "15", color: REF_STATUS_COLORS[ref.status] || "#475569" }}>{ref.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="font-mono text-[8px] text-slate-500 mt-0.5">{ref.referral_type} &middot; {ref.reason} &middot; To: {ref.referred_to_name}</p>
                </div>
                <Badge className={`font-mono text-[6px] shrink-0 ${ref.priority === "high" ? "bg-red-500/10 text-red-400" : "bg-slate-500/10 text-slate-400"}`}>{ref.priority}</Badge>
              </div>
            ))}
            {(!referrals || !referrals.referrals?.length) && <p className="text-slate-500 font-mono text-xs text-center py-6">No referrals</p>}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="population-highlights">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><BarChart3 size={16} className="text-[#7B35D8]" /><h3 className="font-display text-sm font-bold text-white">Population Health</h3></div>
            <button data-testid="view-population" onClick={() => navigate("/hcp/population")} className="font-mono text-[8px] text-[#7B35D8] hover:text-[#9B60E8] flex items-center gap-1">Full Analytics <ArrowRight size={10} /></button>
          </div>
          {popHealth && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="font-mono text-xl font-black text-white">{Math.round(popHealth.avg_hps)}</p>
                  <p className="font-mono text-[7px] text-slate-500 uppercase">Avg HPS</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="font-mono text-xl font-black text-red-400">{popHealth.at_risk_members}</p>
                  <p className="font-mono text-[7px] text-slate-500 uppercase">At-Risk</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="font-mono text-xl font-black text-emerald-400">{popHealth.optimal_members}</p>
                  <p className="font-mono text-[7px] text-slate-500 uppercase">Optimal</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {Object.entries(popHealth.tier_distribution).map(([tier, count]) => {
                  const pct = Math.round(count / popHealth.total_members * 100);
                  return (
                    <div key={tier} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TIER_COLORS[tier] }} />
                      <span className="font-mono text-[8px] text-slate-400 w-20 truncate">{tier}</span>
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TIER_COLORS[tier] }} /></div>
                      <span className="font-mono text-[8px] text-white w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
