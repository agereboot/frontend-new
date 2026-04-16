import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Trophy, Users, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

const ACCENT = "#F59E0B";

export default function CXOCompetitivePage() {
  const [fran, setFran] = useState(null);
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/cxo/drill/franchise").then(r => setFran(r.data)),
      api.get("/cxo/drill/talent").then(r => setTalent(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-competitive-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Competitive <span className="text-amber-400">Intelligence</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Franchise Championship, League Standing, Talent Brand</p>
      </div>

      {fran && <>
        {/* Season Info */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Season", value: fran.season_info.name },
            { label: "Weeks Remaining", value: fran.season_info.weeks_remaining },
            { label: "Challenges Done", value: `${fran.season_info.completed_challenges}/${fran.season_info.total_challenges}` },
            { label: "Your Rank", value: `#${fran.league_table?.find(l => l.is_self)?.rank || "—"}` },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-white/5 bg-[#11111a] p-4 text-center">
              <p className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.15em]">{m.label}</p>
              <p className="font-display text-2xl font-bold text-white mt-2">{m.value}</p>
            </div>
          ))}
        </div>

        {/* League Table */}
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="league-table">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Franchise League Standings</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 text-xs border-b border-white/5">
                <th className="pb-2 w-12">#</th><th className="pb-2">Company</th><th className="pb-2">Avg HPS</th><th className="pb-2">Status</th>
              </tr></thead>
              <tbody>{fran.league_table?.map(r => (
                <tr key={r.rank} className={`border-b border-white/[0.03] ${r.is_self ? "bg-amber-500/5" : ""}`}>
                  <td className="py-2 font-mono text-slate-500">{r.rank}</td>
                  <td className={`py-2 font-medium ${r.is_self ? "text-amber-400" : "text-white"}`}>{r.company} {r.is_self && <span className="text-[9px] ml-1 text-amber-500">(You)</span>}</td>
                  <td className="py-2 font-mono">{r.avg_hps}</td>
                  <td className="py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${r.qualification_status === "qualified" ? "bg-emerald-500/10 text-emerald-400" : r.qualification_status === "in_contention" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"}`}>{r.qualification_status.replace("_", " ")}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        {/* Season Timeline */}
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Season Rank Timeline</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fran.season_timeline}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis reversed tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="rank" stroke={ACCENT} fill={ACCENT + "20"} strokeWidth={2} name="Rank" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>}

      {talent && <>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="talent-trend">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Talent Brand — 12-Month Metrics</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={talent.monthly_trend}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="attrition_rate" stroke="#EF4444" fill="#EF444420" strokeWidth={2} name="Attrition %" />
                <Area type="monotone" dataKey="offer_acceptance" stroke="#10B981" fill="#10B98120" strokeWidth={2} name="Offer Accept %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
            <p className="font-mono text-[8px] text-slate-500 uppercase">Annual Savings</p>
            <p className="font-display text-2xl font-bold text-emerald-400 mt-2">₹{(talent.cost_avoidance.annual_savings / 10000000).toFixed(1)}Cr</p>
            <p className="text-xs text-slate-400 mt-1">{talent.cost_avoidance.positions_retained} positions retained</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
            <p className="font-mono text-[8px] text-slate-500 uppercase">Glassdoor Trend</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {talent.employer_brand.glassdoor_trend?.map((v, i) => (
                <div key={i} className="w-6 rounded-sm" style={{ height: `${v * 8}px`, backgroundColor: v >= 4.0 ? "#10B981" : "#F59E0B" }} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
            <p className="font-mono text-[8px] text-slate-500 uppercase">Wellness in Offer Talks</p>
            <p className="font-display text-2xl font-bold text-indigo-400 mt-2">{talent.employer_brand.wellness_in_offer_talks_pct}%</p>
            <p className="text-xs text-slate-400 mt-1">of accepted offers</p>
          </div>
        </div>
      </>}
    </div>
  );
}
