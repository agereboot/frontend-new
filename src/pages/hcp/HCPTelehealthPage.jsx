import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Video, Phone, MessageSquare, Plus, Clock, CheckCircle,
  Play, Calendar, User, XCircle,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TYPE_CONFIG = {
  video: { icon: Video, color: "#7B35D8", label: "Video" },
  audio: { icon: Phone, color: "#6366F1", label: "Audio" },
  text: { icon: MessageSquare, color: "#0F9F8F", label: "Text" },
};
const STATUS_CONFIG = {
  scheduled: { color: "#6366F1", label: "Scheduled" },
  in_progress: { color: "#10B981", label: "In Progress" },
  completed: { color: "#475569", label: "Completed" },
  cancelled: { color: "#EF4444", label: "Cancelled" },
};

export default function HCPTelehealthPage() {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ member_id: "", session_type: "video", scheduled_at: "", duration_min: 30, reason: "" });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/telehealth/sessions").then(r => setSessions(r.data.sessions)),
      api.get("/cc/members").then(r => setMembers(r.data.members)),
    ]).finally(() => setLoading(false));
  }, []);

  const createSession = async () => {
    if (!form.member_id) { toast.error("Select a member"); return; }
    setCreating(true);
    try {
      const res = await api.post("/telehealth/sessions", form);
      setSessions(prev => [res.data, ...prev]);
      toast.success(`Telehealth session created (Room: ${res.data.room_code})`);
      setShowCreate(false);
      setForm({ member_id: "", session_type: "video", scheduled_at: "", duration_min: 30, reason: "" });
    } catch { toast.error("Failed to create session"); }
    finally { setCreating(false); }
  };

  const startSession = async (sessionId) => {
    try {
      await api.put(`/telehealth/sessions/${sessionId}/start`);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: "in_progress" } : s));
      navigate(`/hcp/telehealth/${sessionId}`);
    } catch { toast.error("Failed to start session"); }
  };

  const joinSession = (sessionId) => {
    navigate(`/hcp/telehealth/${sessionId}`);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  const upcoming = sessions.filter(s => s.status === "scheduled" || s.status === "in_progress");
  const past = sessions.filter(s => s.status === "completed" || s.status === "cancelled");

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-telehealth-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Tele<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#6366F1]">health</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Video, Audio & Text Consultations</p>
        </div>
        <Button data-testid="create-telehealth-btn" onClick={() => setShowCreate(!showCreate)} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">
          <Plus size={16} className="mr-2" /> New Session
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-6 space-y-4" data-testid="telehealth-form">
          <h3 className="font-display text-base font-bold text-white">Schedule Telehealth Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Member</label>
              <AppSelect data-testid="telehealth-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
                <AppSelectOption value="">Select member...</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Session Type</label>
              <div className="flex gap-2 mt-1">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={type} data-testid={`type-${type}`} onClick={() => setForm(p => ({ ...p, session_type: type }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${form.session_type === type ? `border-[${cfg.color}] bg-[${cfg.color}]/10` : "border-white/10 bg-black/20 hover:bg-white/5"}`}
                      style={form.session_type === type ? { borderColor: cfg.color, backgroundColor: cfg.color + "15" } : {}}>
                      <Icon size={16} style={{ color: form.session_type === type ? cfg.color : "#64748B" }} />
                      <span className="font-body text-xs" style={{ color: form.session_type === type ? cfg.color : "#94A3B8" }}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Scheduled Time</label>
              <input type="datetime-local" data-testid="telehealth-time" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Duration (min)</label>
              <AppSelect value={form.duration_min} onChange={e => setForm(p => ({ ...p, duration_min: parseInt(e.target.value) }))}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
                <AppSelectOption value={15}>15 min</AppSelectOption><AppSelectOption value={30}>30 min</AppSelectOption><AppSelectOption value={45}>45 min</AppSelectOption><AppSelectOption value={60}>60 min</AppSelectOption>
              </AppSelect>
            </div>
          </div>
          <textarea data-testid="telehealth-reason" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            placeholder="Reason for consultation..." className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600 h-16 resize-none" />
          {/* Indian Telemedicine Compliance Notice */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="font-mono text-[8px] text-amber-400 uppercase tracking-wider mb-1">Telemedicine Practice Guidelines 2020 (India)</p>
            <ul className="space-y-0.5 text-[10px] text-slate-400">
              <li>Patient consent will be captured at session start</li>
              <li>Session details are logged for medicolegal compliance</li>
              <li>Schedule B prescriptions require in-person follow-up</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button data-testid="submit-telehealth" onClick={createSession} disabled={creating} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">{creating ? "Creating..." : "Schedule Session"}</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 text-slate-300 hover:bg-white/5 font-body text-sm">Cancel</Button>
          </div>
        </div>
      )}

      {/* Active / Upcoming */}
      <div>
        <h2 className="font-display text-lg font-bold text-white mb-3">Active & Upcoming</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="upcoming-sessions">
          {upcoming.length > 0 ? upcoming.map(s => {
            const tc = TYPE_CONFIG[s.session_type] || TYPE_CONFIG.video;
            const sc = STATUS_CONFIG[s.status] || STATUS_CONFIG.scheduled;
            const TIcon = tc.icon;
            return (
              <div key={s.id} className="rounded-xl border border-white/5 bg-black/20 p-5 hover:border-white/10 transition-all" data-testid={`telehealth-session-${s.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: tc.color + "15", border: `1px solid ${tc.color}30` }}>
                      <TIcon size={18} style={{ color: tc.color }} />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-white">{s.member_name}</p>
                      <p className="font-mono text-[8px] text-slate-500">Room: {s.room_code}</p>
                    </div>
                  </div>
                  <Badge className="font-mono text-[7px]" style={{ backgroundColor: sc.color + "15", color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</Badge>
                </div>
                {s.reason && <p className="font-body text-xs text-slate-400 mb-3">{s.reason}</p>}
                <div className="flex items-center gap-3 mb-3">
                  <Clock size={12} className="text-slate-500" />
                  <span className="font-mono text-[9px] text-slate-400">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "Now"}</span>
                  <span className="font-mono text-[9px] text-slate-400">{s.duration_min}min</span>
                </div>
                <div className="flex gap-2">
                  {s.status === "scheduled" && (
                    <Button data-testid={`start-session-${s.id}`} size="sm" onClick={() => startSession(s.id)}
                      className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-body text-xs">
                      <Play size={12} className="mr-1" /> Start
                    </Button>
                  )}
                  {s.status === "in_progress" && (
                    <Button data-testid={`join-session-${s.id}`} size="sm" onClick={() => joinSession(s.id)}
                      className="flex-1 bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-xs">
                      <Video size={12} className="mr-1" /> Join
                    </Button>
                  )}
                </div>
              </div>
            );
          }) : <p className="text-slate-500 text-sm py-8 col-span-3 text-center">No upcoming sessions.</p>}
        </div>
      </div>

      {/* Past Sessions */}
      {past.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-white mb-3">Past Sessions</h2>
          <div className="space-y-2" data-testid="past-sessions">
            {past.map(s => {
              const tc = TYPE_CONFIG[s.session_type] || TYPE_CONFIG.video;
              const TIcon = tc.icon;
              return (
                <div key={s.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TIcon size={16} style={{ color: tc.color }} />
                    <div>
                      <p className="font-body text-sm text-white">{s.member_name}</p>
                      <p className="font-mono text-[8px] text-slate-500">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : ""} &middot; {s.duration_min}min &middot; {s.reason || tc.label}</p>
                    </div>
                  </div>
                  <Badge className={`font-mono text-[7px] ${s.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{s.status}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
