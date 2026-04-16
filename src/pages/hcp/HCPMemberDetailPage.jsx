import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CDSSPanel } from "@/components/hcp/CDSSPanel";
import {
  ArrowLeft, Activity, Heart, Zap, Brain, Moon, Shield,
  Bell, BookOpen, CalendarClock, MessageSquare, Send,
  TrendingUp, TrendingDown, Minus, ShieldCheck, Clock,
  ClipboardList, Target, CheckCircle2, Circle, Play, Pause, Plus,
  AlertTriangle, Lightbulb, Dna, ArrowRight,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const PILLAR_META = {
  BR: { name: "Bio Resilience", icon: Heart, color: "#EF4444" },
  PF: { name: "Fitness", icon: Zap, color: "#0F9F8F" },
  CA: { name: "Cognitive", icon: Brain, color: "#7B35D8" },
  SR: { name: "Sleep", icon: Moon, color: "#6366F1" },
  BL: { name: "Lifestyle", icon: Shield, color: "#D97706" },
};
const TIER_COLORS = {
  CENTENARIAN: "#0F9F8F", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1",
  VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626", UNKNOWN: "#475569",
};

export default function HCPMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [bioAge, setBioAge] = useState(null);
  const [carePlan, setCarePlan] = useState(null);
  const [allProtocols, setAllProtocols] = useState([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planForm, setPlanForm] = useState({ title: "Longevity Care Plan", selectedProtocols: [], notes: "" });
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [addingToPlan, setAddingToPlan] = useState(null);

  useEffect(() => {
    api.get(`/cc/members/${memberId}`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    api.get(`/cc/bio-age/${memberId}`).then(r => setBioAge(r.data)).catch(() => {});
    api.get(`/cc/members/${memberId}/care-plan`).then(r => setCarePlan(r.data.care_plan)).catch(() => {});
    api.get("/cc/protocols").then(r => setAllProtocols(r.data.protocols || [])).catch(() => {});
    api.get(`/cc/members/${memberId}/protocol-recommendations`).then(r => setRecommendations(r.data)).catch(() => {});
  }, [memberId]);

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      const res = await api.post("/cc/messages", { recipient_id: memberId, content: msgText });
      setData(prev => ({ ...prev, messages: [...(prev.messages || []), res.data] }));
      setMsgText("");
      toast.success("Message sent");
    } catch { toast.error("Failed to send"); } finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
  );
  if (!data) return <div className="text-slate-400 text-center p-20">Member not found.</div>;

  const { member, hps, hps_history, biomarkers, alerts, prescriptions, sessions, messages, overrides } = data;
  const pillars = hps.pillars || {};
  const tier = hps.tier || "UNKNOWN";
  const hpsScore = Math.round(hps.hps_final || 0);

  const TABS = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "ai_insights", label: "AgeReboot Insights", icon: Target },
    { key: "alerts", label: `Alerts (${alerts?.length || 0})`, icon: Bell },
    { key: "sessions", label: `Sessions (${sessions?.length || 0})`, icon: CalendarClock },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "overrides", label: "Audit", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-member-detail">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button data-testid="member-back" onClick={() => navigate("/hcp/members")}
          className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-white">{member.name}</h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] uppercase">
            {member.age}y &middot; {member.sex} &middot; {member.franchise || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-3xl font-black" style={{ color: TIER_COLORS[tier] }}>{hpsScore}</p>
            <Badge className="font-mono text-[8px]" style={{ backgroundColor: TIER_COLORS[tier] + "15", color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}30` }}>{tier}</Badge>
          </div>
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-5 gap-3" data-testid="member-pillars">
        {Object.entries(PILLAR_META).map(([code, meta]) => {
          const pillarData = pillars[code];
          const score = Math.round(typeof pillarData === "object" ? pillarData?.score || 0 : pillarData || 0);
          const Icon = meta.icon;
          return (
            <div key={code} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 text-center">
              <Icon size={18} style={{ color: meta.color }} className="mx-auto mb-2" />
              <p className="font-mono text-xl font-black text-white">{score}</p>
              <p className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mt-1">{meta.name}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-px" data-testid="member-tabs">
        {TABS.map(({ key, label, icon: TIcon }) => (
          <button key={key} data-testid={`tab-${key}`} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm font-medium transition-all border-b-2 ${
              tab === key ? "border-[#7B35D8] text-white" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <TIcon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="hps-trend-chart">
              <h3 className="font-display text-sm font-bold text-white mb-4">HPS Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hps_history.map(h => ({ date: h.timestamp?.slice(5, 10) || "", score: Math.round(h.hps_final) }))}>
                    <defs>
                      <linearGradient id="hpsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7B35D8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7B35D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 1000]} tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px" }} />
                    <Area type="monotone" dataKey="score" stroke="#7B35D8" strokeWidth={2} fill="url(#hpsGrad)" dot={{ fill: "#7B35D8", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Bio-Age Widget */}
            {bioAge && (
              <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="bio-age-widget">
                <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-[#6366F1]" /> Biological Age Estimate
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="font-mono text-[9px] text-slate-500 uppercase mb-1">Chronological</p>
                    <p className="font-mono text-2xl font-black text-white">{bioAge.chronological_age}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[9px] text-slate-500 uppercase mb-1">Biological</p>
                    <p className="font-mono text-2xl font-black" style={{ color: bioAge.direction === "younger" ? "#10B981" : bioAge.direction === "older" ? "#EF4444" : "#6366F1" }}>{bioAge.biological_age}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[9px] text-slate-500 uppercase mb-1">Delta</p>
                    <p className={`font-mono text-2xl font-black ${bioAge.delta_years < 0 ? "text-emerald-400" : bioAge.delta_years > 0 ? "text-red-400" : "text-slate-400"}`}>
                      {bioAge.delta_years > 0 ? "+" : ""}{bioAge.delta_years}y
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-slate-500">Biomarkers used: {bioAge.biomarkers_used}</span>
                  <span className="font-mono text-[8px] text-slate-500">Confidence: {Math.round(bioAge.confidence * 100)}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="member-quick-info">
            <h3 className="font-display text-sm font-bold text-white mb-4">Quick Info</h3>
            <div className="space-y-3">
              {[
                ["Open Alerts", alerts?.filter(a => a.status === "open").length || 0],
                ["Active Protocols", prescriptions?.filter(p => p.status === "active").length || 0],
                ["Total Sessions", sessions?.length || 0],
                ["Biomarkers Tracked", biomarkers?.length || 0],
                ["Algorithm", hps.algorithm_version || "N/A"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
                  <span className="font-mono text-sm font-bold text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "care_plan" && (
        <div className="space-y-4" data-testid="care-plan-tab">
          {/* AgeReboot Protocol Recommendations */}
          {recommendations && recommendations.recommendations?.length > 0 && (
            <div className="rounded-xl border border-[#7B35D8]/20 bg-gradient-to-r from-[#7B35D8]/5 to-transparent p-4 space-y-3" data-testid="protocol-recommendations">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7B35D8]/10 flex items-center justify-center">
                    <Lightbulb size={14} className="text-[#7B35D8]" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">AgeReboot Protocol Recommendations</h3>
                    <p className="font-mono text-[8px] text-slate-500">
                      {recommendations.total_recommendations} protocols suggested &middot; Based on {recommendations.biomarker_summary?.total_assessed || 0} biomarkers &middot;
                      <span className="text-red-400 ml-1">{recommendations.biomarker_summary?.at_risk || 0} at risk</span>
                      <span className="text-amber-400 ml-1">{recommendations.biomarker_summary?.borderline || 0} borderline</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => {
                  setRecsLoading(true);
                  api.get(`/cc/members/${memberId}/protocol-recommendations`)
                    .then(r => { setRecommendations(r.data); setRecsLoading(false); })
                    .catch(() => setRecsLoading(false));
                }} className="font-mono text-[8px] text-[#7B35D8] hover:text-white transition-colors">
                  {recsLoading ? "Analyzing..." : "Refresh"}
                </button>
              </div>
              <div className="space-y-2">
                {recommendations.recommendations.slice(0, 8).map((rec, i) => {
                  const isAdding = addingToPlan === rec.lgp_id;
                  return (
                    <div key={rec.lgp_id} className={`rounded-lg border p-3 transition-all ${
                      rec.already_in_plan ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-black/20 hover:bg-white/[0.03]"
                    }`} data-testid={`rec-${rec.lgp_id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[9px] text-[#7B35D8] font-bold">{rec.lgp_id}</span>
                            <span className="font-body text-xs font-semibold text-white">{rec.name}</span>
                            <Badge className="font-mono text-[6px]" style={{
                              backgroundColor: rec.evidence_grade === "A" ? "rgba(15,159,143,0.1)" : "rgba(132,204,22,0.1)",
                              color: rec.evidence_grade === "A" ? "#0F9F8F" : "#84CC16",
                              border: `1px solid ${rec.evidence_grade === "A" ? "rgba(15,159,143,0.2)" : "rgba(132,204,22,0.2)"}`,
                            }}>Grade {rec.evidence_grade}</Badge>
                            {rec.already_in_plan && (
                              <Badge className="font-mono text-[6px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">In Plan</Badge>
                            )}
                          </div>
                          {/* Risk Reasons */}
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {rec.reasons.map((reason, ri) => (
                              <span key={ri} className="flex items-center gap-1 font-mono text-[7px] px-1.5 py-0.5 rounded bg-red-500/5 border border-red-500/10 text-red-400">
                                <AlertTriangle size={8} /> {reason}
                              </span>
                            ))}
                          </div>
                          {/* Flagged Biomarkers */}
                          {rec.flagged_biomarkers?.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {rec.flagged_biomarkers.map((bm, bi) => (
                                <span key={bi} className="font-mono text-[7px] text-slate-400">
                                  <span className={bm.status === "red" ? "text-red-400" : "text-amber-400"}>{bm.name}: {bm.value} {bm.unit}</span>
                                  <span className="text-slate-600 ml-0.5">(opt: {bm.optimal_low}-{bm.optimal_high})</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {/* Confidence */}
                          <div className="flex items-center gap-1">
                            <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{
                                width: `${rec.confidence * 100}%`,
                                background: rec.confidence > 0.8 ? "#0F9F8F" : rec.confidence > 0.6 ? "#D97706" : "#6366F1",
                              }} />
                            </div>
                            <span className="font-mono text-[7px] text-slate-500">{Math.round(rec.confidence * 100)}%</span>
                          </div>
                          {/* Add to Plan Button */}
                          {!rec.already_in_plan && carePlan && (
                            <Button size="sm" data-testid={`add-rec-${rec.lgp_id}`}
                              disabled={isAdding}
                              onClick={async () => {
                                setAddingToPlan(rec.lgp_id);
                                try {
                                  const currentProtos = carePlan.protocols.map(p => ({ protocol_id: p.protocol_id }));
                                  currentProtos.push({ protocol_id: rec.protocol_id });
                                  await api.put(`/cc/care-plans/${carePlan.id}`, {
                                    protocols: currentProtos,
                                  });
                                  const res = await api.get(`/cc/members/${memberId}/care-plan`);
                                  setCarePlan(res.data.care_plan);
                                  const recsRes = await api.get(`/cc/members/${memberId}/protocol-recommendations`);
                                  setRecommendations(recsRes.data);
                                  toast.success(`Added ${rec.name} to care plan`);
                                } catch { toast.error("Failed to add"); }
                                setAddingToPlan(null);
                              }}
                              className="bg-[#7B35D8]/10 text-[#7B35D8] border border-[#7B35D8]/20 hover:bg-[#7B35D8]/20 font-mono text-[7px] h-6 px-2">
                              {isAdding ? "Adding..." : <>
                                <Plus size={10} className="mr-0.5" /> Add to Plan
                              </>}
                            </Button>
                          )}
                          {!rec.already_in_plan && !carePlan && (
                            <Button size="sm" data-testid={`quick-plan-${rec.lgp_id}`}
                              disabled={isAdding}
                              onClick={async () => {
                                setAddingToPlan(rec.lgp_id);
                                try {
                                  await api.post(`/cc/members/${memberId}/care-plan`, {
                                    title: "AgeReboot Longevity Plan",
                                    protocols: [{ protocol_id: rec.protocol_id }],
                                    notes: `Auto-created from recommendation: ${rec.reasons[0] || ""}`,
                                  });
                                  const res = await api.get(`/cc/members/${memberId}/care-plan`);
                                  setCarePlan(res.data.care_plan);
                                  const recsRes = await api.get(`/cc/members/${memberId}/protocol-recommendations`);
                                  setRecommendations(recsRes.data);
                                  toast.success(`Care plan created with ${rec.name}`);
                                } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
                                setAddingToPlan(null);
                              }}
                              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono text-[7px] h-6 px-2">
                              {isAdding ? "Creating..." : <>
                                <Dna size={10} className="mr-0.5" /> Create Plan
                              </>}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {carePlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{carePlan.title}</h3>
                  <p className="font-mono text-[9px] text-slate-500">
                    Created by {carePlan.hcp_name} &middot; {new Date(carePlan.created_at).toLocaleDateString()} &middot; {carePlan.protocols?.length || 0} protocols
                  </p>
                </div>
                <Badge data-testid="care-plan-status" className={`font-mono text-[8px] ${
                  carePlan.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>{carePlan.status}</Badge>
              </div>
              {carePlan.notes && (
                <p className="font-body text-xs text-slate-400 bg-white/[0.02] border border-white/5 rounded-lg p-3">{carePlan.notes}</p>
              )}
              {/* Progress Overview */}
              {(() => {
                const allGoals = (carePlan.protocols || []).flatMap(p => p.customized_goals || []);
                const achieved = allGoals.filter(g => g.status === "achieved").length;
                const inProgress = allGoals.filter(g => g.status === "in_progress").length;
                const total = allGoals.length;
                const pct = total > 0 ? Math.round((achieved / total) * 100) : 0;
                return (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid="care-plan-progress">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Goal Progress</span>
                      <span className="font-mono text-sm font-bold text-white">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#7B35D8] to-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="font-mono text-[8px] text-emerald-400">{achieved} achieved</span>
                      <span className="font-mono text-[8px] text-blue-400">{inProgress} in progress</span>
                      <span className="font-mono text-[8px] text-slate-500">{total - achieved - inProgress} remaining</span>
                    </div>
                  </div>
                );
              })()}
              {/* Protocol Cards with Goals */}
              {(carePlan.protocols || []).map((cp, pi) => (
                <div key={pi} className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-3" data-testid={`care-plan-protocol-${pi}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[9px] text-[#7B35D8]">{cp.lgp_id}</span>
                      <h4 className="font-body text-sm font-semibold text-white">{cp.protocol_name}</h4>
                      <span className="font-mono text-[8px] text-slate-500">{cp.category}</span>
                    </div>
                    <Badge className={`font-mono text-[7px] ${
                      cp.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>{cp.status}</Badge>
                  </div>
                  {(cp.customized_goals || []).map((goal, gi) => {
                    const statusColor = {
                      achieved: "text-emerald-400", in_progress: "text-blue-400",
                      not_started: "text-slate-500", missed: "text-red-400",
                    }[goal.status] || "text-slate-500";
                    const StatusIcon = {
                      achieved: CheckCircle2, in_progress: Play, not_started: Circle, missed: Pause,
                    }[goal.status] || Circle;
                    return (
                      <div key={gi} className="flex items-start gap-3 py-2 border-t border-white/5" data-testid={`goal-${goal.goal_id}`}>
                        <StatusIcon size={14} className={`mt-0.5 shrink-0 ${statusColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs text-slate-300">{goal.description}</p>
                          {goal.target_value && (
                            <p className="font-mono text-[8px] text-slate-500 mt-0.5">Target: {goal.target_value}</p>
                          )}
                        </div>
                        <AppSelect
                          data-testid={`goal-status-${goal.goal_id}`}
                          value={goal.status}
                          onChange={async (e) => {
                            try {
                              await api.put(`/cc/care-plans/${carePlan.id}/goals/${goal.goal_id}`, { status: e.target.value });
                              const res = await api.get(`/cc/members/${memberId}/care-plan`);
                              setCarePlan(res.data.care_plan);
                              toast.success("Goal updated");
                            } catch { toast.error("Update failed"); }
                          }}
                          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[9px] text-white font-mono focus:border-[#7B35D8] focus:outline-none shrink-0"
                        >
                          <AppSelectOption value="not_started">Not Started</AppSelectOption>
                          <AppSelectOption value="in_progress">In Progress</AppSelectOption>
                          <AppSelectOption value="achieved">Achieved</AppSelectOption>
                          <AppSelectOption value="missed">Missed</AppSelectOption>
                        </AppSelect>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : showCreatePlan ? (
            <div className="rounded-xl border border-[#7B35D8]/30 bg-black/30 p-5 space-y-4" data-testid="create-care-plan-form">
              <h3 className="font-display text-lg font-bold text-white">Create Care Plan</h3>
              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Plan Title</label>
                <input data-testid="plan-title" value={planForm.title}
                  onChange={e => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none font-body" />
              </div>
              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase mb-2 block">
                  Select Protocols ({planForm.selectedProtocols.length} selected)
                </label>
                <div className="max-h-[250px] overflow-y-auto space-y-1.5 custom-scrollbar">
                  {allProtocols.map(p => {
                    const isSelected = planForm.selectedProtocols.includes(p.id);
                    return (
                      <button key={p.id} data-testid={`select-protocol-${p.lgp_id}`}
                        onClick={() => setPlanForm(prev => ({
                          ...prev,
                          selectedProtocols: isSelected
                            ? prev.selectedProtocols.filter(id => id !== p.id)
                            : [...prev.selectedProtocols, p.id]
                        }))}
                        className={`w-full text-left rounded-lg border p-2.5 transition-all ${
                          isSelected
                            ? "border-[#7B35D8]/40 bg-[#7B35D8]/10"
                            : "border-white/5 bg-black/20 hover:bg-white/5"
                        }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? "bg-[#7B35D8] border-[#7B35D8]" : "border-white/20"
                          }`}>
                            {isSelected && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <span className="font-mono text-[8px] text-[#7B35D8]">{p.lgp_id}</span>
                          <span className="font-body text-xs text-white">{p.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <textarea data-testid="plan-notes" value={planForm.notes}
                onChange={e => setPlanForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Care plan notes..." rows={2}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body resize-none placeholder:text-slate-600" />
              <div className="flex gap-3">
                <Button data-testid="cancel-plan" onClick={() => setShowCreatePlan(false)}
                  variant="outline" className="flex-1 border-white/10 text-slate-300 hover:bg-white/5 font-body text-xs">Cancel</Button>
                <Button data-testid="save-plan" disabled={planForm.selectedProtocols.length === 0}
                  onClick={async () => {
                    try {
                      await api.post(`/cc/members/${memberId}/care-plan`, {
                        title: planForm.title,
                        protocols: planForm.selectedProtocols.map(id => ({ protocol_id: id })),
                        notes: planForm.notes,
                      });
                      const res = await api.get(`/cc/members/${memberId}/care-plan`);
                      setCarePlan(res.data.care_plan);
                      setShowCreatePlan(false);
                      toast.success("Care plan created");
                    } catch (e) { toast.error(e.response?.data?.detail || "Failed to create plan"); }
                  }}
                  className="flex-1 bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-xs font-semibold">
                  <CheckCircle2 size={14} className="mr-2" /> Create Plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-care-plan">
              <ClipboardList size={40} className="text-[#7B35D8]/30 mx-auto mb-3" />
              <p className="font-body text-sm text-slate-400 mb-4">No active care plan for this member.</p>
              <Button data-testid="create-care-plan-btn" onClick={() => setShowCreatePlan(true)}
                className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm font-semibold">
                <Plus size={16} className="mr-2" /> Create Care Plan
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "ai_insights" && (
        <div data-testid="ai-insights-tab">
          <CDSSPanel memberId={memberId} memberName={member.name} />
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-2" data-testid="member-alerts-list">
          {alerts?.length > 0 ? alerts.map(a => {
            const sc = a.severity === "CRITICAL" ? "#EF4444" : a.severity === "HIGH" ? "#D97706" : a.severity === "MEDIUM" ? "#6366F1" : "#475569";
            return (
              <div key={a.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-start gap-4">
                <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: sc, boxShadow: `0 0 8px ${sc}50` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: sc + "15", color: sc, border: `1px solid ${sc}30` }}>{a.severity}</Badge>
                    <span className="font-mono text-xs text-white font-medium">{a.biomarker}: {a.value} {a.unit}</span>
                    <span className="font-mono text-[8px] text-slate-500 ml-auto">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</span>
                  </div>
                  <p className="font-body text-xs text-slate-300">{a.ai_interpretation}</p>
                </div>
                <Badge className={`font-mono text-[7px] shrink-0 ${a.status === "open" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>{a.status}</Badge>
              </div>
            );
          }) : <p className="text-slate-500 text-sm text-center py-8">No alerts for this member.</p>}
        </div>
      )}

      {tab === "protocols" && (
        <div className="space-y-2" data-testid="member-protocols-list">
          {prescriptions?.length > 0 ? prescriptions.map(p => (
            <div key={p.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-sm font-medium text-white">{p.protocol_name}</span>
                <Badge className={`font-mono text-[7px] ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>{p.status}</Badge>
              </div>
              <p className="font-mono text-[9px] text-slate-500">{p.category} &middot; {p.duration_weeks}wk &middot; Grade {p.evidence_grade} &middot; {new Date(p.prescribed_at).toLocaleDateString()}</p>
              {p.custom_notes && <p className="font-body text-xs text-slate-400 mt-1">{p.custom_notes}</p>}
            </div>
          )) : <p className="text-slate-500 text-sm text-center py-8">No protocols prescribed.</p>}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y-2" data-testid="member-sessions-list">
          {sessions?.length > 0 ? sessions.map(s => (
            <div key={s.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-sm font-medium text-white">{s.session_type} — {s.duration_min}min</span>
                <Badge className={`font-mono text-[7px] ${
                  s.status === "scheduled" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  s.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>{s.status}</Badge>
              </div>
              <p className="font-mono text-[9px] text-slate-500">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "TBD"}</p>
              {s.notes && <p className="font-body text-xs text-slate-400 mt-1">{s.notes}</p>}
            </div>
          )) : <p className="text-slate-500 text-sm text-center py-8">No sessions recorded.</p>}
        </div>
      )}

      {tab === "messages" && (
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm" data-testid="member-messages">
          <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
            {messages?.length > 0 ? messages.map(m => {
              const isMe = m.sender_role === "clinician" || m.sender_role === "coach";
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-xl p-3 ${isMe ? "bg-[#7B35D8]/15 border border-[#7B35D8]/20" : "bg-white/5 border border-white/5"}`}>
                    <p className="font-body text-sm text-white">{m.content}</p>
                    <p className="font-mono text-[8px] text-slate-500 mt-1">{m.sent_at ? new Date(m.sent_at).toLocaleString() : ""}</p>
                  </div>
                </div>
              );
            }) : <p className="text-slate-500 text-sm text-center py-8">No messages yet. Start the conversation.</p>}
          </div>
          <div className="p-4 border-t border-white/5 flex gap-3">
            <input data-testid="msg-input" value={msgText} onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..." className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600 font-body" />
            <Button data-testid="msg-send" onClick={sendMessage} disabled={sending || !msgText.trim()}
              className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white px-4">
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}

      {tab === "overrides" && (
        <div className="space-y-2" data-testid="member-overrides-list">
          {overrides?.length > 0 ? overrides.map(o => (
            <div key={o.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-sm font-medium text-white">{o.override_type}</span>
                <Badge className={`font-mono text-[7px] ${o.approved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                  {o.approved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <p className="font-mono text-[9px] text-slate-500">
                {o.old_value != null ? `${o.old_value} → ${o.new_value}` : `Freeze: ${o.freeze_days} days`} &middot; {o.reason_code} &middot; {new Date(o.created_at).toLocaleDateString()}
              </p>
              {o.reason_text && <p className="font-body text-xs text-slate-400 mt-1">{o.reason_text}</p>}
            </div>
          )) : <p className="text-slate-500 text-sm text-center py-8">No overrides recorded.</p>}
        </div>
      )}
    </div>
  );
}
