import { useState, useEffect } from "react";
import api from "@/lib/api";
import { HeartPulse, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminHPSMonitorPage() {
  const [pillars, setPillars] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/hps/pillar-averages"),
      api.get("/admin/hps/low-score-alerts"),
      api.get("/admin/hps/calculation-logs"),
    ]).then(([p, a, l]) => {
      setPillars(p.data.pillars || {});
      setAlerts(a.data.alerts || []);
      setLogs(l.data.logs || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  const pillarData = Object.entries(pillars).map(([k, v]) => ({ name: k, score: v }));

  return (
    <div className="space-y-6" data-testid="admin-hps-monitor-page">
      <div>
        <h1 className="text-2xl font-bold text-white">HPS Engine Monitor</h1>
        <p className="text-sm text-slate-500 mt-1">Score distribution, pillar averages, and alerts</p>
      </div>

      {/* Pillar Averages */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="hps-pillar-chart">
        <h3 className="text-sm font-semibold text-white mb-4">Platform-Wide Pillar Averages</h3>
        {pillarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pillarData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} domain={[0, 300]} />
              <Tooltip contentStyle={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" fill="#7B35D8" radius={[4, 4, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No HPS data available</p>
        )}
      </div>

      {/* Low Score Alerts */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="hps-alerts">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Low Score Alerts (HPS &lt; 400)</h3>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No low-score alerts</p>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.user_id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <div>
                  <p className="text-sm text-white">{a.user_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{a.user_id?.slice(0, 8)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-400">{a.score}</p>
                  <p className="text-[10px] text-slate-500">{a.computed_at?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Calculations */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="hps-calc-logs">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Calculations ({logs.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] text-slate-500 uppercase px-3 py-2 font-mono">User</th>
                <th className="text-left text-[10px] text-slate-500 uppercase px-3 py-2 font-mono">Score</th>
                <th className="text-left text-[10px] text-slate-500 uppercase px-3 py-2 font-mono">Tier</th>
                <th className="text-left text-[10px] text-slate-500 uppercase px-3 py-2 font-mono">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map(l => (
                <tr key={l.id} className="border-b border-white/[0.03]">
                  <td className="px-3 py-2 text-xs text-slate-400 font-mono">{l.user_id?.slice(0, 8)}...</td>
                  <td className="px-3 py-2 text-sm font-bold text-[#7B35D8]">{l.hps_final || l.total_score || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{l.tier || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 font-mono">{(l.timestamp || l.computed_at || "").slice(0, 16).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
