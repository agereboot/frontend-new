import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, Heart, Pill, FlaskConical, BookOpen, Activity,
  AlertTriangle, CheckCircle, Plus, Send, Calendar, Stethoscope,
  ChevronDown, ChevronRight, Search, TrendingUp, TrendingDown,
  Minus, XCircle, Loader2, Scan, Shield, Brain, Moon, Flame,
  Users, Clock, Eye, Upload, Thermometer, ClipboardList,
  Cigarette, Wine, Dumbbell, Baby, History, HeartPulse,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
/* ─── Vitals config ─── */
const VITALS_CFG = [
  { key: "bp_sys", label: "BP Sys", unit: "mmHg", min: 60, max: 250, nLo: 90, nHi: 130 },
  { key: "bp_dia", label: "BP Dia", unit: "mmHg", min: 30, max: 150, nLo: 60, nHi: 85 },
  { key: "hr", label: "Heart Rate", unit: "bpm", min: 30, max: 220, nLo: 60, nHi: 100 },
  { key: "temp", label: "Temp", unit: "°F", min: 95, max: 107, nLo: 97.8, nHi: 99.5 },
  { key: "rr", label: "Resp Rate", unit: "/min", min: 8, max: 40, nLo: 12, nHi: 20 },
  { key: "spo2", label: "SpO2", unit: "%", min: 50, max: 100, nLo: 95, nHi: 100 },
  { key: "weight", label: "Weight", unit: "kg", min: 20, max: 300, nLo: 40, nHi: 150 },
  { key: "height", label: "Height", unit: "cm", min: 50, max: 250, nLo: 140, nHi: 210 },
];
const PILLAR_ICONS = { BR: Shield, PF: Activity, CA: Brain, SR: Moon, BL: Flame };
const STATUS_COLORS = { active: "text-red-400 bg-red-500/10 border-red-500/20", managed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", declining: "text-amber-400 bg-amber-500/10 border-amber-500/20" };

export default function SmartEMRPage() {
  const { memberId } = useParams();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hpsProfile, setHpsProfile] = useState(null);
  const [hpsDelta, setHpsDelta] = useState(null);
  const [medHistory, setMedHistory] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [cdssSuggestions, setCdss] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [smartProtos, setSmartProtos] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [carePlan, setCarePlan] = useState(null);
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [approving, setApproving] = useState(false);

  // Drug & Diagnostics search
  const [drugQuery, setDrugQuery] = useState("");
  const [drugResults, setDrugResults] = useState([]);
  const [drugSearching, setDrugSearching] = useState(false);
  const drugTimer = useRef(null);
  const [dxQuery, setDxQuery] = useState("");
  const [dxResults, setDxResults] = useState([]);
  const [dxSearching, setDxSearching] = useState(false);
  const [dxCategory, setDxCategory] = useState("");
  const dxTimer = useRef(null);
  const [vitalsErrors, setVitalsErrors] = useState({});

  // Encounter form
  const [enc, setEnc] = useState({
    chief_complaint: "", subjective: "", objective: "", assessment: "", plan: "",
    vitals: {}, lab_orders: [], pharmacy_orders: [],
    protocol_assignments: [], diagnostics_orders: [], prescriptions: [],
    follow_up_days: 0,
  });
  const [rxForm, setRxForm] = useState({
    drug_name: "", generic_name: "", dosage_form: "", route: "", dose: "",
    frequency: "", timing: "", with_food: "", duration_days: 30, special_instructions: "",
  });

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, sRes, hRes, dRes, mhRes, vhRes, cdRes, spRes, cRes, cpRes, rrRes] = await Promise.all([
        api.get(`/cc/members/${memberId}`),
        api.get(`/emr/member/${memberId}/visit-summary`),
        api.get(`/emr/member/${memberId}/hps-profile`),
        api.get(`/emr/member/${memberId}/hps-delta`),
        api.get(`/emr/member/${memberId}/medical-history`),
        api.get(`/emr/member/${memberId}/vitals-history?limit=5`),
        api.get(`/emr/member/${memberId}/cdss-suggestions`),
        api.get(`/emr/member/${memberId}/smart-protocols`),
        api.get("/emr/hcp-coaches"),
        api.get(`/emr/member/${memberId}/care-plan`),
        api.get(`/emr/member/${memberId}/longevity-roadmap`),
      ]);
      setMember(mRes.data.member || mRes.data);
      setSummary(sRes.data);
      setHpsProfile(hRes.data);
      setHpsDelta(dRes.data);
      setMedHistory(mhRes.data);
      setVitalsHistory(vhRes.data.readings || []);
      setCdss(cdRes.data);
      setSmartProtos(spRes.data.protocols || []);
      setCoaches(cRes.data.coaches || []);
      setCarePlan(cpRes.data.care_plan);
      setRoadmapItems(rrRes.data.roadmap_items || []);
      if (appointmentId) {
        try {
          const aRes = await api.get(`/emr/appointments/${appointmentId}`);
          setAppointment(aRes.data);
          if (aRes.data.reason) setEnc(p => ({ ...p, chief_complaint: aRes.data.reason }));
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  }, [memberId, appointmentId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Drug search debounced
  const searchDrugs = (q) => {
    setDrugQuery(q);
    if (drugTimer.current) clearTimeout(drugTimer.current);
    if (q.length < 3) { setDrugResults([]); return; }
    drugTimer.current = setTimeout(async () => {
      setDrugSearching(true);
      try { const r = await api.get(`/emr/drugs/search?q=${encodeURIComponent(q)}`); setDrugResults(r.data.drugs || []); } catch {} finally { setDrugSearching(false); }
    }, 400);
  };

  // Diagnostics search debounced
  const searchDx = (q) => {
    setDxQuery(q);
    if (dxTimer.current) clearTimeout(dxTimer.current);
    if (q.length < 2 && !dxCategory) { setDxResults([]); return; }
    dxTimer.current = setTimeout(async () => {
      setDxSearching(true);
      try {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (dxCategory) p.set("category", dxCategory);
        const r = await api.get(`/emr/diagnostics/search?${p}`);
        setDxResults(r.data.diagnostics || []);
      } catch {} finally { setDxSearching(false); }
    }, 300);
  };
  useEffect(() => { if (dxCategory) searchDx(dxQuery); }, [dxCategory]);

  // Vitals validation
  const handleVital = (key, val) => {
    if (val !== "" && !/^\d*\.?\d*$/.test(val)) return;
    setEnc(p => ({ ...p, vitals: { ...p.vitals, [key]: val } }));
    const cfg = VITALS_CFG.find(v => v.key === key);
    if (!cfg || val === "") { setVitalsErrors(p => { const n = { ...p }; delete n[key]; return n; }); return; }
    const num = parseFloat(val);
    if (isNaN(num)) { setVitalsErrors(p => ({ ...p, [key]: "Must be a number" })); return; }
    if (num < cfg.min || num > cfg.max) { setVitalsErrors(p => ({ ...p, [key]: `Range: ${cfg.min}-${cfg.max}` })); return; }
    if (num < cfg.nLo || num > cfg.nHi) { setVitalsErrors(p => ({ ...p, [key]: "warn" })); return; }
    setVitalsErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const vitalStatus = (key) => {
    const err = vitalsErrors[key]; const val = enc.vitals[key];
    if (!val || val === "") return "empty";
    if (err === "warn") return "warn";
    if (err) return "error";
    return "ok";
  };

  // Prescription
  const selectDrug = (d) => {
    setRxForm(p => ({ ...p, drug_name: d.brand_name, generic_name: d.generic_name, dosage_form: d.dosage_form || "", route: d.route || "" }));
    setDrugQuery(""); setDrugResults([]);
  };
  const addRx = () => {
    if (!rxForm.drug_name || !rxForm.dose || !rxForm.frequency) { toast.error("Drug, dose, and frequency required"); return; }
    setEnc(p => ({ ...p, prescriptions: [...p.prescriptions, { ...rxForm }] }));
    setRxForm({ drug_name: "", generic_name: "", dosage_form: "", route: "", dose: "", frequency: "", timing: "", with_food: "", duration_days: 30, special_instructions: "" });
    toast.success("Rx added");
  };

  // Submit
  const submitEncounter = async () => {
    if (!enc.chief_complaint.trim()) { toast.error("Chief complaint required"); setActiveTab("notes"); return; }
    if (Object.entries(vitalsErrors).some(([, v]) => v && v !== "warn")) { toast.error("Fix vital errors first"); setActiveTab("vitals"); return; }
    setSubmitting(true);
    try {
      const payload = {
        appointment_id: appointmentId || "", member_id: memberId,
        encounter_type: appointment?.mode === "telehealth" ? "telehealth" : "office_visit",
        chief_complaint: enc.chief_complaint, subjective: enc.subjective, objective: enc.objective,
        assessment: enc.assessment, plan: enc.plan, vitals: enc.vitals,
        lab_orders: enc.lab_orders.map(lo => ({ panel_id: lo.panel_id, priority: lo.priority || "routine" })),
        pharmacy_orders: enc.pharmacy_orders.length > 0 ? [{ items: enc.pharmacy_orders.map(po => ({ item_id: po.item_id, quantity: po.quantity || 1 })), notes: "" }] : [],
        protocol_assignments: enc.protocol_assignments, protocol_ids: enc.protocol_assignments.map(pa => pa.protocol_id),
        diagnostics_orders: enc.diagnostics_orders, prescriptions: enc.prescriptions, referrals: [],
        follow_up_days: enc.follow_up_days,
      };
      const res = await api.post("/emr/encounters/smart", payload);
      const d = res.data;
      let msg = "Encounter saved";
      if (d.prescriptions_created?.length) msg += ` | ${d.prescriptions_created.length} Rx`;
      if (d.diagnostics_created?.length) msg += ` | ${d.diagnostics_created.length} Dx`;
      if (d.protocols_assigned?.length) msg += ` | ${d.protocols_assigned.length} protocols`;
      toast.success(msg);
      navigate("/hcp/appointments");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-14 h-14 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>;

  const hps = hpsProfile?.hps_score;
  const tier = hpsProfile?.tier;
  const pillars = hpsProfile?.pillars || {};
  const abnBm = hpsProfile?.abnormal_biomarkers || [];
  const allergies = medHistory?.allergies || [];
  const conditions = medHistory?.conditions || [];

  const TABS = [
    { key: "overview", label: "Overview", icon: Eye },
    { key: "vitals", label: "Vitals", icon: HeartPulse },
    { key: "history", label: "Medical History", icon: History },
    { key: "medications", label: "Medications", icon: Pill },
    { key: "labs", label: "Lab Results", icon: FlaskConical },
    { key: "notes", label: "Clinical Notes", icon: FileText },
    { key: "hps", label: "HPS Analysis", icon: Activity },
    { key: "diagnostics", label: "Diagnostics", icon: Scan },
    { key: "prescribe", label: "Prescription", icon: Pill },
    { key: "careplan", label: "Care Plan", icon: ClipboardList },
    { key: "longevity", label: "Longevity Protocols", icon: BookOpen },
  ];

  return (
    <div className="animate-in fade-in duration-300" data-testid="smart-emr-page">
      {/* ─── TOP BAR ─── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button data-testid="back-btn" onClick={() => navigate("/hcp/appointments")} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">{member?.name || "Patient"}</h1>
              <span className="text-xs text-slate-400">{member?.age}y &middot; {member?.sex === "M" ? "Male" : "Female"}</span>
              {hps && <Badge data-testid="hps-badge" className="text-[10px] font-semibold border" style={{ backgroundColor: `${tier?.color}15`, color: tier?.color, borderColor: `${tier?.color}40` }}>HPS {Math.round(hps)} &middot; {tier?.tier}</Badge>}
            </div>
            {appointment && <p className="text-[11px] text-slate-500 ml-0.5">{appointment.appointment_type} &middot; {appointment.mode} &middot; {new Date(appointment.scheduled_at).toLocaleString()}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[10px] bg-white/5 text-slate-400 border-white/10">Encounter #{enc.chief_complaint ? "Active" : "Draft"}</Badge>
          <Button data-testid="submit-encounter" onClick={submitEncounter} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm h-9 shadow-lg shadow-violet-600/20">
            <Send size={14} className="mr-1.5" /> {submitting ? "Saving..." : "Complete & Save"}
          </Button>
        </div>
      </div>

      {/* ─── ALLERGY BANNER ─── */}
      {allergies.length > 0 && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25" data-testid="allergy-banner">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span className="text-sm font-semibold text-red-400">Allergies:</span>
          {allergies.map((a, i) => (
            <Badge key={i} className="text-[10px] bg-red-500/15 text-red-300 border-red-500/30">{a.allergen} ({a.severity})</Badge>
          ))}
        </div>
      )}

      {/* ─── TABS ─── */}
      <div className="flex gap-0.5 mb-4 overflow-x-auto pb-1 border-b border-white/5">
        {TABS.map(t => {
          const cnt = t.key === "diagnostics" ? enc.diagnostics_orders.length : t.key === "prescribe" ? enc.prescriptions.length : t.key === "careplan" ? enc.protocol_assignments.length : t.key === "longevity" ? enc.protocol_assignments.length : 0;
          return (
            <button key={t.key} data-testid={`tab-${t.key}`} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
                activeTab === t.key ? "text-violet-400 border-violet-500 bg-violet-500/5" : "text-slate-500 border-transparent hover:text-white hover:bg-white/[0.02]"
              }`}>
              <t.icon size={14} /> {t.label}
              {cnt > 0 && <span className="ml-1 w-4.5 h-4.5 rounded-full bg-violet-500/20 text-violet-400 text-[9px] flex items-center justify-center">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-4" data-testid="overview-section">
          {/* Demographics & HPS Summary */}
          <div className="space-y-4">
            <Card title="Patient Demographics" icon={Users}>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Name" value={member?.name} />
                <InfoRow label="Age" value={`${member?.age} years`} />
                <InfoRow label="Sex" value={member?.sex === "M" ? "Male" : "Female"} />
                <InfoRow label="Occupation" value={medHistory?.personal_history?.occupation || "—"} />
              </div>
            </Card>

            <Card title="HPS Score Summary" icon={Activity} accent="violet">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ borderColor: tier?.color || "#8B5CF6", backgroundColor: `${tier?.color || "#8B5CF6"}10` }}>
                  <span className="text-lg font-bold" style={{ color: tier?.color || "#8B5CF6" }}>{hps ? Math.round(hps) : "—"}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{tier?.tier || "No Score"}</p>
                  {hpsDelta?.hps_delta != null && (
                    <p className={`text-xs font-medium flex items-center gap-1 ${hpsDelta.hps_delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {hpsDelta.hps_delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {hpsDelta.hps_delta > 0 ? "+" : ""}{hpsDelta.hps_delta} since last
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(pillars).map(([code, p]) => {
                  const PIcon = PILLAR_ICONS[code] || Shield;
                  return (
                    <div key={code} className="flex items-center gap-2">
                      <PIcon size={12} style={{ color: p.color }} className="shrink-0" />
                      <span className="text-[10px] text-slate-400 w-6 uppercase">{code}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.percentage || 0}%`, backgroundColor: p.color }} />
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: p.color }}>{Math.round(p.score)}/{p.max_points}</span>
                      {hpsDelta?.pillar_deltas?.[code] != null && (
                        <span className={`text-[9px] font-mono ${hpsDelta.pillar_deltas[code] >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {hpsDelta.pillar_deltas[code] > 0 ? "+" : ""}{hpsDelta.pillar_deltas[code]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Current Conditions & Vitals */}
          <div className="space-y-4">
            <Card title="Current Medical Conditions" icon={Heart}>
              {conditions.length > 0 ? conditions.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-500">Since {c.since} &middot; {c.notes}</p>
                  </div>
                  <Badge className={`text-[9px] border ${STATUS_COLORS[c.status] || STATUS_COLORS.active}`}>{c.status}</Badge>
                </div>
              )) : <p className="text-xs text-slate-500">No conditions recorded</p>}
            </Card>

            <Card title="Latest Vitals" icon={Thermometer} accent="emerald">
              {vitalsHistory.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {VITALS_CFG.map(v => {
                    const val = vitalsHistory[0]?.vitals?.[v.key];
                    const num = parseFloat(val);
                    const isAbnormal = !isNaN(num) && (num < v.nLo || num > v.nHi);
                    return (
                      <div key={v.key} className={`rounded-lg p-2 border ${isAbnormal ? "border-amber-500/20 bg-amber-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                        <p className="text-[9px] text-slate-500 uppercase">{v.label}</p>
                        <p className={`text-sm font-semibold ${isAbnormal ? "text-amber-400" : "text-white"}`}>{val || "—"}</p>
                        <p className="text-[8px] text-slate-600">{v.unit}</p>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-xs text-slate-500">No vitals recorded</p>}
              {vitalsHistory.length > 0 && <p className="text-[10px] text-slate-500 mt-2">Last: {new Date(vitalsHistory[0]?.recorded_at).toLocaleDateString()}</p>}
            </Card>
          </div>

          {/* Medications & Last Visit */}
          <div className="space-y-4">
            <Card title="Current Medications" icon={Pill} accent="teal">
              {summary?.medications?.length > 0 ? summary.medications.slice(0, 5).map((m, i) => (
                <div key={i} className="py-1.5 border-b border-white/5 last:border-0">
                  <p className="text-sm text-white">{m.name}</p>
                  <p className="text-[10px] text-slate-500">{m.dosage} &middot; {m.status}</p>
                </div>
              )) : <p className="text-xs text-slate-500">No medications</p>}
            </Card>

            {/* AgeReboot CDSS Alerts */}
            {cdssSuggestions?.alerts?.length > 0 && (
              <Card title="AgeReboot CDSS Alerts" icon={AlertTriangle} accent="amber">
                {cdssSuggestions.alerts.slice(0, 4).map((a, i) => (
                  <div key={i} className={`py-2 border-b border-white/5 last:border-0 flex items-start gap-2 ${a.level === "critical" ? "text-red-400" : "text-amber-400"}`}>
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <p className="text-xs">{a.message}</p>
                  </div>
                ))}
              </Card>
            )}

            {/* Last Visit */}
            {summary?.encounters?.length > 0 && (
              <Card title="Last Visit Summary" icon={FileText}>
                {(() => {
                  const last = summary.encounters[0];
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white">{last.encounter_type}</span>
                        <span className="text-[10px] text-slate-500">{new Date(last.created_at).toLocaleDateString()}</span>
                      </div>
                      {last.chief_complaint && <p className="text-xs text-slate-400">{last.chief_complaint}</p>}
                    </div>
                  );
                })()}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── VITALS TAB ─── */}
      {activeTab === "vitals" && (
        <div className="space-y-4" data-testid="vitals-section">
          {/* New Vitals Entry */}
          <Card title="Record Vitals" icon={Thermometer} accent="emerald">
            <div className="grid grid-cols-4 gap-3">
              {VITALS_CFG.map(v => {
                const st = vitalStatus(v.key);
                const bdr = st === "error" ? "border-red-500" : st === "warn" ? "border-amber-500" : st === "ok" ? "border-emerald-500" : "border-white/10";
                return (
                  <div key={v.key}>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">{v.label} <span className="text-slate-600">({v.unit})</span></label>
                    <div className="relative">
                      <input data-testid={`vital-${v.key}`} value={enc.vitals[v.key] || ""} onChange={e => handleVital(v.key, e.target.value)}
                        placeholder={`${v.nLo}-${v.nHi}`}
                        className={`w-full bg-black/30 border ${bdr} rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-slate-700 transition-colors`} />
                      {st === "ok" && <CheckCircle size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
                      {st === "warn" && <AlertTriangle size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500" />}
                      {st === "error" && <XCircle size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500" />}
                    </div>
                    {vitalsErrors[v.key] && vitalsErrors[v.key] !== "warn" && <p className="text-[10px] text-red-400 mt-0.5">{vitalsErrors[v.key]}</p>}
                    {st === "warn" && <p className="text-[10px] text-amber-400 mt-0.5">Outside normal ({v.nLo}-{v.nHi})</p>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Vitals History Log */}
          <Card title="Vitals History (Last 5 Readings)" icon={Clock}>
            {vitalsHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase text-[10px] border-b border-white/5">
                      <th className="pb-2 pr-3">Date</th>
                      {VITALS_CFG.map(v => <th key={v.key} className="pb-2 px-2 text-center">{v.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsHistory.map((r, i) => (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td className="py-2.5 pr-3 text-slate-400 text-[11px] whitespace-nowrap">{new Date(r.recorded_at).toLocaleDateString()}</td>
                        {VITALS_CFG.map(v => {
                          const val = r.vitals?.[v.key];
                          const num = parseFloat(val);
                          const isAbn = !isNaN(num) && (num < v.nLo || num > v.nHi);
                          // Trend vs previous
                          const prevR = vitalsHistory[i + 1];
                          const prevVal = prevR ? parseFloat(prevR.vitals?.[v.key]) : NaN;
                          const diff = !isNaN(num) && !isNaN(prevVal) ? num - prevVal : null;
                          return (
                            <td key={v.key} className="py-2.5 px-2 text-center">
                              <span className={`text-sm font-mono ${isAbn ? "text-amber-400 font-semibold" : "text-white"}`}>{val || "—"}</span>
                              {diff !== null && diff !== 0 && (
                                <span className={`text-[9px] ml-0.5 ${diff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                  {diff > 0 ? "+" : ""}{diff.toFixed(0)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-slate-500">No vitals history available</p>}
          </Card>
        </div>
      )}

      {/* ─── MEDICAL HISTORY TAB ─── */}
      {activeTab === "history" && (
        <div className="grid grid-cols-2 gap-4" data-testid="history-section">
          <Card title="Current Medical Conditions" icon={Heart}>
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-500">Since {c.since} &middot; {c.notes}</p>
                </div>
                <Badge className={`text-[9px] border ${STATUS_COLORS[c.status] || STATUS_COLORS.active}`}>{c.status}</Badge>
              </div>
            ))}
            {conditions.length === 0 && <p className="text-xs text-slate-500">None recorded</p>}
          </Card>

          <Card title="Family History" icon={Users}>
            {medHistory?.family_history?.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <p className="text-sm text-white">{f.condition}</p>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{f.relation}</p>
                  {f.age_onset && <p className="text-[10px] text-slate-500">Onset: {f.age_onset}y</p>}
                </div>
              </div>
            ))}
            {(!medHistory?.family_history || medHistory.family_history.length === 0) && <p className="text-xs text-slate-500">None recorded</p>}
          </Card>

          <Card title="Surgical History" icon={Stethoscope}>
            {medHistory?.surgical_history?.map((s, i) => (
              <div key={i} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-sm text-white">{s.procedure}</p>
                <p className="text-[10px] text-slate-500">{s.year} &middot; {s.notes}</p>
              </div>
            ))}
            {(!medHistory?.surgical_history || medHistory.surgical_history.length === 0) && <p className="text-xs text-slate-500">None recorded</p>}
          </Card>

          <Card title="Personal History" icon={ClipboardList}>
            {medHistory?.personal_history && (
              <div className="space-y-2.5">
                <PHRow icon={Cigarette} label="Smoking" value={
                  medHistory.personal_history.smoking?.status === "former"
                    ? `Former smoker (${medHistory.personal_history.smoking.pack_years} pack-years, quit ${medHistory.personal_history.smoking.quit_year})`
                    : medHistory.personal_history.smoking?.status === "current"
                    ? `Current smoker (${medHistory.personal_history.smoking.pack_years} pack-years)`
                    : medHistory.personal_history.smoking?.status || "Unknown"
                } status={medHistory.personal_history.smoking?.status === "current" ? "bad" : medHistory.personal_history.smoking?.status === "former" ? "warn" : "ok"} />
                <PHRow icon={Wine} label="Alcohol" value={
                  medHistory.personal_history.alcohol?.status === "social"
                    ? `Social (${medHistory.personal_history.alcohol.units_per_week} units/wk, ${medHistory.personal_history.alcohol.type})`
                    : medHistory.personal_history.alcohol?.status || "Unknown"
                } status={medHistory.personal_history.alcohol?.units_per_week > 14 ? "bad" : "ok"} />
                <PHRow icon={Dumbbell} label="Exercise" value={medHistory.personal_history.exercise || "Unknown"} />
                <PHRow icon={Activity} label="Diet" value={medHistory.personal_history.diet || "Unknown"} />
                <PHRow icon={Moon} label="Sleep" value={medHistory.personal_history.sleep || "Unknown"} />
                <PHRow icon={Brain} label="Stress" value={medHistory.personal_history.stress || "Unknown"} />
              </div>
            )}
          </Card>

          {/* Gynaec History */}
          {medHistory?.gynaec_history && (
            <Card title="Gynaecological History" icon={Baby}>
              <div className="grid grid-cols-2 gap-2">
                <InfoRow label="Menarche" value={`${medHistory.gynaec_history.menarche_age}y`} />
                <InfoRow label="Status" value={medHistory.gynaec_history.menstrual_status} />
                <InfoRow label="Pregnancies" value={medHistory.gynaec_history.pregnancies} />
                <InfoRow label="Live Births" value={medHistory.gynaec_history.live_births} />
                <InfoRow label="Last Pap Smear" value={medHistory.gynaec_history.pap_smear_last} />
                <InfoRow label="Last Mammogram" value={medHistory.gynaec_history.mammogram_last} />
              </div>
            </Card>
          )}

          {/* Abnormal Biomarker History */}
          <Card title={`Abnormal Biomarkers (${abnBm.length})`} icon={AlertTriangle} accent="red">
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {abnBm.map((bm, i) => (
                <div key={i} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${
                  bm.status === "abnormal" ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"
                }`}>
                  <span className="text-white">{bm.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold ${bm.status === "abnormal" ? "text-red-400" : "text-amber-400"}`}>{typeof bm.value === "number" ? bm.value.toFixed(1) : bm.value} {bm.unit}</span>
                    {bm.optimal_low != null && <span className="text-[9px] text-slate-500">(ref: {bm.optimal_low}-{bm.optimal_high})</span>}
                  </div>
                </div>
              ))}
              {abnBm.length === 0 && <p className="text-xs text-slate-500">All biomarkers within normal range</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ─── MEDICATIONS TAB ─── */}
      {activeTab === "medications" && (
        <div className="space-y-4" data-testid="medications-section">
          <Card title="Current Medications" icon={Pill} accent="emerald">
            {summary?.medications?.filter(m => m.status === "active").map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div><p className="text-sm text-white font-medium">{m.name}</p><p className="text-[10px] text-slate-500">{m.dosage}</p></div>
                <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
              </div>
            ))}
            {(!summary?.medications?.length) && <p className="text-xs text-slate-500">No current medications</p>}
          </Card>
          <Card title="Past Medications" icon={History}>
            {summary?.medications?.filter(m => m.status !== "active").map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div><p className="text-sm text-slate-300">{m.name}</p><p className="text-[10px] text-slate-500">{m.dosage}</p></div>
                <Badge className="text-[9px] bg-white/5 text-slate-400 border-white/10">{m.status}</Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ─── LAB RESULTS TAB ─── */}
      {activeTab === "labs" && (
        <div className="space-y-4" data-testid="labs-section">
          <Card title="Abnormal Biomarkers with Trend" icon={FlaskConical} accent="red">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 uppercase text-[10px] border-b border-white/5">
                    <th className="pb-2 pr-4">Biomarker</th><th className="pb-2 px-3">Current</th><th className="pb-2 px-3">Previous</th><th className="pb-2 px-3">Change</th><th className="pb-2 px-3">Unit</th><th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hpsDelta?.biomarker_changes?.filter(b => abnBm.some(a => a.code === b.code)).map((b, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      <td className="py-2.5 pr-4 text-white text-sm">{b.name}</td>
                      <td className="py-2.5 px-3 font-mono text-white">{b.current?.toFixed(1)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{b.previous?.toFixed(1) || "—"}</td>
                      <td className="py-2.5 px-3">
                        {b.change != null && (
                          <span className={`font-mono flex items-center gap-0.5 ${b.trend === "up" ? "text-red-400" : b.trend === "down" ? "text-emerald-400" : "text-slate-400"}`}>
                            {b.trend === "up" ? <TrendingUp size={11} /> : b.trend === "down" ? <TrendingDown size={11} /> : <Minus size={11} />}
                            {b.change > 0 ? "+" : ""}{b.change.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{b.unit}</td>
                      <td className="py-2.5">
                        <Badge className={`text-[9px] ${abnBm.find(a => a.code === b.code)?.status === "abnormal" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                          {abnBm.find(a => a.code === b.code)?.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!hpsDelta?.biomarker_changes || hpsDelta.biomarker_changes.filter(b => abnBm.some(a => a.code === b.code)).length === 0) && <p className="text-xs text-slate-500">No abnormal lab values</p>}
          </Card>

          {/* Lab Order History */}
          <Card title="Lab Order History" icon={FlaskConical}>
            {summary?.lab_orders?.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div><p className="text-sm text-white">{l.panel_name}</p><p className="text-[10px] text-slate-500">{l.ordered_at ? new Date(l.ordered_at).toLocaleDateString() : ""}</p></div>
                <Badge className={`text-[9px] ${l.status === "resulted" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>{l.status}</Badge>
              </div>
            ))}
            {(!summary?.lab_orders?.length) && <p className="text-xs text-slate-500">No lab orders</p>}
          </Card>
        </div>
      )}

      {/* ─── CLINICAL NOTES TAB ─── */}
      {activeTab === "notes" && (
        <div className="space-y-4" data-testid="notes-section">
          <Card title="Current Encounter Notes" icon={FileText} accent="blue">
            {[
              { key: "chief_complaint", label: "Chief Complaint", rows: 2, required: true },
              { key: "subjective", label: "Subjective", rows: 3 },
              { key: "objective", label: "Objective", rows: 3 },
              { key: "assessment", label: "Assessment / Diagnosis", rows: 3 },
              { key: "plan", label: "Plan", rows: 3 },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="text-[11px] text-slate-400 uppercase tracking-wide block mb-1.5 font-medium">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                <textarea data-testid={`soap-${f.key}`} value={enc[f.key]}
                  onChange={e => setEnc(p => ({ ...p, [f.key]: e.target.value }))}
                  rows={f.rows} placeholder={`Enter ${f.label.toLowerCase()}...`}
                  className={`w-full bg-black/30 border ${!enc[f.key] && f.required ? "border-red-500/30" : "border-white/10"} rounded-lg px-3.5 py-2.5 text-white text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none placeholder:text-slate-600`} />
              </div>
            ))}
          </Card>

          {/* Follow-up */}
          <Card title="Follow-up" icon={Calendar}>
            <div className="flex items-center gap-3">
              <AppSelect data-testid="follow-up-days" value={enc.follow_up_days} onChange={e => setEnc(p => ({ ...p, follow_up_days: parseInt(e.target.value) || 0 }))}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none">
                <AppSelectOption value="0">No follow-up</AppSelectOption>
                <AppSelectOption value="7">1 week</AppSelectOption><AppSelectOption value="14">2 weeks</AppSelectOption>
                <AppSelectOption value="30">1 month</AppSelectOption><AppSelectOption value="60">2 months</AppSelectOption><AppSelectOption value="90">3 months</AppSelectOption>
              </AppSelect>
              {enc.follow_up_days > 0 && <span className="text-xs text-violet-400">Auto-creates appointment in {enc.follow_up_days} days</span>}
            </div>
          </Card>

          {/* Past Encounters */}
          {summary?.encounters?.length > 0 && (
            <Card title="Previous Visit Notes" icon={History}>
              {summary.encounters.map((e, i) => (
                <CollapsibleNote key={i} encounter={e} />
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ─── HPS ANALYSIS TAB ─── */}
      {activeTab === "hps" && (
        <div className="grid grid-cols-2 gap-4" data-testid="hps-section">
          <Card title="AgeReboot CDSS Suggestions" icon={Brain} accent="violet">
            {cdssSuggestions?.diagnostics?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-violet-400 uppercase font-semibold mb-1.5">Recommended Diagnostics</p>
                {cdssSuggestions.diagnostics.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <Scan size={12} className="text-violet-400 mt-0.5 shrink-0" />
                    <div><p className="text-sm text-white">{d.name}</p><p className="text-[10px] text-slate-400">{d.reason}</p><p className="text-[9px] text-slate-500">{d.biomarker}: {d.value} {d.unit}</p></div>
                  </div>
                ))}
              </div>
            )}
            {cdssSuggestions?.prescriptions?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-emerald-400 uppercase font-semibold mb-1.5">Recommended Prescriptions</p>
                {cdssSuggestions.prescriptions.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <Pill size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div><p className="text-sm text-white">{r.drug} {r.dose}</p><p className="text-[10px] text-slate-400">{r.reason}</p></div>
                  </div>
                ))}
              </div>
            )}
            {cdssSuggestions?.lifestyle?.length > 0 && (
              <div>
                <p className="text-[10px] text-teal-400 uppercase font-semibold mb-1.5">Lifestyle Interventions</p>
                {cdssSuggestions.lifestyle.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
                    <Activity size={12} className="text-teal-400 mt-0.5 shrink-0" />
                    <div><p className="text-sm text-white">{l.recommendation}</p><p className="text-[9px] text-slate-500">Based on: {l.biomarker}</p></div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card title="Pillar Performance" icon={Activity} accent="violet">
              {Object.entries(pillars).map(([code, p]) => {
                const PIcon = PILLAR_ICONS[code] || Shield;
                return (
                  <div key={code} className="py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><PIcon size={14} style={{ color: p.color }} /><span className="text-sm text-white font-medium">{p.name}</span></div>
                      <span className="text-sm font-mono font-semibold" style={{ color: p.color }}>{Math.round(p.percentage || 0)}%</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.percentage || 0}%`, backgroundColor: p.color }} /></div>
                  </div>
                );
              })}
            </Card>
            <Card title="System Alerts" icon={AlertTriangle} accent="red">
              {cdssSuggestions?.alerts?.map((a, i) => (
                <div key={i} className={`py-2 border-b border-white/5 last:border-0 ${a.level === "critical" ? "text-red-400" : "text-amber-400"}`}>
                  <p className="text-xs">{a.message}</p>
                </div>
              ))}
              {(!cdssSuggestions?.alerts?.length) && <p className="text-xs text-emerald-400">No alerts - all pillars performing well</p>}
            </Card>
          </div>
        </div>
      )}

      {/* ─── DIAGNOSTICS TAB ─── */}
      {activeTab === "diagnostics" && (
        <div className="space-y-4" data-testid="diagnostics-section">
          <Card title="Order Diagnostics" icon={Scan} accent="cyan">
            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input data-testid="dx-search" value={dxQuery} onChange={e => searchDx(e.target.value)}
                  placeholder="Search diagnostics (ECG, 2D Echo, MRI, CBC, CT Scan...)"
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 placeholder:text-slate-600" />
                {dxSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 animate-spin" />}
              </div>
              <AppSelect data-testid="dx-category" value={dxCategory} onChange={e => setDxCategory(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none min-w-[160px]">
                <AppSelectOption value="">All Categories</AppSelectOption>
                <AppSelectOption value="Pathological Lab">Pathological Lab</AppSelectOption><AppSelectOption value="Radiology">Radiology</AppSelectOption>
                <AppSelectOption value="Cardiac">Cardiac</AppSelectOption><AppSelectOption value="Pulmonary">Pulmonary</AppSelectOption>
                <AppSelectOption value="Surgical Diagnostic">Surgical</AppSelectOption><AppSelectOption value="Ophthalmology">Ophthalmology</AppSelectOption>
                <AppSelectOption value="Neurology">Neurology</AppSelectOption><AppSelectOption value="Fitness Assessment">Fitness</AppSelectOption><AppSelectOption value="Genetic">Genetic</AppSelectOption>
              </AppSelect>
            </div>
            {enc.diagnostics_orders.length > 0 && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 mb-3 space-y-1.5">
                <span className="text-[10px] text-cyan-400 uppercase font-semibold">Ordered ({enc.diagnostics_orders.length})</span>
                {enc.diagnostics_orders.map((dx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[8px] bg-white/5 text-slate-400">{dx.category}</Badge>
                      <span className="text-sm text-white">{dx.name}</span>
                    </div>
                    <button onClick={() => setEnc(p => ({ ...p, diagnostics_orders: p.diagnostics_orders.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300"><XCircle size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto">
              {dxResults.map(dx => {
                const added = enc.diagnostics_orders.some(d => d.diagnostic_id === dx.id);
                return (
                  <button key={dx.id} data-testid={`dx-${dx.id}`} disabled={added}
                    onClick={() => setEnc(p => ({ ...p, diagnostics_orders: [...p.diagnostics_orders, { diagnostic_id: dx.id, name: dx.name, category: dx.category, notes: "", priority: "routine" }] }))}
                    className={`text-left rounded-lg border p-3 transition-all ${added ? "border-cyan-500/30 bg-cyan-500/10 opacity-60" : "border-white/5 bg-black/20 hover:bg-white/5"}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge className="text-[8px] bg-white/5 text-slate-400">{dx.subcategory}</Badge>
                      {added && <CheckCircle size={12} className="text-cyan-400 ml-auto" />}
                    </div>
                    <p className="text-sm text-white">{dx.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{dx.description}</p>
                  </button>
                );
              })}
            </div>
            {dxQuery.length >= 2 && dxResults.length === 0 && !dxSearching && <p className="text-center text-xs text-slate-500 py-4">No results for "{dxQuery}"</p>}
            {!dxQuery && !dxCategory && <p className="text-center text-xs text-slate-500 py-4">Search or select category to browse diagnostics</p>}
          </Card>
        </div>
      )}

      {/* ─── PRESCRIPTION TAB ─── */}
      {activeTab === "prescribe" && (
        <div className="space-y-4" data-testid="prescribe-section">
          {enc.prescriptions.length > 0 && (
            <Card title={`Prescriptions (${enc.prescriptions.length})`} icon={Pill} accent="emerald">
              {enc.prescriptions.map((rx, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Pill size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-sm text-white font-medium">{rx.drug_name}</span>
                      {rx.generic_name && <span className="text-[10px] text-slate-500">({rx.generic_name})</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 ml-6">{rx.dose} &middot; {rx.dosage_form} &middot; {rx.route} &middot; {rx.frequency} {rx.timing && `&middot; ${rx.timing}`} {rx.with_food && `&middot; ${rx.with_food}`} &middot; {rx.duration_days}d</p>
                  </div>
                  <button onClick={() => setEnc(p => ({ ...p, prescriptions: p.prescriptions.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300 ml-2"><XCircle size={16} /></button>
                </div>
              ))}
            </Card>
          )}
          <Card title="New Prescription" icon={Pill}>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input data-testid="drug-search" value={rxForm.drug_name || drugQuery}
                onChange={e => { setRxForm(p => ({ ...p, drug_name: e.target.value, generic_name: "" })); searchDrugs(e.target.value); }}
                placeholder="Search drug name (type 3+ letters)..."
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 placeholder:text-slate-600" />
              {drugSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />}
              {drugResults.length > 0 && drugQuery.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-[#0c0c14] border border-white/10 rounded-lg shadow-2xl max-h-[200px] overflow-y-auto">
                  {drugResults.map((d, i) => (
                    <button key={i} onClick={() => selectDrug(d)} data-testid={`drug-opt-${i}`}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 border-b border-white/[0.03] last:border-0">
                      <span className="text-sm text-white">{d.brand_name}</span>
                      {d.generic_name && <span className="text-[10px] text-slate-500 ml-2">({d.generic_name})</span>}
                      <p className="text-[10px] text-slate-600">{d.dosage_form} &middot; {d.route}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <SelectField testId="rx-form" label="Dosage Form" value={rxForm.dosage_form} onChange={v => setRxForm(p => ({ ...p, dosage_form: v }))}
                options={[["","Select..."],["TABLET","Tablet"],["CAPSULE","Capsule"],["SYRUP","Syrup"],["INJECTION","Injection"],["CREAM","Cream"],["DROPS","Drops"],["INHALER","Inhaler"],["PATCH","Patch"],["POWDER","Powder"]]} />
              <SelectField testId="rx-route" label="Route" value={rxForm.route} onChange={v => setRxForm(p => ({ ...p, route: v }))}
                options={[["","Select..."],["ORAL","Oral"],["SUBLINGUAL","Sublingual"],["TOPICAL","Topical"],["INTRAMUSCULAR","IM"],["INTRAVENOUS","IV"],["SUBCUTANEOUS","SC"],["INHALATION","Inhalation"],["TRANSDERMAL","Transdermal"]]} />
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Dose <span className="text-red-400">*</span></label>
                <input data-testid="rx-dose" value={rxForm.dose} onChange={e => setRxForm(p => ({ ...p, dose: e.target.value }))} placeholder="e.g. 500mg"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none placeholder:text-slate-600" />
              </div>
              <SelectField testId="rx-freq" label="Frequency *" value={rxForm.frequency} onChange={v => setRxForm(p => ({ ...p, frequency: v }))}
                options={[["","Select..."],["OD","Once Daily (OD)"],["BD","Twice Daily (BD)"],["TDS","Three Times (TDS)"],["QID","Four Times (QID)"],["QHS","At Bedtime"],["PRN","As Needed"],["WEEKLY","Weekly"],["STAT","Stat"]]} />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <SelectField testId="rx-timing" label="Timing" value={rxForm.timing} onChange={v => setRxForm(p => ({ ...p, timing: v }))}
                options={[["","Select..."],["Morning","Morning"],["Afternoon","Afternoon"],["Evening","Evening"],["Night","Night"],["Morning & Night","Morning & Night"]]} />
              <SelectField testId="rx-food" label="With Food" value={rxForm.with_food} onChange={v => setRxForm(p => ({ ...p, with_food: v }))}
                options={[["","Select..."],["Before Food","Before Food"],["After Food","After Food"],["With Food","With Food"],["Empty Stomach","Empty Stomach"],["Any","Regardless"]]} />
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Duration (days)</label>
                <input data-testid="rx-duration" type="number" value={rxForm.duration_days} onChange={e => setRxForm(p => ({ ...p, duration_days: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="flex items-end">
                <Button data-testid="add-rx" onClick={addRx} disabled={!rxForm.drug_name || !rxForm.dose || !rxForm.frequency}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm h-[38px]">
                  <Plus size={14} className="mr-1" /> Add Rx
                </Button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Special Instructions</label>
              <input data-testid="rx-instructions" value={rxForm.special_instructions} onChange={e => setRxForm(p => ({ ...p, special_instructions: e.target.value }))}
                placeholder="e.g. Avoid grapefruit, monitor blood glucose..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none placeholder:text-slate-600" />
            </div>
          </Card>
        </div>
      )}

      {/* ─── PROTOCOLS / CARE PLAN TAB ─── */}
      {/* ─── CARE PLAN TAB ─── */}
      {activeTab === "careplan" && (
        <div className="space-y-4" data-testid="careplan-section">
          {/* Active Care Plan */}
          <Card title="Active Care Plan" icon={ClipboardList} accent="violet">
            {carePlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-white font-medium">{carePlan.title}</p>
                    <p className="text-[10px] text-slate-500">Created by {carePlan.created_by_name} &middot; {new Date(carePlan.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{carePlan.status}</Badge>
                </div>
                {carePlan.protocols?.map((pp, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[8px] font-mono bg-violet-500/10 text-violet-400">{pp.lgp_id}</Badge>
                        <span className="text-sm text-white font-medium">{pp.protocol_name}</span>
                      </div>
                      <Badge className={`text-[8px] ${pp.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-400"}`}>{pp.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500">{pp.category}</p>
                    {pp.assigned_coach_name && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Users size={10} /> Coach: {pp.assigned_coach_name}</p>}
                    {pp.customized_goals?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {pp.customized_goals.map((g, gi) => (
                          <div key={gi} className="flex items-center gap-2 text-[10px]">
                            <div className={`w-3 h-3 rounded-full border ${g.status === "completed" ? "bg-emerald-500 border-emerald-500" : g.status === "in_progress" ? "bg-amber-500 border-amber-500" : "border-white/20"}`} />
                            <span className="text-slate-300">{g.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active care plan. Assign protocols below to create one.</p>
            )}
          </Card>

          {/* Assign Protocols to Care Plan */}
          <Card title="Assign to Care Plan" icon={Plus}>
            {enc.protocol_assignments.length > 0 && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 mb-3 space-y-1.5">
                <span className="text-[10px] text-violet-400 uppercase font-semibold">To be assigned ({enc.protocol_assignments.length})</span>
                {enc.protocol_assignments.map((pa, i) => {
                  const p = smartProtos.find(sp => sp.protocol_id === pa.protocol_id);
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-white">{p?.name}</span>
                        {pa.assigned_coach_name && <span className="text-[10px] text-slate-400 ml-2">Coach: {pa.assigned_coach_name}</span>}
                      </div>
                      <button onClick={() => setEnc(p => ({ ...p, protocol_assignments: p.protocol_assignments.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300"><XCircle size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-400 mb-3">{smartProtos.filter(p => p.recommended).length} protocols recommended based on HPS analysis</p>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {smartProtos.filter(p => p.recommended).map(p => {
                const isAdded = enc.protocol_assignments.some(pa => pa.protocol_id === p.protocol_id);
                return (
                  <div key={p.protocol_id} data-testid={`cp-proto-${p.lgp_id}`}
                    className={`rounded-lg border p-3 transition-all ${isAdded ? "border-violet-500/30 bg-violet-500/10" : "border-emerald-500/20 bg-emerald-500/[0.03]"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-[8px] font-mono bg-white/5 text-violet-400">{p.lgp_id}</Badge>
                      <Badge className="text-[8px]" style={{ backgroundColor: p.evidence_grade === "A" ? "rgba(16,185,129,0.1)" : "rgba(132,204,22,0.1)", color: p.evidence_grade === "A" ? "#10B981" : "#84CC16" }}>Grade {p.evidence_grade}</Badge>
                      {isAdded && <CheckCircle size={12} className="text-violet-400 ml-auto" />}
                    </div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[10px] text-slate-500 mb-1">{p.category} &middot; {p.duration_weeks}wk</p>
                    {p.reasons?.length > 0 && p.reasons.slice(0, 2).map((r, ri) => (
                      <p key={ri} className="text-[10px] text-emerald-400/80 flex items-center gap-1"><TrendingUp size={9} className="shrink-0" /> {r}</p>
                    ))}
                    {!isAdded ? (
                      <div className="flex gap-2 mt-2">
                        <AppSelect id={`cp-coach-${p.protocol_id}`} className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none">
                          <AppSelectOption value="">Assign coach...</AppSelectOption>
                          {coaches.map(c => <AppSelectOption key={c.id} value={c.id}>{c.name} ({c.role})</AppSelectOption>)}
                        </AppSelect>
                        <Button size="sm" data-testid={`add-cp-${p.lgp_id}`} onClick={() => {
                          const sel = document.getElementById(`cp-coach-${p.protocol_id}`);
                          const cId = sel?.value || "";
                          const coach = coaches.find(c => c.id === cId);
                          setEnc(prev => ({ ...prev, protocol_assignments: [...prev.protocol_assignments, { protocol_id: p.protocol_id, assigned_coach_id: cId, assigned_coach_name: coach?.name || "" }] }));
                        }} className="bg-violet-600 hover:bg-violet-700 text-white text-xs"><Plus size={12} className="mr-1" /> Add</Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setEnc(prev => ({ ...prev, protocol_assignments: prev.protocol_assignments.filter(pa => pa.protocol_id !== p.protocol_id) }))}
                        className="w-full mt-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs">Remove</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─── LONGEVITY PROTOCOLS TAB ─── */}
      {activeTab === "longevity" && (
        <div className="space-y-4" data-testid="longevity-section">
          {/* Approved Roadmap Items */}
          <Card title="Approved Longevity Protocols" icon={BookOpen} accent="emerald">
            {roadmapItems.length > 0 ? (
              <div className="space-y-2">
                {roadmapItems.map((ri, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400">{ri.lgp_id}</Badge>
                        <span className="text-sm text-white font-medium">{ri.protocol_name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{ri.category} &middot; {ri.duration_weeks}wk &middot; Approved by {ri.approved_by_name}</p>
                      {ri.assigned_coach_name && <p className="text-[10px] text-slate-400"><Users size={10} className="inline mr-1" />Coach: {ri.assigned_coach_name}</p>}
                    </div>
                    <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{ri.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No approved longevity protocols yet. Review and approve protocols below to push them to the member's roadmap.</p>
            )}
          </Card>

          {/* Review & Approve Protocols */}
          <Card title="Review & Approve for Longevity Roadmap" icon={Shield}>
            <p className="text-xs text-slate-400 mb-3">Select protocols to approve. Approved protocols will appear in the member's Longevity Roadmap in their portal.</p>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {smartProtos.filter(p => p.recommended).map(p => {
                const alreadyApproved = roadmapItems.some(ri => ri.protocol_id === p.protocol_id);
                const inPlan = carePlan?.protocols?.some(pp => pp.protocol_id === p.protocol_id);
                return (
                  <div key={p.protocol_id} data-testid={`lr-proto-${p.lgp_id}`}
                    className={`rounded-lg border p-3 transition-all ${alreadyApproved ? "border-emerald-500/30 bg-emerald-500/10 opacity-60" : "border-white/5 bg-black/20 hover:bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-[8px] font-mono bg-white/5 text-violet-400">{p.lgp_id}</Badge>
                      {inPlan && <Badge className="text-[8px] bg-violet-500/10 text-violet-400">In Care Plan</Badge>}
                      {alreadyApproved && <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400">Approved</Badge>}
                    </div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[10px] text-slate-500 mb-1">{p.category} &middot; {p.duration_weeks}wk</p>
                    {p.reasons?.slice(0, 2).map((r, ri) => (
                      <p key={ri} className="text-[10px] text-emerald-400/70"><TrendingUp size={9} className="inline mr-0.5" />{r}</p>
                    ))}
                    {!alreadyApproved && (
                      <div className="flex gap-2 mt-2">
                        <AppSelect id={`lr-coach-${p.protocol_id}`} className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none">
                          <AppSelectOption value="">Assign coach...</AppSelectOption>
                          {coaches.map(c => <AppSelectOption key={c.id} value={c.id}>{c.name} ({c.role})</AppSelectOption>)}
                        </AppSelect>
                        <Button size="sm" data-testid={`approve-${p.lgp_id}`} disabled={approving}
                          onClick={async () => {
                            setApproving(true);
                            try {
                              const sel = document.getElementById(`lr-coach-${p.protocol_id}`);
                              const cId = sel?.value || "";
                              const coach = coaches.find(c => c.id === cId);
                              const res = await api.post(`/emr/member/${memberId}/longevity-roadmap/approve`, {
                                protocol_ids: [p.protocol_id],
                                coach_assignments: { [p.protocol_id]: { coach_id: cId, coach_name: coach?.name || "" } },
                              });
                              setRoadmapItems(prev => [...(res.data.approved || []), ...prev]);
                              toast.success(`${p.name} approved for longevity roadmap`);
                            } catch { toast.error("Approval failed"); } finally { setApproving(false); }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                          <CheckCircle size={12} className="mr-1" /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Also show non-recommended for manual selection */}
          <Card title="All Protocols Library" icon={BookOpen}>
            <p className="text-xs text-slate-500 mb-2">Browse all protocols. Only recommended protocols have evidence-based triggers.</p>
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {smartProtos.filter(p => !p.recommended).map(p => {
                const alreadyApproved = roadmapItems.some(ri => ri.protocol_id === p.protocol_id);
                return (
                  <div key={p.protocol_id} className="rounded-lg border border-white/5 bg-black/20 p-2.5 opacity-70">
                    <Badge className="text-[7px] font-mono bg-white/5 text-slate-400 mb-1">{p.lgp_id}</Badge>
                    <p className="text-xs text-white">{p.name}</p>
                    <p className="text-[9px] text-slate-500">{p.category}</p>
                    {alreadyApproved && <Badge className="text-[7px] bg-emerald-500/10 text-emerald-400 mt-1">Approved</Badge>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─── SUMMARY FOOTER ─── */}
      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-4 py-3 flex items-center justify-between" data-testid="encounter-summary-bar">
        <div className="flex flex-wrap gap-2">
          {enc.chief_complaint && <Badge className="text-[10px] bg-white/5 text-white border-white/10">CC: {enc.chief_complaint.slice(0, 40)}</Badge>}
          {enc.diagnostics_orders.length > 0 && <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20"><Scan size={10} className="mr-1" />{enc.diagnostics_orders.length} Diagnostics</Badge>}
          {enc.prescriptions.length > 0 && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><Pill size={10} className="mr-1" />{enc.prescriptions.length} Rx</Badge>}
          {enc.protocol_assignments.length > 0 && <Badge className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20"><ClipboardList size={10} className="mr-1" />{enc.protocol_assignments.length} Care Plan</Badge>}
          {enc.follow_up_days > 0 && <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20"><Calendar size={10} className="mr-1" />F/U {enc.follow_up_days}d</Badge>}
        </div>
        <Button data-testid="submit-encounter-bottom" onClick={submitEncounter} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm h-9">
          <Send size={14} className="mr-1.5" /> {submitting ? "Saving..." : "Complete & Save"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Card({ title, icon: Icon, accent, children }) {
  const accentColors = { violet: "border-violet-500/15", emerald: "border-emerald-500/15", teal: "border-teal-500/15", cyan: "border-cyan-500/15", red: "border-red-500/15", amber: "border-amber-500/15", blue: "border-blue-500/15" };
  const iconColors = { violet: "text-violet-400", emerald: "text-emerald-400", teal: "text-teal-400", cyan: "text-cyan-400", red: "text-red-400", amber: "text-amber-400", blue: "text-blue-400" };
  return (
    <div className={`rounded-xl border bg-black/20 p-4 ${accent ? accentColors[accent] : "border-white/5"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={accent ? iconColors[accent] : "text-slate-400"} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}

function PHRow({ icon: Icon, label, value, status }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className={status === "bad" ? "text-red-400" : status === "warn" ? "text-amber-400" : "text-slate-400"} />
      <div>
        <p className="text-[10px] text-slate-500 uppercase">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

function SelectField({ testId, label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 uppercase block mb-1">{label}</label>
      <AppSelect data-testid={testId} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none">
        {options.map(([v, l]) => <AppSelectOption key={v} value={v}>{l}</AppSelectOption>)}
      </AppSelect>
    </div>
  );
}

function CollapsibleNote({ encounter }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2.5 text-left hover:bg-white/[0.02] transition-all">
        <div>
          <p className="text-sm text-white">{encounter.encounter_type} - {encounter.chief_complaint || "No CC"}</p>
          <p className="text-[10px] text-slate-500">{new Date(encounter.created_at).toLocaleDateString()}</p>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      {open && (
        <div className="pb-3 space-y-1.5 text-xs text-slate-300">
          {encounter.subjective && <p><span className="text-slate-500 uppercase text-[10px]">S: </span>{encounter.subjective}</p>}
          {encounter.objective && <p><span className="text-slate-500 uppercase text-[10px]">O: </span>{encounter.objective}</p>}
          {encounter.assessment && <p><span className="text-slate-500 uppercase text-[10px]">A: </span>{encounter.assessment}</p>}
          {encounter.plan && <p><span className="text-slate-500 uppercase text-[10px]">P: </span>{encounter.plan}</p>}
        </div>
      )}
    </div>
  );
}
