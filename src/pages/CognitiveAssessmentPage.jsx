import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Brain, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Shield,
  Activity, Heart, Zap, Moon, Target, Clock, RotateCcw, ArrowRight,
  TrendingUp, FileText
} from "lucide-react";

const INSTRUMENTS = [
  {
    key: "phq9", name: "PHQ-9", fullName: "Patient Health Questionnaire",
    description: "Screens for depression severity over the past 2 weeks",
    color: "#6366F1", icon: Heart, scaleLabels: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself, or that you are a failure",
      "Trouble concentrating on things, such as reading or watching TV",
      "Moving or speaking so slowly that others noticed, or being fidgety/restless",
      "Thoughts that you would be better off dead, or of hurting yourself",
    ],
  },
  {
    key: "gad7", name: "GAD-7", fullName: "Generalized Anxiety Disorder Scale",
    description: "Measures anxiety severity over the past 2 weeks",
    color: "#EF4444", icon: Activity, scaleLabels: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
  },
  {
    key: "pss10", name: "PSS-10", fullName: "Perceived Stress Scale",
    description: "Evaluates your perceived stress level over the past month",
    color: "#D97706", icon: Zap, scaleLabels: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"],
    questions: [
      "Been upset because of something that happened unexpectedly",
      "Felt that you were unable to control the important things in your life",
      "Felt nervous and stressed",
      "Felt confident about your ability to handle personal problems",
      "Felt that things were going your way",
      "Found that you could not cope with all the things you had to do",
      "Been able to control irritations in your life",
      "Felt that you were on top of things",
      "Been angered because of things that were outside of your control",
      "Felt difficulties were piling up so high that you could not overcome them",
    ],
    reverseItems: [3, 4, 6, 7],
  },
  {
    key: "rs14", name: "RS-14", fullName: "Resilience Scale",
    description: "Assesses your personal resilience and coping ability",
    color: "#0F9F8F", icon: Shield, scaleLabels: ["Strongly disagree", "Disagree", "Somewhat disagree", "Neutral", "Somewhat agree", "Agree", "Strongly agree"],
    questions: [
      "I usually manage one way or another",
      "I feel proud that I have accomplished things in life",
      "I usually take things in stride",
      "I am friends with myself",
      "I feel that I can handle many things at a time",
      "I am determined",
      "I can get through difficult times because I've experienced difficulty before",
      "I have self-discipline",
      "I keep interested in things",
      "I can usually find something to laugh about",
      "My belief in myself gets me through hard times",
      "In an emergency, I'm someone people can generally rely on",
      "My life has meaning",
      "When I'm in a difficult situation, I can usually find my way out of it",
    ],
  },
  {
    key: "sf36_mcs", name: "SF-36 MCS", fullName: "Mental Component Summary",
    description: "Evaluates your mental health-related quality of life",
    color: "#8B5CF6", icon: Moon, scaleLabels: ["None of the time", "A little of the time", "Some of the time", "A good bit of the time", "Most of the time", "All of the time"],
    questions: [
      "Have you felt calm and peaceful?",
      "Did you have a lot of energy?",
      "Have you felt downhearted and blue?",
      "Has your physical health or emotional problems limited your social activities?",
      "Have you been a happy person?",
      "Did you feel so down in the dumps that nothing could cheer you up?",
    ],
    reverseItems: [2, 3, 5],
  },
  {
    key: "moca", name: "MoCA", fullName: "Cognitive Self-Assessment",
    description: "Self-reported cognitive function screening across key domains",
    color: "#EC4899", icon: Brain, scaleLabels: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    questions: [
      "I can easily remember a short list of items (like a grocery list) after a few minutes",
      "I can concentrate on a task without getting easily distracted",
      "I can quickly come up with words or names when I need them",
      "I can follow and understand complex instructions or conversations",
      "I can easily do mental math (like calculating change or tips)",
      "I can remember appointments and important dates without reminders",
    ],
    isSelfReport: true,
  },
];

const FLAG_COLORS = {
  GREEN: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", label: "Normal" },
  YELLOW: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: "Mild" },
  ORANGE: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", label: "Moderate" },
  RED: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "Severe" },
};

const BAND_META = {
  ELITE: { color: "#D97706", label: "Excellent" },
  HIGH: { color: "#0F9F8F", label: "Strong" },
  GOOD: { color: "#4F46E5", label: "Good" },
  MILD: { color: "#D97706", label: "Mild Concern" },
  MODERATE: { color: "#EF4444", label: "Moderate Concern" },
  SEVERE: { color: "#DC2626", label: "Needs Attention" },
};

