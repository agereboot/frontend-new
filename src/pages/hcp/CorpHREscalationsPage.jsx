import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertTriangle, Shield, Send, Users, X, Clock,
  CheckCircle, ChevronDown, ChevronRight, Eye, EyeOff,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TYPE_LABELS = {
  engagement_concern: "Engagement Concern", burnout_flag: "Burnout Flag",
  performance_wellness: "Performance & Wellness", absenteeism: "Absenteeism Pattern",
  policy_compliance: "Policy Compliance",
};
const SEVERITY_COLORS = { critical: "#EF4444", high: "#F97316", medium: "#D97706", low: "#64748B" };
const STATUS_COLORS = { open: "#EF4444", in_progress: "#D97706", resolved: "#10B981", dismissed: "#64748B" };
const PRIVACY_ICONS = { anonymized: EyeOff, identified: Eye };

export default function CorpHREscalationsPage() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    type: "engagement_concern", emp_name: "", department: "",
    manager_name: "", reason: "", recommended_action: "",
    privacy_level: "anonymized", severity: "medium",
  });

  useEffect(() => {
    api.get("/corporate/hr-escalations").then(r => setEscalations(r.data.escalations || [])).finally(() => setLoading(false));
  }, []);

  const createEscalation = async () => {
    if (!form.reason) return toast.error("Reason required");
    try {
      const { data } = await api.post("/corporate/hr-escalations", form);
      setEscalations(e => [data, ...e]);
      setShowCreate(false);
      setForm({ type: "engagement_concern", emp_name: "", department: "", manager_name: "", reason: "", recommended_action: "", privacy_level: "anonymized", severity: "medium" });
      toast.success("Escalation created");
    } catch { toast.error("Failed"); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/corporate/hr-escalations/${id}`, { status });
      setEscalations(e => e.map(x => x.id === id ? { ...x, status } : x));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  const stats = { open: 0, in_progress: 0, resolved: 0 };
  escalations.forEach(e => { stats[e.status] = (stats[e.status] || 0) + 1; });

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-hr-esc-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">HR <span className="text-red-400">Escalation Engine</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">NON-CLINICAL HR-TO-MANAGER ESCALATION PATHWAYS &bull; PRIVACY-SAFE</p>
        </div>
        <Button data-testid="create-hr-esc-btn" onClick={() => setShowCreate(true)} size="sm" className="bg-red-600 hover:bg-red-500 text-white text-xs gap-1"><AlertTriangle size={14} />New Escalation</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
            <p className="font-mono text-2xl font-black" style={{ color: STATUS_COLORS[k] }}>{v}</p>
            <p className="font-mono text-[7px] text-slate-500 uppercase capitalize">{k.replace("_", " ")}</p>
          </div>
        ))}
      </div>

      {/* Escalation List */}
      <div className="space-y-2" data-testid="hr-esc-list">
        {escalations.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-black/20 p-12 text-center">
            <Shield size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="font-body text-sm text-slate-400">No escalations. Create one to flag an HR concern.</p>
          </div>
        ) : escalations.map((esc, i) => {
          const isOpen = expanded === i;
          const PrivacyIcon = PRIVACY_ICONS[esc.privacy_level] || EyeOff;
          return (
            <div key={esc.id} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid={`hr-esc-${esc.id}`}>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[esc.severity] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-xs text-white">{TYPE_LABELS[esc.type] || esc.type}</p>
                    <Badge className="font-mono text-[6px]" style={{ backgroundColor: STATUS_COLORS[esc.status] + "15", color: STATUS_COLORS[esc.status] }}>{esc.status}</Badge>
                    <Badge className="font-mono text-[6px]" style={{ backgroundColor: SEVERITY_COLORS[esc.severity] + "15", color: SEVERITY_COLORS[esc.severity] }}>{esc.severity}</Badge>
                  </div>
                  <p className="font-mono text-[8px] text-slate-500 mt-0.5">{esc.department} &bull; Created by {esc.created_by_name} &bull; {new Date(esc.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PrivacyIcon size={12} className="text-slate-500" />
                  <span className="font-mono text-[7px] text-slate-500 capitalize">{esc.privacy_level}</span>
                </div>
                {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
              </div>
              {isOpen && (
                <div className="border-t border-white/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="font-mono text-[7px] text-slate-500 uppercase">Employee</p><p className="font-body text-xs text-white">{esc.emp_name || "Anonymous"}</p></div>
                    <div><p className="font-mono text-[7px] text-slate-500 uppercase">Manager</p><p className="font-body text-xs text-white">{esc.manager_name || "N/A"}</p></div>
                  </div>
                  <div><p className="font-mono text-[7px] text-slate-500 uppercase">Reason</p><p className="font-body text-xs text-slate-300">{esc.reason}</p></div>
                  {esc.recommended_action && <div><p className="font-mono text-[7px] text-slate-500 uppercase">Recommended Action</p><p className="font-body text-xs text-slate-300">{esc.recommended_action}</p></div>}
                  <div className="flex gap-2 pt-2">
                    {esc.status === "open" && <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-[10px]" onClick={() => updateStatus(esc.id, "in_progress")}>Mark In Progress</Button>}
                    {(esc.status === "open" || esc.status === "in_progress") && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px]" onClick={() => updateStatus(esc.id, "resolved")}>Resolve</Button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0D0D12] border border-white/10 rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="font-display text-sm font-bold text-white">New HR Escalation</h3><button onClick={() => setShowCreate(false)}><X size={16} className="text-slate-500" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase">Type</label>
                <AppSelect data-testid="hr-esc-type" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none mt-1">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
                </AppSelect>
              </div>
              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase">Severity</label>
                <AppSelect data-testid="hr-esc-severity" value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none mt-1">
                  <AppSelectOption value="low">Low</AppSelectOption><AppSelectOption value="medium">Medium</AppSelectOption><AppSelectOption value="high">High</AppSelectOption><AppSelectOption value="critical">Critical</AppSelectOption>
                </AppSelect>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input data-testid="hr-esc-emp" placeholder="Employee name (optional for anon)" value={form.emp_name} onChange={e => setForm(f => ({...f, emp_name: e.target.value}))} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
              <input placeholder="Department" value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
            </div>
            <input placeholder="Manager name" value={form.manager_name} onChange={e => setForm(f => ({...f, manager_name: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none" />
            <textarea data-testid="hr-esc-reason" placeholder="Reason for escalation..." value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none resize-none" />
            <textarea placeholder="Recommended action..." value={form.recommended_action} onChange={e => setForm(f => ({...f, recommended_action: e.target.value}))} rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 focus:outline-none resize-none" />
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase">Privacy Level</label>
              <div className="flex gap-2 mt-1">
                {["anonymized", "identified"].map(p => (
                  <button key={p} onClick={() => setForm(f => ({...f, privacy_level: p}))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${form.privacy_level === p ? "bg-white/10 text-white border border-white/20" : "bg-white/[0.02] text-slate-500 border border-white/5"}`}>
                    {p === "anonymized" ? <EyeOff size={10} className="inline mr-1" /> : <Eye size={10} className="inline mr-1" />}{p}
                  </button>
                ))}
              </div>
            </div>
            <Button data-testid="hr-esc-submit" onClick={createEscalation} className="w-full bg-red-600 hover:bg-red-500 text-white text-xs">Create Escalation</Button>
          </div>
        </div>
      )}
    </div>
  );
}
