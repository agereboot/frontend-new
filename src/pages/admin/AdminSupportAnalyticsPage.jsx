import { useState, useEffect } from "react";
import api from "@/lib/api";
import { BarChart3, Clock, CheckCircle, AlertTriangle, ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#7B35D8", "#0F9F8F", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function AdminSupportAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/support/analytics").then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  const statusData = Object.entries(data?.status_breakdown || {}).map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v }));
  const catData = Object.entries(data?.by_category || {}).map(([k, v]) => ({ name: k.replace(/_/g, " "), count: v }));
  const priData = Object.entries(data?.by_priority || {}).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div className="space-y-6" data-testid="admin-support-analytics-page">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Team performance and ticket trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="analytics-total">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Tickets</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.total_tickets || 0}</p>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="analytics-open">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Open</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{data?.status_breakdown?.open || 0}</p>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="analytics-resolved">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{data?.status_breakdown?.resolved || 0}</p>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="analytics-escalation">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Escalation Rate</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{data?.escalation_rate || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="analytics-status-chart">
          <h3 className="text-sm font-semibold text-white mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="analytics-category-chart">
          <h3 className="text-sm font-semibold text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 9 }} width={120} />
              <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#7B35D8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
