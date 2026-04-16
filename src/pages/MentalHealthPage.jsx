import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Brain, Activity, Moon, Zap, Heart, ChevronRight, CheckCircle,
  Clock, RotateCcw, History, TrendingUp, TrendingDown, Minus, Target,
  AlertTriangle, ShieldAlert, Gauge, ArrowRight
} from "lucide-react";

const CATEGORY_META = {
  depression: { name: "Depression", icon: Heart, color: "#6366F1", gradient: "from-indigo-500/10 to-transparent" },
  anxiety: { name: "Anxiety", icon: Activity, color: "#EF4444", gradient: "from-red-500/10 to-transparent" },
  sleep: { name: "Sleep Quality", icon: Moon, color: "#8B5CF6", gradient: "from-violet-500/10 to-transparent" },
  cognitive: { name: "Cognitive Clarity", icon: Brain, color: "#0F9F8F", gradient: "from-teal-500/10 to-transparent" },
  stress: { name: "Stress Level", icon: Zap, color: "#D97706", gradient: "from-amber-500/10 to-transparent" },
};

const LEVEL_COLORS = { 0: "#0F9F8F", 1: "#84CC16", 2: "#D97706", 3: "#EF4444", 4: "#DC2626" };
const TREND_ICONS = { improving: TrendingDown, declining: TrendingUp, stable: Minus, mixed: Activity, worsening: TrendingUp };
const TREND_COLORS = { improving: "#0F9F8F", declining: "#EF4444", stable: "#D97706", mixed: "#6366F1", worsening: "#EF4444" };
const SCALE_LABELS = ["Never", "Sometimes", "Often", "Always"];

