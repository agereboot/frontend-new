import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Brain, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Shield,
  Activity, Heart, Zap, Moon, Target, Clock, RotateCcw, ArrowRight,
  Gauge, TrendingUp, TrendingDown, Minus, Lightbulb, FileText, Sun
} from "lucide-react";

const DOMAIN_ICONS = {
  "Mood & Energy": Sun,
  "Calm & Control": Shield,
  "Stress Resilience": Zap,
  "Inner Strength": Heart,
  "Quality of Life": Activity,
  "Mental Sharpness": Brain,
  "Rest & Recovery": Moon,
};

const FLAG_STYLES = {
  GREEN: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", label: "Optimal" },
  YELLOW: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: "Fair" },
  ORANGE: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", label: "Low" },
  RED: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "Needs Attention" },
};

const TREND_ICONS = { improving: TrendingDown, declining: TrendingUp, stable: Minus, worsening: TrendingUp };
const TREND_COLORS = { improving: "#0F9F8F", declining: "#EF4444", stable: "#D97706", worsening: "#EF4444" };

const CATEGORY_META = {
  depression: { name: "Mood", icon: Sun, color: "#6366F1" },
  anxiety: { name: "Calm", icon: Shield, color: "#EF4444" },
  sleep: { name: "Sleep", icon: Moon, color: "#8B5CF6" },
  cognitive: { name: "Cognition", icon: Brain, color: "#0F9F8F" },
  stress: { name: "Stress", icon: Zap, color: "#D97706" },
};

