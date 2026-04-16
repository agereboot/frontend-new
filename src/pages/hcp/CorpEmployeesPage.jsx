import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Search, Filter, ChevronDown, ChevronUp,
  HeartPulse, Activity, Zap, DollarSign,
  ArrowUpDown, AlertTriangle, CheckCircle, ExternalLink,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const HPS_TIER_COLORS = { CENTENARIAN: "#C0C0FF", MASTERY: "#10B981", RESILIENCE: "#84CC16", LONGEVITY: "#6366F1", VITALITY: "#D97706", FOUNDATION: "#EF4444", AWAKENING: "#DC2626" };
const EHS_TIER_COLORS = { Champion: "#10B981", Engaged: "#6366F1", Moderate: "#D97706", "At-Risk": "#EF4444", Critical: "#DC2626" };
const BRI_COLORS = { green: "#10B981", yellow: "#D97706", orange: "#F97316", red: "#EF4444" };

export default function CorpEmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("hps_score");
  const [sortDir, setSortDir] = useState("desc");
  const [filterTier, setFilterTier] = useState("all");

  useEffect(() => {
    api.get("/corporate/employees").then(r => setEmployees(r.data.employees || [])).finally(() => setLoading(false));
  }, []);

  const filtered = employees
    .filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.email.toLowerCase().includes(search.toLowerCase()) && !e.department.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTier !== "all" && e.hps_tier !== filterTier) return false;
      return true;
    })
    .sort((a, b) => {
      const val = sortDir === "desc" ? -1 : 1;
      if (sortField === "name") return val * a.name.localeCompare(b.name) * -1;
      return val * ((a[sortField] || 0) - (b[sortField] || 0));
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;

  const tiers = [...new Set(employees.map(e => e.hps_tier))].sort();

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-employees-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Employee <span className="text-amber-400">Management</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">{employees.length} EMPLOYEES TRACKED</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input data-testid="emp-search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none" />
        </div>
        <AppSelect data-testid="emp-filter-tier" value={filterTier} onChange={e => setFilterTier(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
          <AppSelectOption value="all">All Tiers</AppSelectOption>
          {tiers.map(t => <AppSelectOption key={t} value={t}>{t}</AppSelectOption>)}
        </AppSelect>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: employees.length, color: "#64748B" },
          { label: "HPS 600+", value: employees.filter(e => e.hps_score >= 600).length, color: "#10B981" },
          { label: "At-Risk EHS", value: employees.filter(e => e.ehs_tier === "At-Risk" || e.ehs_tier === "Critical").length, color: "#EF4444" },
          { label: "BRI Orange/Red", value: employees.filter(e => e.bri_tier === "orange" || e.bri_tier === "red").length, color: "#F97316" },
          { label: "Profit-Share", value: employees.filter(e => e.profit_share_eligible).length, color: "#D97706" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
            <p className="font-mono text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="emp-table">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  { field: "name", label: "Employee" },
                  { field: "department", label: "Department" },
                  { field: "hps_score", label: "HPS" },
                  { field: "ehs_score", label: "EHS" },
                  { field: "bri_score", label: "BRI" },
                  { field: "profit_share_eligible", label: "Profit-Share" },
                ].map(col => (
                  <th key={col.field} className="px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02]" onClick={() => toggleSort(col.field)}>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">{col.label}</span>
                      {sortField === col.field && <ArrowUpDown size={10} className="text-amber-400" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(emp => (
                <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all cursor-pointer" data-testid={`emp-row-${emp.id}`} onClick={() => navigate(`/hcp/members/${emp.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-body text-xs text-white">{emp.name}</p>
                        <p className="font-mono text-[8px] text-slate-500">{emp.email}</p>
                      </div>
                      <ExternalLink size={10} className="text-slate-600 shrink-0" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-slate-300">{emp.department}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{emp.hps_score}</span>
                      <Badge className="font-mono text-[6px]" style={{ backgroundColor: (HPS_TIER_COLORS[emp.hps_tier] || "#64748B") + "15", color: HPS_TIER_COLORS[emp.hps_tier] || "#64748B" }}>{emp.hps_tier}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold" style={{ color: EHS_TIER_COLORS[emp.ehs_tier] || "#64748B" }}>{emp.ehs_score}</span>
                      <Badge className="font-mono text-[6px]" style={{ backgroundColor: (EHS_TIER_COLORS[emp.ehs_tier] || "#64748B") + "15", color: EHS_TIER_COLORS[emp.ehs_tier] || "#64748B" }}>{emp.ehs_tier}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRI_COLORS[emp.bri_tier] }} />
                      <span className="font-mono text-[10px] text-slate-300 capitalize">{emp.bri_tier}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {emp.profit_share_eligible
                      ? <Badge className="font-mono text-[7px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle size={10} className="mr-0.5" />Eligible</Badge>
                      : <Badge className="font-mono text-[7px] bg-white/5 text-slate-500">Ineligible</Badge>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="p-3 text-center border-t border-white/5">
            <p className="font-mono text-[9px] text-slate-500">Showing 50 of {filtered.length} employees</p>
          </div>
        )}
      </div>
    </div>
  );
}
