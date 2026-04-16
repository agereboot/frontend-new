import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Users, Zap, Calendar, Clock, Brain, AlertTriangle,
  ClipboardList, Shield, HeartPulse, BookOpen, ChevronRight,
} from "lucide-react";

export default function PSYDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDash = useCallback(async () => {
    try {
      const [dashRes, crisisRes] = await Promise.all([
        api.get("/coach/dashboard"),
        api.get("/coach/psy/crisis-alerts").catch(() => ({ data: { alerts: [] } })),
      ]);
      setDash({ ...dashRes.data, crisisAlerts: crisisRes.data.alerts || [] });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchDash(); }, [fetchDash]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const d = dash || {};
  const crisisAlerts = d.crisisAlerts || [];

  const kpis = [
    { label: "Active Patients", value: d.total_members || 0, icon: Users, color: "#6366F1" },
    { label: "Active Therapy", value: d.active_therapy_cases || 0, icon: Brain, color: "#8B5CF6" },
    { label: "Pending Tasks", value: d.pending_tasks || 0, icon: Zap, color: "#F59E0B" },
    { label: "Crisis Alerts", value: d.crisis_alerts || 0, icon: AlertTriangle, color: "#EF4444" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="psy-dashboard">
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Psychology <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Therapist</span>
        </h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Welcome back, {user?.name}</p>
      </div>

      {/* Crisis Banner */}
      {crisisAlerts.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 animate-pulse" data-testid="crisis-banner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-red-400">{crisisAlerts.length} Active Crisis Alert{crisisAlerts.length > 1 ? "s" : ""}</p>
              <p className="font-body text-[10px] text-red-300/70">Immediate attention required — SLA: 2 hours</p>
            </div>
            <button onClick={() => navigate("/hcp/crisis")} className="font-mono text-xs text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10">
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="psy-agenda">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-indigo-400" /><h3 className="font-display text-xs font-bold text-white">Today's Sessions</h3></div>
          <button onClick={() => navigate("/hcp/appointments")} className="font-mono text-[8px] text-indigo-400">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2">
          {(d.today_appointments || []).length > 0 ? d.today_appointments.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => navigate(`/hcp/smart-emr/${a.member_id}`)}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Clock size={12} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[11px] text-white truncate">{a.member_name || "Patient"}</p>
                <p className="font-mono text-[8px] text-slate-500">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}</p>
              </div>
            </div>
          )) : <p className="text-slate-500 font-mono text-[10px] text-center py-3 col-span-full">No sessions today</p>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="psy-kpis">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.color + "12", border: `1px solid ${k.color}25` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-white">{k.value}</p>
            <p className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patient HPS Spotlight */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="psy-spotlight">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><HeartPulse size={14} className="text-indigo-400" /><h3 className="font-display text-xs font-bold text-white">Patient HPS Spotlight</h3></div>
            <button onClick={() => navigate("/hcp/members")} className="font-mono text-[8px] text-indigo-400">All Patients</button>
          </div>
          <div className="space-y-2">
            {(d.member_spotlight || []).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]" onClick={() => navigate(`/hcp/smart-emr/${m.id}`)}>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-indigo-400">{(m.name || "?")[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[11px] text-white truncate">{m.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {m.scores?.cognitive_acuity != null && <Badge className="font-mono text-[7px] bg-indigo-500/10 text-indigo-400">Cognitive: {m.scores.cognitive_acuity}</Badge>}
                    {m.scores?.sleep_recovery != null && <Badge className="font-mono text-[7px] bg-violet-500/10 text-violet-400">Sleep: {m.scores.sleep_recovery}</Badge>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-bold" style={{ color: m.hps_total > 70 ? "#10B981" : m.hps_total > 50 ? "#F59E0B" : "#EF4444" }}>{m.hps_total || "—"}</p>
                  <p className="font-mono text-[6px] text-slate-600">HPS</p>
                </div>
              </div>
            ))}
            {(d.member_spotlight || []).length === 0 && <p className="text-slate-500 font-mono text-[10px] text-center py-6">No patients assigned</p>}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="psy-sessions">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><BookOpen size={14} className="text-violet-400" /><h3 className="font-display text-xs font-bold text-white">Recent Therapy Sessions</h3></div>
          </div>
          <div className="space-y-2">
            {(d.recent_sessions || []).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Brain size={12} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[11px] text-white truncate">{s.member_name || "Patient"}</p>
                  <p className="font-mono text-[7px] text-slate-500">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(d.recent_sessions || []).length === 0 && <p className="text-slate-500 font-mono text-[10px] text-center py-6">No sessions logged</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="psy-actions">
        {[
          { label: "New Assessment", icon: ClipboardList, path: "/hcp/assessments", color: "#6366F1" },
          { label: "CBT Modules", icon: Brain, path: "/hcp/cbt-modules", color: "#8B5CF6" },
          { label: "Crisis Alerts", icon: AlertTriangle, path: "/hcp/crisis", color: "#EF4444" },
          { label: "Review Tasks", icon: Zap, path: "/hcp/nfle", color: "#F59E0B" },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} data-testid={`psy-action-${a.label.toLowerCase().replace(/ /g, "-")}`}
            className="rounded-xl border border-white/5 bg-black/20 p-4 text-left hover:bg-white/[0.04] transition-all group">
            <a.icon size={20} style={{ color: a.color }} className="mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-body text-sm text-white">{a.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