export default function CognitiveAssessmentPage() {
  const [phase, setPhase] = useState("overview");
  const [currentInstrument, setCurrentInstrument] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await api.get("/hps/ca-assessment/latest");
      if (res.data?.result) setLatestAssessment(res.data);
    } catch { /* no previous assessment */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  const instrument = INSTRUMENTS[currentInstrument];
  const totalQuestions = INSTRUMENTS.reduce((sum, ins) => sum + ins.questions.length, 0);
  const answeredCount = Object.values(answers).reduce((sum, a) => sum + Object.keys(a).length, 0);

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [instrument.key]: { ...(prev[instrument.key] || {}), [currentQuestion]: value },
    }));
    // Auto-advance after 300ms
    setTimeout(() => {
      if (currentQuestion < instrument.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else if (currentInstrument < INSTRUMENTS.length - 1) {
        setCurrentInstrument(currentInstrument + 1);
        setCurrentQuestion(0);
      }
    }, 300);
  };

  const computeRawScores = () => {
    const scores = {};
    INSTRUMENTS.forEach(ins => {
      const insAnswers = answers[ins.key] || {};
      if (Object.keys(insAnswers).length === 0) return;

      if (ins.key === "moca") {
        // MoCA self-report: scale 0-4 per question, map to 0-30
        const sum = Object.values(insAnswers).reduce((s, v) => s + v, 0);
        scores.moca = Math.round((sum / (ins.questions.length * 4)) * 30);
      } else if (ins.key === "rs14") {
        // RS-14: 1-7 scale, sum gives 14-98
        scores.rs14 = Object.values(insAnswers).reduce((s, v) => s + (v + 1), 0);
      } else if (ins.key === "sf36_mcs") {
        // SF-36 MCS: 0-5 per Q, sum 0-30. Reverse items 2,3,5 (0-indexed)
        let sum = 0;
        Object.entries(insAnswers).forEach(([qi, v]) => {
          const qIdx = parseInt(qi);
          sum += (ins.reverseItems || []).includes(qIdx) ? (5 - v) : v;
        });
        scores.sf36_mcs = sum;
      } else if (ins.key === "pss10") {
        // PSS-10: 0-4 per Q, reverse items 3,4,6,7 (0-indexed)
        let sum = 0;
        Object.entries(insAnswers).forEach(([qi, v]) => {
          const qIdx = parseInt(qi);
          sum += (ins.reverseItems || []).includes(qIdx) ? (4 - v) : v;
        });
        scores.pss10 = sum;
      } else {
        // PHQ-9, GAD-7: simple sum
        scores[ins.key] = Object.values(insAnswers).reduce((s, v) => s + v, 0);
      }
    });
    return scores;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const rawScores = computeRawScores();
      const res = await api.post("/hps/ca-assessment", rawScores);
      setResults(res.data.result);
      setPhase("results");
      toast.success("Cognitive Assessment completed!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setPhase("overview");
    setCurrentInstrument(0);
    setCurrentQuestion(0);
    setAnswers({});
    setResults(null);
  };

  const allAnswered = INSTRUMENTS.every(ins =>
    (answers[ins.key] || {}) && Object.keys(answers[ins.key] || {}).length === ins.questions.length
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto" />
        <p className="mt-4 font-mono text-sm text-stellar-dim tracking-wider">LOADING...</p>
      </div>
    </div>
  );

  // === RESULTS VIEW ===
  if (phase === "results" && results) {
    const band = BAND_META[results.ca_band] || BAND_META.GOOD;
    return (
      <div className="space-y-5 animate-slide-up" data-testid="ca-results-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
              Assessment <span className="text-cosmic">Results</span>
            </h1>
            <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">Cognitive Assessment v3.2</p>
          </div>
          <Button data-testid="retake-ca-btn" onClick={resetAssessment} variant="outline"
            className="border-white/10 text-stellar-dim hover:text-stellar">
            <RotateCcw size={14} className="mr-2" /> Retake Assessment
          </Button>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-card rounded-lg p-6 text-center cosmic-glow" data-testid="ca-composite-score">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Composite CA Score</p>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={band.color} strokeWidth="8"
                  strokeDasharray={`${(results.ca_composite / 100) * 327} 327`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-black text-stellar">{results.ca_composite}</span>
                <span className="font-mono text-[9px] text-stellar-dim">/100</span>
              </div>
            </div>
            <Badge className={`font-mono text-xs`} style={{ backgroundColor: band.color + "20", color: band.color, borderColor: band.color + "30" }}>
              {band.label}
            </Badge>
          </div>

          <div className="glass-card rounded-lg p-6 text-center" data-testid="ca-hps-contribution">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">HPS Cognitive Contribution</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="font-mono text-5xl font-black text-cosmic">{results.hps_cognitive}</span>
              <span className="font-mono text-sm text-stellar-dim">/150 pts</span>
            </div>
            <Progress value={(results.hps_cognitive / 150) * 100} className="h-2 mb-3" />
            <p className="font-mono text-[9px] text-stellar-dim">
              Coverage: {results.present_count}/{results.total_mandatory} instruments &middot; CCM: {results.ccm}
            </p>
          </div>

          <div className="glass-card rounded-lg p-6" data-testid="ca-cross-alerts">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Clinical Alerts</p>
            {results.cross_alerts?.length > 0 ? (
              <div className="space-y-2">
                {results.cross_alerts.map((alert, i) => (
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
                <p className="font-mono text-[9px] text-stellar-dim mt-1">All instruments within normal parameters</p>
              </div>
            )}
          </div>
        </div>

        {/* Instrument Breakdown */}
        <div className="glass-card rounded-lg p-5" data-testid="ca-instrument-breakdown">
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">Instrument Scores</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INSTRUMENTS.map(ins => {
              const pctScore = results.instrument_scores?.[ins.key];
              if (pctScore == null) return null;
              const flag = results.clinical_flags?.[ins.key];
              const flagMeta = FLAG_COLORS[flag] || FLAG_COLORS.GREEN;
              return (
                <div key={ins.key} className="bg-white/[0.03] border border-white/5 rounded-lg p-4" data-testid={`ca-score-${ins.key}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <ins.icon size={16} style={{ color: ins.color }} />
                    <div className="flex-1">
                      <p className="font-display text-sm font-bold text-stellar">{ins.name}</p>
                      <p className="font-mono text-[8px] text-stellar-dim">{ins.fullName}</p>
                    </div>
                    {flag && (
                      <Badge className={`${flagMeta.bg} ${flagMeta.text} border ${flagMeta.border} font-mono text-[8px]`}>
                        {flagMeta.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pctScore}%`, backgroundColor: ins.color }} />
                    </div>
                    <span className="font-mono text-sm font-bold" style={{ color: ins.color }}>
                      {pctScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // === QUESTIONNAIRE FLOW ===
  if (phase === "questionnaire") {
    const insAnswers = answers[instrument.key] || {};
    const insProgress = Object.keys(insAnswers).length;
    const Icon = instrument.icon;

    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-slide-up" data-testid="ca-questionnaire">
        {/* Global Progress */}
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">
              Overall Progress
            </p>
            <span className="font-mono text-xs text-stellar">
              {answeredCount}/{totalQuestions} questions
            </span>
          </div>
          <Progress value={(answeredCount / totalQuestions) * 100} className="h-1.5 mb-3" />
          <div className="flex gap-1.5">
            {INSTRUMENTS.map((ins, i) => {
              const completed = Object.keys(answers[ins.key] || {}).length === ins.questions.length;
              const active = i === currentInstrument;
              return (
                <button key={ins.key} onClick={() => { setCurrentInstrument(i); setCurrentQuestion(0); }}
                  data-testid={`ca-nav-${ins.key}`}
                  className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                    completed ? "bg-emerald-400" : active ? "bg-cosmic" : "bg-white/10"
                  }`}
                  title={`${ins.name}: ${Object.keys(answers[ins.key] || {}).length}/${ins.questions.length}`} />
              );
            })}
          </div>
        </div>

        {/* Instrument Header */}
        <div className="glass-card rounded-lg p-5" style={{ borderColor: instrument.color + "20" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: instrument.color + "15" }}>
              <Icon size={20} style={{ color: instrument.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-stellar">{instrument.name}</h2>
                <Badge variant="outline" className="font-mono text-[8px]" style={{ borderColor: instrument.color + "40", color: instrument.color }}>
                  {insProgress}/{instrument.questions.length}
                </Badge>
              </div>
              <p className="font-body text-xs text-stellar-dim">{instrument.description}</p>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="glass-card rounded-lg p-6" data-testid="ca-current-question">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] text-stellar-dim tracking-wider uppercase">
              Question {currentQuestion + 1} of {instrument.questions.length}
            </span>
            <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: instrument.color }}>
              {instrument.name}
            </span>
          </div>

          <p className="font-body text-base text-stellar mb-6 leading-relaxed">
            {instrument.questions[currentQuestion]}
          </p>

          <div className="space-y-2">
            {instrument.scaleLabels.map((label, value) => {
              const selected = insAnswers[currentQuestion] === value;
              return (
                <button key={value} onClick={() => handleAnswer(value)}
                  data-testid={`ca-option-${value}`}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
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
                  <span className="font-mono text-[9px] text-stellar-dim/40 ml-auto">{value}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" className="border-white/10 text-stellar-dim"
            data-testid="ca-prev-btn"
            onClick={() => {
              if (currentQuestion > 0) {
                setCurrentQuestion(currentQuestion - 1);
              } else if (currentInstrument > 0) {
                const prevIns = INSTRUMENTS[currentInstrument - 1];
                setCurrentInstrument(currentInstrument - 1);
                setCurrentQuestion(prevIns.questions.length - 1);
              }
            }}
            disabled={currentInstrument === 0 && currentQuestion === 0}>
            <ChevronLeft size={14} className="mr-1" /> Previous
          </Button>

          <div className="flex gap-2">
            {currentInstrument < INSTRUMENTS.length - 1 || currentQuestion < instrument.questions.length - 1 ? (
              <Button className="bg-cosmic/20 hover:bg-cosmic/30 text-cosmic border border-cosmic/20"
                data-testid="ca-next-btn"
                onClick={() => {
                  if (currentQuestion < instrument.questions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                  } else if (currentInstrument < INSTRUMENTS.length - 1) {
                    setCurrentInstrument(currentInstrument + 1);
                    setCurrentQuestion(0);
                  }
                }}>
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : null}

            {allAnswered && (
              <Button data-testid="ca-submit-btn" onClick={handleSubmit} disabled={submitting}
                className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
                {submitting ? "Analyzing..." : "Submit Assessment"}
                <ArrowRight size={14} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === OVERVIEW (default) ===
  return (
    <div className="space-y-5 animate-slide-up" data-testid="ca-overview-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Cognitive <span className="text-cosmic">Assessment</span>
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            CA Pillar v3.2 &middot; {totalQuestions} questions &middot; ~12 min
          </p>
        </div>
        <Button data-testid="start-ca-btn" onClick={() => setPhase("questionnaire")}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
          <Brain size={16} className="mr-2" />
          Begin Assessment
        </Button>
      </div>

      {/* Latest Assessment Summary (if exists) */}
      {latestAssessment?.result && (
        <div className="glass-card rounded-lg p-5 border-cosmic/10" data-testid="ca-previous-result">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-cosmic" />
              <p className="font-mono text-[10px] tracking-[0.2em] text-cosmic uppercase">Previous Assessment</p>
            </div>
            <span className="font-mono text-[9px] text-stellar-dim">
              {new Date(latestAssessment.timestamp).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-mono text-3xl font-black text-stellar">{latestAssessment.result.ca_composite}</p>
              <p className="font-mono text-[8px] text-stellar-dim uppercase">Composite Score</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-black text-cosmic">{latestAssessment.result.hps_cognitive}</p>
              <p className="font-mono text-[8px] text-stellar-dim uppercase">HPS Points</p>
            </div>
            <div className="text-center">
              <Badge className="font-mono text-xs" style={{
                backgroundColor: (BAND_META[latestAssessment.result.ca_band]?.color || "#4F46E5") + "20",
                color: BAND_META[latestAssessment.result.ca_band]?.color || "#4F46E5",
              }}>
                {BAND_META[latestAssessment.result.ca_band]?.label || latestAssessment.result.ca_band}
              </Badge>
              <p className="font-mono text-[8px] text-stellar-dim uppercase mt-1">Band</p>
            </div>
          </div>
        </div>
      )}

      {/* Instrument Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INSTRUMENTS.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div key={ins.key}
              className="glass-card rounded-lg p-5 relative overflow-hidden hover:border-white/10 transition-all cursor-pointer group"
              data-testid={`ca-instrument-card-${ins.key}`}
              onClick={() => { setCurrentInstrument(i); setCurrentQuestion(0); setPhase("questionnaire"); }}>
              <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${ins.color}, transparent 70%)` }} />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: ins.color + "15" }}>
                  <Icon size={18} style={{ color: ins.color }} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-stellar">{ins.name}</h3>
                  <p className="font-mono text-[8px] text-stellar-dim">{ins.fullName}</p>
                </div>
              </div>
              <p className="font-body text-xs text-stellar-dim mb-3 leading-relaxed">{ins.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={10} className="text-stellar-dim/50" />
                  <span className="font-mono text-[9px] text-stellar-dim">{ins.questions.length} questions</span>
                </div>
                <ChevronRight size={14} className="text-stellar-dim/30 group-hover:text-cosmic transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="glass-card rounded-lg p-5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-4">How It Works</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Complete Instruments", desc: "Answer all 6 validated clinical questionnaires", icon: FileText },
            { step: "02", title: "Percentile Scoring", desc: "Your answers are scored against population norms", icon: Target },
            { step: "03", title: "Clinical Flags", desc: "Automatic detection of areas needing attention", icon: AlertTriangle },
            { step: "04", title: "HPS Integration", desc: "Your CA score contributes up to 150 HPS points", icon: TrendingUp },
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
