import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Crown, Users } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const ACCENT = "#CFB53B";
const TIER_COLORS = { Bronze: "#CD7F32", Silver: "#C0C0C0", Gold: "#FFD700", Platinum: "#E5E4E2" };

function fmt(v) { return v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`; }

export default function CXOProfitSharePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/cxo/drill/profitshare").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: ACCENT + "30", borderTopColor: ACCENT }} /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load</div>;

  const { tiers, pool_size, pat, monthly_eligibility_trend, by_department, payout_window, scenarios } = data;
  const tierPie = Object.entries(tiers).filter(([, v]) => v.count > 0).map(([k, v]) => ({ name: k, value: v.count, fill: TIER_COLORS[k] }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-profitshare-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profit-Share <span style={{ color: ACCENT }}>Administration</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">5% PAT Distribution Engine &middot; Next payout: {payout_window.next_payout}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase">PAT</p>
          <p className="font-display text-2xl font-bold text-white mt-2">{fmt(pat)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase">Pool (5%)</p>
          <p className="font-display text-2xl font-bold mt-2" style={{ color: ACCENT }}>{fmt(pool_size)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase">Days to Payout</p>
          <p className="font-display text-2xl font-bold text-white mt-2">{payout_window.days_until}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#11111a] p-5 text-center">
          <p className="font-mono text-[8px] text-slate-500 uppercase">Total Eligible</p>
          <p className="font-display text-2xl font-bold text-emerald-400 mt-2">{Object.values(tiers).reduce((a, t) => a + t.count, 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Tier Breakdown */}
        <div className="col-span-12 lg:col-span-5 rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="tier-breakdown">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Tier Distribution & Payouts</p>
          <div className="h-36 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={tierPie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                {tierPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
          {Object.entries(tiers).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] text-xs">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[k] }} /><span className="text-slate-300">{k}</span></div>
              <span className="text-slate-500">{v.range}</span>
              <span className="text-slate-500">{v.multiplier}</span>
              <span className="text-white font-medium">{v.count}</span>
              <span className="font-mono text-xs" style={{ color: TIER_COLORS[k] }}>{fmt(v.payout_share)}</span>
            </div>
          ))}
        </div>

        {/* Eligibility Trend */}
        <div className="col-span-12 lg:col-span-7 rounded-xl border border-white/5 bg-[#11111a] p-5">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Monthly Eligibility Trend</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_eligibility_trend}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="eligible" stroke={ACCENT} fill={ACCENT + "20"} strokeWidth={2} name="Eligible" />
                <Area type="monotone" dataKey="near_eligible" stroke="#F59E0B" fill="#F59E0B10" strokeWidth={1} strokeDasharray="4 4" name="Near Eligible" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="ps-scenarios">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">CFO Scenario Modelling</p>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(scenarios).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/5 p-4">
              <p className="text-xs text-slate-400 capitalize mb-2">{k.replace(/_/g, " ")}</p>
              <p className="text-lg font-bold text-white">{fmt(v.pool)}</p>
              <p className="text-xs text-slate-500 mt-1">{v.eligible} eligible {v.scaling_applied ? <span className="text-amber-400">(cap applied)</span> : ""}</p>
            </div>
          ))}
        </div>
      </div>

      {/* By Department */}
      <div className="rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="ps-dept">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-4">Eligibility by Department</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs border-b border-white/5">
              <th className="pb-2">Department</th><th className="pb-2">Headcount</th><th className="pb-2">Eligible</th><th className="pb-2">Near Eligible</th><th className="pb-2">Conversion %</th>
            </tr></thead>
            <tbody>{by_department.map(d => (
              <tr key={d.department} className="border-b border-white/[0.03] text-slate-300">
                <td className="py-2 text-white font-medium">{d.department}</td>
                <td className="py-2">{d.headcount}</td>
                <td className="py-2 font-mono text-emerald-400">{d.eligible}</td>
                <td className="py-2 font-mono text-amber-400">{d.near}</td>
                <td className="py-2 font-mono">{d.headcount > 0 ? ((d.eligible / d.headcount) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
