import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Plus, Loader2, CheckCircle2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function PSYSessionNotesPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    session_type: "individual", cbt_module_used: "", subjective: "", objective: "",
    assessment: "", plan: "", emotional_state: "", behavioral_observations: "",
    interventions_used: [], homework_assigned: "", risk_assessment: "none", next_session_focus: "",
  });

  useEffect(() => { api.get("/cc/members").then(r => setMembers(r.data.members || [])); }, []);
  useEffect(() => { if (selectedId) api.get(`/coach-v2/psy/session-notes/${selectedId}`).then(r => setNotes(r.data.notes || [])); }, [selectedId]);

  const saveNote = async () => {
    if (!selectedId) { toast.error("Select a patient"); return; }
    setSaving(true);
    const member = members.find(m => m.id === selectedId);
    try {
      const res = await api.post("/coach-v2/psy/session-notes", { ...form, member_id: selectedId, member_name: member?.name });
      setNotes(prev => [res.data, ...prev]);
      setShowForm(false);
      toast.success("Session note saved & synced to EMR");
    } catch { toast.error("Failed"); }
    setSaving(false);
  };

  const RISK_COLORS = { none: "#10B981", low: "#6366F1", moderate: "#F59E0B", high: "#EF4444", critical: "#FF0055" };
  const INTERVENTIONS = ["CBT", "Motivational Interviewing", "Psychoeducation", "Mindfulness", "Exposure Therapy", "Behavioral Activation", "Relaxation Training", "EMDR", "Dialectical Behavior", "Solution-Focused"];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="session-notes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Therapy <span className="text-indigo-400">Session Notes</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">SOAP-FORMAT CLINICAL DOCUMENTATION</p>
        </div>
        <div className="flex items-center gap-3">
          <AppSelect data-testid="sn-member" value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none min-w-[200px]">
            <AppSelectOption value="">Select patient</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          {selectedId && <Button data-testid="new-note" onClick={() => setShowForm(!showForm)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs"><Plus size={14} className="mr-1" /> New Note</Button>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-indigo-500/20 bg-black/30 p-5 space-y-4" data-testid="note-form">
          <div className="grid grid-cols-3 gap-3">
            <AppSelect value={form.session_type} onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none">
              <AppSelectOption value="individual">Individual</AppSelectOption><AppSelectOption value="group">Group</AppSelectOption><AppSelectOption value="couples">Couples</AppSelectOption><AppSelectOption value="crisis">Crisis</AppSelectOption>
            </AppSelect>
            <AppSelect value={form.risk_assessment} onChange={e => setForm(p => ({ ...p, risk_assessment: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none">
              <AppSelectOption value="none">Risk: None</AppSelectOption><AppSelectOption value="low">Risk: Low</AppSelectOption><AppSelectOption value="moderate">Risk: Moderate</AppSelectOption><AppSelectOption value="high">Risk: High</AppSelectOption><AppSelectOption value="critical">Risk: Critical</AppSelectOption>
            </AppSelect>
            <input value={form.emotional_state} onChange={e => setForm(p => ({ ...p, emotional_state: e.target.value }))} placeholder="Emotional state (e.g., Anxious, Hopeful)"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          {/* SOAP */}
          <div className="space-y-3">
            {[
              ["S — Subjective", "subjective", "Client's self-report: symptoms, feelings, concerns expressed..."],
              ["O — Objective", "objective", "Observable behavior, mental status exam findings, vital signs..."],
              ["A — Assessment", "assessment", "Clinical assessment, diagnosis updates, therapeutic formulation..."],
              ["P — Plan", "plan", "Treatment plan, next steps, referrals, medication coordination..."],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="font-mono text-[9px] text-indigo-400 block mb-1">{label}</label>
                <textarea data-testid={`soap-${key}`} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />
              </div>
            ))}
          </div>

          {/* Interventions */}
          <div>
            <label className="font-mono text-[9px] text-slate-400 block mb-2">Interventions Used</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERVENTIONS.map(intv => (
                <button key={intv} onClick={() => setForm(p => ({ ...p, interventions_used: p.interventions_used.includes(intv) ? p.interventions_used.filter(i => i !== intv) : [...p.interventions_used, intv] }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${form.interventions_used.includes(intv) ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" : "bg-black/20 text-slate-500 border-white/5 hover:text-white"}`}>
                  {intv}
                </button>
              ))}
            </div>
          </div>

          <textarea value={form.homework_assigned} onChange={e => setForm(p => ({ ...p, homework_assigned: e.target.value }))} placeholder="Homework assigned..." rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-note" onClick={saveNote} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} className="mr-1" /> Save & Sync to EMR</>}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`note-${n.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-400" />
                <span className="font-body text-sm text-white">{n.member_name}</span>
                <Badge className="font-mono text-[7px] bg-indigo-500/10 text-indigo-400">{n.session_type}</Badge>
                <Badge className="font-mono text-[7px]" style={{ backgroundColor: RISK_COLORS[n.risk_assessment] + "15", color: RISK_COLORS[n.risk_assessment] }}>Risk: {n.risk_assessment}</Badge>
              </div>
              <span className="font-mono text-[8px] text-slate-500">{n.session_date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {n.subjective && <div className="bg-white/[0.02] rounded-lg p-2"><p className="font-mono text-[7px] text-indigo-400 mb-0.5">SUBJECTIVE</p><p className="text-slate-300 font-body">{n.subjective.slice(0, 120)}{n.subjective.length > 120 ? "..." : ""}</p></div>}
              {n.assessment && <div className="bg-white/[0.02] rounded-lg p-2"><p className="font-mono text-[7px] text-indigo-400 mb-0.5">ASSESSMENT</p><p className="text-slate-300 font-body">{n.assessment.slice(0, 120)}{n.assessment.length > 120 ? "..." : ""}</p></div>}
            </div>
            {n.interventions_used?.length > 0 && (
              <div className="flex gap-1 mt-2">{n.interventions_used.map(i => <Badge key={i} className="font-mono text-[6px] bg-white/5 text-slate-400">{i}</Badge>)}</div>
            )}
          </div>
        ))}
        {!selectedId && <p className="text-slate-500 text-sm text-center py-12">Select a patient to view session notes</p>}
      </div>
    </div>
  );
}
