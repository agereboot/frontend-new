import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, Shield, CheckCircle, Clock, Phone } from "lucide-react";

export default function PSYCrisisAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/coach/psy/crisis-alerts").then(r => setAlerts(r.data.alerts || [])).finally(() => setLoading(false));
  }, []);

  const resolveAlert = async (id) => {
    try {
      await api.put(`/coach/psy/crisis-alerts/${id}/resolve`, { notes: "Reviewed and safety plan established" });
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Crisis alert resolved — safety plan documented");
    } catch { toast.error("Failed to resolve"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="crisis-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Crisis <span className="text-red-400">Alerts</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">C-SSRS FLAGGING & SAFETY PROTOCOL MANAGEMENT</p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-sm font-bold text-red-400">{alerts.length} Active Crisis Alert{alerts.length > 1 ? "s" : ""}</p>
          </div>
          <p className="text-[10px] text-red-300/70">SLA: All crisis alerts must be addressed within 2 hours per protocol.</p>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map(a => (
          <div key={a.id} className="rounded-xl border border-red-500/15 bg-black/20 backdrop-blur-sm p-5" data-testid={`crisis-${a.id}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{a.type === "suicidal_ideation" ? "Suicidal Ideation Flagged" : a.type}</p>
                  <p className="font-mono text-[8px] text-slate-500">Detected by {a.detected_by_name} &middot; {new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
              <Badge className="text-[8px] bg-red-500/10 text-red-400 border-red-500/20 animate-pulse">CRITICAL</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[10px] mb-3 rounded-lg bg-white/[0.02] p-3 border border-white/5">
              <div><span className="text-slate-500">PHQ-9 Q9:</span> <span className="text-red-400 font-bold ml-1">{a.phq9_q9_score}</span></div>
              <div><span className="text-slate-500">Total Score:</span> <span className="text-white ml-1">{a.total_score}</span></div>
              <div><span className="text-slate-500">SLA:</span> <span className="text-amber-400 ml-1">{a.sla_hours}h</span></div>
            </div>
            <div className="flex gap-2">
              <Button data-testid={`resolve-${a.id}`} onClick={() => resolveAlert(a.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Shield size={12} className="mr-1" /> Resolve — Safety Plan Established
              </Button>
              <Button variant="outline" className="border-white/10 text-slate-300 text-xs">
                <Phone size={12} className="mr-1" /> Call Patient
              </Button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-16">
            <Shield size={40} className="text-emerald-500/30 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No active crisis alerts</p>
            <p className="text-slate-600 font-mono text-[10px] mt-1">All patients are within safe parameters</p>
          </div>
        )}
      </div>
    </div>
  );
}
