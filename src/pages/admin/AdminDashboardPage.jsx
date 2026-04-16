import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Users, Building2, HeartPulse, LifeBuoy, DollarSign, Activity, TrendingUp, FileText, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ACCENT = "#7B35D8";
const COLORS = ["#7B35D8", "#0F9F8F", "#F59E0B", "#EF4444", "#3B82F6"];

function KPICard({ icon: Icon, label, value, color = ACCENT, testId }) {
  return (
    <div className="bg-[#11111a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">{label}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, actRes] = await Promise.all([
        api.get("/admin/platform-stats"),
        api.get("/admin/platform-activity"),
      ]);
      setStats(statsRes.data);
      setActivity(actRes.data.activity || []);
    } catch (e) {
      console.error("Failed to fetch admin stats", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" />
    </div>
  );

  const kpis = stats?.kpis || {};
  const roleData = Object.entries(stats?.role_breakdown || {}).map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v }));
  const planData = Object.entries(stats?.plan_distribution || {}).map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v }));

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time platform health and activity</p>
        </div>
        <a href={`${process.env.REACT_APP_BACKEND_URL}/api/download/spec-document`}
           target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-2 bg-[#7B35D8] hover:bg-[#6B2BC8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
           data-testid="download-spec-doc-btn">
          <Download size={16} />
          Download Spec Document
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-kpi-grid">
        <KPICard icon={Users} label="Total Users" value={kpis.total_users || 0} color="#7B35D8" testId="kpi-total-users" />
        <KPICard icon={Activity} label="Active (24h)" value={kpis.daily_active_users || 0} color="#0F9F8F" testId="kpi-active-users" />
        <KPICard icon={Building2} label="Corporate Clients" value={kpis.corporate_clients || 0} color="#3B82F6" testId="kpi-corporates" />
        <KPICard icon={LifeBuoy} label="Open Tickets" value={kpis.open_support_tickets || 0} color="#F59E0B" testId="kpi-open-tickets" />
        <KPICard icon={HeartPulse} label="HPS Reports Today" value={kpis.hps_reports_today || 0} color="#EF4444" testId="kpi-hps-today" />
        <KPICard icon={FileText} label="Lab Uploads Today" value={kpis.lab_uploads_today || 0} color="#8B5CF6" testId="kpi-labs-today" />
        <KPICard icon={DollarSign} label="Total Paid" value={Object.entries(stats?.plan_distribution || {}).filter(([k]) => k !== "free" && k !== "rookie_league").reduce((s, [,v]) => s + v, 0)} color="#10B981" testId="kpi-paid-users" />
        <KPICard icon={TrendingUp} label="User Growth" value={`${stats?.user_growth_30d?.reduce((s, d) => s + d.signups, 0) || 0} (30d)`} color="#EC4899" testId="kpi-growth" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Activity */}
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="chart-daily-activity">
          <h3 className="text-sm font-semibold text-white mb-4">Daily Platform Activity (14d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activity}>
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="logins" fill="#7B35D8" radius={[3, 3, 0, 0]} name="Logins" />
              <Bar dataKey="hps_computations" fill="#0F9F8F" radius={[3, 3, 0, 0]} name="HPS Computations" />
              <Bar dataKey="lab_uploads" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Lab Uploads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="chart-plan-distribution">
          <h3 className="text-sm font-semibold text-white mb-4">Subscription Plan Distribution</h3>
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">No subscription data</div>
          )}
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="chart-role-breakdown">
        <h3 className="text-sm font-semibold text-white mb-4">User Role Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={roleData} layout="vertical">
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} width={140} />
            <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill="#7B35D8" radius={[0, 4, 4, 0]} name="Users" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
