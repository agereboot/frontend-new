import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Plus, Loader2, CheckCircle2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function NUTConsultNotesPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    dietary_analysis: "", recommendations: "", meal_plan_updates: "",
    supplement_changes: "", follow_up_plan: "", client_feedback: "", barriers_identified: "",
  });

  useEffect(() => { api.get("/cc/members").then(r => setMembers(r.data.members || [])); }, []);
  useEffect(() => { if (selectedId) api.get(`/coach-v2/nut/consultation-notes/${selectedId}`).then(r => setNotes(r.data.notes || [])); }, [selectedId]);

  const saveNote = async () => {
    if (!selectedId) { toast.error("Select a client"); return; }
    setSaving(true);
    const member = members.find(m => m.id === selectedId);
    try {
      const res = await api.post("/coach-v2/nut/consultation-notes", { ...form, member_id: selectedId, member_name: member?.name });
      setNotes(prev => [res.data, ...prev]);
      setShowForm(false);
      toast.success("Consultation note saved & synced to EMR");
    } catch { toast.error("Failed"); }
    setSaving(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="consult-notes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Consultation <span className="text-teal-400">Notes</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">NUTRITION CONSULTATION DOCUMENTATION</p>
        </div>
        <div className="flex items-center gap-3">
          <AppSelect data-testid="cn-member" value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 focus:outline-none min-w-[200px]">
            <AppSelectOption value="">Select client</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          {selectedId && <Button data-testid="new-cn" onClick={() => setShowForm(!showForm)} className="bg-teal-500 hover:bg-teal-600 text-white text-xs"><Plus size={14} className="mr-1" /> New Note</Button>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-teal-500/20 bg-black/30 p-5 space-y-3" data-testid="cn-form">
          {[
            ["Dietary Analysis", "dietary_analysis", "Current dietary patterns, caloric intake assessment, macro distribution..."],
            ["Recommendations", "recommendations", "Specific dietary changes, food additions/removals, timing adjustments..."],
            ["Meal Plan Updates", "meal_plan_updates", "Changes to existing meal plan, new recipes, substitutions..."],
            ["Supplement Changes", "supplement_changes", "New supplements, dosage adjustments, timing changes..."],
            ["Barriers Identified", "barriers_identified", "Client-reported barriers to adherence, lifestyle challenges..."],
            ["Client Feedback", "client_feedback", "How the client feels about the current plan, preferences..."],
            ["Follow-up Plan", "follow_up_plan", "Next steps, reassessment timeline, lab orders needed..."],
          ].map(([label, key, ph]) => (
            <div key={key}>
              <label className="font-mono text-[9px] text-teal-400 block mb-1">{label}</label>
              <textarea data-testid={`cn-${key}`} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none resize-none" />
            </div>
          ))}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-cn" onClick={saveNote} disabled={saving} className="bg-teal-500 hover:bg-teal-600 text-white text-xs">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} className="mr-1" /> Save & Sync to EMR</>}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`cn-${n.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-teal-400" />
                <span className="font-body text-sm text-white">{n.member_name}</span>
              </div>
              <span className="font-mono text-[8px] text-slate-500">{n.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {n.dietary_analysis && <div className="bg-white/[0.02] rounded-lg p-2"><p className="font-mono text-[7px] text-teal-400 mb-0.5">DIETARY ANALYSIS</p><p className="text-slate-300 font-body">{n.dietary_analysis.slice(0, 120)}...</p></div>}
              {n.recommendations && <div className="bg-white/[0.02] rounded-lg p-2"><p className="font-mono text-[7px] text-teal-400 mb-0.5">RECOMMENDATIONS</p><p className="text-slate-300 font-body">{n.recommendations.slice(0, 120)}...</p></div>}
            </div>
          </div>
        ))}
        {!selectedId && <p className="text-slate-500 text-sm text-center py-12">Select a client to view consultation notes</p>}
      </div>
    </div>
  );
}
