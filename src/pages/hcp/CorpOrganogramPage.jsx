import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, ChevronDown, ChevronRight, HeartPulse,
  User, Mail,
} from "lucide-react";

const HEALTH_COLORS = { green: "#10B981", yellow: "#D97706", red: "#EF4444" };

export default function CorpOrganogramPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("/corporate/organogram").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const toggle = (name) => setExpanded(e => ({ ...e, [name]: !e[name] }));

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { departments, span_analytics } = data;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-organogram-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Organogram <span className="text-indigo-400">Engine</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">{span_analytics.total_departments} DEPARTMENTS &bull; {span_analytics.total_employees} EMPLOYEES &bull; INTERACTIVE ORG VIEW</p>
      </div>

      {/* Span Analytics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Departments", value: span_analytics.total_departments, color: "#6366F1" },
          { label: "Avg Span of Control", value: span_analytics.avg_span, color: "#D97706" },
          { label: "Largest Team", value: span_analytics.max_span, color: "#EF4444" },
          { label: "Smallest Team", value: span_analytics.min_span, color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
            <p className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Org Tree */}
      <div className="space-y-3" data-testid="org-tree">
        {/* Root Node */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.04] p-4 text-center">
          <Building2 size={24} className="text-indigo-400 mx-auto mb-1" />
          <p className="font-display text-sm font-bold text-white">AgeReboot Corporate</p>
          <p className="font-mono text-[8px] text-slate-500">{span_analytics.total_employees} employees &bull; {span_analytics.total_departments} departments</p>
        </div>

        {/* Department Nodes */}
        <div className="grid grid-cols-1 gap-2 pl-6 border-l-2 border-indigo-500/20 ml-6">
          {departments.map(dept => {
            const isOpen = expanded[dept.name];
            return (
              <div key={dept.name} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden" data-testid={`org-dept-${dept.name}`}>
                <button onClick={() => toggle(dept.name)} className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: HEALTH_COLORS[dept.health_rating] + "15" }}>
                    <Users size={16} style={{ color: HEALTH_COLORS[dept.health_rating] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-medium text-white">{dept.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-mono text-[8px] text-slate-500">{dept.member_count} members</span>
                      <span className="font-mono text-[8px] font-bold" style={{ color: HEALTH_COLORS[dept.health_rating] }}>Avg HPS: {dept.avg_hps}</span>
                    </div>
                  </div>
                  <Badge className="font-mono text-[7px] capitalize shrink-0" style={{ backgroundColor: HEALTH_COLORS[dept.health_rating] + "15", color: HEALTH_COLORS[dept.health_rating] }}>{dept.health_rating}</Badge>
                  {isOpen ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 p-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dept.members.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono ${i === 0 ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-slate-500"}`}>
                            {i === 0 ? <Crown size={12} className="text-amber-400" /> : m.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-[10px] text-white truncate">{m.name}</p>
                            <p className="font-mono text-[7px] text-slate-500 truncate">{m.role_title} {i === 0 && "(Lead)"}</p>
                          </div>
                          <span className="font-mono text-[10px] font-bold shrink-0" style={{ color: m.hps >= 600 ? "#10B981" : m.hps >= 400 ? "#D97706" : "#EF4444" }}>{m.hps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Crown(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5.21 16.5h13.58"/></svg>;
}
