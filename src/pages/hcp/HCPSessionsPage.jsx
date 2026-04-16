import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CalendarClock, Plus, Clock, FileText, Check, X,
  Video, MessageSquare, ClipboardCheck,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TYPE_CONFIG = {
  consultation: { icon: ClipboardCheck, color: "#0F9F8F", label: "Consultation" },
  coaching: { icon: MessageSquare, color: "#D97706", label: "Coaching" },
  review: { icon: FileText, color: "#6366F1", label: "Review" },
  telehealth: { icon: Video, color: "#7B35D8", label: "Telehealth" },
};
const STATUS_CONFIG = {
  scheduled: { color: "#6366F1", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  completed: { color: "#0F9F8F", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  cancelled: { color: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  no_show: { color: "#D97706", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
};

export default function HCPSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ member_id: "", session_type: "consultation", scheduled_at: "", duration_min: 30 });
  const [editingId, setEditingId] = useState(null);
  const [notes, setNotes] = useState("");

  const fetchSessions = () => {
    setLoading(true);
    Promise.all([
      api.get("/cc/sessions"),
      api.get("/cc/members"),
    ]).then(([sRes, mRes]) => {
      setSessions(sRes.data.sessions);
      setMembers(mRes.data.members);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetchSessions, []);

  const createSession = async () => {
    if (!form.member_id || !form.scheduled_at) { toast.error("Select member and date"); return; }
    setCreating(true);
    try {
      await api.post("/cc/sessions", form);
      toast.success("Session scheduled");
      setShowCreate(false);
      setForm({ member_id: "", session_type: "consultation", scheduled_at: "", duration_min: 30 });
      fetchSessions();
    } catch { toast.error("Failed to create session"); } finally { setCreating(false); }
  };

  const updateSession = async (sid, status, sessionNotes) => {
    try {
      await api.put(`/cc/sessions/${sid}`, { status, notes: sessionNotes || undefined });
      toast.success(`Session ${status}`);
      setEditingId(null);
      fetchSessions();
    } catch { toast.error("Update failed"); }
  };

  const upcoming = sessions.filter(s => s.status === "scheduled");
  const past = sessions.filter(s => s.status !== "scheduled");

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-sessions-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Session <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#7B35D8]">Management</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Consultations & Coaching Sessions</p>
        </div>
        <Button data-testid="create-session-btn" onClick={() => setShowCreate(!showCreate)}
          className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body font-semibold shadow-[0_0_15px_rgba(123,53,216,0.3)]">
          <Plus size={16} className="mr-2" /> New Session
        </Button>
      </div>

      {/* Create Session Form */}
      {showCreate && (
        <div className="rounded-xl border border-[#7B35D8]/30 bg-black/30 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(123,53,216,0.1)]" data-testid="create-session-form">
          <p className="font-mono text-[9px] text-[#7B35D8] uppercase tracking-[0.2em] mb-4">Schedule New Session</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AppSelect data-testid="session-member" value={form.member_id} onChange={e => setForm(prev => ({ ...prev, member_id: e.target.value }))}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body">
              <AppSelectOption value="">Select member...</AppSelectOption>
              {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
            </AppSelect>
            <AppSelect data-testid="session-type" value={form.session_type} onChange={e => setForm(prev => ({ ...prev, session_type: e.target.value }))}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-body">
              {Object.entries(TYPE_CONFIG).map(([k, v]) => <AppSelectOption key={k} value={k}>{v.label}</AppSelectOption>)}
            </AppSelect>
            <input data-testid="session-date" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-mono [color-scheme:dark]" />
            <div className="flex gap-3">
              <AppSelect data-testid="session-duration" value={form.duration_min} onChange={e => setForm(prev => ({ ...prev, duration_min: parseInt(e.target.value) }))}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none font-mono flex-1">
                {[15, 30, 45, 60, 90].map(d => <AppSelectOption key={d} value={d}>{d} min</AppSelectOption>)}
              </AppSelect>
              <Button data-testid="session-submit" onClick={createSession} disabled={creating}
                className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 font-mono text-xs">
                {creating ? "..." : "Schedule"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming */}
          <div>
            <h2 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Clock size={14} className="text-[#6366F1]" /> Upcoming ({upcoming.length})
            </h2>
            <div className="space-y-2" data-testid="sessions-upcoming">
              {upcoming.length > 0 ? upcoming.map(s => {
                const tc = TYPE_CONFIG[s.session_type] || TYPE_CONFIG.consultation;
                const TIcon = tc.icon;
                return (
                  <div key={s.id} data-testid={`session-${s.id}`} className="rounded-xl border border-white/5 bg-black/20 p-4 hover:bg-white/[0.03] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tc.color + "15", border: `1px solid ${tc.color}25` }}>
                        <TIcon size={16} style={{ color: tc.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-white truncate">{s.member_name}</p>
                        <p className="font-mono text-[9px] text-slate-500">{tc.label} &middot; {s.duration_min}min</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-white">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : ""}</p>
                        <p className="font-mono text-[9px] text-slate-400">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => updateSession(s.id, "completed", "")} data-testid={`complete-${s.id}`}
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono text-[10px] h-7">
                        <Check size={12} className="mr-1" /> Complete
                      </Button>
                      <Button size="sm" onClick={() => updateSession(s.id, "cancelled")} data-testid={`cancel-${s.id}`}
                        className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-mono text-[10px] h-7">
                        <X size={12} className="mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                );
              }) : <p className="text-slate-500 font-mono text-xs text-center py-6">No upcoming sessions.</p>}
            </div>
          </div>

          {/* Past */}
          <div>
            <h2 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileText size={14} className="text-slate-400" /> Past Sessions ({past.length})
            </h2>
            <div className="space-y-2" data-testid="sessions-past">
              {past.length > 0 ? past.map(s => {
                const tc = TYPE_CONFIG[s.session_type] || TYPE_CONFIG.consultation;
                const sc = STATUS_CONFIG[s.status] || STATUS_CONFIG.completed;
                return (
                  <div key={s.id} data-testid={`session-${s.id}`} className="rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-body text-sm font-medium text-white truncate">{s.member_name}</p>
                          <Badge className={`font-mono text-[7px] ${sc.bg} ${sc.text} ${sc.border}`}>{s.status}</Badge>
                        </div>
                        <p className="font-mono text-[9px] text-slate-500">{tc.label} &middot; {s.duration_min}min &middot; {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : ""}</p>
                        {s.notes && <p className="font-body text-xs text-slate-400 mt-1">{s.notes}</p>}
                      </div>
                      {s.status === "completed" && !s.notes && (
                        editingId === s.id ? (
                          <div className="flex gap-2 items-center">
                            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."
                              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs w-48 focus:border-[#7B35D8] focus:outline-none font-body" />
                            <Button size="sm" onClick={() => updateSession(s.id, "completed", notes)} className="bg-[#7B35D8]/10 text-[#7B35D8] border border-[#7B35D8]/20 font-mono text-[10px] h-7">Save</Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => { setEditingId(s.id); setNotes(""); }} className="bg-white/5 text-slate-400 border border-white/5 font-mono text-[10px] h-7">
                            <FileText size={12} className="mr-1" /> Add Notes
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              }) : <p className="text-slate-500 font-mono text-xs text-center py-6">No past sessions.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
