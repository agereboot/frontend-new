import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  AlertTriangle, Activity, Zap, TrendingUp, Trophy, Crown,
  Bell, TestTubes, Flame, Filter, RefreshCw, CheckCircle, Clock,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const ICON_MAP = {
  AlertTriangle, Flame, TestTubes, TrendingUp, Activity, Zap, Trophy, Crown, Bell,
};

const URGENCY_C = { critical: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#64748B" };

function UrgencyBadge({ level }) {
  const c = URGENCY_C[level] || "#64748B";
  return <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-mono" style={{ backgroundColor: c + "15", color: c }}>{level}</span>;
}

function CategoryBadge({ config }) {
  if (!config) return null;
  return <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: config.color + "15", color: config.color }}>{config.label}</span>;
}

export default function CXOMissionControlPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: "", urgency: "" });
  const [refreshing, setRefreshing] = useState(false);

  const load = (showRefresh) => {
    if (showRefresh) setRefreshing(true);
    const params = new URLSearchParams();
    if (filter.category) params.set("category", filter.category);
    if (filter.urgency) params.set("urgency", filter.urgency);
    api.get(`/cxo/mission-control?${params}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, [filter.category, filter.urgency]);

  // Auto-refresh every 30s
  useEffect(() => {
    const iv = setInterval(() => load(false), 30000);
    return () => clearInterval(iv);
  }, [filter]);

  const resolve = async (id) => {
    try {
      await api.patch(`/cxo/mission-control/${id}/resolve`);
      load(false);
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load mission control</div>;

  const { events, stats, by_category, categories } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-mission-control">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            AI Unified <span className="text-red-400">Command Centre</span>
            <span className="ml-2 inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="font-mono text-[9px] text-red-400/70 uppercase">Live</span></span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Mission Control — All platform events, AI-triaged and prioritized</p>
        </div>
        <button onClick={() => load(true)} data-testid="mc-refresh-btn"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 border border-white/5 hover:bg-white/5 transition-all">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Events", value: stats.total, color: "#FFFFFF" },
          { label: "Critical", value: stats.critical, color: "#EF4444" },
          { label: "High", value: stats.high, color: "#F59E0B" },
          { label: "Medium", value: stats.medium, color: "#3B82F6" },
          { label: "Unresolved", value: stats.unresolved, color: "#F97316" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-[#11111a] p-3 text-center">
            <p className="font-mono text-[8px] text-slate-500 uppercase">{s.label}</p>
            <p className="font-display text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" data-testid="mc-filters">
        <Filter size={14} className="text-slate-500" />
        <AppSelect value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          className="bg-[#0a0a12] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none" data-testid="mc-filter-category">
          <AppSelectOption value="">All Categories</AppSelectOption>
          {Object.entries(categories || {}).map(([k, v]) => <AppSelectOption key={k} value={k}>{v.label}</AppSelectOption>)}
        </AppSelect>
        <AppSelect value={filter.urgency} onChange={e => setFilter(f => ({ ...f, urgency: e.target.value }))}
          className="bg-[#0a0a12] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none" data-testid="mc-filter-urgency">
          <AppSelectOption value="">All Urgency</AppSelectOption>
          {["critical", "high", "medium", "low"].map(u => <AppSelectOption key={u} value={u}>{u}</AppSelectOption>)}
        </AppSelect>
        <span className="text-[10px] text-slate-600 ml-auto">{events?.length || 0} events</span>
      </div>

      {/* Category Quick Stats */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(by_category || {}).map(([cat, count]) => {
          const cfg = categories?.[cat];
          if (!cfg) return null;
          return (
            <button key={cat} onClick={() => setFilter(f => ({ ...f, category: f.category === cat ? "" : cat }))}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all border ${filter.category === cat ? "border-white/20 bg-white/5" : "border-white/5 hover:bg-white/[0.03]"}`}
              style={{ color: cfg.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}: {count}
            </button>
          );
        })}
      </div>

      {/* Event Feed */}
      {events?.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Bell size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No events match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events?.map(ev => {
            const cfg = ev.config || categories?.[ev.category] || {};
            return (
              <div key={ev.id} data-testid={`mc-event-${ev.id}`}
                className={`rounded-xl border bg-[#11111a] p-4 transition-all ${ev.resolved ? "border-white/[0.03] opacity-60" : "border-white/5 hover:border-white/10"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: (cfg.color || "#64748B") + "15" }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color || "#64748B" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <UrgencyBadge level={ev.urgency} />
                      <CategoryBadge config={cfg} />
                      {ev.department && <span className="text-[10px] text-slate-500">{ev.department}</span>}
                      {ev.resolved && <span className="text-[10px] text-emerald-400/60"><CheckCircle size={10} className="inline mr-0.5" />Resolved</span>}
                    </div>
                    <p className="text-sm text-white font-medium">{ev.title}</p>
                    {ev.description && <p className="text-xs text-slate-400 mt-0.5">{ev.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-600 flex items-center gap-1"><Clock size={10} />{new Date(ev.timestamp).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-600">Score: {ev.priority_score}</span>
                      {ev.source && <span className="text-[10px] text-slate-600">{ev.source}</span>}
                    </div>
                  </div>
                  {!ev.resolved && (
                    <button onClick={() => resolve(ev.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400/60 hover:text-emerald-400 transition-all flex-shrink-0" title="Resolve">
                      <CheckCircle size={16} />
                    </button>
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