export default function MindCognitionPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState("overview");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scale, setScale] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [latest, setLatest] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [mhHistory, setMhHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, burnoutRes, histRes] = await Promise.all([
        api.get("/hps/adaptive-assessment/latest").catch(() => ({ data: { assessment: null } })),
        api.get("/health/burnout-prediction").catch(() => ({ data: { prediction: null } })),
        api.get("/hps/adaptive-assessment/history").catch(() => ({ data: { history: [] } })),
      ]);
      if (latestRes.data?.domain_scores) setLatest(latestRes.data);
      setBurnout(burnoutRes.data?.prediction);
      setMhHistory(histRes.data?.history || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startAssessment = async () => {
    try {
      const res = await api.get("/hps/adaptive-assessment/questions");
      setQuestions(res.data.questions || []);
      setScale(res.data.scale || []);
      setAnswers({});
      setCurrentQ(0);
      setPhase("assessment");
    } catch (err) {
      toast.error("Failed to load questions");
    }
  };

  const handleAnswer = (value) => {
    const qid = questions[currentQ].id;
    setAnswers(prev => ({ ...prev, [qid]: value }));
    setTimeout(() => {
      if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
    }, 280);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([id, value]) => ({ id, value })),
      };
      const res = await api.post("/hps/adaptive-assessment/submit", payload);
      setResults(res.data);
      setPhase("results");
      toast.success("Assessment complete!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setPhase("overview");
    setQuestions([]);
    setCurrentQ(0);
    setAnswers({});
    setResults(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="mind-loading">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto" />
        <p className="mt-4 font-mono text-sm text-stellar-dim tracking-wider">LOADING...</p>
      </div>
    </div>
  );

  // ========================= RESULTS =========================
  if (phase === "results" && results) {
    const domainEntries = Object.entries(results.domain_scores || {});
    const caResult = results.ca_result || {};
    return (
      <div className="space-y-5 animate-slide-up" data-testid="mind-results-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
              Your <span className="text-cosmic">Results</span>
            </h1>
            <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
              Wellness Assessment &middot; {results.answers_count} questions analysed
            </p>
          </div>
          <div className="flex gap-2">
            <Button data-testid="retake-btn" onClick={resetAssessment} variant="outline"
              className="border-white/10 text-stellar-dim hover:text-stellar">
              <RotateCcw size={14} className="mr-2" /> Retake
            </Button>
            <Button onClick={() => setPhase("overview")} variant="outline"
              className="border-white/10 text-stellar-dim hover:text-stellar">
              Back to Overview
            </Button>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Overall Wellness */}
          <div className="glass-card rounded-lg p-6 text-center cosmic-glow" data-testid="overall-wellness-score">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Overall Wellness</p>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={results.overall_wellness >= 75 ? "#0F9F8F" : results.overall_wellness >= 50 ? "#D97706" : "#EF4444"}
                  strokeWidth="8" strokeDasharray={`${(results.overall_wellness / 100) * 327} 327`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-black text-stellar">{results.overall_wellness}</span>
                <span className="font-mono text-[9px] text-stellar-dim">/100</span>
              </div>
            </div>
          </div>

          {/* HPS Cognitive Contribution */}
          <div className="glass-card rounded-lg p-6 text-center" data-testid="ca-hps-score">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">HPS Cognitive Score</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="font-mono text-5xl font-black text-cosmic">{caResult.hps_cognitive || 0}</span>
              <span className="font-mono text-sm text-stellar-dim">/150 pts</span>
            </div>
            <Progress value={((caResult.hps_cognitive || 0) / 150) * 100} className="h-2 mb-3" />
            <p className="font-mono text-[9px] text-stellar-dim">
              {caResult.present_count || 0}/{caResult.total_mandatory || 8} instruments &middot; CCM: {caResult.ccm || 1}
            </p>
          </div>

          {/* Clinical Alerts */}
          <div className="glass-card rounded-lg p-6" data-testid="clinical-alerts">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Clinical Alerts</p>
            {caResult.cross_alerts?.length > 0 ? (
              <div className="space-y-2">
                {caResult.cross_alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-md border ${alert.level === "HIGH" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className={alert.level === "HIGH" ? "text-red-400" : "text-amber-400"} />
                      <p className="font-body text-xs text-stellar leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="font-body text-sm text-emerald-400">No clinical alerts</p>
                <p className="font-mono text-[9px] text-stellar-dim mt-1">All areas within healthy range</p>
              </div>
            )}
          </div>
        </div>

        {/* Domain Breakdown */}
        <div className="glass-card rounded-lg p-5" data-testid="domain-breakdown">
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">Wellness Domains</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainEntries.map(([key, dom]) => {
              const Icon = DOMAIN_ICONS[dom.name] || Heart;
              const flagStyle = FLAG_STYLES[dom.flag] || FLAG_STYLES.GREEN;
              return (
                <div key={key} className="bg-white/[0.03] border border-white/5 rounded-lg p-4" data-testid={`domain-${key}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} style={{ color: dom.color }} />
                    <p className="font-display text-sm font-bold text-stellar flex-1">{dom.name}</p>
                    <Badge className={`${flagStyle.bg} ${flagStyle.text} border ${flagStyle.border} font-mono text-[8px]`}>
                      {flagStyle.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${dom.score}%`, backgroundColor: dom.color }} />
                    </div>
                    <span className="font-mono text-sm font-bold" style={{ color: dom.color }}>{dom.score}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========================= ASSESSMENT FLOW =========================
  if (phase === "assessment" && questions.length > 0) {
    const q = questions[currentQ];
    const progress = (Object.keys(answers).length / questions.length) * 100;
    const selectedValue = answers[q.id];

    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-slide-up" data-testid="mind-assessment">
        {/* Progress */}
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Progress</p>
            <span className="font-mono text-xs text-stellar">
              {Object.keys(answers).length}/{questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Question Card */}
        <div className="glass-card rounded-lg p-8" data-testid="assessment-question-card">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[10px] text-stellar-dim tracking-wider uppercase">
              Question {currentQ + 1} of {questions.length}
            </span>
          </div>

          <p className="font-body text-lg text-stellar mb-8 leading-relaxed" data-testid="question-text">
            {q.text}
          </p>

          <div className="space-y-2.5">
            {scale.map((label, value) => {
              const selected = selectedValue === value;
              return (
                <button key={value} onClick={() => handleAnswer(value)}
                  data-testid={`answer-option-${value}`}
                  className={`w-full text-left px-5 py-3.5 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                    selected
                      ? "border-cosmic/50 bg-cosmic/10 shadow-[0_0_12px_rgba(123,53,216,0.15)]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selected ? "border-cosmic bg-cosmic" : "border-white/20"
                  }`}>
                    {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`font-body text-sm ${selected ? "text-stellar font-medium" : "text-stellar-dim"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" className="border-white/10 text-stellar-dim"
            data-testid="prev-question-btn"
            onClick={() => currentQ > 0 && setCurrentQ(currentQ - 1)}
            disabled={currentQ === 0}>
            <ChevronLeft size={14} className="mr-1" /> Previous
          </Button>

          <div className="flex gap-2">
            {currentQ < questions.length - 1 ? (
              <Button className="bg-cosmic/20 hover:bg-cosmic/30 text-cosmic border border-cosmic/20"
                data-testid="next-question-btn"
                onClick={() => setCurrentQ(currentQ + 1)}>
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : null}

            {Object.keys(answers).length === questions.length && (
              <Button data-testid="submit-assessment-btn" onClick={handleSubmit} disabled={submitting}
                className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
                {submitting ? "Analysing..." : "Complete Assessment"}
                <ArrowRight size={14} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================= OVERVIEW =========================
  return (
    <div className="space-y-5 animate-slide-up" data-testid="mind-overview-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Mind & <span className="text-cosmic">Cognition</span>
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            Adaptive wellness assessment &middot; ~5 min
          </p>
        </div>
        <Button data-testid="start-assessment-btn" onClick={startAssessment}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
          <Brain size={16} className="mr-2" />
          {latest ? "Retake Assessment" : "Begin Assessment"}
        </Button>
      </div>

      {/* Latest Results Summary */}
      {latest && (
        <div className="glass-card rounded-lg p-5" data-testid="latest-result-summary">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-cosmic" />
              <p className="font-mono text-[10px] tracking-[0.2em] text-cosmic uppercase">Latest Assessment</p>
            </div>
            <span className="font-mono text-[9px] text-stellar-dim">
              {new Date(latest.timestamp).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="font-mono text-3xl font-black text-stellar">{latest.overall_wellness}</p>
              <p className="font-mono text-[8px] text-stellar-dim uppercase">Overall Wellness</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-black text-cosmic">{latest.ca_result?.hps_cognitive || 0}</p>
              <p className="font-mono text-[8px] text-stellar-dim uppercase">HPS Cognitive Pts</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-black" style={{
                color: latest.overall_wellness >= 75 ? "#0F9F8F" : latest.overall_wellness >= 50 ? "#D97706" : "#EF4444"
              }}>{latest.ca_result?.ca_band || "—"}</p>
              <p className="font-mono text-[8px] text-stellar-dim uppercase">CA Band</p>
            </div>
          </div>

          {/* Domain bars */}
          <div className="space-y-2">
            {Object.entries(latest.domain_scores || {}).map(([key, dom]) => {
              const Icon = DOMAIN_ICONS[dom.name] || Heart;
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon size={13} style={{ color: dom.color }} className="shrink-0" />
                  <span className="font-mono text-[9px] text-stellar-dim w-28 truncate uppercase tracking-wider">{dom.name}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${dom.score}%`, backgroundColor: dom.color }} />
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: dom.color }}>{dom.score}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Burnout Prediction */}
      {burnout && (
        <div className="glass-card rounded-lg p-5 relative overflow-hidden" data-testid="burnout-prediction">
          <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06]"
            style={{ background: `radial-gradient(circle at top right, ${burnout.risk_color}, transparent 70%)` }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: burnout.risk_color + "15", border: `1px solid ${burnout.risk_color}30` }}>
              <Gauge size={20} style={{ color: burnout.risk_color }} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-bold text-stellar">Burnout Prediction</h3>
              <p className="font-mono text-[9px] text-stellar-dim">{burnout.assessments_analyzed} assessment(s) analysed</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-3xl font-black" style={{ color: burnout.risk_color }}>{burnout.burnout_score}</span>
              <span className="font-mono text-[9px] text-stellar-dim block">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Badge className="font-mono text-[9px] uppercase" style={{ backgroundColor: burnout.risk_color + "15", color: burnout.risk_color, border: `1px solid ${burnout.risk_color}30` }}>
              {burnout.risk_level} risk
            </Badge>
            {burnout.trend && burnout.trend !== "stable" && (() => {
              const TrendIcon = TREND_ICONS[burnout.trend] || Minus;
              const tColor = TREND_COLORS[burnout.trend] || "#D97706";
              return (
                <Badge className="font-mono text-[8px]" style={{ backgroundColor: tColor + "15", color: tColor, border: `1px solid ${tColor}30` }}>
                  <TrendIcon size={9} className="mr-1" /> {burnout.trend}
                </Badge>
              );
            })()}
            {burnout.days_to_critical && (
              <Badge className="bg-red-500/10 text-red-400 border border-red-500/15 font-mono text-[8px]">
                <AlertTriangle size={8} className="mr-1" /> Critical in ~{burnout.days_to_critical} days
              </Badge>
            )}
          </div>
          <p className="font-body text-sm text-stellar leading-relaxed mb-3 relative z-10">{burnout.recommendation}</p>
          {burnout.domain_contributions && (
            <div className="space-y-1.5 relative z-10">
              <p className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-[0.2em] mb-1">Contributing Factors</p>
              {Object.entries(burnout.domain_contributions).sort((a, b) => b[1].contribution - a[1].contribution).map(([cat, info]) => {
                const meta = CATEGORY_META[cat];
                const Icon = meta?.icon || Brain;
                return (
                  <div key={cat} className="flex items-center gap-2 py-1">
                    <Icon size={12} style={{ color: meta?.color || "#94A3B8" }} />
                    <span className="font-mono text-[9px] text-stellar-dim w-20">{info.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${info.percentage}%`, backgroundColor: meta?.color || "#94A3B8" }} />
                    </div>
                    <span className="font-mono text-[9px] text-stellar-dim w-8 text-right">{info.percentage}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assessment History */}
      {mhHistory.length > 0 && (
        <div className="glass-card rounded-lg p-5" data-testid="assessment-history">
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">Assessment History</p>
          <div className="space-y-2">
            {mhHistory.slice(0, 5).map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-md">
                <Clock size={12} className="text-stellar-dim shrink-0" />
                <span className="font-mono text-[10px] text-stellar-dim w-24">
                  {new Date(h.timestamp).toLocaleDateString()}
                </span>
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-stellar">{h.overall_wellness}</span>
                  <span className="font-mono text-[9px] text-stellar-dim">wellness</span>
                  <span className="font-mono text-sm font-bold text-cosmic">{h.ca_result?.hps_cognitive || "—"}</span>
                  <span className="font-mono text-[9px] text-stellar-dim">HPS pts</span>
                </div>
                <Badge className="font-mono text-[8px]" style={{
                  backgroundColor: (h.overall_wellness >= 75 ? "#0F9F8F" : h.overall_wellness >= 50 ? "#D97706" : "#EF4444") + "15",
                  color: h.overall_wellness >= 75 ? "#0F9F8F" : h.overall_wellness >= 50 ? "#D97706" : "#EF4444",
                }}>
                  {h.ca_result?.ca_band || "—"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="glass-card rounded-lg p-5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">How It Works</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Personalised Questions", desc: "Questions adapt to your age, profile, and prior results", icon: Brain },
            { step: "02", title: "7 Wellness Domains", desc: "Mood, Calm, Stress, Resilience, Wellbeing, Sharpness, Sleep", icon: Target },
            { step: "03", title: "Clinical Intelligence", desc: "Proprietary algorithm detects patterns and cross-domain alerts", icon: Lightbulb },
            { step: "04", title: "HPS Integration", desc: "Your scores feed directly into HPS Cognitive pillar (up to 150 pts)", icon: TrendingUp },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-md bg-cosmic/10 border border-cosmic/20 flex items-center justify-center shrink-0">
                <item.icon size={14} className="text-cosmic" />
              </div>
              <div>
                <p className="font-mono text-[9px] text-cosmic mb-0.5">{item.step}</p>
                <p className="font-body text-xs font-medium text-stellar">{item.title}</p>
                <p className="font-mono text-[9px] text-stellar-dim">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
