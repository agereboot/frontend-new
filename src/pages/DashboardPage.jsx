import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { HPSRing, PillarRing } from "@/components/hps/HPSRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Zap, Brain, Moon, Heart,
  Trophy, Flame, Coins, Award, Target, Globe, Building, ChevronRight, Gift,
  CheckCircle, Clock, MapPin, Utensils, Watch, MessageCircle, Wind, Droplet, Map,
  Phone, X, Send, AlertCircle, Pill, Salad, Lightbulb
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const PILLAR_ICONS = {
  "Biological Resilience": Heart,
  "Physical Fitness": Zap,
  "Cognitive Health": Brain,
  "Sleep & Recovery": Moon,
  "Behaviour & Lifestyle": Shield,
};

const ACTION_ICONS = {
  zap: Zap, target: Target, refresh: RefreshCw, watch: Watch, utensils: Utensils,
  award: Award, map: Map, message: MessageCircle, heart: Heart, droplet: Droplet, wind: Wind,
  pill: Pill, flame: Flame,
};

const PRIORITY_STYLES = {
  high: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", dot: "bg-red-500" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", dot: "bg-amber-500" },
  low: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500" },
};

const TYPE_COLORS = {
  wellness: "#0F9F8F", mindfulness: "#7B35D8", movement: "#4F46E5",
  nutrition: "#D97706", sleep: "#6366F1", social: "#EC4899",
  resilience: "#EF4444", steps: "#0F9F8F", hps_improvement: "#7B35D8",
  biomarker: "#EF4444", exercise: "#0F9F8F",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [score, setScore] = useState(null);
  const [trend, setTrend] = useState(null);
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [nutritionScore, setNutritionScore] = useState(null);
  const [bioAge, setBioAge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosMsg, setSosMsg] = useState("");
  const [sosSending, setSosSending] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [scoreRes, trendRes, statsRes, rankRes, dailyRes, actionsRes, nutRes, bioAgeRes] = await Promise.all([
        api.get(`/hps/score/${user.user_id}`),
        api.get("/hps/trend").catch(() => ({ data: { trend: null } })),
        api.get("/employee/dashboard-stats").catch(() => ({ data: {} })),
        api.get("/employee/global-ranking").catch(() => ({ data: {} })),
        api.get("/employee/daily-challenge").catch(() => ({ data: null })),
        api.get("/employee/action-items").catch(() => ({ data: { items: [] } })),
        api.get("/nutrition/weekly-score").catch(() => ({ data: null })),
        api.get("/health/organ-ages").catch(() => ({ data: null })),
      ]);
      setScore(scoreRes.data?.hps_final ? scoreRes.data : null);
     console.log("Fetched dashboard data:", { score: scoreRes.data, trend: trendRes.data, stats: statsRes.data, ranking: rankRes.data, dailyChallenge: dailyRes.data, actionItems: actionsRes.data, nutritionScore: nutRes.data, bioAge: bioAgeRes.data });
      setTrend(trendRes.data?.current ? trendRes.data : null);
      setStats(statsRes.data);
      setRanking(rankRes.data);
      setDailyChallenge(dailyRes.data);
      setActionItems(actionsRes.data?.items || []);
      setNutritionScore(nutRes.data);
      setBioAge(bioAgeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCompute = async () => {
    setComputing(true);
    try {
      const res = await api.post("/hps/compute");
      setScore(res.data);
      toast.success(`HPS computed: ${Math.round(res.data.hps_final)} pts`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to compute HPS");
    } finally {
      setComputing(false);
    }
  };

  const handleCompleteDaily = async () => {
    setCompleting(true);
    try {
      const res = await api.post("/employee/daily-challenge/complete");
      setDailyChallenge(res.data);
      toast.success("Daily challenge completed! Surprise unlocked!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to complete");
    } finally {
      setCompleting(false);
    }
  };

  const handleSOS = async () => {
    setSosSending(true);
    try {
      const res = await api.post("/employee/sos", { message: sosMsg || "Emergency assistance requested", severity: "high" });
      toast.success(`SOS sent! ${res.data.notified_team?.length || 1} care team members notified.`);
      setSosOpen(false);
      setSosMsg("");
    } catch (err) {
      toast.error("Failed to send SOS");
    } finally {
      setSosSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="dashboard-loading">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto" />
        <p className="mt-4 font-mono text-sm text-stellar-dim tracking-wider">LOADING TELEMETRY...</p>
      </div>
    </div>
  );

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor = trend?.direction === "up" ? "#0F9F8F" : trend?.direction === "down" ? "#EF4444" : "#D97706";

  return (
    <div className="space-y-5 animate-slide-up" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Performance <span className="text-cosmic">Dashboard</span>
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            {user?.franchise || "Independent"} &middot; {user?.name}
          </p>
        </div>
        <Button data-testid="compute-hps-btn" onClick={handleCompute} disabled={computing}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
          <RefreshCw size={16} className={computing ? "animate-spin mr-2" : "mr-2"} />
          {computing ? "Computing..." : "Compute HPS"}
        </Button>
      </div>

      {!score ? (
        <div className="glass-card rounded-lg p-16 text-center" data-testid="no-score-card">
          <div className="w-16 h-16 rounded-full bg-cosmic/10 border border-cosmic/20 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-cosmic" />
          </div>
          <h2 className="font-display text-xl font-bold text-stellar mb-2">No HPS Computed Yet</h2>
          <p className="text-stellar-dim font-body max-w-md mx-auto mb-6">
            Add biomarker data first, then compute your Health Performance Score.
          </p>
          <Button data-testid="first-compute-btn" onClick={handleCompute} disabled={computing}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-8 border border-cosmic-light/30">
            Compute Your First HPS
          </Button>
        </div>
      ) : (
        <>
          {/* Row 1: HPS Ring + Trend Widget + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* HPS Ring */}
            <div className="lg:col-span-3 glass-card rounded-lg p-6 flex flex-col items-center justify-center cosmic-glow" data-testid="hps-ring-card">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Health Performance Scoress</p>
              <HPSRing score={score.hps_final} tier={score.tier} ci={score.confidence_interval} size={180} strokeWidth={12} />
              <div className="mt-3 flex gap-4">
                <div className="text-center">
                  <p className="font-mono text-[9px] text-stellar-dim">Metrics</p>
                  <p className="font-mono text-sm font-bold text-stellar">{score.n_metrics_tested}</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[9px] text-stellar-dim">Coverage</p>
                  <p className="font-mono text-sm font-bold text-stellar">{(score.coverage_ratio * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* Trend Widget */}
            <div className="lg:col-span-5 glass-card rounded-lg p-5" data-testid="trend-widget">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Week-over-Week Trend</p>
                <div className="flex items-center gap-1.5" style={{ color: trendColor }}>
                  <TrendIcon size={14} />
                  <span className="font-mono text-xs font-bold">
                    {trend?.delta > 0 ? "+" : ""}{trend?.delta || 0} pts
                  </span>
                </div>
              </div>

              {/* Trend chart */}
              {trend?.chart_data?.length > 0 && (
                <div className="h-28 mb-3" style={{ minWidth: 100, minHeight: 50 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend.chart_data}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B35D8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7B35D8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis domain={["dataMin - 50", "dataMax + 50"]} hide />
                      <Tooltip contentStyle={{ background: "#0F0A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="hps" stroke="#7B35D8" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: "#7B35D8", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AgeReboot Insights */}
              {trend?.insights?.length > 0 && (
                <div className="space-y-1.5">
                  {trend.insights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Lightbulb size={11} className="text-cosmic shrink-0 mt-0.5" />
                      <p className="font-body text-xs text-stellar-dim leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Stack */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3" data-testid="quick-stats">
              {/* Streak */}
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center">
                <Flame size={20} className="text-amber-500 mb-1" />
                <p className="font-mono text-2xl font-black text-stellar">{stats?.streak_days || 0}</p>
                <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Day Streak</p>
              </div>
              {/* Weekly Credits */}
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center">
                <Coins size={20} className="text-aurora mb-1" />
                <p className="font-mono text-2xl font-black text-stellar">{stats?.weekly_credits || 0}</p>
                <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Credits (7d)</p>
              </div>
              {/* Monthly Badges */}
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center">
                <Award size={20} className="text-cosmic mb-1" />
                <p className="font-mono text-2xl font-black text-stellar">{stats?.monthly_badges_count || 0}</p>
                <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Badges (30d)</p>
              </div>
              {/* Alert */}
              <div className="glass-card rounded-lg p-4 flex flex-col items-center justify-center"
                data-testid="alert-banner" style={{ borderColor: (score.alert?.color || "#0F9F8F") + "30" }}>
                <AlertTriangle size={20} style={{ color: score.alert?.color }} className="mb-1" />
                <p className="font-mono text-sm font-bold uppercase" style={{ color: score.alert?.color }}>
                  {score.alert?.level}
                </p>
                <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Status</p>
              </div>
            </div>
          </div>

          {/* Row 2: Biological Age + HPS Pillar Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Biological Age Card */}
            {bioAge && (
              <div className="lg:col-span-4 glass-card rounded-lg p-5 relative overflow-hidden" data-testid="bio-age-card">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.05]"
                  style={{ background: "radial-gradient(circle at top right, #7B35D8, transparent 70%)" }} />
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={14} className="text-cosmic" />
                  <p className="font-mono text-[10px] tracking-[0.2em] text-cosmic uppercase">Biological Age</p>
                </div>
                <div className="text-center mb-3">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-mono text-5xl font-black text-stellar">{bioAge.overall_biological_age?.toFixed(1)}</span>
                    <span className="font-mono text-sm text-stellar-dim">yrs</span>
                  </div>
                  <p className="font-mono text-[9px] text-stellar-dim mt-1">vs Chronological: {user?.age} yrs</p>
                </div>
                {(() => {
                  const diff = (bioAge.overall_biological_age || user?.age) - (user?.age || 30);
                  const isYounger = diff < 0;
                  return (
                    <div className={`text-center p-2.5 rounded-lg border ${
                      isYounger ? "bg-emerald-500/10 border-emerald-500/20" : diff === 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"
                    }`}>
                      <span className={`font-mono text-sm font-bold ${
                        isYounger ? "text-emerald-400" : diff === 0 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {isYounger ? `${Math.abs(diff).toFixed(1)} yrs younger` : diff === 0 ? "Right on track" : `${diff.toFixed(1)} yrs older`}
                      </span>
                    </div>
                  );
                })()}
                {/* Organ ages */}
                <div className="mt-4 space-y-1.5">
                  <p className="font-mono text-[9px] text-stellar-dim/60 uppercase tracking-wider mb-1">Organ Age Breakdown</p>
                  {(bioAge.organs || []).slice(0, 6).map(o => {
                    const organAge = o.organ_age || o.predicted_age;
                    const orgDiff = organAge - (user?.age || 30);
                    return (
                      <div key={o.organ} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-stellar-dim truncate flex-1">{o.name || o.organ}</span>
                        <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, (organAge / (user?.age || 30)) * 50)}%`,
                            backgroundColor: orgDiff < -2 ? "#10B981" : orgDiff > 2 ? "#EF4444" : "#D97706"
                          }} />
                        </div>
                        <span className={`font-mono text-[10px] font-bold w-10 text-right ${orgDiff < -2 ? "text-emerald-400" : orgDiff > 2 ? "text-red-400" : "text-amber-400"}`}>
                          {organAge?.toFixed(1)}y
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pillar Breakdown */}
            <div className={`${bioAge ? "lg:col-span-8" : "lg:col-span-12"} glass-card rounded-lg p-5`} data-testid="pillar-breakdown">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">Pillar Breakdown</p>
            <div className={`grid ${bioAge ? "grid-cols-5" : "grid-cols-5"} gap-4 mb-5`}>
              {score.pillars && Object.entries(score.pillars).map(([code, p]) => (
                <PillarRing key={code} name={p.name} score={p.score} maxPoints={p.max_points}
                  percentage={p.percentage} color={p.color} size={90} strokeWidth={7} />
              ))}
            </div>
            <div className="space-y-3">
              {score.pillars && Object.entries(score.pillars).map(([code, p]) => {
                const Icon = PILLAR_ICONS[p.name] || Heart;
                return (
                  <div key={code} className="flex items-center gap-3">
                    <Icon size={14} style={{ color: p.color }} className="shrink-0" />
                    <span className="font-mono text-[10px] text-stellar-dim w-32 truncate uppercase tracking-wider">{p.name}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(p.score / p.max_points) * 100}%`, backgroundColor: p.color }} />
                    </div>
                    <span className="font-mono text-xs font-bold text-stellar w-20 text-right">{p.score}/{p.max_points}</span>
                    <span className="font-mono text-[10px] w-10 text-right" style={{ color: p.color }}>{p.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          </div>

          {/* Row 3: Daily Challenge + Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily Dopamine Challenge */}
            <div className="glass-card rounded-lg p-5 relative overflow-hidden" data-testid="daily-challenge">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cosmic/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-aurora" />
                <p className="font-mono text-[10px] tracking-[0.2em] text-aurora uppercase">Daily Challenge</p>
              </div>
             {dailyChallenge?.length > 0 &&
  dailyChallenge.map((dailyChallenge) => (
    <div
      key={dailyChallenge.id}
      className="rounded-xl border border-white/10 bg-black/20 p-4"
    >
      <h3 className="font-display text-lg font-bold text-stellar mb-1">
        {dailyChallenge.title}
      </h3>

      <p className="text-stellar-dim text-sm font-body mb-3">
        {dailyChallenge.description}
      </p>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Badge
          variant="outline"
          className="border-cosmic/30 text-cosmic font-mono text-[10px]"
        >
          +{dailyChallenge.xp} XP
        </Badge>

        <Badge
          variant="outline"
          className="font-mono text-[10px]"
          style={{
            borderColor:
              (TYPE_COLORS[dailyChallenge.type] || "#7B35D8") + "50",
            color: TYPE_COLORS[dailyChallenge.type] || "#7B35D8",
          }}
        >
          {dailyChallenge.type}
        </Badge>

        <div className="flex items-center gap-1.5 text-stellar-dim">
          <Gift size={12} />
          <span className="font-mono text-[10px]">
            {dailyChallenge.surprise_reward}
          </span>
        </div>
      </div>

      {dailyChallenge.completed ? (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="font-mono text-xs text-emerald-400">
            Completed! Reward: {dailyChallenge.surprise_reward}
          </span>
        </div>
      ) : (
        <Button
          data-testid={`complete-daily-btn-${dailyChallenge.id}`}
          onClick={() => handleCompleteDaily(dailyChallenge.id)}
          disabled={completing === dailyChallenge.id}
          className="w-full bg-gradient-to-r from-cosmic to-indigo-600 hover:from-cosmic-light hover:to-indigo-500 text-white font-display font-bold uppercase tracking-wider border border-cosmic-light/20"
        >
          {completing === dailyChallenge.id
            ? "Completing..."
            : "Mark Complete & Reveal Surprise"}
        </Button>
      )}
    </div>
  ))}
            </div>

            {/* Action Items */}
            <div className="glass-card rounded-lg p-5" data-testid="action-items">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Today's Action Items</p>
                <div className="flex items-center gap-2">
                  {actionItems?.some(i => i.category === "medication") && (
                    <Badge variant="outline" className="border-cosmic/30 text-cosmic font-mono text-[9px]">
                      <Pill size={9} className="mr-1" />
                      {actionItems?.filter(i => i.category === "medication").length} meds due
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-white/10 text-stellar-dim font-mono text-[9px]">
                    {actionItems?.length} items
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                {actionItems.slice(0, 8).map((item, i) => {
                  const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low;
                  const Icon = ACTION_ICONS[item.icon] || Target;
                  const isMed = item.category === "medication";
                  return (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-md border ${style.bg} ${style.border} transition-colors hover:bg-white/[0.04]`}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                      <Icon size={13} className={style.text} />
                      <p className="font-body text-xs text-stellar flex-1">{item.action}</p>
                      {isMed && item.med_id ? (
                        <Button size="sm" data-testid={`action-log-med-${item.med_id}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await api.post(`/health/medications/${item.med_id}/log`);
                              toast.success(`Logged! +${item.reward || 1} credits`);
                              fetchData();
                            } catch { toast.error("Already logged"); }
                          }}
                          className="bg-cosmic/20 hover:bg-cosmic/30 text-cosmic border border-cosmic/20 font-mono text-[8px] h-5 px-2 shrink-0">
                          Log +{item.reward}cr
                        </Button>
                      )  : null}
                    </div>
                  );
                })}
                
                {/* : this is for above weraable navigation item.link ? (
                        <ChevronRight size={12} className="text-stellar-dim cursor-pointer shrink-0"
                          onClick={() => window.location.href = item.link} />
                      ) */}
              </div>
            </div>
          </div>

          {/* Row 4: Active Challenges + Global Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active Challenges Snapshot */}
            <div className="glass-card rounded-lg p-5" data-testid="active-challenges">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Active Challenges</p>
                <Badge variant="outline" className="border-cosmic/30 text-cosmic font-mono text-[9px]">
                  {stats?.total_active_challenges || 0} active
                </Badge>
              </div>
              {stats?.active_challenges?.length > 0 ? (
                <div className="space-y-3">
                  {stats.active_challenges.slice(0, 4).map((ch) => (
                    <div key={ch.id} className="bg-white/[0.03] border border-white/5 rounded-md p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Trophy size={12} style={{ color: TYPE_COLORS[ch.type] || "#7B35D8" }} />
                          <span className="font-body text-xs font-medium text-stellar">{ch.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-aurora">+{ch.reward_credits}cr</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={ch.pct} className="h-1.5 flex-1" />
                        <span className="font-mono text-[9px] text-stellar-dim w-12 text-right">{ch.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Trophy size={24} className="text-stellar-dim/30 mx-auto mb-2" />
                  <p className="font-body text-xs text-stellar-dim">No active challenges</p>
                  <Button variant="link" onClick={() => window.location.href = "/challenges"}
                    className="text-cosmic text-xs font-mono mt-1 p-0 h-auto">
                    Browse Challenges <ChevronRight size={12} />
                  </Button>
                </div>
              )}
            </div>

            {/* Global Ranking */}
            <div className="glass-card rounded-lg p-5" data-testid="global-ranking">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Global Ranking</p>
              {ranking && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/[0.03] border border-white/5 rounded-md p-3 text-center">
                      <Globe size={14} className="text-cosmic mx-auto mb-1" />
                      <p className="font-mono text-xl font-black text-stellar">#{ranking.global_rank || "—"}</p>
                      <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Global</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-md p-3 text-center">
                      <Building size={14} className="text-nebula mx-auto mb-1" />
                      <p className="font-mono text-xl font-black text-stellar">#{ranking.franchise_rank || "—"}</p>
                      <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Franchise</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-md p-3 text-center">
                      <TrendingUp size={14} className="text-aurora mx-auto mb-1" />
                      <p className="font-mono text-xl font-black text-stellar">{ranking.percentile}%</p>
                      <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-widest">Percentile</p>
                    </div>
                  </div>
                  {/* Top players */}
                  <div className="space-y-1">
                    {ranking.top_20?.slice(0, 5).map((p) => (
                      <div key={p.rank}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-xs ${
                          p.is_you ? "bg-cosmic/10 border border-cosmic/20" : "border border-transparent"
                        }`}>
                        <span className="font-mono text-[10px] text-stellar-dim w-6">#{p.rank}</span>
                        <span className={`font-body font-medium flex-1 ${p.is_you ? "text-cosmic" : "text-stellar"}`}>
                          {p.name} {p.is_you && <span className="text-[9px] text-cosmic/60">(you)</span>}
                        </span>
                        <span className="font-mono text-[9px] text-stellar-dim">{p.franchise}</span>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[9px] text-stellar-dim/50 mt-2 text-center">
                    {ranking.total_players} players across all franchises
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Row 5: Nutrition Score + Biomarker Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Weekly Nutrition Score */}
            <div className="lg:col-span-5 glass-card rounded-lg p-5 relative overflow-hidden" data-testid="nutrition-score-card">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.05]"
                style={{ background: "radial-gradient(circle at top right, #D97706, transparent 70%)" }} />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Salad size={14} className="text-amber-500" />
                <p className="font-mono text-[10px] tracking-[0.2em] text-amber-400 uppercase">Nutrition Score</p>
              </div>
              {nutritionScore ? (
                <div className="relative z-10 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-5xl font-black text-stellar">{nutritionScore.weekly_score}</span>
                    <span className="font-mono text-sm text-stellar-dim">/100</span>
                    {nutritionScore.change != null && (
                      <span className={`font-mono text-xs font-bold ${nutritionScore.change > 0 ? "text-emerald-400" : nutritionScore.change < 0 ? "text-red-400" : "text-stellar-dim"}`}>
                        {nutritionScore.change > 0 ? "+" : ""}{nutritionScore.change} vs last week
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {(nutritionScore.day_scores || []).map((d) => (
                      <div key={d.date} title={`${d.date}: ${d.score}/100`}
                        className={`flex-1 h-2 rounded-full ${d.logged ? (d.score >= 70 ? "bg-emerald-400" : d.score >= 40 ? "bg-amber-400" : "bg-red-400") : "bg-white/5"}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-stellar-dim">{nutritionScore.days_logged}/{nutritionScore.days_in_week} days logged</span>
                    <span className="font-mono text-[8px] text-stellar-dim">Mon &rarr; Sun</span>
                  </div>
                  {nutritionScore.nutrient_adherence && (
                    <div className="space-y-1">
                      {Object.entries(nutritionScore.nutrient_adherence).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="font-mono text-[8px] text-stellar-dim w-14 capitalize">{k}</span>
                          <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${Math.min(v.adherence_pct, 100)}%`,
                              backgroundColor: v.adherence_pct >= 90 && v.adherence_pct <= 110 ? "#0F9F8F" : v.adherence_pct > 120 ? "#EF4444" : "#D97706"
                            }} />
                          </div>
                          <span className="font-mono text-[7px] text-stellar-dim w-8 text-right">{v.adherence_pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative z-10 text-center py-4">
                  <Salad size={28} className="text-stellar-dim/20 mx-auto mb-2" />
                  <p className="font-body text-xs text-stellar-dim">Log meals to get your nutrition score</p>
                </div>
              )}
            </div>

            {/* Biomarker Health Summary */}
            {score.metric_scores && (
              <div className="lg:col-span-7 glass-card rounded-lg p-5" data-testid="biomarker-summary">
                <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">Biomarker Status</p>
                {(() => {
                  const entries = Object.entries(score.metric_scores);
                  const green = entries.filter(([,v]) => v >= 70);
                  const yellow = entries.filter(([,v]) => v >= 40 && v < 70);
                  const red = entries.filter(([,v]) => v < 40);
                  return (
                    <div className="space-y-4">
                      <div className="flex h-3 rounded-full overflow-hidden">
                        {green.length > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(green.length / entries.length) * 100}%` }} />}
                        {yellow.length > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(yellow.length / entries.length) * 100}%` }} />}
                        {red.length > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(red.length / entries.length) * 100}%` }} />}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                          <p className="font-mono text-2xl font-black text-emerald-400">{green.length}</p>
                          <p className="font-mono text-[8px] text-emerald-400/70 uppercase tracking-widest">Optimal</p>
                        </div>
                        <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                          <p className="font-mono text-2xl font-black text-amber-400">{yellow.length}</p>
                          <p className="font-mono text-[8px] text-amber-400/70 uppercase tracking-widest">Watch</p>
                        </div>
                        <div className="text-center bg-red-500/10 border border-red-500/20 rounded-md p-3">
                          <p className="font-mono text-2xl font-black text-red-400">{red.length}</p>
                          <p className="font-mono text-[8px] text-red-400/70 uppercase tracking-widest">At Risk</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {red.length > 0 && red.map(([code, pct]) => (
                          <div key={code} className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-stellar-dim truncate">{code.replace(/_/g, " ")}</span>
                            <span className="font-mono text-xs font-bold text-red-400">{Math.round(pct)}%</span>
                          </div>
                        ))}
                        {yellow.length > 0 && yellow.slice(0, 6).map(([code, pct]) => (
                          <div key={code} className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-stellar-dim truncate">{code.replace(/_/g, " ")}</span>
                            <span className="font-mono text-xs font-bold text-amber-400">{Math.round(pct)}%</span>
                          </div>
                        ))}
                      </div>
                      <p className="font-mono text-[9px] text-stellar-dim/50 text-center">{entries.length} biomarkers tracked</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      )}

      {/* SOS Floating Button */}
      <button data-testid="sos-button" onClick={() => setSosOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all duration-200 hover:scale-110 active:scale-95"
        title="Emergency SOS">
        <Phone size={22} />
      </button>

      {/* SOS Modal */}
      {sosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" data-testid="sos-modal">
          <div className="glass-card rounded-lg p-6 w-full max-w-md mx-4 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                  <AlertCircle size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-red-400">Emergency SOS</h3>
                  <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider">Alert your care team</p>
                </div>
              </div>
              <button onClick={() => setSosOpen(false)} className="text-stellar-dim hover:text-stellar p-1">
                <X size={18} />
              </button>
            </div>
            <p className="text-stellar-dim text-sm font-body mb-3">
              This will immediately notify your assigned care team. Use for urgent health concerns.
            </p>
            <textarea data-testid="sos-message" value={sosMsg} onChange={(e) => setSosMsg(e.target.value)}
              placeholder="Describe your situation (optional)..."
              className="w-full bg-space border border-white/10 focus:border-red-500/50 text-stellar placeholder:text-slate-600 font-body text-sm rounded-md p-3 resize-none h-24 outline-none mb-4" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSosOpen(false)} className="flex-1 border-white/10 text-stellar-dim">
                Cancel
              </Button>
              <Button data-testid="sos-send-btn" onClick={handleSOS} disabled={sosSending}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-display font-bold uppercase tracking-wider">
                <Send size={14} className="mr-2" />
                {sosSending ? "Sending..." : "Send SOS"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
