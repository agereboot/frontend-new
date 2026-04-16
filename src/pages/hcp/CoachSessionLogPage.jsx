import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Plus, Activity, Clock, CheckCircle } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function CoachSessionLogPage() {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState({ member_id: "", notes: "", session_rpe: 5, compliance_pct: 100, duration_min: 30 });

  useEffect(() => {
    Promise.all([
      api.get("/coach/sessions").then(r => setSessions(r.data.sessions || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const logSession = async () => {
    if (!form.member_id) { toast.error("Select a member"); return; }
    const member = members.find(m => m.id === form.member_id);
    try {
      const res = await api.post("/coach/sessions", { ...form, member_name: member?.name || "", type: "fitness" });
      setSessions(prev => [res.data, ...prev]);
      setShowLog(false);
      toast.success("Session logged");
    } catch { toast.error("Failed to log session"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="session-log-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Session <span className="text-blue-400">Logger</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">TRACK SESSIONS, RPE & COMPLIANCE</p>
        </div>
        <Button data-testid="log-session-btn" onClick={() => setShowLog(!showLog)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
          <Plus size={14} className="mr-1" /> Log Session
        </Button>
      </div>

      {showLog && (
        <div className="rounded-xl border border-blue-500/20 bg-black/30 p-5 space-y-3" data-testid="session-form">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Member</label>
              <AppSelect data-testid="session-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none">
                <AppSelectOption value="">Select</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Duration (min)</label>
              <input type="number" value={form.duration_min} onChange={e => setForm(p => ({ ...p, duration_min: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Session RPE (1-10)</label>
              <input type="number" min={1} max={10} value={form.session_rpe} onChange={e => setForm(p => ({ ...p, session_rpe: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-400 block mb-1">Compliance %</label>
              <input type="number" min={0} max={100} value={form.compliance_pct} onChange={e => setForm(p => ({ ...p, compliance_pct: +e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[9px] text-slate-400 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none h-20 resize-none" />
          </div>
          <div className="flex gap-2">
            <Button data-testid="save-session" onClick={logSession} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Save Session</Button>
            <Button variant="outline" onClick={() => setShowLog(false)} className="border-white/10 text-slate-300 text-xs">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-black/20" data-testid={`session-${s.id}`}>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-white">{s.member_name || "Member"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[8px] text-slate-500">{new Date(s.created_at).toLocaleDateString()}</span>
                <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{s.duration_min}min</Badge>
                {s.session_rpe && <Badge className="font-mono text-[7px] bg-blue-500/10 text-blue-400">RPE {s.session_rpe}</Badge>}
              </div>
            </div>
            <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400">{s.compliance_pct || 100}%</Badge>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-slate-500 text-sm text-center py-12">No sessions logged yet</p>}
      </div>
    </div>
  );
}
