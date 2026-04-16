import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowUpRight, Send, Clock, CheckCircle2,
  ShieldAlert, Loader2, User, ChevronDown, ChevronUp,
  MessageSquare, FileText, X,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const SEV_META = {
  critical: { color: "#FF0055", bg: "#FF005512", label: "Critical", sla: "2h" },
  high: { color: "#EF4444", bg: "#EF444412", label: "High", sla: "8h" },
  medium: { color: "#F59E0B", bg: "#F59E0B12", label: "Medium", sla: "24h" },
  low: { color: "#6366F1", bg: "#6366F112", label: "Low", sla: "72h" },
};
const STATUS_META = {
  pending: { color: "#F59E0B", label: "Pending" },
  acknowledged: { color: "#6366F1", label: "Acknowledged" },
  resolved: { color: "#10B981", label: "Resolved" },
};
const CATEGORIES = [
  { value: "deteriorating_hps", label: "Deteriorating HPS Score" },
  { value: "critical_biomarker", label: "Critical Biomarker Result" },
  { value: "mental_health_crisis", label: "Mental Health Crisis" },
  { value: "non_adherence", label: "Prolonged Non-Adherence" },
  { value: "new_symptom", label: "New Symptom / Complaint" },
  { value: "medication_concern", label: "Medication Concern" },
  { value: "urgent_clinical_review", label: "Urgent Clinical Review" },
  { value: "other", label: "Other" },
];

