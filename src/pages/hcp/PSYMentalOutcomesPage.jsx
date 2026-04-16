import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, Brain, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function PSYMentalOutcomesPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [wellness, setWellness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/cc/members").then(r => { setMembers(r.data.members || []); setLoading(false); }); }, []);
  useEffect(() => {
    if (selectedId) {
      setWellness(null);
      api.get(`/coach-v2/psy/mental-wellness/${selectedId}`).then(r => setWellness(r.data)).catch(() => {});
    }
  }, [selectedId]);

  const DOMAIN_COLORS = { stress: "#EF4444", mood: "#F59E0B", sleep: "#7B35D8", anxiety: "#6366F1", resilience: "#10B981", cognitive: "#0F9F8F" };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="mental-outcomes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mental Health <span className="text-indigo-400">Outcomes</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">MENTAL WELLNESS SCORE & ASSESSMENT TRENDS</p>
        </div>
        <AppSelect data-testid="mo-member" value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none min-w-[200px]">
          <AppSelectOption value="">Select patient</AppSelectOption>
          {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
        </AppSelect>
      </div>

      {!selectedId && <p className="text-slate-500 text-sm text-center py-16">Select a patient to view mental health outcomes</p>}

      {selectedId && wellness && (
        <>
          {/* Overall MWS */}
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-6 text-center" data-testid="mws-overall">
            <p className="font-mono text-[9px] text-indigo-400 uppercase tracking-wider mb-1">Mental Wellness Score</p>
            <p className="font-display text-5xl font-black text-white">{wellness.overall_mws}</p>
            <p className="font-mono text-[8px] text-slate-500 mt-1">Composite score across all domains (0-100)</p>
          </div>

          {/* Domain Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="mws-domains">
            {Object.entries(wellness.domains || {}).map(([key, d]) => (
              <div key={key} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                <p className="font-mono text-3xl font-black" style={{ color: DOMAIN_COLORS[key] || "#64748B" }}>{d.score}</p>
                <p className="font-body text-xs text-white mt-1">{d.label}</p>
                <p className="font-mono text-[7px] text-slate-500">Source: {d.source}</p>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-black/20 p-5">
              <h3 className="font-display text-sm font-bold text-white mb-3">Domain Radar</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={Object.entries(wellness.domains || {}).map(([k, d]) => ({ domain: d.label, score: d.score }))}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: "#94A3B8", fontSize: 9 }} />
                    <Radar dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Latest Assessments */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-5">
              <h3 className="font-display text-sm font-bold text-white mb-3">Latest Assessments</h3>
              <div className="space-y-2">
                {Object.entries(wellness.latest_assessments || {}).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono text-[8px] bg-indigo-500/10 text-indigo-400">{type}</Badge>
                      <span className="font-mono text-[8px] text-slate-500">{wellness.assessment_counts?.[type] || 0} total</span>
                    </div>
                    {data ? (
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-white">{data.score}</span>
                        <Badge className="font-mono text-[7px] ml-2 bg-white/5 text-slate-300">{data.severity}</Badge>
                        <p className="font-mono text-[7px] text-slate-500">{data.date}</p>
                      </div>
                    ) : <span className="font-mono text-[8px] text-slate-600">No data</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assessment Trend */}
          {wellness.assessment_trend?.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-black/20 p-5">
              <h3 className="font-display text-sm font-bold text-white mb-3">Assessment Score Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wellness.assessment_trend}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }}
                      formatter={(v, n, p) => [v, `${p.payload.type} (${p.payload.severity})`]} />
                    <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: "#6366F1", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {selectedId && !wellness && <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-500" size={24} /></div>}
    </div>
  );
}
