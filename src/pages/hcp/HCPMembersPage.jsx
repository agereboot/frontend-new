import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Users, Search, Filter, TrendingUp, TrendingDown, Minus,
  Bell, ChevronRight, ArrowUpDown, BookOpen,
} from "lucide-react";

const TIER_COLORS = {
  CENTENARIAN: "#0F9F8F", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1",
  VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626", UNKNOWN: "#475569",
};
const TREND_ICON = { improving: TrendingUp, declining: TrendingDown, stable: Minus };
const TREND_COLOR = { improving: "text-emerald-400", declining: "text-red-400", stable: "text-slate-400" };

export default function HCPMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("hps");
  const [filterTier, setFilterTier] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sortBy) params.set("sort_by", sortBy);
    if (filterTier) params.set("filter_tier", filterTier);
    api.get(`/cc/members?${params}`).then(r => { setMembers(r.data.members); setLoading(false); }).catch(() => setLoading(false));
  }, [search, sortBy, filterTier]);

  const tiers = [...new Set(members.map(m => m.tier))].filter(Boolean);
  const tierGroups = tiers.reduce((acc, t) => { acc[t] = members.filter(m => m.tier === t).length; return acc; }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-members-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Member <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#4F46E5]">Panel</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Full Cohort Overview</p>
        </div>
        <Badge className="font-mono text-xs bg-white/5 text-slate-300 border border-white/10">{members.length} members</Badge>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap" data-testid="member-filters">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input data-testid="member-search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600 font-body" />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-slate-500" />
          {[["hps", "HPS"], ["alerts", "Alerts"], ["name", "Name"]].map(([v, l]) => (
            <button key={v} data-testid={`sort-${v}`} onClick={() => setSortBy(v)}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${sortBy === v ? "bg-[#7B35D8]/10 border-[#7B35D8]/30 " : "border-white/5 text-slate-500"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <button data-testid="tier-all" onClick={() => setFilterTier("")}
            className={`font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-all ${!filterTier ? "bg-[#7B35D8]/10 border-[#7B35D8]/30 text-white" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"}`}>All</button>
          {Object.keys(tierGroups).sort().map(t => (
            <button key={t} data-testid={`tier-${t}`} onClick={() => setFilterTier(t)}
              className={`font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-all ${filterTier === t ? "text-white" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
              style={filterTier === t ? { backgroundColor: TIER_COLORS[t] + "15", borderColor: TIER_COLORS[t] + "30", color: TIER_COLORS[t] } : { borderColor: "rgba(255,255,255,0.05)" }}>
              {t} ({tierGroups[t]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-black/20 p-12 text-center">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No members found.</p>
        </div>
      ) : (
        <div className="space-y-1.5" data-testid="member-list">
          {members.map((m) => {
            const TIcon = TREND_ICON[m.hps_trend] || Minus;
            const tc = TIER_COLORS[m.tier] || "#475569";
            return (
              <button key={m.id} data-testid={`member-row-${m.id}`} onClick={() => navigate(`/hcp/members/${m.id}`)}
                className="w-full group rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 flex items-center gap-4 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 text-left">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-display text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${tc}30, ${tc}10)`, border: `1px solid ${tc}40` }}>
                  {(m.name || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-white truncate group-hover:text-[#7B35D8] transition-colors">{m.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-mono text-[9px] text-slate-500">{m.age}y &middot; {m.sex}</span>
                    <span className="font-mono text-[9px] text-slate-500">{m.franchise || ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right min-w-[80px]">
                    <span className="font-mono text-xl font-black" style={{ color: tc }}>{Math.round(m.hps_score)}</span>
                    <Badge className="font-mono text-[7px] ml-1.5" style={{ backgroundColor: tc + "15", color: tc, border: `1px solid ${tc}30` }}>{m.tier}</Badge>
                  </div>
                  <div className={`flex items-center gap-1 min-w-[50px] ${TREND_COLOR[m.hps_trend]}`}>
                    <TIcon size={12} />
                    <span className="font-mono text-[9px]">{m.hps_delta > 0 ? "+" : ""}{m.hps_delta}</span>
                  </div>
                  {m.open_alerts > 0 && (
                    <div className="flex items-center gap-1 text-red-400 min-w-[40px]">
                      <Bell size={11} />
                      <span className="font-mono text-[9px]">{m.open_alerts}</span>
                    </div>
                  )}
                  {m.active_protocols > 0 && (
                    <div className="flex items-center gap-1 text-emerald-400 min-w-[40px]">
                      <BookOpen size={11} />
                      <span className="font-mono text-[9px]">{m.active_protocols}</span>
                    </div>
                  )}
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-[#7B35D8] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
