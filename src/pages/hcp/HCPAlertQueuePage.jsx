import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, AlertTriangle, Check, ArrowUpRight, Filter, Clock } from "lucide-react";

const SEV_CONFIG = {
  CRITICAL: { color: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  HIGH: { color: "#D97706", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  MEDIUM: { color: "#6366F1", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
  LOW: { color: "#475569", bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400" },
};

export default function HCPAlertQueuePage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "open", severity: "" });
  const [resolving, setResolving] = useState(null);

  const fetchAlerts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.severity) params.set("severity", filter.severity);
    api.get(`/cc/alerts?${params}`).then(r => { setAlerts(r.data.alerts); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(fetchAlerts, [filter]);

  const resolve = async (alertId, resolution) => {
    setResolving(alertId);
    try {
      await api.post(`/cc/alerts/${alertId}/resolve`, { resolution, notes: `Resolved as ${resolution}` });
      toast.success(`Alert ${resolution}`);
      fetchAlerts();
    } catch { toast.error("Failed to resolve"); } finally { setResolving(null); }
  };

  const sevCounts = alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-alerts-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Clinical <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Alert Queue</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Priority-Scored Biomarker Alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEV_CONFIG[s].color }} />
              <span className="font-mono text-[9px]" style={{ color: SEV_CONFIG[s].color }}>{sevCounts[s] || 0} {s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap" data-testid="alert-filters">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Status:</span>
        </div>
        {["open", "resolved", "escalated", "dismissed"].map(s => (
          <button key={s} data-testid={`filter-status-${s}`} onClick={() => setFilter(prev => ({ ...prev, status: s }))}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${filter.status === s ? "bg-[#7B35D8]/10 border-[#7B35D8]/30 text-white" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"}`}>
            {s}
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-1" />
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Severity:</span>
        <button data-testid="filter-severity-all" onClick={() => setFilter(prev => ({ ...prev, severity: "" }))}
          className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${!filter.severity ? "bg-[#7B35D8]/10 border-[#7B35D8]/30 text-white" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"}`}>All</button>
        {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(s => (
          <button key={s} data-testid={`filter-severity-${s}`} onClick={() => setFilter(prev => ({ ...prev, severity: s }))}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${filter.severity === s ? `${SEV_CONFIG[s].bg} ${SEV_CONFIG[s].border} ${SEV_CONFIG[s].text}` : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-black/20 p-12 text-center">
          <Check size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-white">All Clear</p>
          <p className="font-body text-sm text-slate-400">No {filter.status} alerts{filter.severity ? ` with ${filter.severity} severity` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="alert-list">
          {alerts.map((a) => {
            const cfg = SEV_CONFIG[a.severity] || SEV_CONFIG.LOW;
            const hoursAgo = a.created_at ? Math.round((Date.now() - new Date(a.created_at).getTime()) / 3600000) : 0;
            const slaExceeded = hoursAgo > a.sla_hours;
            return (
              <div key={a.id} data-testid={`alert-row-${a.id}`}
                className="group rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}40` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-body text-sm font-medium text-white">{a.member_name}</span>
                      <Badge className={`font-mono text-[7px] ${cfg.bg} ${cfg.text} ${cfg.border}`}>{a.severity}</Badge>
                      <span className="font-mono text-xs text-white font-medium">{a.biomarker}: <span style={{ color: cfg.color }}>{a.value}</span> {a.unit}</span>
                      <span className="font-mono text-[8px] text-slate-500">(threshold: {a.direction}{a.threshold})</span>
                      <span className="font-mono text-[8px] text-slate-600 ml-auto flex items-center gap-1">
                        <Clock size={9} /> {hoursAgo}h ago
                        {slaExceeded && <span className="text-red-400 font-bold ml-1">SLA BREACH</span>}
                      </span>
                    </div>
                    <p className="font-body text-xs text-slate-300 leading-relaxed">{a.ai_interpretation}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-[8px] text-slate-500">APS: <span className="font-bold text-white">{a.aps_score}</span></span>
                      <span className="font-mono text-[8px] text-slate-500">SLA: {a.sla_hours}h</span>
                      {a.member_franchise && <span className="font-mono text-[8px] text-slate-500">{a.member_franchise}</span>}
                    </div>
                  </div>
                  {a.status === "open" && (
                    <div className="flex gap-2 shrink-0">
                      <Button data-testid={`resolve-${a.id}`} onClick={() => resolve(a.id, "resolved")}
                        disabled={resolving === a.id} size="sm"
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono text-[10px] h-8">
                        <Check size={12} className="mr-1" /> Resolve
                      </Button>
                      <Button data-testid={`escalate-${a.id}`} onClick={() => resolve(a.id, "escalated")}
                        disabled={resolving === a.id} size="sm"
                        className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-mono text-[10px] h-8">
                        <ArrowUpRight size={12} className="mr-1" /> Escalate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
