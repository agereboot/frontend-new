import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, ArrowUpDown, Snowflake,
  AlertTriangle, Clock, User,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const REASON_CODES = [
  { code: "lab_artifact", label: "Lab Artifact / Sample Error" },
  { code: "post_surgery", label: "Post-Surgery Recovery" },
  { code: "acute_illness", label: "Acute Illness / Infection" },
  { code: "medication_change", label: "Medication Change Period" },
  { code: "clinical_judgment", label: "Clinical Judgment" },
  { code: "data_error", label: "Data Entry Error" },
];

export default function HCPOverridePage() {
  const [members, setMembers] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("override");
  const [overrideForm, setOverrideForm] = useState({ member_id: "", new_value: "", reason_code: "", reason_text: "", dimension: "hps_final" });
  const [freezeForm, setFreezeForm] = useState({ member_id: "", freeze_days: 30, reason_code: "post_surgery", reason_text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/cc/members"),
      api.get("/cc/override/audit"),
    ]).then(([mRes, aRes]) => {
      setMembers(mRes.data.members);
      setAudits(aRes.data.audits);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const submitOverride = async () => {
    if (!overrideForm.member_id || !overrideForm.new_value || !overrideForm.reason_code) {
      toast.error("Fill all required fields"); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/cc/override", { ...overrideForm, new_value: parseFloat(overrideForm.new_value), override_type: "score_adjustment" });
      if (res.data.requires_dual_approval) {
        toast.warning("Override requires dual clinician approval (delta > 50 points)");
      } else {
        toast.success("HPS override applied successfully");
      }
      setOverrideForm({ member_id: "", new_value: "", reason_code: "", reason_text: "", dimension: "hps_final" });
      const aRes = await api.get("/cc/override/audit");
      setAudits(aRes.data.audits);
    } catch { toast.error("Override failed"); } finally { setSubmitting(false); }
  };

  const submitFreeze = async () => {
    if (!freezeForm.member_id || !freezeForm.reason_code) { toast.error("Fill all required fields"); return; }
    setSubmitting(true);
    try {
      await api.post("/cc/override/freeze", freezeForm);
      toast.success(`Score frozen for ${freezeForm.freeze_days} days`);
      setFreezeForm({ member_id: "", freeze_days: 30, reason_code: "post_surgery", reason_text: "" });
      const aRes = await api.get("/cc/override/audit");
      setAudits(aRes.data.audits);
    } catch { toast.error("Freeze failed"); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
  );

  const selectedMember = members.find(m => m.id === (tab === "override" ? overrideForm.member_id : freezeForm.member_id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-override-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            HPS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-400">Override & Audit</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Immutable Clinical Audit Trail</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-slate-500" />
          <span className="font-mono text-[9px] text-slate-500">All actions are permanently logged</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3" data-testid="override-tabs">
        {[
          { key: "override", label: "Score Override", icon: ArrowUpDown },
          { key: "freeze", label: "Score Freeze", icon: Snowflake },
          { key: "audit", label: `Audit Log (${audits.length})`, icon: ShieldCheck },
        ].map(({ key, label, icon: TIcon }) => (
          <button key={key} data-testid={`override-tab-${key}`} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-all border ${
              tab === key ? "bg-[#7B35D8]/10 border-[#7B35D8]/30 text-white" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
            }`}>
            <TIcon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-5">
          {tab === "override" && (
            <div className="rounded-xl border border-amber-500/20 bg-black/30 backdrop-blur-xl p-6" data-testid="override-form">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle size={16} className="text-amber-400" />
                <p className="font-display text-sm font-bold text-white">Score Adjustment</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">Member</label>
                  <AppSelect data-testid="override-member" value={overrideForm.member_id} onChange={e => setOverrideForm(prev => ({ ...prev, member_id: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body">
                    <AppSelectOption value="">Select member...</AppSelectOption>
                    {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name} (HPS: {Math.round(m.hps_score)})</AppSelectOption>)}
                  </AppSelect>
                </div>
                {selectedMember && (
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 flex items-center gap-3">
                    <User size={14} className="text-slate-400" />
                    <div>
                      <p className="font-body text-xs text-white">{selectedMember.name}</p>
                      <p className="font-mono text-[9px] text-slate-500">Current HPS: <span className="text-white font-bold">{Math.round(selectedMember.hps_score)}</span></p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">New HPS Value (0-1000)</label>
                  <input data-testid="override-value" type="number" min="0" max="1000" value={overrideForm.new_value} onChange={e => setOverrideForm(prev => ({ ...prev, new_value: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#7B35D8] focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">Reason Code</label>
                  <AppSelect data-testid="override-reason" value={overrideForm.reason_code} onChange={e => setOverrideForm(prev => ({ ...prev, reason_code: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body">
                    <AppSelectOption value="">Select reason...</AppSelectOption>
                    {REASON_CODES.map(r => <AppSelectOption key={r.code} value={r.code}>{r.label}</AppSelectOption>)}
                  </AppSelect>
                </div>
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">Clinical Justification</label>
                  <textarea data-testid="override-text" rows={3} value={overrideForm.reason_text} onChange={e => setOverrideForm(prev => ({ ...prev, reason_text: e.target.value }))}
                    placeholder="Provide clinical reasoning for this override..."
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body resize-none placeholder:text-slate-600" />
                </div>
                <Button data-testid="override-submit" onClick={submitOverride} disabled={submitting}
                  className="w-full bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 font-body font-semibold">
                  <ArrowUpDown size={16} className="mr-2" /> {submitting ? "Processing..." : "Apply Override"}
                </Button>
              </div>
            </div>
          )}

          {tab === "freeze" && (
            <div className="rounded-xl border border-blue-500/20 bg-black/30 backdrop-blur-xl p-6" data-testid="freeze-form">
              <div className="flex items-center gap-2 mb-5">
                <Snowflake size={16} className="text-blue-400" />
                <p className="font-display text-sm font-bold text-white">Score Freeze</p>
              </div>
              <p className="font-body text-xs text-slate-400 mb-4">Temporarily freeze a member's HPS score to prevent recalculation during recovery, medication changes, or acute illness periods.</p>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">Member</label>
                  <AppSelect data-testid="freeze-member" value={freezeForm.member_id} onChange={e => setFreezeForm(prev => ({ ...prev, member_id: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body">
                    <AppSelectOption value="">Select member...</AppSelectOption>
                    {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
                  </AppSelect>
                </div>
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">Freeze Duration (days)</label>
                  <AppSelect data-testid="freeze-days" value={freezeForm.freeze_days} onChange={e => setFreezeForm(prev => ({ ...prev, freeze_days: parseInt(e.target.value) }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-mono">
                    {[7, 14, 30, 60, 90].map(d => <AppSelectOption key={d} value={d}>{d} days</AppSelectOption>)}
                  </AppSelect>
                </div>
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mb-1.5 block">Reason</label>
                  <AppSelect data-testid="freeze-reason" value={freezeForm.reason_code} onChange={e => setFreezeForm(prev => ({ ...prev, reason_code: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body">
                    {REASON_CODES.map(r => <AppSelectOption key={r.code} value={r.code}>{r.label}</AppSelectOption>)}
                  </AppSelect>
                </div>
                <textarea data-testid="freeze-notes" rows={2} value={freezeForm.reason_text} onChange={e => setFreezeForm(prev => ({ ...prev, reason_text: e.target.value }))}
                  placeholder="Additional notes..." className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body resize-none placeholder:text-slate-600" />
                <Button data-testid="freeze-submit" onClick={submitFreeze} disabled={submitting}
                  className="w-full bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 font-body font-semibold">
                  <Snowflake size={16} className="mr-2" /> {submitting ? "Processing..." : "Freeze Score"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="audit-log">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-[#7B35D8]" />
              <h3 className="font-display text-sm font-bold text-white">Audit Trail</h3>
              <Badge className="font-mono text-[8px] bg-white/5 text-slate-300 border border-white/10 ml-auto">{audits.length} entries</Badge>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {audits.length > 0 ? audits.map(a => {
                const isFreeze = a.override_type === "score_freeze";
                return (
                  <div key={a.id} data-testid={`audit-${a.id}`} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isFreeze ? <Snowflake size={12} className="text-blue-400" /> : <ArrowUpDown size={12} className="text-amber-400" />}
                      <span className="font-body text-sm font-medium text-white">{a.member_name}</span>
                      <Badge className={`font-mono text-[7px] ${isFreeze ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                        {isFreeze ? "Score Freeze" : "Override"}
                      </Badge>
                      {a.requires_dual_approval && !a.approved && (
                        <Badge className="font-mono text-[7px] bg-red-500/10 text-red-400 border-red-500/20">Pending Approval</Badge>
                      )}
                      <span className="font-mono text-[8px] text-slate-500 ml-auto flex items-center gap-1">
                        <Clock size={9} /> {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {isFreeze ? (
                        <span className="font-mono text-slate-300">Frozen for <span className="text-blue-400 font-bold">{a.freeze_days} days</span></span>
                      ) : (
                        <span className="font-mono text-slate-300">
                          <span className="text-slate-500">{a.old_value}</span>
                          <span className="text-slate-600 mx-1">&rarr;</span>
                          <span className="text-white font-bold">{a.new_value}</span>
                          {a.old_value != null && (
                            <span className={`ml-2 ${a.new_value > a.old_value ? "text-emerald-400" : "text-red-400"}`}>
                              ({a.new_value > a.old_value ? "+" : ""}{Math.round(a.new_value - a.old_value)})
                            </span>
                          )}
                        </span>
                      )}
                      <Badge className="font-mono text-[7px] bg-white/5 text-slate-400 border-white/10">{a.reason_code}</Badge>
                      <span className="font-mono text-[8px] text-slate-500">by {a.clinician_name}</span>
                    </div>
                    {a.reason_text && <p className="font-body text-[11px] text-slate-400 mt-1.5">{a.reason_text}</p>}
                  </div>
                );
              }) : <p className="text-slate-500 font-mono text-xs text-center py-8">No audit entries yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
