import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Activity, Heart, Zap, Brain, Moon, Shield,
  Bell, BookOpen, CalendarClock, MessageSquare, Send,
  TrendingUp, TrendingDown, Minus, ShieldCheck, Clock,
  ClipboardList, Target, CheckCircle2, Circle, Play, Pause, Plus,
  AlertTriangle, Lightbulb, Dna, ArrowRight, FileText,
  Download, Loader2, Watch, Stethoscope, Pill, FlaskConical,
  HeartPulse, Footprints, BedDouble,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, Legend } from "recharts";

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
const STATUS_COLORS = { at_risk: "#EF4444", borderline: "#F59E0B", optimal: "#10B981", normal: "#6366F1" };

export default function PatientProfilePage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  // Biomarkers
  const [bioAnalytics, setBioAnalytics] = useState(null);
  // Medical History
  const [medHistory, setMedHistory] = useState(null);
  // Wearables
  const [wearables, setWearables] = useState(null);
  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxForm, setRxForm] = useState({ diagnosis: "", medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }], notes: "", follow_up: "" });
  const [rxSaving, setRxSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  // Messaging
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/cc/members/${memberId}`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [memberId]);

  const loadBiomarkers = () => {
    if (!bioAnalytics) api.get(`/patient/${memberId}/biomarker-analytics`).then(r => setBioAnalytics(r.data)).catch(() => {});
  };
  const loadMedHistory = () => {
    if (!medHistory) api.get(`/patient/${memberId}/medical-history`).then(r => setMedHistory(r.data.history)).catch(() => {});
  };
  const loadWearables = () => {
    if (!wearables) api.get(`/patient/${memberId}/wearables`).then(r => setWearables(r.data)).catch(() => {});
  };
  const loadPrescriptions = () => {
    api.get(`/patient/prescriptions/${memberId}`).then(r => setPrescriptions(r.data.prescriptions || [])).catch(() => {});
  };
  const loadMessages = () => {
    api.get(`/patient/messaging/${memberId}`).then(r => setMessages(r.data.messages || [])).catch(() => {});
  };

  useEffect(() => {
    if (tab === "biomarkers") loadBiomarkers();
    if (tab === "medical") loadMedHistory();
    if (tab === "wearables") loadWearables();
    if (tab === "prescriptions") loadPrescriptions();
    if (tab === "messages") loadMessages();
  }, [tab]);

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      const res = await api.post("/patient/messaging/send", { recipient_id: memberId, content: msgText });
      setMessages(prev => [...prev, res.data]);
      setMsgText("");
      toast.success("Message sent");
    } catch { toast.error("Failed to send"); } finally { setSending(false); }
  };

  const savePrescription = async () => {
    if (!rxForm.medications[0]?.name) { toast.error("Add at least one medication"); return; }
    setRxSaving(true);
    try {
      const res = await api.post("/patient/prescriptions", {
        member_id: memberId,
        member_name: data?.member?.name,
        member_age: data?.member?.age,
        member_sex: data?.member?.sex,
        ...rxForm,
      });
      setPrescriptions(prev => [res.data, ...prev]);
      setShowRxForm(false);
      setRxForm({ diagnosis: "", medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }], notes: "", follow_up: "" });
      toast.success("Prescription created");
    } catch { toast.error("Failed to create prescription"); }
    setRxSaving(false);
  };

  const downloadPdf = async (rxId) => {
    setPdfLoading(rxId);
    try {
      const res = await api.get(`/patient/prescriptions/${rxId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `prescription_${rxId.slice(0, 8)}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch { toast.error("PDF download failed"); }
    setPdfLoading(null);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center p-20">Member not found.</div>;

  const { member, hps, hps_history, biomarkers, alerts, sessions, overrides } = data;
  const pillars = hps?.pillars || {};
  const tier = hps?.tier || "UNKNOWN";
  const hpsScore = Math.round(hps?.hps_final || 0);

  const TABS = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "biomarkers", label: "Biomarkers", icon: FlaskConical },
    { key: "medical", label: "Medical Records", icon: Stethoscope },
    // { key: "wearables", label: "Wearables", icon: Watch },
    // { key: "prescriptions", label: "Prescriptions", icon: Pill },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "alerts", label: `Alerts (${alerts?.length || 0})`, icon: Bell },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="patient-profile-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button data-testid="profile-back" onClick={() => navigate("/hcp/members")}
          className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-white">{member.name}</h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] uppercase">
            {member.age}y &middot; {member.sex} &middot; {member.franchise || "N/A"} &middot; Patient Health Profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button data-testid="open-emr-btn" onClick={() => navigate(`/hcp/smart-emr/${memberId}`)} className="bg-[#7B35D8]/10 text-[#7B35D8] border border-[#7B35D8]/20 hover:bg-[#7B35D8]/20 text-xs">
            <Stethoscope size={14} className="mr-1" /> Open EMR
          </Button>
          <div className="text-right">
            <p className="font-mono text-3xl font-black" style={{ color: TIER_COLORS[tier] }}>{hpsScore}</p>
            <Badge className="font-mono text-[8px]" style={{ backgroundColor: TIER_COLORS[tier] + "15", color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}30` }}>{tier}</Badge>
          </div>
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-5 gap-3" data-testid="profile-pillars">
        {Object.entries(PILLAR_META).map(([code, meta]) => {
          const pillarData = pillars[code];
          const score = Math.round(typeof pillarData === "object" ? pillarData?.score || 0 : pillarData || 0);
          const Icon = meta.icon;
          return (
            <div key={code} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-3 text-center">
              <Icon size={16} style={{ color: meta.color }} className="mx-auto mb-1.5" />
              <p className="font-mono text-lg font-black text-white">{score}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase tracking-wider mt-0.5">{meta.name}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/5 pb-px overflow-x-auto" data-testid="profile-tabs">
        {TABS.map(({ key, label, icon: TIcon }) => (
          <button key={key} data-testid={`tab-${key}`} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 font-body text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
              tab === key ? "border-[#7B35D8] text-white" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <TIcon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="hps-trend-chart">
              <h3 className="font-display text-sm font-bold text-white mb-3">HPS Score Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hps_history?.map(h => ({ date: h.timestamp?.slice(5, 10) || "", score: Math.round(h.hps_final) })) || []}>
                    <defs>
                      <linearGradient id="hpsGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7B35D8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7B35D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 1000]} tick={{ fill: "#64748B", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "10px" }} />
                    <Area type="monotone" dataKey="score" stroke="#7B35D8" strokeWidth={2} fill="url(#hpsGrad2)" dot={{ fill: "#7B35D8", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="profile-quick-info">
            <h3 className="font-display text-sm font-bold text-white mb-4">Quick Info</h3>
            <div className="space-y-3">
              {[
                ["Open Alerts", alerts?.filter(a => a.status === "open").length || 0],
                ["Biomarkers Tracked", biomarkers?.length || 0],
                ["Total Sessions", sessions?.length || 0],
                ["Algorithm", hps?.algorithm_version || "N/A"],
                ["Email", member.email || "N/A"],
                ["Phone", member.phone || "N/A"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
                  <span className="font-mono text-xs font-bold text-white truncate max-w-[140px]">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BIOMARKERS TAB ═══ */}
      {tab === "biomarkers" && (
        <div className="space-y-4" data-testid="biomarkers-tab">
          {bioAnalytics ? (
            <>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Tracked", value: bioAnalytics.summary.total, color: "#7B35D8" },
                  { label: "Optimal", value: bioAnalytics.summary.optimal, color: "#10B981" },
                  { label: "Borderline", value: bioAnalytics.summary.borderline, color: "#F59E0B" },
                  { label: "At Risk", value: bioAnalytics.summary.at_risk, color: "#EF4444" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                    <p className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-mono text-[8px] text-slate-500 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {bioAnalytics.analytics.map(bm => (
                  <div key={bm.code} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`bio-${bm.code}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[bm.status] }} />
                        <span className="font-display text-sm font-bold text-white">{bm.name}</span>
                        <Badge className="font-mono text-[7px] bg-white/5 text-slate-400">{bm.domain}</Badge>
                        <Badge className="font-mono text-[7px]" style={{ backgroundColor: STATUS_COLORS[bm.status] + "15", color: STATUS_COLORS[bm.status] }}>
                          {bm.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-lg font-black text-white">{typeof bm.latest_value === "number" ? bm.latest_value.toFixed(1) : bm.latest_value}</span>
                        <span className="font-mono text-[9px] text-slate-500 ml-1">{bm.unit}</span>
                      </div>
                    </div>
                    {/* Range bar */}
                    {bm.optimal_range && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-mono text-[7px] text-slate-600">Optimal: {bm.optimal_range[0]}-{bm.optimal_range[1]} {bm.unit}</span>
                          {bm.standard_range && <span className="font-mono text-[7px] text-slate-600">Standard: {bm.standard_range[0]}-{bm.standard_range[1]}</span>}
                        </div>
                      </div>
                    )}
                    {/* Trend chart */}
                    {bm.trend.length > 1 && (
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={bm.trend}>
                            <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={35} domain={["auto", "auto"]} />
                            <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                            {bm.optimal_range && (
                              <>
                                <Area type="monotone" dataKey={() => bm.optimal_range[1]} stroke="none" fill="#10B981" fillOpacity={0.05} />
                                <Area type="monotone" dataKey={() => bm.optimal_range[0]} stroke="none" fill="#050217" fillOpacity={1} />
                              </>
                            )}
                            <Line type="monotone" dataKey="value" stroke={STATUS_COLORS[bm.status]} strokeWidth={2} dot={{ fill: STATUS_COLORS[bm.status], r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-[#7B35D8]" size={24} /></div>}
        </div>
      )}

      {/* ═══ MEDICAL RECORDS TAB ═══ */}
      {tab === "medical" && (
        <div className="space-y-4" data-testid="medical-tab">
          {medHistory ? (
            <>
              {/* Conditions */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Stethoscope size={14} className="text-[#7B35D8]" /> Active Conditions
                </h3>
                <div className="space-y-2">
                  {(medHistory.conditions || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]" data-testid={`condition-${i}`}>
                      <Badge className={`font-mono text-[7px] ${c.status === "active" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>{c.status}</Badge>
                      <span className="font-body text-xs text-white flex-1">{c.name}</span>
                      <span className="font-mono text-[8px] text-slate-500">Since {c.since}</span>
                    </div>
                  ))}
                  {!medHistory.conditions?.length && <p className="text-slate-500 text-xs text-center py-4">No conditions recorded</p>}
                </div>
              </div>

              {/* Allergies */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" /> Allergies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(medHistory.allergies || []).map((a, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                      <Badge className={`font-mono text-[7px] ${a.severity === "moderate" || a.severity === "severe" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{a.severity}</Badge>
                      <div>
                        <p className="font-body text-xs text-white">{a.allergen}</p>
                        <p className="font-mono text-[8px] text-slate-500">{a.reaction}</p>
                      </div>
                    </div>
                  ))}
                  {!medHistory.allergies?.length && <p className="text-slate-500 text-xs text-center py-4 col-span-2">No allergies recorded</p>}
                </div>
              </div>

              {/* Family History */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Dna size={14} className="text-indigo-400" /> Family History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(medHistory.family_history || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <span className="font-mono text-[10px] text-indigo-400">{(f.relation || "?")[0]}</span>
                      </div>
                      <div>
                        <p className="font-body text-xs text-white">{f.condition}</p>
                        <p className="font-mono text-[8px] text-slate-500">{f.relation} &middot; Onset age {f.age_onset}</p>
                      </div>
                    </div>
                  ))}
                  {!medHistory.family_history?.length && <p className="text-slate-500 text-xs text-center py-4 col-span-2">No family history recorded</p>}
                </div>
              </div>

              {/* Surgical History */}
              {medHistory.surgical_history?.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <h3 className="font-display text-sm font-bold text-white mb-3">Surgical History</h3>
                  <div className="space-y-2">
                    {medHistory.surgical_history.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                        <span className="font-mono text-xs text-white">{s.procedure}</span>
                        <span className="font-mono text-[8px] text-slate-500 ml-auto">{s.year} &middot; {s.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal / Lifestyle */}
              {medHistory.personal_history && Object.keys(medHistory.personal_history).length > 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <h3 className="font-display text-sm font-bold text-white mb-3">Lifestyle & Personal History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(medHistory.personal_history).filter(([k]) => typeof medHistory.personal_history[k] !== "object").map(([k, v]) => (
                      <div key={k} className="flex justify-between items-start p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                        <span className="font-mono text-[9px] text-slate-400 uppercase">{k.replace(/_/g, " ")}</span>
                        <span className="font-body text-xs text-white text-right max-w-[60%]">{typeof v === "string" ? v : JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-[#7B35D8]" size={24} /></div>}
        </div>
      )}

      {/* ═══ WEARABLES TAB ═══ */}
      {/* {tab === "wearables" && (
        <div className="space-y-4" data-testid="wearables-tab">
          {wearables ? (
            <>
         
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Resting HR", value: wearables.summary?.avg_resting_hr, unit: "bpm", icon: HeartPulse, color: "#EF4444" },
                  { label: "HRV", value: wearables.summary?.avg_hrv, unit: "ms", icon: Activity, color: "#6366F1" },
                  { label: "Avg Steps", value: wearables.summary?.avg_steps?.toLocaleString(), unit: "", icon: Footprints, color: "#10B981" },
                  { label: "Sleep Score", value: wearables.summary?.avg_sleep_score, unit: "/100", icon: BedDouble, color: "#7B35D8" },
                  { label: "Recovery", value: wearables.summary?.avg_recovery, unit: "%", icon: Zap, color: "#0F9F8F" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                    <s.icon size={16} style={{ color: s.color }} className="mx-auto mb-1.5" />
                    <p className="font-mono text-xl font-black text-white">{s.value || "N/A"}<span className="text-xs text-slate-500 ml-0.5">{s.unit}</span></p>
                    <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

      
              {wearables.daily?.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <h3 className="font-display text-sm font-bold text-white mb-3">Heart Rate & HRV Trend</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={wearables.daily}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Line type="monotone" dataKey="resting_hr" name="HR" stroke="#EF4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="hrv" name="HRV" stroke="#6366F1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {wearables.daily?.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <h3 className="font-display text-sm font-bold text-white mb-3">Daily Steps & Active Calories</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wearables.daily}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="steps" name="Steps" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

           
              {wearables.daily?.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <h3 className="font-display text-sm font-bold text-white mb-3">Sleep & Recovery</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={wearables.daily}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Line type="monotone" dataKey="sleep_score" name="Sleep" stroke="#7B35D8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="recovery_score" name="Recovery" stroke="#0F9F8F" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          ) : <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-[#7B35D8]" size={24} /></div>}
        </div>
      )} */}

{/*     
      {tab === "prescriptions" && (
        <div className="space-y-4" data-testid="prescriptions-tab">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Prescriptions</h3>
            <Button data-testid="new-rx-btn" onClick={() => setShowRxForm(!showRxForm)} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white text-xs">
              <Plus size={14} className="mr-1" /> New Prescription
            </Button>
          </div>

          {showRxForm && (
            <div className="rounded-xl border border-[#7B35D8]/20 bg-black/30 p-5 space-y-4" data-testid="rx-form">
              <div>
                <label className="font-mono text-[9px] text-slate-400 block mb-1">Diagnosis</label>
                <input data-testid="rx-diagnosis" value={rxForm.diagnosis} onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none" placeholder="Primary diagnosis" />
              </div>

              <div>
                <label className="font-mono text-[9px] text-slate-400 block mb-2">Medications</label>
                {rxForm.medications.map((med, mi) => (
                  <div key={mi} className="grid grid-cols-5 gap-2 mb-2" data-testid={`med-row-${mi}`}>
                    <input placeholder="Medication" value={med.name} onChange={e => { const meds = [...rxForm.medications]; meds[mi].name = e.target.value; setRxForm(p => ({ ...p, medications: meds })); }}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none" />
                    <input placeholder="Dosage" value={med.dosage} onChange={e => { const meds = [...rxForm.medications]; meds[mi].dosage = e.target.value; setRxForm(p => ({ ...p, medications: meds })); }}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none" />
                    <input placeholder="Frequency" value={med.frequency} onChange={e => { const meds = [...rxForm.medications]; meds[mi].frequency = e.target.value; setRxForm(p => ({ ...p, medications: meds })); }}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none" />
                    <input placeholder="Duration" value={med.duration} onChange={e => { const meds = [...rxForm.medications]; meds[mi].duration = e.target.value; setRxForm(p => ({ ...p, medications: meds })); }}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none" />
                    <input placeholder="Instructions" value={med.instructions} onChange={e => { const meds = [...rxForm.medications]; meds[mi].instructions = e.target.value; setRxForm(p => ({ ...p, medications: meds })); }}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none" />
                  </div>
                ))}
                <button data-testid="add-med-row" onClick={() => setRxForm(p => ({ ...p, medications: [...p.medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }] }))}
                  className="font-mono text-[10px] text-[#7B35D8] hover:text-white transition-colors">+ Add medication</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] text-slate-400 block mb-1">Notes</label>
                  <textarea data-testid="rx-notes" value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#7B35D8] focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="font-mono text-[9px] text-slate-400 block mb-1">Follow-up</label>
                  <input data-testid="rx-followup" value={rxForm.follow_up} onChange={e => setRxForm(p => ({ ...p, follow_up: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#7B35D8] focus:outline-none" placeholder="e.g., Review in 2 weeks" />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRxForm(false)} className="border-white/10 text-slate-300 text-xs">Cancel</Button>
                <Button data-testid="save-rx" onClick={savePrescription} disabled={rxSaving} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white text-xs">
                  {rxSaving ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} className="mr-1" /> Save & Generate</>}
                </Button>
              </div>
            </div>
          )}

  
          <div className="space-y-2">
            {prescriptions.map(rx => (
              <div key={rx.id} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`rx-${rx.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-body text-sm font-medium text-white">{rx.diagnosis || "Prescription"}</p>
                    <p className="font-mono text-[8px] text-slate-500">{rx.medications?.length || 0} medications &middot; By {rx.prescribed_by_name} &middot; {new Date(rx.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button data-testid={`pdf-${rx.id}`} size="sm" onClick={() => downloadPdf(rx.id)} disabled={pdfLoading === rx.id}
                    className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] h-7 px-2">
                    {pdfLoading === rx.id ? <Loader2 size={12} className="animate-spin" /> : <><Download size={12} className="mr-1" /> PDF</>}
                  </Button>
                </div>
                <div className="space-y-1">
                  {(rx.medications || []).map((m, i) => (
                    <div key={i} className="flex items-center gap-3 font-mono text-[9px] text-slate-400">
                      <span className="text-white">{i + 1}.</span>
                      <span className="text-white">{m.name}</span>
                      <span>{m.dosage}</span>
                      <span>{m.frequency}</span>
                      <span>{m.duration}</span>
                    </div>
                  ))}
                </div>
                {rx.follow_up && <p className="font-mono text-[8px] text-slate-500 mt-2">Follow-up: {rx.follow_up}</p>}
              </div>
            ))}
            {prescriptions.length === 0 && !showRxForm && (
              <p className="text-slate-500 text-sm text-center py-8">No prescriptions yet. Create one to get started.</p>
            )}
          </div>
        </div>
      )} */}

      {/* ═══ MESSAGES TAB ═══ */}
      {tab === "messages" && (
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm" data-testid="messages-tab">
          <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
            {messages.length > 0 ? messages.map(m => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-xl p-3 ${isMe ? "bg-[#7B35D8]/15 border border-[#7B35D8]/20" : "bg-white/5 border border-white/5"}`}>
                    <p className="font-body text-sm text-white">{m.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-[7px] text-slate-500">{m.sender_name}</p>
                      <p className="font-mono text-[7px] text-slate-600">{m.sent_at ? new Date(m.sent_at).toLocaleString() : ""}</p>
                      {isMe && m.read && <span className="font-mono text-[6px] text-emerald-500">Read</span>}
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-slate-500 text-sm text-center py-8">No messages yet. Start a secure conversation.</p>}
          </div>
          <div className="p-4 border-t border-white/5 flex gap-3">
            <input data-testid="secure-msg-input" value={msgText} onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a secure message..." className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600" />
            <Button data-testid="secure-msg-send" onClick={sendMessage} disabled={sending || !msgText.trim()}
              className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white px-4">
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ ALERTS TAB ═══ */}
      {tab === "alerts" && (
        <div className="space-y-2" data-testid="alerts-tab">
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
    </div>
  );
}
