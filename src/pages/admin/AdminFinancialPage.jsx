import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DollarSign, TrendingUp, Users, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminFinancialPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/financial/overview").then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  const planChart = Object.entries(data?.plan_breakdown || {}).map(([k, v]) => ({
    name: k.replace(/_/g, " "),
    users: v.count,
    revenue: v.monthly_revenue,
  }));

  return (
    <div className="space-y-6" data-testid="admin-financial-page">
      <div>
        <h1 className="text-2xl font-bold text-white">Financial Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Revenue and subscription monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="financial-mrr">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10">
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Monthly MRR</p>
              <p className="text-xl font-bold text-white">{(data?.mrr || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="financial-arr">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
              <TrendingUp size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Annualized ARR</p>
              <p className="text-xl font-bold text-white">{(data?.arr || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="financial-paid">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10">
              <Users size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Paid Subscribers</p>
              <p className="text-xl font-bold text-white">{data?.paid_subscribers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="financial-contracts">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10">
              <Building2 size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Corp Contracts</p>
              <p className="text-xl font-bold text-white">{data?.corporate_contracts || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="financial-plan-chart">
        <h3 className="text-sm font-semibold text-white mb-4">Revenue by Plan</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={planChart}>
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="users" fill="#7B35D8" name="Users" radius={[3, 3, 0, 0]} />
            <Bar dataKey="revenue" fill="#0F9F8F" name="Monthly Revenue (INR)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