export default function EscalationsPage() {
  const { user } = useAuth();
  const isPhysician = ["longevity_physician", "clinician", "medical_director", "corporate_hr_admin", "corporate_wellness_head"].includes(user?.role);
  const isCorporate = ["corporate_hr_admin", "corporate_wellness_head"].includes(user?.role);
  const [escalations, setEscalations] = useState([]);
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [responseForm, setResponseForm] = useState({ response: "", notes: "", action_taken: "", status: "acknowledged" });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    member_id: "", severity: "medium", category: "deteriorating_hps",
    clinical_summary: "", deteriorating_metrics: "",
    interventions_tried: "", recommended_action: "", supporting_data: "",
  });

  const loadData = () => {
    const endpoint = isPhysician ? "/coach-v2/escalations/received" : "/coach-v2/escalations/sent";
    Promise.all([
      api.get(endpoint).then(r => setEscalations(r.data.escalations || [])),
      api.get("/coach-v2/escalations/stats").then(r => setStats(r.data)),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(loadData, [isPhysician]);

  const createEscalation = async () => {
    if (!form.member_id || !form.clinical_summary) {
      toast.error("Member and clinical summary required");
      return;
    }
    setSaving(true);
    const member = members.find(m => m.id === form.member_id);
    try {
      const res = await api.post("/coach-v2/escalations", {
        ...form,
        member_name: member?.name,
        deteriorating_metrics: form.deteriorating_metrics.split(",").map(s => s.trim()).filter(Boolean),
        interventions_tried: form.interventions_tried.split(",").map(s => s.trim()).filter(Boolean),
      });
      setEscalations(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ member_id: "", severity: "medium", category: "deteriorating_hps", clinical_summary: "", deteriorating_metrics: "", interventions_tried: "", recommended_action: "", supporting_data: "" });
      toast.success("Escalation sent to physician");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    setSaving(false);
  };

  const respondToEscalation = async (escId) => {
    setSaving(true);
    try {
      await api.put(`/coach-v2/escalations/${escId}/respond`, responseForm);
      loadData();
      setRespondingId(null);
      toast.success("Response recorded");
    } catch { toast.error("Failed"); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="escalations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {isCorporate ? "Organization " : isPhysician ? "Incoming " : ""}<span className="text-red-400">Escalations</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">
            {isCorporate ? "ORGANIZATION-WIDE COACH ESCALATION OVERVIEW" : isPhysician ? "COACH-TO-PHYSICIAN CLINICAL HANDOFF QUEUE" : "ESCALATE MEMBERS TO SUPERVISING PHYSICIAN"}
          </p>
        </div>
        {!isPhysician && (
          <Button data-testid="new-escalation" onClick={() => setShowForm(!showForm)}
            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs">
            <ArrowUpRight size={14} className="mr-1" /> Escalate to Physician
          </Button>
        )}
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-5 gap-3" data-testid="escalation-stats">
          {[
            { label: "Total", value: stats.total, color: "#64748B" },
            { label: "Pending", value: stats.pending, color: "#F59E0B" },
            { label: "Acknowledged", value: stats.acknowledged, color: "#6366F1" },
            { label: "Resolved", value: stats.resolved, color: "#10B981" },
            { label: "Critical Pending", value: stats.critical_pending, color: "#FF0055" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
              <p className="font-mono text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Escalation Form (Coach) */}
      {showForm && !isPhysician && (
        <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-5 space-y-4" data-testid="escalation-form">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={16} className="text-red-400" />
            <h3 className="font-display text-sm font-bold text-white">Escalation Handoff Note</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <AppSelect data-testid="esc-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none">
              <AppSelectOption value="">Select member</AppSelectOption>
              {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
            </AppSelect>
            <AppSelect data-testid="esc-severity" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none">
              {Object.entries(SEV_META).map(([k, v]) => <AppSelectOption key={k} value={k}>{v.label} (SLA: {v.sla})</AppSelectOption>)}
            </AppSelect>
            <AppSelect data-testid="esc-category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none">
              {CATEGORIES.map(c => <AppSelectOption key={c.value} value={c.value}>{c.label}</AppSelectOption>)}
            </AppSelect>
          </div>

          <div>
            <label className="font-mono text-[9px] text-red-400 block mb-1">Clinical Summary *</label>
            <textarea data-testid="esc-summary" value={form.clinical_summary} onChange={e => setForm(p => ({ ...p, clinical_summary: e.target.value }))}
              placeholder="Describe the clinical concern, what you've observed, and why escalation is needed..."
              rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Deteriorating Metrics (comma-separated)</label>
              <input data-testid="esc-metrics" value={form.deteriorating_metrics} onChange={e => setForm(p => ({ ...p, deteriorating_metrics: e.target.value }))}
                placeholder="e.g., HPS dropped 15%, PHQ-9 increased to 18, Sleep score 40"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Interventions Already Tried (comma-separated)</label>
              <input data-testid="esc-interventions" value={form.interventions_tried} onChange={e => setForm(p => ({ ...p, interventions_tried: e.target.value }))}
                placeholder="e.g., CBT sessions, Sleep hygiene protocol, Increased frequency"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Recommended Action</label>
              <input value={form.recommended_action} onChange={e => setForm(p => ({ ...p, recommended_action: e.target.value }))}
                placeholder="e.g., Medication review, Specialist referral, Lab panel reorder"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Supporting Data</label>
              <input value={form.supporting_data} onChange={e => setForm(p => ({ ...p, supporting_data: e.target.value }))}
                placeholder="e.g., Latest assessment scores, biomarker values, wearable data"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="submit-escalation" onClick={createEscalation} disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white text-xs">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} className="mr-1" /> Send Escalation</>}
            </Button>
          </div>
        </div>
      )}

      {/* Escalation List */}
      <div className="space-y-3">
        {escalations.map(esc => {
          const sev = SEV_META[esc.severity] || SEV_META.medium;
          const st = STATUS_META[esc.status] || STATUS_META.pending;
          const isExpanded = expandedId === esc.id;
          const isResponding = respondingId === esc.id;
          const handoff = esc.handoff_note || {};

          return (
            <div key={esc.id} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid={`esc-${esc.id}`}>
              {/* Header */}
              <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-all"
                onClick={() => setExpandedId(isExpanded ? null : esc.id)}>
                <div className="w-2.5 h-10 rounded-full shrink-0" style={{ backgroundColor: sev.color, boxShadow: `0 0 12px ${sev.color}40` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.color}30` }}>{sev.label}</Badge>
                    <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{CATEGORIES.find(c => c.value === esc.category)?.label || esc.category}</Badge>
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: st.color + "15", color: st.color }}>{st.label}</Badge>
                  </div>
                  <p className="font-body text-sm text-white">{handoff.clinical_summary?.slice(0, 100) || "No summary"}{(handoff.clinical_summary?.length || 0) > 100 ? "..." : ""}</p>
                  <div className="flex items-center gap-3 mt-0.5 font-mono text-[8px] text-slate-500">
                    <span><User size={10} className="inline mr-0.5" />{esc.member_name}</span>
                    <span>From: {esc.coach_name} ({esc.coach_role?.replace("_", " ")})</span>
                    <span>To: {esc.physician_name}</span>
                    {esc.member_hps_score && <span>HPS: {esc.member_hps_score} ({esc.member_hps_tier})</span>}
                    <span><Clock size={10} className="inline mr-0.5" />{new Date(esc.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-mono text-[8px] text-slate-500">SLA: {esc.sla_hours}h</p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {/* Handoff Note Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {handoff.clinical_summary && (
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="font-mono text-[8px] text-red-400 uppercase mb-1">Clinical Summary</p>
                        <p className="font-body text-xs text-slate-300">{handoff.clinical_summary}</p>
                      </div>
                    )}
                    {handoff.recommended_action && (
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="font-mono text-[8px] text-amber-400 uppercase mb-1">Recommended Action</p>
                        <p className="font-body text-xs text-slate-300">{handoff.recommended_action}</p>
                      </div>
                    )}
                  </div>

                  {(handoff.deteriorating_metrics?.length > 0 || handoff.interventions_tried?.length > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                      {handoff.deteriorating_metrics?.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                          <p className="font-mono text-[8px] text-red-400 uppercase mb-1">Deteriorating Metrics</p>
                          <div className="flex flex-wrap gap-1">{handoff.deteriorating_metrics.map((m, i) => (
                            <Badge key={i} className="font-mono text-[7px] bg-red-500/10 text-red-400 border-red-500/20">{m}</Badge>
                          ))}</div>
                        </div>
                      )}
                      {handoff.interventions_tried?.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                          <p className="font-mono text-[8px] text-blue-400 uppercase mb-1">Interventions Tried</p>
                          <div className="flex flex-wrap gap-1">{handoff.interventions_tried.map((m, i) => (
                            <Badge key={i} className="font-mono text-[7px] bg-blue-500/10 text-blue-400 border-blue-500/20">{m}</Badge>
                          ))}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Physician Response (if exists) */}
                  {esc.physician_response && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="font-mono text-[8px] text-emerald-400 uppercase mb-1">Physician Response — {esc.responded_by_name}</p>
                      <p className="font-body text-xs text-slate-300">{esc.physician_response}</p>
                      {esc.physician_action_taken && <p className="font-mono text-[8px] text-slate-400 mt-1">Action: {esc.physician_action_taken}</p>}
                      {esc.physician_notes && <p className="font-mono text-[8px] text-slate-500 mt-0.5">Notes: {esc.physician_notes}</p>}
                    </div>
                  )}

                  {/* Physician Response Form */}
                  {isPhysician && esc.status !== "resolved" && (
                    <>
                      {isResponding ? (
                        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3" data-testid="respond-form">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-indigo-400" />
                            <h4 className="font-display text-xs font-bold text-white">Respond to Escalation</h4>
                          </div>
                          <textarea data-testid="resp-text" value={responseForm.response} onChange={e => setResponseForm(p => ({ ...p, response: e.target.value }))}
                            placeholder="Your clinical response to the coach..." rows={2}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />
                          <div className="grid grid-cols-2 gap-3">
                            <input value={responseForm.action_taken} onChange={e => setResponseForm(p => ({ ...p, action_taken: e.target.value }))}
                              placeholder="Action taken (e.g., Ordered labs, Adjusted medication)"
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none" />
                            <AppSelect value={responseForm.status} onChange={e => setResponseForm(p => ({ ...p, status: e.target.value }))}
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none">
                              <AppSelectOption value="acknowledged">Acknowledge</AppSelectOption>
                              <AppSelectOption value="resolved">Resolve</AppSelectOption>
                            </AppSelect>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setRespondingId(null)} className="text-[10px] border-white/10 text-slate-300">Cancel</Button>
                            <Button data-testid="submit-response" size="sm" onClick={() => respondToEscalation(esc.id)} disabled={saving}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px]">
                              {saving ? <Loader2 size={12} className="animate-spin" /> : "Submit Response"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button data-testid={`respond-${esc.id}`} onClick={() => { setRespondingId(esc.id); setResponseForm({ response: "", notes: "", action_taken: "", status: "acknowledged" }); }}
                          className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs">
                          <MessageSquare size={14} className="mr-1" /> Respond
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {escalations.length === 0 && (
          <div className="text-center py-16">
            <ShieldAlert size={40} className="text-red-400/20 mx-auto mb-3" />
            <p className="font-body text-sm text-slate-500">{isPhysician ? "No pending escalations from coaches" : "No escalations sent. Use this to flag urgent member concerns to the physician."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
