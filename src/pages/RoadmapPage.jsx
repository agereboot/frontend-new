import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Map, Target, Clock, ArrowRight, AlertTriangle, CheckCircle, RefreshCw,
  HeartPulse, Dumbbell, Brain, Moon, ShieldCheck, Activity, Pill,
  FlaskConical, Stethoscope, ShoppingCart, Plus, X, Coins,
  ChevronRight, ChevronDown, TrendingDown, Zap, Leaf, Syringe, Wind,
  Droplets, Bone, Shield, Lock, Unlock, FileText, Eye, EyeOff,
  Microscope, ScanLine, Send
} from "lucide-react";

const PILLAR_META = {
  PF: { name: "Physical Fitness", icon: Dumbbell, color: "#0F9F8F", gradient: "from-teal-500/10" },
  BR: { name: "Biomarker Recovery", icon: HeartPulse, color: "#EF4444", gradient: "from-red-500/10" },
  CA: { name: "Cognitive Acuity", icon: Brain, color: "#6366F1", gradient: "from-indigo-500/10" },
  SR: { name: "Sleep & Recovery", icon: Moon, color: "#8B5CF6", gradient: "from-violet-500/10" },
  BL: { name: "Body & Longevity", icon: ShieldCheck, color: "#D97706", gradient: "from-amber-500/10" },
};
const TYPE_META = {
  medical: { label: "Medical", icon: Stethoscope, color: "#0F9F8F", bg: "bg-teal-500/8" },
  pharmaceutical: { label: "Pharmaceutical", icon: Syringe, color: "#6366F1", bg: "bg-indigo-500/8" },
  nutraceutical: { label: "Nutraceutical", icon: Leaf, color: "#84CC16", bg: "bg-lime-500/8" },
};
const PRIORITY_META = {
  must_do: { label: "MUST DO", color: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/20" },
  good_to_do: { label: "GOOD TO DO", color: "#D97706", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};
const ORGAN_ICONS = {
  "heart-pulse": HeartPulse, "flask-conical": FlaskConical, "droplets": Droplets,
  "wind": Wind, "brain": Brain, "zap": Zap, "shield": Shield, "bone": Bone,
};

/* ─── Strip markdown from AI text ─── */
function cleanNarrative(raw) {
  if (!raw) return [];
  const cleaned = raw
    .replace(/^#{1,4}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/---/g, "")
    .trim();
  // Split into sections by double newline or by lines that look like headers
  const lines = cleaned.split(/\n/).filter(l => l.trim());
  const sections = [];
  let currentSection = { heading: "", items: [] };
  for (const line of lines) {
    const trimmed = line.trim();
    // Detect section headings: ALL CAPS lines or lines ending with colon
    if (/^[A-Z][A-Z\s&\-:]+$/.test(trimmed) && trimmed.length > 5 && trimmed.length < 60) {
      if (currentSection.heading || currentSection.items.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { heading: trimmed, items: [] };
    } else if (/^\d+\.\s/.test(trimmed)) {
      currentSection.items.push(trimmed.replace(/^\d+\.\s*/, ""));
    } else if (trimmed) {
      currentSection.items.push(trimmed);
    }
  }
  if (currentSection.heading || currentSection.items.length > 0) {
    sections.push(currentSection);
  }
  return sections;
}

/* ─── Intervention Card ─── */
function InterventionCard({ iv, inCart, onToggleCart }) {
  const type = TYPE_META[iv.type] || TYPE_META.medical;
  const prio = PRIORITY_META[iv.priority] || PRIORITY_META.good_to_do;
  const TypeIcon = type.icon;
  const pillar = PILLAR_META[iv.pillar_code] || {};
  return (
    <div className={`glass-premium rounded-xl p-4 border-l-2 transition-all ${inCart ? "ring-1 ring-cosmic/30" : ""}`}
      style={{ borderLeftColor: pillar.color || "#7B35D8" }} data-testid={`intervention-${iv.id}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: type.color + "12" }}>
          <TypeIcon size={16} style={{ color: type.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={`font-mono text-[7px] uppercase ${prio.bg} ${prio.border} border`} style={{ color: prio.color }}>{prio.label}</Badge>
            <Badge className={`font-mono text-[7px] ${type.bg} border border-white/5`} style={{ color: type.color }}>{type.label}</Badge>
          </div>
          <p className="font-body text-sm font-medium text-stellar leading-snug">{iv.intervention}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="font-mono text-[8px] text-stellar-dim">{iv.evidence}</span>
            <span className="font-mono text-[8px] text-cosmic font-bold">{iv.hps_delta} HPS</span>
            <span className="font-mono text-[8px] text-stellar-dim">{iv.duration}</span>
          </div>
          {iv.contra && iv.contra !== "None" && (
            <div className="flex items-start gap-1 mt-1">
              <AlertTriangle size={8} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="font-mono text-[7px] text-amber-400/70">{iv.contra}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {iv.credits > 0 ? (
            <div className="flex items-center gap-1"><Coins size={10} className="text-amber-400" /><span className="font-mono text-xs font-bold text-amber-400">{iv.credits}</span></div>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-mono text-[7px]">FREE</Badge>
          )}
          <button onClick={() => onToggleCart(iv)} data-testid={`cart-toggle-${iv.id}`}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-mono text-[8px] transition-all ${inCart ? "bg-cosmic/15 border-cosmic/30 text-cosmic" : "bg-white/[0.02] border-white/8 text-stellar-dim hover:border-cosmic/30 hover:text-cosmic"}`}>
            {inCart ? <><CheckCircle size={9} /> In Cart</> : <><Plus size={9} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Organ Card (fixed layout, no overlap) ─── */
function OrganCard({ organ, onAddTest, cartIds }) {
  const [expanded, setExpanded] = useState(false);
  const OIcon = ORGAN_ICONS[organ.icon] || Activity;
  const isYounger = organ.age_difference > 0;
  return (
    <div className={`glass-premium rounded-xl overflow-hidden transition-all ${organ.status === "at_risk" ? "ring-1 ring-red-500/20" : ""}`} data-testid={`organ-${organ.organ}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-white/[0.01] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: organ.status_color + "10", border: `1px solid ${organ.status_color}25` }}>
            <OIcon size={18} style={{ color: organ.status_color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs font-bold text-stellar truncate">{organ.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className="font-mono text-[6px] px-1 py-0" style={{ backgroundColor: organ.status_color + "15", color: organ.status_color, border: `1px solid ${organ.status_color}30` }}>{organ.status.replace("_", " ")}</Badge>
              {organ.confidence !== "high" && (
                <Badge className="bg-amber-500/8 text-amber-400 border border-amber-500/12 font-mono text-[6px] px-1 py-0">
                  {organ.data_coverage}%
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <p className="font-mono text-xl font-black leading-none" style={{ color: organ.status_color }}>{organ.organ_age}</p>
            <p className="font-mono text-[8px] text-stellar-dim mt-0.5">
              {isYounger ? "-" : "+"}{Math.abs(organ.age_difference).toFixed(1)} yrs
            </p>
          </div>
          <ChevronRight size={12} className={`text-stellar-dim shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div className="grid grid-cols-3 gap-3">
            <div><span className="font-mono text-[7px] text-stellar-dim/50 uppercase block">Score</span><span className="font-mono text-sm font-bold text-stellar">{organ.health_score}</span></div>
            <div><span className="font-mono text-[7px] text-stellar-dim/50 uppercase block">Data</span><span className="font-mono text-sm font-bold text-stellar">{organ.biomarkers_available}/{organ.biomarkers_total}</span></div>
            <div><span className="font-mono text-[7px] text-stellar-dim/50 uppercase block">Confidence</span>
              <span className={`font-mono text-sm font-bold ${organ.confidence === "high" ? "text-emerald-400" : organ.confidence === "moderate" ? "text-amber-400" : "text-red-400"}`}>{organ.confidence}</span>
            </div>
          </div>
          {organ.matching_conditions?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {organ.matching_conditions.map((c, i) => (
                <Badge key={i} className="bg-red-500/8 text-red-400 border border-red-500/12 font-mono text-[7px] capitalize">{c}</Badge>
              ))}
            </div>
          )}
          {organ.suggested_tests?.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-mono text-[8px] text-amber-400/80 uppercase tracking-[0.15em]">Investigations Needed</p>
              {organ.suggested_tests.map((t, i) => {
                const testId = `${organ.organ}-test-${i}`;
                const inCart = cartIds.has(testId);
                return (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                    <Microscope size={10} className="text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[11px] text-stellar truncate">{t.test}</p>
                      <Badge className={`font-mono text-[5px] mt-0.5 ${t.priority === "must_do" ? "bg-red-500/10 text-red-400 border-red-500/15" : "bg-amber-500/10 text-amber-400 border-amber-500/15"} border`}>
                        {t.priority === "must_do" ? "MUST DO" : "GOOD TO DO"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[9px] font-bold text-amber-400">{t.credits}</span>
                      <Coins size={8} className="text-amber-400" />
                      <button onClick={() => onAddTest(testId, t)} data-testid={`add-test-${organ.organ}-${i}`}
                        className={`px-1.5 py-1 rounded border font-mono text-[7px] ${inCart ? "bg-cosmic/15 border-cosmic/30 text-cosmic" : "bg-white/[0.02] border-white/8 text-stellar-dim hover:border-cosmic/30"}`}>
                        {inCart ? "Added" : "+Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function RoadmapPage() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [organAges, setOrganAges] = useState(null);
  const [cart, setCart] = useState({ items: [], total_credits: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPillars, setExpandedPillars] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [briefingAcknowledged, setBriefingAcknowledged] = useState(false);
  const [approvedProtocols, setApprovedProtocols] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [rRes, cRes, oRes] = await Promise.all([
        api.get(`/roadmap/${user.id}`),
        api.get("/cart").catch(() => ({ data: { items: [], total_credits: 0 } })),
        api.get("/health/organ-ages").catch(() => ({ data: null })),
      ]);
      setRoadmap(rRes.data?.roadmap !== null ? rRes.data : null);
      setApprovedProtocols(rRes.data?.approved_protocols || []);
      setCart(cRes.data || { items: [], total_credits: 0 });
      setOrganAges(oRes.data);
    } catch { } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/roadmap/generate");
      setRoadmap(res.data);
      setBriefingOpen(false);
      setBriefingAcknowledged(false);
      setConsentChecked(false);
      toast.success("Longevity roadmap generated.");
      api.get("/health/organ-ages").then(r => setOrganAges(r.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || "Compute HPS first.");
    } finally { setGenerating(false); }
  };

  const toggleCart = async (iv) => {
    const inCart = cart.items.some(i => i.intervention_id === iv.id);
    try {
      const res = inCart
        ? await api.post("/cart/remove", { intervention_id: iv.id })
        : await api.post("/cart/add", { intervention_id: iv.id, intervention_name: iv.intervention, credits: iv.credits, pillar_code: iv.pillar_code, priority: iv.priority });
      setCart(res.data);
    } catch { toast.error("Cart update failed"); }
  };

  const addTestToCart = async (testId, test) => {
    if (cart.items.some(i => i.intervention_id === testId)) return;
    try {
      const res = await api.post("/cart/add", { intervention_id: testId, intervention_name: test.test, credits: test.credits, pillar_code: "DIAG", priority: test.priority || "must_do" });
      setCart(res.data);
      toast.success("Added to cart");
    } catch { toast.error("Failed"); }
  };

  const removeFromCart = async (itemId) => {
    try { const res = await api.post("/cart/remove", { intervention_id: itemId }); setCart(res.data); } catch { }
  };

  const togglePillar = (code) => setExpandedPillars(prev => ({ ...prev, [code]: !prev[code] }));

  const handleSubmitForReview = async () => {
    if (!roadmap?.id) return;
    setSubmittingReview(true);
    try {
      const res = await api.post("/roadmap/submit-for-review", { roadmap_id: roadmap.id });
      toast.success(res.data?.message || "Submitted for review!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit");
    } finally { setSubmittingReview(false); }
  };

  const handleAcceptSuggestion = async () => {
    if (!roadmap?.id) return;
    setSubmittingReview(true);
    try {
      // Find the review id from roadmap_reviews
      const reviewsRes = await api.get(`/roadmap/review-history/${user?.id}`);
      const sugReview = (reviewsRes.data?.reviews || []).find(r => r.status === "suggested" && r.roadmap_id === roadmap.id);
      if (!sugReview) { toast.error("No pending suggestion found"); return; }
      const res = await api.post(`/roadmap/${sugReview.id}/accept-suggestion`);
      toast.success(res.data?.message || "Suggestion accepted!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to accept");
    } finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64" data-testid="roadmap-loading">
      <div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  const bioAge = roadmap?.biological_age;
  const interventions = roadmap?.interventions || {};
  const cartIds = new Set(cart.items.map(i => i.intervention_id));
  const briefingSections = cleanNarrative(roadmap?.ai_narrative);

  return (
    <div className="space-y-5 animate-slide-up" data-testid="roadmap-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            <span className="text-gradient-cosmic">Longevity</span> Roadmap
          </h1>
          <p className="font-mono text-[10px] text-stellar-dim tracking-[0.25em] mt-2 uppercase">AgeReboot Performance Protocol</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCart(!showCart)} data-testid="cart-toggle-btn"
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl glass-premium border border-white/5 hover:border-cosmic/20 transition-all">
            <ShoppingCart size={16} className="text-cosmic" />
            <span className="font-mono text-xs text-stellar">{cart.total_credits}</span>
            <Coins size={12} className="text-amber-400" />
            {cart.items.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cosmic text-white font-mono text-[8px] flex items-center justify-center">{cart.items.length}</span>}
          </button>
          <Button data-testid="generate-roadmap-btn" onClick={handleGenerate} disabled={generating}
            className="bg-gradient-to-r from-cosmic to-indigo-600 hover:from-cosmic-light hover:to-indigo-500 text-white font-display font-bold uppercase tracking-[0.15em] text-xs h-11 rounded-xl shadow-[0_4px_20px_rgba(123,53,216,0.3)]">
            {generating ? <><RefreshCw size={14} className="animate-spin mr-2" /> Generating...</> : <><Activity size={14} className="mr-2" /> {roadmap ? "Regenerate" : "Generate"}</>}
          </Button>
        </div>
      </div>

      {/* Roadmap Review Status Banner */}
      {roadmap && roadmap.review_status && (
        <div className={`glass-premium rounded-xl p-4 border ${
          roadmap.review_status === "approved" ? "border-emerald-500/30 bg-emerald-500/5" :
          roadmap.review_status === "rejected" ? "border-red-500/30 bg-red-500/5" :
          roadmap.review_status === "suggested" ? "border-cyan-500/30 bg-cyan-500/5" :
          roadmap.review_status === "pending" ? "border-amber-500/30 bg-amber-500/5" :
          "border-white/10"
        }`} data-testid="roadmap-review-status">
          <div className="flex items-center gap-3">
            {roadmap.review_status === "approved" && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
            {roadmap.review_status === "rejected" && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
            {roadmap.review_status === "suggested" && <Activity size={18} className="text-cyan-400 shrink-0" />}
            {roadmap.review_status === "pending" && <Clock size={18} className="text-amber-400 shrink-0" />}
            <div className="flex-1">
              <p className={`font-display text-sm font-bold ${
                roadmap.review_status === "approved" ? "text-emerald-400" :
                roadmap.review_status === "rejected" ? "text-red-400" :
                roadmap.review_status === "suggested" ? "text-cyan-400" :
                "text-amber-400"
              }`}>
                {roadmap.review_status === "approved" && `Approved by ${roadmap.approved_by_name || "Care Team"}`}
                {roadmap.review_status === "rejected" && `Needs Revision — Reviewed by ${roadmap.rejected_by_name || "Care Team"}`}
                {roadmap.review_status === "suggested" && `${roadmap.suggested_by_name || "Care Team"} has proposed a modified roadmap`}
                {roadmap.review_status === "pending" && "Pending Care Team Review"}
              </p>
              {roadmap.review_status === "approved" && roadmap.review_notes && (
                <p className="font-body text-xs text-emerald-300/70 mt-1">{roadmap.review_notes}</p>
              )}
              {roadmap.review_status === "approved" && roadmap.care_team_modifications?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-mono text-[8px] text-emerald-400/60 uppercase tracking-wider">Modifications</p>
                  {roadmap.care_team_modifications.map((m, i) => (
                    <p key={i} className="font-body text-xs text-emerald-300/80">+ {m}</p>
                  ))}
                </div>
              )}
              {roadmap.review_status === "rejected" && roadmap.rejection_reasons?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-mono text-[8px] text-red-400/60 uppercase tracking-wider">Clinical Reasons</p>
                  {roadmap.rejection_reasons.map((r, i) => (
                    <p key={i} className="font-body text-xs text-red-300/80">- {r}</p>
                  ))}
                  {roadmap.clinical_notes && (
                    <p className="font-body text-xs text-zinc-400 italic mt-1">{roadmap.clinical_notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Side-by-side diff for suggestions */}
          {roadmap.review_status === "suggested" && roadmap.milestone_diff?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-cyan-500/20" data-testid="suggestion-diff-view">
              {roadmap.clinical_rationale && (
                <p className="font-body text-xs text-cyan-300/80 mb-3 italic">{roadmap.clinical_rationale}</p>
              )}
              {roadmap.change_summary?.length > 0 && (
                <div className="mb-3 space-y-0.5">
                  <p className="font-mono text-[8px] text-cyan-400/60 uppercase tracking-wider">Changes Summary</p>
                  {roadmap.change_summary.map((s, i) => (
                    <p key={i} className="font-body text-xs text-cyan-300/70">- {s}</p>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <p className="font-mono text-[9px] text-red-400/50 uppercase tracking-wider pl-2">Your Original</p>
                <p className="font-mono text-[9px] text-cyan-400/50 uppercase tracking-wider pl-2">Suggested by Care Team</p>
              </div>
              <div className="space-y-1">
                {roadmap.milestone_diff.map((d, i) => {
                  const isModified = d.type === "modified";
                  const isAdded = d.type === "added";
                  const isRemoved = d.type === "removed";
                  return (
                    <div key={i} className={`grid grid-cols-2 gap-2 rounded-lg py-2 px-2 ${
                      isModified ? "bg-cyan-500/5 border-l-2 border-l-cyan-500" :
                      isAdded ? "bg-emerald-500/5 border-l-2 border-l-emerald-500" :
                      isRemoved ? "bg-red-500/5 border-l-2 border-l-red-500" : ""
                    }`}>
                      <div className="flex items-start gap-1.5">
                        {d.original ? (
                          <>
                            <span className={`font-mono text-[10px] shrink-0 ${isModified || isRemoved ? "text-red-400" : "text-zinc-500"}`}>M{d.original.month}</span>
                            <span className={`font-body text-xs ${isModified || isRemoved ? "text-red-400 line-through" : "text-zinc-500"}`}>{d.original.target}</span>
                          </>
                        ) : <span className="font-body text-xs text-zinc-600 italic">—</span>}
                      </div>
                      <div className="flex items-start gap-1.5">
                        {d.suggested ? (
                          <>
                            <span className={`font-mono text-[10px] shrink-0 ${isModified || isAdded ? "text-cyan-400" : "text-zinc-500"}`}>M{d.suggested.month}</span>
                            <span className={`font-body text-xs ${isModified || isAdded ? "text-cyan-300" : "text-zinc-500"}`}>{d.suggested.target}</span>
                            {(isModified || isAdded) && (
                              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">{isAdded ? "New" : "Changed"}</span>
                            )}
                          </>
                        ) : <span className="font-body text-xs text-red-400/60 italic">removed</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Submit for Review / Accept Suggestion buttons */}
      {roadmap && roadmap.review_status === "suggested" && (
        <div className="flex justify-end gap-2">
          <Button data-testid="accept-suggestion-btn" onClick={handleAcceptSuggestion} disabled={submittingReview}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-display font-bold uppercase tracking-wider text-xs h-10 rounded-xl">
            <CheckCircle size={14} className="mr-2" />{submittingReview ? "Accepting..." : "Accept Care Team Suggestion"}
          </Button>
        </div>
      )}
      {roadmap && (!roadmap.review_status || roadmap.review_status === "rejected") && (
        <div className="flex justify-end">
          <Button data-testid="submit-for-review-btn" onClick={handleSubmitForReview} disabled={submittingReview}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display font-bold uppercase tracking-wider text-xs h-10 rounded-xl">
            <Send size={14} className="mr-2" />{submittingReview ? "Submitting..." : "Submit for Care Team Review"}
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="glass-premium rounded-2xl p-5 border border-cosmic/10" data-testid="cart-drawer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><ShoppingCart size={16} className="text-cosmic" /><h3 className="font-display text-sm font-bold text-stellar">Cart</h3></div>
            <button onClick={() => setShowCart(false)} className="text-stellar-dim hover:text-stellar"><X size={16} /></button>
          </div>
          {cart.items.length === 0 ? (
            <p className="font-body text-sm text-stellar-dim text-center py-3">Add interventions or investigations below.</p>
          ) : (
            <div className="space-y-1.5">
              {cart.items.map(item => (
                <div key={item.intervention_id} className="flex items-center gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="w-1.5 h-5 rounded-full shrink-0" style={{ backgroundColor: PILLAR_META[item.pillar_code]?.color || "#D97706" }} />
                  <span className="font-body text-[11px] text-stellar flex-1 truncate">{item.intervention_name}</span>
                  <span className="font-mono text-[10px] font-bold text-amber-400 shrink-0">{item.credits}</span>
                  <Coins size={9} className="text-amber-400 shrink-0" />
                  <button onClick={() => removeFromCart(item.intervention_id)} className="text-stellar-dim hover:text-red-400 shrink-0"><X size={12} /></button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="font-display text-sm font-bold text-stellar">Total</span>
                <div className="flex items-center gap-1"><Coins size={12} className="text-amber-400" /><span className="font-mono text-lg font-black text-amber-400">{cart.total_credits}</span></div>
              </div>
              <Button data-testid="checkout-btn" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-bold uppercase tracking-wider text-xs h-9 rounded-xl">
                <ShoppingCart size={12} className="mr-2" /> Checkout
              </Button>
            </div>
          )}
        </div>
      )}

      {!roadmap && approvedProtocols.length === 0 ? (
        <div className="glass-premium rounded-2xl p-16 text-center">
          <Map size={40} className="text-cosmic/30 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-stellar mb-2">No Roadmap Generated</h2>
          <p className="font-body text-sm text-stellar-dim max-w-lg mx-auto mb-4">
            Generate your personalized longevity roadmap. AgeReboot will analyze your HPS, identify priority gaps, and prescribe evidence-based protocols.
          </p>
        </div>
      ) : !roadmap && approvedProtocols.length > 0 ? (
        <div className="space-y-5">
          <div className="glass-premium rounded-2xl p-6 text-center mb-4">
            <Map size={32} className="text-cosmic/30 mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold text-stellar mb-1">AI Roadmap Not Generated Yet</h2>
            <p className="font-body text-sm text-stellar-dim max-w-lg mx-auto">Generate your HPS-powered roadmap for gap analysis and AI-suggested interventions.</p>
          </div>
          <div className="flex items-center gap-2 mb-2" data-testid="longevity-roadmap-section">
            <ShieldCheck size={16} className="text-emerald-400" />
            <h3 className="font-display text-base font-bold text-stellar">Clinician-Approved Longevity Protocols</h3>
            <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{approvedProtocols.length} Active</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedProtocols.map(p => (
              <div key={p.id} className="glass-premium rounded-xl p-5 border-l-2 border-emerald-500" data-testid={`approved-proto-${p.lgp_id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{p.lgp_id}</Badge>
                  <Badge className="font-mono text-[8px] bg-white/5 text-slate-300 border-white/10">{p.category}</Badge>
                </div>
                <p className="font-display text-sm font-bold text-stellar mb-1">{p.protocol_name}</p>
                <div className="flex items-center gap-3 text-[10px] text-stellar-dim">
                  <span className="flex items-center gap-1"><Clock size={10} /> {p.duration_weeks} weeks</span>
                  <span>Approved {new Date(p.approved_at).toLocaleDateString()}</span>
                </div>
                {p.assigned_coach_name && <p className="text-[10px] text-cosmic mt-1"><Stethoscope size={10} className="inline mr-1" />Coach: {p.assigned_coach_name}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-space-light/50 border border-white/5 p-1 h-auto">
            <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">
              Overview
            </TabsTrigger>
            <TabsTrigger value="ages" data-testid="tab-ages" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">
              Biological &amp; Organ Ages
            </TabsTrigger>
            <TabsTrigger value="interventions" data-testid="tab-interventions" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">
              Interventions
            </TabsTrigger>
            {approvedProtocols.length > 0 && (
              <TabsTrigger value="longevity" data-testid="tab-longevity" className="text-xs font-mono data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
                Longevity Roadmap ({approvedProtocols.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* ═════════ TAB 1: OVERVIEW ═════════ */}
          <TabsContent value="overview" className="space-y-5 mt-4">
            {/* Clinician-Approved Protocols Banner */}
            {approvedProtocols.length > 0 && (
              <button onClick={() => setActiveTab("longevity")} className="w-full glass-premium rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/8 transition-all text-left" data-testid="approved-banner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold text-emerald-400">{approvedProtocols.length} Clinician-Approved Protocol{approvedProtocols.length !== 1 ? "s" : ""}</p>
                    <p className="font-body text-[10px] text-stellar-dim">Your healthcare team has approved personalized longevity protocols. Tap to view.</p>
                  </div>
                  <ChevronRight size={16} className="text-emerald-400 shrink-0" />
                </div>
              </button>
            )}
            {/* Priority Gap Analysis */}
            {roadmap.gaps?.length > 0 && (
              <div className="space-y-4" data-testid="gap-analysis">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-cosmic" />
                  <h3 className="font-display text-base font-bold text-stellar">Priority Gap Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {roadmap.gaps.map((g) => {
                    const meta = PILLAR_META[g.pillar_code] || {};
                    const Icon = meta.icon || Activity;
                    const isCritical = g.gap_score > 15;
                    return (
                      <div key={g.pillar_code} className={`glass-premium rounded-xl p-5 bg-gradient-to-br ${meta.gradient || ""} to-transparent`} data-testid={`gap-${g.pillar_code}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: meta.color + "12", border: `1px solid ${meta.color}25` }}>
                            <Icon size={18} style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-display text-sm font-bold text-stellar">{g.pillar_name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-xs" style={{ color: g.current_pct < 50 ? "#EF4444" : "#D97706" }}>{g.current_pct}%</span>
                              <ArrowRight size={10} className="text-stellar-dim" />
                              <span className="font-mono text-xs text-teal-400">{g.target_pct}%</span>
                            </div>
                          </div>
                          <Badge className={`font-mono text-[8px] ${isCritical ? "bg-red-500/10 text-red-400 border-red-500/15" : g.gap_score > 5 ? "bg-amber-500/10 text-amber-400 border-amber-500/15" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"} border`}>
                            GAP {g.gap_score > 0 ? "+" : ""}{g.gap_score}
                          </Badge>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${g.current_pct}%`, backgroundColor: meta.color }} />
                        </div>
                        <p className="font-body text-[10px] text-stellar-dim mt-2">
                          {isCritical
                            ? `Critical gap. ${g.pillar_name} needs immediate intervention to reach optimal performance.`
                            : g.gap_score > 5
                              ? `Moderate gap. Targeted protocols can improve this pillar by ${g.gap_score.toFixed(0)} points.`
                              : `Near optimal. Maintain current protocols for ${g.pillar_name}.`
                          }
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Performance Briefing (Sealed Ribbon / Consent / Structured Content) */}
            {roadmap.ai_narrative && (
              <div data-testid="performance-briefing">
                {!briefingOpen ? (
                  <div className="glass-premium rounded-2xl overflow-hidden">
                    <div className="p-1 bg-gradient-to-r from-transparent via-cosmic/30 to-transparent" />
                    <div className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmic/20 to-indigo-600/20 border border-cosmic/30 flex items-center justify-center shrink-0">
                        <Lock size={20} className="text-cosmic" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-base font-bold text-stellar">AgeReboot Performance Briefing</h3>
                        <p className="font-body text-xs text-stellar-dim mt-0.5">Your personalized longevity analysis is ready</p>
                      </div>
                      <Button data-testid="unseal-briefing-btn" onClick={() => setBriefingOpen(true)}
                        className="bg-gradient-to-r from-cosmic to-indigo-600 text-white font-display font-bold uppercase tracking-wider text-xs h-10 rounded-xl shrink-0">
                        <Eye size={14} className="mr-2" /> View Briefing
                      </Button>
                    </div>
                  </div>
                ) : !briefingAcknowledged ? (
                  <div className="glass-premium rounded-2xl overflow-hidden">
                    <div className="p-1 bg-gradient-to-r from-transparent via-cosmic/20 to-transparent" />
                    <div className="p-6 space-y-4" data-testid="briefing-consent">
                      <div className="flex items-start gap-3">
                        <ShieldCheck size={18} className="text-cosmic mt-0.5 shrink-0" />
                        <div>
                          <p className="font-display text-sm font-bold text-stellar mb-1">Medical Disclaimer</p>
                          <p className="font-body text-xs text-stellar-dim leading-relaxed">
                            This briefing is generated by AgeReboot algorithms for <strong className="text-stellar">informational purposes only</strong>.
                            It does not constitute medical advice, diagnosis, or treatment. Consult qualified healthcare professionals before making changes to your health regimen.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5 cursor-pointer hover:border-cosmic/20 transition-colors" data-testid="consent-checkbox-label">
                        <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)}
                          className="w-4 h-4 rounded accent-purple-600" data-testid="consent-checkbox" />
                        <span className="font-body text-xs text-stellar">I understand this is informational only and does not replace medical advice</span>
                      </label>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setBriefingOpen(false)} className="border-white/10 text-stellar-dim text-xs flex-1">Cancel</Button>
                        <Button data-testid="accept-consent-btn" onClick={() => { if (consentChecked) setBriefingAcknowledged(true); }} disabled={!consentChecked}
                          className="bg-cosmic hover:bg-cosmic-light disabled:opacity-30 text-white font-display font-bold uppercase tracking-wider text-xs flex-1">
                          <Unlock size={14} className="mr-2" /> Access Briefing
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-premium rounded-2xl overflow-hidden" data-testid="briefing-content">
                    <div className="p-1 bg-gradient-to-r from-transparent via-cosmic/20 to-transparent" />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
                            <FileText size={16} className="text-cosmic" />
                          </div>
                          <div>
                            <h3 className="font-display text-sm font-bold text-stellar">Performance Briefing</h3>
                            <p className="font-mono text-[8px] text-stellar-dim">HPS {roadmap.hps_at_generation}/1000</p>
                          </div>
                        </div>
                        <button onClick={() => setBriefingOpen(false)} data-testid="collapse-briefing-btn"
                          className="flex items-center gap-1 text-stellar-dim hover:text-cosmic text-xs font-mono transition-colors">
                          <EyeOff size={14} /> Collapse
                        </button>
                      </div>

                      {/* Structured sections — no raw markdown */}
                      <div className="space-y-5">
                        {briefingSections.map((section, idx) => (
                          <div key={idx}>
                            {section.heading && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-4 rounded-full bg-cosmic" />
                                <h4 className="font-display text-xs font-bold text-cosmic uppercase tracking-wider">{section.heading}</h4>
                              </div>
                            )}
                            <div className="space-y-2 pl-3">
                              {section.items.map((item, i) => (
                                <p key={i} className="font-body text-sm text-stellar/85 leading-relaxed">{item}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5">
                        <span className="font-mono text-[7px] text-stellar-dim/30 uppercase tracking-wider">Confidential — AgeReboot Health Report</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phases Timeline */}
            {roadmap.phases && (
              <div className="glass-premium rounded-2xl p-5" data-testid="phases-timeline">
                <div className="flex items-center gap-2 mb-4"><Clock size={16} className="text-cosmic" /><h3 className="font-display text-base font-bold text-stellar">Improvement Timeline</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roadmap.phases.map((phase, i) => {
                    const colors = ["#7B35D8", "#4F46E5", "#0F9F8F", "#D97706"];
                    return (
                      <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-white/5 border-l-2" style={{ borderLeftColor: colors[i] }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-display text-sm font-bold text-stellar">{phase.phase}</h4>
                          <Badge variant="outline" className="font-mono text-[7px] border-white/8 text-stellar-dim">{phase.timeline}</Badge>
                        </div>
                        <p className="font-body text-xs text-stellar/80 mb-1.5">{phase.objective}</p>
                        <Badge className="font-mono text-[7px] bg-teal-500/10 text-teal-400 border border-teal-500/15 mb-1.5">{phase.target_delta}</Badge>
                        <ul className="space-y-0.5">
                          {phase.actions.map((a, j) => (
                            <li key={j} className="flex items-start gap-1.5"><div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colors[i] }} /><span className="font-body text-[10px] text-stellar-dim">{a}</span></li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═════════ TAB 2: BIOLOGICAL & ORGAN AGES ═════════ */}
          <TabsContent value="ages" className="space-y-5 mt-4">
            {/* Bio Age + Trajectory Chart */}
            {bioAge && (
              <div className="glass-premium rounded-2xl p-6 relative overflow-hidden" data-testid="bio-age-card">
                <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]" style={{ background: "radial-gradient(circle at top right, #0F9F8F, transparent 70%)" }} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                  <div>
                    <p className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-[0.25em] mb-3">Overall Biological Age</p>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="font-mono text-5xl font-black text-teal-400">{bioAge.current_biological_age}</span>
                      <span className="font-mono text-lg text-stellar-dim">yrs</span>
                    </div>
                    <div className="flex items-center gap-5 mb-4">
                      <div><span className="font-mono text-[8px] text-stellar-dim/50 uppercase block">Chronological</span><span className="font-mono text-lg font-bold text-stellar">{bioAge.current_chronological_age}</span></div>
                      <ArrowRight size={14} className="text-stellar-dim" />
                      <div><span className="font-mono text-[8px] text-stellar-dim/50 uppercase block">Age Gap</span>
                        <span className="font-mono text-lg font-bold text-teal-400">
                          {bioAge.current_chronological_age - bioAge.current_biological_age > 0 ? "-" : "+"}{Math.abs(bioAge.current_chronological_age - bioAge.current_biological_age).toFixed(1)} yrs
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-1"><TrendingDown size={12} className="text-teal-400" /><span className="font-mono text-[9px] text-teal-400 uppercase tracking-wider">12-Month Projection</span></div>
                      <p className="font-body text-sm text-stellar">
                        Projected: <strong className="text-teal-400">{bioAge.projected_biological_age_12m} yrs</strong> (HPS {bioAge.projected_hps_12m}/1000)
                      </p>
                    </div>
                  </div>
                  <div className="h-56" data-testid="bio-age-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bioAge.trajectory}>
                        <defs>
                          <linearGradient id="bioG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F9F8F" stopOpacity={0.2} /><stop offset="100%" stopColor="#0F9F8F" stopOpacity={0} /></linearGradient>
                          <linearGradient id="chrG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#94A3B8" stopOpacity={0.1} /><stop offset="100%" stopColor="#94A3B8" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} domain={["dataMin - 2", "dataMax + 2"]} />
                        <Tooltip contentStyle={{ background: "#0F0A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px" }}
                          formatter={(val, name) => [val + " yrs", name === "biological_age" ? "Biological" : "Chronological"]} />
                        <Area type="monotone" dataKey="chronological_age" stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 4" fill="url(#chrG)" dot={false} />
                        <Area type="monotone" dataKey="biological_age" stroke="#0F9F8F" strokeWidth={2} fill="url(#bioG)" dot={{ fill: "#0F9F8F", r: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-4 mt-1">
                      <div className="flex items-center gap-1"><div className="w-4 h-[2px] bg-teal-400" /><span className="font-mono text-[7px] text-stellar-dim">Biological</span></div>
                      <div className="flex items-center gap-1"><div className="w-4 h-[2px]" style={{ borderTop: "1px dashed #94A3B8" }} /><span className="font-mono text-[7px] text-stellar-dim">Chronological</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organ Ages Grid */}
            {organAges?.organs?.length > 0 && (
              <div className="space-y-3" data-testid="organ-ages-section">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={16} className="text-cosmic" />
                    <h3 className="font-display text-base font-bold text-stellar">System Organ Ages</h3>
                  </div>
                  <span className="font-mono text-[8px] text-stellar-dim">vs chrono: {organAges.chronological_age} yrs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {organAges.organs.map(organ => (
                    <OrganCard key={organ.organ} organ={organ} onAddTest={addTestToCart} cartIds={cartIds} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═════════ TAB 3: INTERVENTIONS ═════════ */}
          <TabsContent value="interventions" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-cosmic" />
              <h3 className="font-display text-base font-bold text-stellar">Interventions by Pillar</h3>
              <span className="font-mono text-[8px] text-stellar-dim ml-auto">{Object.values(interventions).flat().length} total</span>
            </div>

            {Object.entries(PILLAR_META).map(([code, meta]) => {
              const pillarIvs = interventions[code] || [];
              if (pillarIvs.length === 0) return null;
              const Icon = meta.icon;
              const mustDo = pillarIvs.filter(iv => iv.priority === "must_do");
              const goodToDo = pillarIvs.filter(iv => iv.priority === "good_to_do");
              const isExpanded = expandedPillars[code] !== false;
              return (
                <div key={code} className="glass-premium rounded-2xl overflow-hidden" data-testid={`pillar-interventions-${code}`}>
                  <button onClick={() => togglePillar(code)} className="w-full flex items-center gap-3 p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + "12", border: `1px solid ${meta.color}25` }}>
                      <Icon size={18} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-display text-sm font-bold text-stellar">{meta.name}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-mono text-[8px] text-red-400">{mustDo.length} must-do</span>
                        <span className="font-mono text-[8px] text-amber-400">{goodToDo.length} good-to-do</span>
                        <span className="font-mono text-[8px] text-stellar-dim">{pillarIvs.reduce((s, iv) => s + (iv.credits || 0), 0)} credits</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-stellar-dim" /> : <ChevronRight size={16} className="text-stellar-dim" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-2">
                      {mustDo.length > 0 && (
                        <>
                          <p className="font-mono text-[8px] text-red-400 uppercase tracking-[0.2em] pt-1">Must Do</p>
                          {mustDo.map(iv => <InterventionCard key={iv.id} iv={iv} inCart={cartIds.has(iv.id)} onToggleCart={toggleCart} />)}
                        </>
                      )}
                      {goodToDo.length > 0 && (
                        <>
                          <p className="font-mono text-[8px] text-amber-400 uppercase tracking-[0.2em] pt-2">Good To Do</p>
                          {goodToDo.map(iv => <InterventionCard key={iv.id} iv={iv} inCart={cartIds.has(iv.id)} onToggleCart={toggleCart} />)}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          {/* ═════════ TAB 4: LONGEVITY ROADMAP (Clinician-Approved) ═════════ */}
          <TabsContent value="longevity" className="space-y-5 mt-4">
            <div className="flex items-center gap-2 mb-2" data-testid="longevity-roadmap-section">
              <ShieldCheck size={16} className="text-emerald-400" />
              <h3 className="font-display text-base font-bold text-stellar">Clinician-Approved Longevity Protocols</h3>
              <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{approvedProtocols.length} Active</Badge>
            </div>
            <p className="font-body text-xs text-stellar-dim">These protocols have been reviewed and approved by your healthcare provider as part of your personalized longevity program.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {approvedProtocols.map(p => (
                <div key={p.id} className="glass-premium rounded-xl p-5 border-l-2 border-emerald-500" data-testid={`approved-proto-${p.lgp_id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{p.lgp_id}</Badge>
                    <Badge className="font-mono text-[8px] bg-white/5 text-slate-300 border-white/10">{p.category}</Badge>
                  </div>
                  <p className="font-display text-sm font-bold text-stellar mb-1">{p.protocol_name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-stellar-dim mb-2">
                    <span className="flex items-center gap-1"><Clock size={10} /> {p.duration_weeks} weeks</span>
                    <span>Approved {new Date(p.approved_at).toLocaleDateString()}</span>
                  </div>
                  {p.assigned_coach_name && (
                    <div className="flex items-center gap-1 text-[10px] text-cosmic">
                      <Stethoscope size={10} /> Coach: {p.assigned_coach_name}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: p.status === "completed" ? "100%" : p.status === "active" ? "35%" : "5%" }} />
                    </div>
                    <Badge className={`text-[7px] ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : p.status === "completed" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
