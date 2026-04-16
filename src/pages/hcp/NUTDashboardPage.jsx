import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Users, Zap, Calendar, Clock, Apple, Salad,
  Pill, Shield, HeartPulse, FileText, TrendingUp,
} from "lucide-react";

export default function NUTDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDash = useCallback(async () => {
    try {
      const res = await api.get("/coach/dashboard");
      setDash(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchDash(); }, [fetchDash]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );

  const d = dash || {};
  const kpis = [
    { label: "My Clients", value: d.total_members || 0, icon: Users, color: "#0F9F8F" },
    { label: "Active Meal Plans", value: d.active_meal_plans || 0, icon: Salad, color: "#10B981" },
    { label: "Pending Tasks", value: d.pending_tasks || 0, icon: Zap, color: "#F59E0B" },
    { label: "Pending Approvals", value: d.pending_approvals || 0, icon: Shield, color: "#7B35D8" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="nut-dashboard">
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Nutritional <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Coach</span>
        </h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Welcome back, {user?.name}</p>
      </div>

      {/* Today's Consultations */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="nut-agenda">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-teal-400" /><h3 className="font-display text-xs font-bold text-white">Today's Consultations</h3></div>
          <button onClick={() => navigate("/hcp/appointments")} className="font-mono text-[8px] text-teal-400">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2">
          {(d.today_appointments || []).length > 0 ? d.today_appointments.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => navigate(`/hcp/smart-emr/${a.member_id}`)}>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Clock size={12} className="text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[11px] text-white truncate">{a.member_name || "Client"}</p>
                <p className="font-mono text-[8px] text-slate-500">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}</p>
              </div>
            </div>
          )) : <p className="text-slate-500 font-mono text-[10px] text-center py-3 col-span-full">No consultations today</p>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="nut-kpis">
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
        {/* Client HPS Spotlight */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="nut-spotlight">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><HeartPulse size={14} className="text-teal-400" /><h3 className="font-display text-xs font-bold text-white">Client HPS Spotlight</h3></div>
            <button onClick={() => navigate("/hcp/members")} className="font-mono text-[8px] text-teal-400">All Clients</button>
          </div>
          <div className="space-y-2">
            {(d.member_spotlight || []).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]" onClick={() => navigate(`/hcp/smart-emr/${m.id}`)}>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-teal-400">{(m.name || "?")[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[11px] text-white truncate">{m.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {m.scores?.biological_resilience != null && <Badge className="font-mono text-[7px] bg-teal-500/10 text-teal-400">BioRes: {m.scores.biological_resilience}</Badge>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-bold" style={{ color: m.hps_total > 70 ? "#10B981" : m.hps_total > 50 ? "#F59E0B" : "#EF4444" }}>{m.hps_total || "—"}</p>
                  <p className="font-mono text-[6px] text-slate-600">HPS</p>
                </div>
              </div>
            ))}
            {(d.member_spotlight || []).length === 0 && <p className="text-slate-500 font-mono text-[10px] text-center py-6">No clients assigned</p>}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid="nut-sessions">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><FileText size={14} className="text-emerald-400" /><h3 className="font-display text-xs font-bold text-white">Recent Consultations</h3></div>
          </div>
          <div className="space-y-2">
            {(d.recent_sessions || []).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Apple size={12} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[11px] text-white truncate">{s.member_name || "Client"}</p>
                  <p className="font-mono text-[7px] text-slate-500">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(d.recent_sessions || []).length === 0 && <p className="text-slate-500 font-mono text-[10px] text-center py-6">No consultations yet</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="nut-actions">
        {[
          { label: "Create Meal Plan", icon: Salad, path: "/hcp/meal-plans", color: "#0F9F8F" },
          { label: "Supplements", icon: Pill, path: "/hcp/supplements", color: "#10B981" },
          { label: "Food Diary", icon: FileText, path: "/hcp/food-diary", color: "#6366F1" },
          { label: "Review Tasks", icon: Zap, path: "/hcp/nfle", color: "#F59E0B" },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} data-testid={`nut-action-${a.label.toLowerCase().replace(/ /g, "-")}`}
            className="rounded-xl border border-white/5 bg-black/20 p-4 text-left hover:bg-white/[0.04] transition-all group">
            <a.icon size={20} style={{ color: a.color }} className="mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-body text-sm text-white">{a.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