export default function MentalHealthPage() {
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [phase, setPhase] = useState("overview");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [qRes, hRes] = await Promise.all([
        api.get("/health/mental-assessment/questions"),
        api.get("/health/mental-assessment/history"),
      ]);
      setQuestions(qRes.data?.questions || []);
      setHistory(hRes.data?.history || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const fetchAiAnalysis = useCallback(async () => {
    setAiLoading(true);
    try {
      const [rRes, bRes] = await Promise.all([
        api.get("/health/mental-health/roadmap"),
        api.get("/health/burnout-prediction"),
      ]);
      setRoadmap(rRes.data?.roadmap);
      setBurnout(bRes.data?.prediction);
    } catch (err) { console.error(err); } finally { setAiLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (!loading && history.length > 0) fetchAiAnalysis(); }, [loading, history.length, fetchAiAnalysis]);

  const startAssessment = () => {
    setAnswers({});
    setCurrentQ(0);
    setResults(null);
    setPhase("assessment");
  };

  const handleAnswer = (qId, score) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(prev => prev + 1), 250);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error(`Answer all questions (${Object.keys(answers).length}/${questions.length})`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { answers: Object.entries(answers).map(([id, score]) => ({ id, score })) };
      const res = await api.post("/health/mental-assessment/submit", payload);
      setResults(res.data?.results || res.data);
      setPhase("results");
      fetchData();
      fetchAiAnalysis();
      toast.success("Assessment complete!");
    } catch { toast.error("Submission failed"); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="mental-health-loading">
      <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  const latestResult = history[0]?.results;
  const analysis = roadmap?.ai_analysis;

  return (
    <div className="space-y-5 animate-slide-up" data-testid="mental-health-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Mental <span className="text-gradient-cosmic">Health</span>
          </h1>
          <p className="font-mono text-[10px] text-stellar-dim tracking-[0.25em] mt-2 uppercase">Dynamic assessment &amp; burnout prediction</p>
        </div>
        {phase !== "assessment" && (
          <Button data-testid="start-assessment-btn" onClick={startAssessment}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs">
            <Brain size={14} className="mr-2" />
            {latestResult ? "Retake Assessment" : "Start Assessment"}
          </Button>
        )}
      </div>

      {/* ========================= OVERVIEW PHASE ========================= */}
      {phase === "overview" && (
        <>
          {/* Burnout Prediction Card - Always visible when available */}
          {burnout && (
            <div className="glass-premium rounded-2xl p-5 relative overflow-hidden" data-testid="burnout-prediction">
              <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06]"
                style={{ background: `radial-gradient(circle at top right, ${burnout.risk_color}, transparent 70%)` }} />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: burnout.risk_color + "15", border: `1px solid ${burnout.risk_color}30` }}>
                  <Gauge size={20} style={{ color: burnout.risk_color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-stellar">Burnout Prediction</h3>
                  <p className="font-mono text-[9px] text-stellar-dim">{burnout.assessments_analyzed} assessment(s) analyzed</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-black" style={{ color: burnout.risk_color }}>{burnout.burnout_score}</span>
                  <span className="font-mono text-[9px] text-stellar-dim block">/100</span>
                </div>
              </div>

              {/* Risk level badge + trend */}
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

              {/* Recommendation */}
              <p className="font-body text-sm text-stellar leading-relaxed mb-3 relative z-10">{burnout.recommendation}</p>

              {/* Domain contributions */}
              {burnout.domain_contributions && (
                <div className="space-y-1.5 mb-3 relative z-10">
                  <p className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-[0.2em] mb-1">Contributing Factors</p>
                  {Object.entries(burnout.domain_contributions).sort((a, b) => b[1].contribution - a[1].contribution).map(([cat, info]) => {
                    const meta = CATEGORY_META[cat];
                    const Icon = meta?.icon || Brain;
                    return (
                      <div key={cat} className="flex items-center gap-2 py-1">
                        <Icon size={12} style={{ color: meta?.color || "#94A3B8" }} />
                        <span className="font-mono text-[9px] text-stellar-dim w-20">{info.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(info.contribution * 2.85, 100)}%`, backgroundColor: meta?.color || "#94A3B8" }} />
                        </div>
                        <span className="font-mono text-[8px] text-stellar-dim w-10 text-right">{info.contribution}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Risk factors */}
              {burnout.risk_factors?.length > 0 && (
                <div className="space-y-2 relative z-10">
                  <p className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-[0.2em]">Top Risk Factors</p>
                  {burnout.risk_factors.map((rf, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                      <ShieldAlert size={12} className="mt-0.5 shrink-0" style={{ color: rf.impact === "high" ? "#EF4444" : "#D97706" }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-xs text-stellar font-medium">{rf.domain}</span>
                          <Badge className={`font-mono text-[7px] ${rf.impact === "high" ? "bg-red-500/10 text-red-400 border-red-500/15" : "bg-amber-500/10 text-amber-400 border-amber-500/15"}`}>{rf.impact}</Badge>
                        </div>
                        <p className="font-body text-[10px] text-stellar-dim mt-0.5">{rf.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Domain Cards - assessment boxes */}
          {latestResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="domain-cards">
              {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                const r = latestResult[cat];
                if (!r) return null;
                const Icon = meta.icon;
                const levelColor = LEVEL_COLORS[r.level_index] || "#475569";
                return (
                  <div key={cat} className={`glass-premium rounded-xl p-5 bg-gradient-to-br ${meta.gradient}`} data-testid={`domain-card-${cat}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: meta.color + "12", border: `1px solid ${meta.color}25` }}>
                        <Icon size={20} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-sm font-bold text-stellar">{r.name}</h3>
                        <Badge className="font-mono text-[8px] mt-0.5" style={{
                          backgroundColor: levelColor + "15", color: levelColor, border: `1px solid ${levelColor}30`
                        }}>{r.level}</Badge>
                      </div>
                      <p className="font-mono text-2xl font-black" style={{ color: levelColor }}>{Math.round(r.percentage)}%</p>
                    </div>
                    <Progress value={r.percentage} className="h-1.5 bg-white/5" />
                    <p className="font-mono text-[9px] text-stellar-dim mt-2">Score: {r.score} / {r.max_score}</p>
                    {r.actions?.[0] && (
                      <div className="mt-3 p-2.5 bg-white/[0.03] border border-white/5 rounded-lg">
                        <p className="font-body text-xs text-stellar">{r.actions[0].action}</p>
                        {r.actions[0].hps_impact && (
                          <span className="font-mono text-[8px] text-cosmic">+{r.actions[0].hps_impact} HPS potential</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-premium rounded-2xl p-10 text-center" data-testid="no-assessment">
              <Brain size={48} className="text-cosmic/30 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-stellar mb-2">No Assessment Yet</h2>
              <p className="font-body text-sm text-stellar-dim max-w-md mx-auto mb-6">
                Take your first mental health assessment to get burnout prediction and personalized insights across depression, anxiety, sleep, cognitive clarity, and stress.
              </p>
              <Button data-testid="start-first-assessment-btn" onClick={startAssessment}
                className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider">
                Begin Assessment
              </Button>
            </div>
          )}

          {/* Mental Health Roadmap - BELOW domain cards */}
          {roadmap && analysis && (
            <div className="glass-premium rounded-2xl p-6 relative overflow-hidden" data-testid="mental-health-roadmap">
              <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]"
                style={{ background: "radial-gradient(circle at top right, #7B35D8, transparent 70%)" }} />
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-11 h-11 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
                  <Brain size={20} className="text-cosmic" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-stellar">Mental Health Roadmap</h3>
                  <p className="font-body text-xs text-stellar-dim">{roadmap.assessment_count} assessment(s) analyzed</p>
                </div>
                {analysis.trend && (() => {
                  const TrendIcon = TREND_ICONS[analysis.trend] || Minus;
                  const trendColor = TREND_COLORS[analysis.trend] || "#D97706";
                  return (
                    <Badge className="font-mono text-[9px]" style={{ backgroundColor: trendColor + "15", color: trendColor, border: `1px solid ${trendColor}30` }}>
                      <TrendIcon size={10} className="mr-1" /> {analysis.trend}
                    </Badge>
                  );
                })()}
              </div>

              {analysis.overall_status && (
                <p className="font-body text-sm text-stellar leading-relaxed mb-4 relative z-10">{analysis.overall_status}</p>
              )}

              {/* Priority Actions */}
              {analysis.priority_actions?.length > 0 && (
                <div className="space-y-2 mb-4 relative z-10">
                  <p className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-[0.2em] mb-2">Priority Actions</p>
                  {analysis.priority_actions.map((act, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-mono text-[10px] font-bold ${
                        act.impact === "high" ? "bg-cosmic/15 text-cosmic" : "bg-white/5 text-stellar-dim"
                      }`}>{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-body text-xs text-stellar">{act.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[8px] text-stellar-dim/50">{act.domain}</span>
                          {act.timeframe && <Badge variant="outline" className="border-white/8 text-stellar-dim/50 font-mono text-[7px]">{act.timeframe}</Badge>}
                          {act.hps_impact && <span className="font-mono text-[8px] text-cosmic">+{act.hps_impact} HPS</span>}
                        </div>
                      </div>
                      {act.impact && (
                        <Badge className={`font-mono text-[7px] shrink-0 ${act.impact === "high" ? "bg-red-500/10 text-red-400 border border-red-500/15" : "bg-amber-500/10 text-amber-400 border border-amber-500/15"}`}>
                          {act.impact}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Weekly Focus + Positive Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                {analysis.weekly_focus && (
                  <div className="p-3 bg-cosmic/5 border border-cosmic/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={12} className="text-cosmic" />
                      <span className="font-mono text-[8px] text-cosmic uppercase tracking-wider">This Week&apos;s Focus</span>
                    </div>
                    <p className="font-body text-xs text-stellar">{analysis.weekly_focus}</p>
                  </div>
                )}
                {analysis.positive_note && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-wider">Positive Note</span>
                    </div>
                    <p className="font-body text-xs text-stellar">{analysis.positive_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {aiLoading && !roadmap && (
            <div className="glass-premium rounded-2xl p-5 flex items-center gap-3" data-testid="ai-loading">
              <div className="w-5 h-5 border border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
              <span className="font-mono text-xs text-stellar-dim">AgeReboot generating analysis...</span>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div className="glass-premium rounded-xl p-5" data-testid="assessment-history">
              <div className="flex items-center gap-2 mb-3">
                <History size={14} className="text-stellar-dim" />
                <h3 className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Assessment History</h3>
              </div>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                    <Clock size={14} className="text-stellar-dim shrink-0" />
                    <span className="font-mono text-xs text-stellar">
                      {new Date(h.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <div className="flex gap-1.5 flex-1 justify-end flex-wrap">
                      {Object.entries(h.results || {}).map(([cat, r]) => (
                        <Badge key={cat} className="font-mono text-[7px]" style={{
                          backgroundColor: (LEVEL_COLORS[r.level_index] || "#475569") + "15",
                          color: LEVEL_COLORS[r.level_index] || "#475569",
                          border: `1px solid ${LEVEL_COLORS[r.level_index] || "#475569"}30`
                        }}>
                          {(CATEGORY_META[cat]?.name || cat).slice(0, 3)} {Math.round(r.percentage)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================= ASSESSMENT PHASE ========================= */}
      {phase === "assessment" && questions.length > 0 && (
        <div className="max-w-2xl mx-auto" data-testid="assessment-flow">
          <div className="glass-card rounded-lg p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-stellar-dim uppercase">Question {currentQ + 1} of {questions.length}</span>
              <span className="font-mono text-[10px] text-cosmic">{Object.keys(answers).length} answered</span>
            </div>
            <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-1.5 bg-white/5" />
          </div>

          <div className="glass-card rounded-xl p-8 mb-5" data-testid={`question-card-${currentQ}`}>
            {(() => {
              const q = questions[currentQ];
              const catMeta = CATEGORY_META[q.category] || {};
              const CatIcon = catMeta.icon || Brain;
              return (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: (catMeta.color || "#7B35D8") + "15" }}>
                      <CatIcon size={14} style={{ color: catMeta.color || "#7B35D8" }} />
                    </div>
                    <Badge variant="outline" className="border-white/10 text-stellar-dim font-mono text-[8px]">
                      {catMeta.name || q.category}
                    </Badge>
                  </div>
                  <h2 className="font-display text-xl font-bold text-stellar leading-relaxed mb-8">{q.q}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {SCALE_LABELS.map((label, score) => (
                      <button key={score} data-testid={`answer-${score}`}
                        onClick={() => handleAnswer(q.id, score)}
                        className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                          answers[q.id] === score
                            ? "bg-cosmic/15 border-cosmic/40 shadow-[0_0_12px_-4px_rgba(123,53,216,0.4)]"
                            : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-sm font-bold ${
                            answers[q.id] === score ? "bg-cosmic/30 text-cosmic" : "bg-white/5 text-stellar-dim"
                          }`}>{score}</div>
                          <span className={`font-body text-sm ${answers[q.id] === score ? "text-cosmic font-medium" : "text-stellar-dim"}`}>{label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0} className="border-white/10 text-stellar-dim font-mono text-[10px]">Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                disabled={currentQ === questions.length - 1} className="border-white/10 text-stellar-dim font-mono text-[10px]">Next</Button>
            </div>
            <div className="flex gap-1">
              {questions.map((q, i) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentQ ? "bg-cosmic" : answers[q.id] !== undefined ? "bg-cosmic/40" : "bg-white/10"
                  }`} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPhase("overview")}
                className="border-white/10 text-stellar-dim font-mono text-[10px]">Cancel</Button>
              {Object.keys(answers).length === questions.length && (
                <Button data-testid="submit-assessment-btn" onClick={handleSubmit} disabled={submitting}
                  className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs">
                  {submitting ? "Analyzing..." : "Submit"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================= RESULTS PHASE ========================= */}
      {phase === "results" && results && (
        <div className="space-y-5" data-testid="assessment-results">
          <div className="glass-card rounded-lg p-6 text-center">
            <CheckCircle size={32} className="text-cosmic mx-auto mb-3" />
            <h2 className="font-display text-xl font-bold text-stellar mb-1">Assessment Complete</h2>
            <p className="font-body text-sm text-stellar-dim">Results across 5 mental health domains</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              const r = results[cat];
              if (!r) return null;
              const Icon = meta.icon;
              const levelColor = LEVEL_COLORS[r.level_index] || "#475569";
              return (
                <div key={cat} className={`glass-card rounded-lg p-5 bg-gradient-to-br ${meta.gradient}`} data-testid={`result-${cat}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: meta.color + "12", border: `1px solid ${meta.color}25` }}>
                      <Icon size={18} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-sm font-bold text-stellar">{r.name}</h3>
                      <Badge className="font-mono text-[8px]" style={{
                        backgroundColor: levelColor + "15", color: levelColor, border: `1px solid ${levelColor}30`
                      }}>{r.level}</Badge>
                    </div>
                    <p className="font-mono text-2xl font-black" style={{ color: levelColor }}>{Math.round(r.percentage)}%</p>
                  </div>
                  <Progress value={r.percentage} className="h-1.5 bg-white/5 mb-3" />
                  {r.actions?.slice(0, 2).map((act, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-white/[0.02] rounded-md mb-1.5">
                      <ChevronRight size={10} className="text-cosmic mt-0.5 shrink-0" />
                      <div>
                        <p className="font-body text-[11px] text-stellar">{act.action}</p>
                        {act.hps_impact && <span className="font-mono text-[8px] text-cosmic">+{act.hps_impact} HPS</span>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setPhase("overview")} className="border-white/10 text-stellar-dim font-mono text-[10px]">
              <History size={12} className="mr-1" /> Dashboard
            </Button>
            <Button onClick={startAssessment} className="bg-cosmic/10 text-cosmic border border-cosmic/20 font-mono text-[10px]">
              <RotateCcw size={12} className="mr-1" /> Retake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
