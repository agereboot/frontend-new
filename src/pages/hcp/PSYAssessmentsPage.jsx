import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ClipboardList, Plus, CheckCircle, AlertTriangle, Brain, TrendingUp, Sparkles, X, Shield, Target, Clock, Loader2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const SEVERITY_COLORS = {
  Minimal: "#10B981", Mild: "#6366F1", Moderate: "#F59E0B",
  "Moderately severe": "#EF4444", Severe: "#FF0055", Poor: "#EF4444",
  Good: "#10B981", "Very Poor": "#FF0055", Low: "#10B981", High: "#EF4444", Unknown: "#64748B",
};

const RISK_COLORS = { low: "#10B981", moderate: "#F59E0B", high: "#EF4444", critical: "#FF0055" };
const PRIORITY_COLORS = { immediate: "#EF4444", short_term: "#F59E0B", ongoing: "#6366F1" };

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly, or being fidgety/restless",
  "Thoughts that you would be better off dead, or of hurting yourself",
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

export default function PSYAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [templates, setTemplates] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedType, setSelectedType] = useState("PHQ-9");
  const [selectedMember, setSelectedMember] = useState("");
  const [responses, setResponses] = useState({});
  const [interpreting, setInterpreting] = useState(null);
  const [interpretation, setInterpretation] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/coach/psy/assessment-templates").then(r => setTemplates(r.data.templates || {})),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchAssessments = async (memberId) => {
    if (!memberId) return;
    const res = await api.get(`/coach/psy/assessments/${memberId}`);
    setAssessments(res.data.assessments || []);
  };

  useEffect(() => { if (selectedMember) fetchAssessments(selectedMember); }, [selectedMember]);

  const interpretAssessment = async (assessmentId) => {
    setInterpreting(assessmentId);
    try {
      const res = await api.post(`/coach/psy/assessments/${assessmentId}/interpret`);
      setInterpretation(res.data);
      toast.success("AI interpretation generated");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Interpretation failed");
    } finally {
      setInterpreting(null);
    }
  };

  const questions = selectedType === "PHQ-9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;

  const submitAssessment = async () => {
    if (!selectedMember) { toast.error("Select a patient"); return; }
    const member = members.find(m => m.id === selectedMember);
    try {
      const res = await api.post("/coach/psy/assessments", {
        type: selectedType,
        member_id: selectedMember,
        member_name: member?.name || "",
        responses,
      });
      setAssessments(prev => [res.data, ...prev]);
      setShowAdmin(false);
      setResponses({});
      const sev = res.data.severity;
      if (sev === "Severe" || sev === "Moderately severe") {
        toast.warning(`${selectedType} Score: ${res.data.total_score} — ${sev}. Review recommended.`);
      } else {
        toast.success(`${selectedType} administered — Score: ${res.data.total_score} (${sev})`);
      }
    } catch { toast.error("Failed to submit assessment"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="assessments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Assessment <span className="text-indigo-400">Suite</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">PHQ-9 / GAD-7 / PSQI / PSS-10 DIGITAL ADMINISTRATION</p>
        </div>
        <Button data-testid="new-assessment-btn" onClick={() => setShowAdmin(!showAdmin)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
          <Plus size={14} className="mr-1" /> Administer Assessment
        </Button>
      </div>

      {/* Admin Form */}
      {showAdmin && (
        <div className="rounded-xl border border-indigo-500/20 bg-black/30 p-5 space-y-4" data-testid="assessment-form">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Patient</label>
              <AppSelect data-testid="assess-member" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none">
                <AppSelectOption value="">Select patient</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Assessment Type</label>
              <div className="flex gap-2">
                {Object.keys(templates).map(t => (
                  <button key={t} data-testid={`type-${t}`} onClick={() => { setSelectedType(t); setResponses({}); }}
                    className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all ${selectedType === t ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400" : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {questions.map((q, i) => {
              const qKey = `q${i + 1}`;
              return (
                <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3" data-testid={`question-${i}`}>
                  <p className="text-xs text-white mb-2"><span className="text-indigo-400 font-mono mr-2">Q{i + 1}.</span>{q}</p>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(v => (
                      <button key={v} onClick={() => setResponses(p => ({ ...p, [qKey]: v }))}
                        className={`flex-1 py-1.5 rounded text-[10px] font-mono border transition-all ${responses[qKey] === v ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "bg-black/20 border-white/5 text-slate-500 hover:border-white/10"}`}>
                        {v} - {["Not at all", "Several days", "More than half", "Nearly every day"][v]}
                      </button>
                    ))}
                  </div>
                  {selectedType === "PHQ-9" && i === 8 && (responses.q9 || 0) > 0 && (
                    <div className="mt-2 p-2 rounded border border-red-500/30 bg-red-500/5 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-red-400 shrink-0" />
                      <p className="text-[10px] text-red-400">Suicidal ideation flagged — C-SSRS screening required</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div>
              <p className="font-mono text-[10px] text-slate-400">Score: <span className="text-white font-bold">{Object.values(responses).reduce((a, b) => a + b, 0)}</span> / {templates[selectedType]?.max_score || 0}</p>
            </div>
            <div className="flex gap-2">
              <Button data-testid="submit-assessment" onClick={submitAssessment} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                <CheckCircle size={12} className="mr-1" /> Submit & Score
              </Button>
              <Button variant="outline" onClick={() => setShowAdmin(false)} className="border-white/10 text-slate-300 text-xs">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Interpretation Panel */}
      {interpretation && (
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5 space-y-4 animate-in fade-in duration-500" data-testid="ai-interpretation-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" />
              <h3 className="font-display text-sm font-bold text-white">AI Clinical Interpretation</h3>
              <Badge className="font-mono text-[7px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{interpretation.assessment_type} Score: {interpretation.score}/{interpretation.max_score}</Badge>
            </div>
            <button onClick={() => setInterpretation(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>

          <p className="font-body text-sm text-slate-300 leading-relaxed">{interpretation.clinical_interpretation}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} style={{ color: RISK_COLORS[interpretation.risk_level] || "#64748B" }} />
                <span className="font-mono text-[8px] text-slate-400 uppercase">Risk Level</span>
              </div>
              <Badge className="font-mono text-xs font-bold" style={{ backgroundColor: (RISK_COLORS[interpretation.risk_level] || "#64748B") + "15", color: RISK_COLORS[interpretation.risk_level] || "#64748B" }}>
                {(interpretation.risk_level || "").toUpperCase()}
              </Badge>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={12} className="text-amber-400" />
                <span className="font-mono text-[8px] text-slate-400 uppercase">Key Concerns</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(interpretation.key_concerns || []).map((c, i) => (
                  <Badge key={i} className="font-mono text-[7px] bg-amber-500/10 text-amber-400 border-amber-500/20">{c}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} className="text-blue-400" />
                <span className="font-mono text-[8px] text-slate-400 uppercase">Follow-up</span>
              </div>
              <p className="font-mono text-xs text-white">{interpretation.follow_up?.reassessment_weeks} weeks</p>
              <p className="font-mono text-[8px] text-slate-500">{interpretation.follow_up?.reason}</p>
            </div>
          </div>

          {/* Recommended Interventions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-emerald-400" />
              <h4 className="font-display text-xs font-bold text-white">Recommended Interventions</h4>
            </div>
            <div className="space-y-2">
              {(interpretation.recommended_interventions || []).map((intv, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-black/20" data-testid={`intervention-${i}`}>
                  <div className="w-1.5 rounded-full h-full min-h-[24px] shrink-0" style={{ backgroundColor: PRIORITY_COLORS[intv.priority] || "#6366F1" }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className="font-mono text-[6px] bg-white/5 text-white">{intv.type}</Badge>
                      <Badge className="font-mono text-[6px]" style={{ backgroundColor: (PRIORITY_COLORS[intv.priority] || "#6366F1") + "15", color: PRIORITY_COLORS[intv.priority] || "#6366F1" }}>{intv.priority?.replace("_", " ")}</Badge>
                    </div>
                    <p className="font-body text-xs text-slate-300">{intv.description}</p>
                    <p className="font-mono text-[7px] text-slate-500 mt-0.5">Evidence: {intv.evidence_base}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Therapeutic Targets & Longevity Connection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <h4 className="font-mono text-[8px] text-slate-400 uppercase mb-2">Therapeutic Targets</h4>
              <ul className="space-y-1">
                {(interpretation.therapeutic_targets || []).map((t, i) => (
                  <li key={i} className="font-body text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">*</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 p-3">
              <h4 className="font-mono text-[8px] text-indigo-400 uppercase mb-2">Longevity Connection</h4>
              <p className="font-body text-xs text-slate-300">{interpretation.longevity_connection}</p>
            </div>
          </div>

          <p className="font-mono text-[7px] text-slate-600 text-right">Generated {new Date(interpretation.generated_at).toLocaleString()} by AI | For clinical reference only</p>
        </div>
      )}

      {/* Assessment History */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="assessment-history">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-indigo-400" />
          <h3 className="font-display text-sm font-bold text-white">Assessment History</h3>
          <AppSelect data-testid="history-member" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
            className="ml-auto bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:border-indigo-500 focus:outline-none">
            <AppSelectOption value="">Select patient</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
        </div>
        {assessments.length > 0 ? (
          <div className="space-y-2">
            {assessments.map(a => {
              const sevColor = SEVERITY_COLORS[a.severity] || "#64748B";
              const isInterpreting = interpreting === a.id;
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]" data-testid={`assess-${a.id}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: sevColor + "12", border: `1px solid ${sevColor}25` }}>
                    <span className="font-display text-sm font-bold" style={{ color: sevColor }}>{a.total_score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono text-[8px] bg-white/5 text-white">{a.type}</Badge>
                      <Badge className="font-mono text-[8px]" style={{ backgroundColor: sevColor + "15", color: sevColor }}>{a.severity}</Badge>
                      {a.type === "PHQ-9" && a.responses?.q9 > 0 && (
                        <Badge className="font-mono text-[7px] bg-red-500/10 text-red-400 border-red-500/20">SI FLAG</Badge>
                      )}
                    </div>
                    <p className="font-mono text-[8px] text-slate-500 mt-0.5">{a.member_name} &middot; {new Date(a.administered_at).toLocaleString()} &middot; By {a.administered_by_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-mono text-[8px] text-slate-500">LOINC: {a.loinc_code}</p>
                      <p className="font-mono text-[8px] text-slate-500">{a.total_score}/{a.max_score}</p>
                    </div>
                    <Button
                      data-testid={`interpret-${a.id}`}
                      size="sm"
                      disabled={isInterpreting}
                      onClick={() => interpretAssessment(a.id)}
                      className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px] h-7 px-2.5"
                    >
                      {isInterpreting ? <Loader2 size={12} className="animate-spin" /> : <><Sparkles size={12} className="mr-1" /> AI Interpret</>}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">
            {selectedMember ? "No assessments found for this patient" : "Select a patient to view assessment history"}
          </p>
        )}
      </div>
    </div>
  );
}
