import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database, Activity, FlaskConical, Watch, AlertTriangle,
  CheckCircle, XCircle, Send, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  green: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Healthy" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Gaps" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Critical" },
};

function StatusDot({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.red;
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.bg.replace("/10", "")} mr-1.5`} />;
}

function QualityBar({ pct, status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.red;
  return (
    <div className="w-full h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${c.bg.replace("/10", "")}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function CorpDataQualityPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedEmp, setExpandedEmp] = useState(null);
  const [nudging, setNudging] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/corporate/data-quality`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendNudge = async (emp) => {
    setNudging(emp.employee_id);
    try {
      await fetch(`${API}/api/corporate/data-quality/nudge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: emp.employee_id, gap_type: emp.overall_status === "red" ? "critical_gaps" : "data_update", message: `Please update your health data. Current data quality: ${emp.quality_score}%` }),
      });
    } catch (e) { console.error(e); }
    setNudging(null);
  };

  const escalate = async (emp) => {
    try {
      const res = await fetch(`${API}/api/corporate/escalate-to-care-team`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: emp.employee_id, employee_name: emp.employee_name, reason: `Data quality critical (${emp.quality_score}%) — needs clinical follow-up to collect missing health data`, type: "data_gap_followup", urgency: emp.quality_score < 30 ? "high" : "normal" }),
      });
      if (res.ok) alert("Escalated to care team successfully");
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-zinc-400"><RefreshCw className="animate-spin mr-2" size={20}/>Loading data quality...</div>;
  if (!data) return <div className="text-zinc-400 text-center py-12">Failed to load data quality dashboard</div>;

  const { summary: s, employees: emps, gap_alerts: alerts } = data;

  return (
    <div className="space-y-6" data-testid="data-quality-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Database size={24} className="text-cyan-400"/>Data Quality Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Track biomarker coverage, wearable sync, and lab completeness per employee</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" data-testid="refresh-quality"><RefreshCw size={14} className="mr-1"/>Refresh</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quality-summary">
        <Card className="bg-[#0f0f1a] border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{s.avg_quality_score}%</div>
            <div className="text-xs text-zinc-400 mt-1">Avg Data Quality</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f0f1a] border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{s.avg_biomarker_coverage}%</div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1"><FlaskConical size={12}/>Biomarker Coverage</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f0f1a] border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-violet-400">{s.wearable_connected_pct}%</div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1"><Watch size={12}/>Wearable Fresh</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f0f1a] border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{s.avg_lab_completion}%</div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1"><Activity size={12}/>Lab Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution */}
      <div className="flex gap-3">
        {["green", "amber", "red"].map(st => (
          <Badge key={st} className={`${STATUS_COLORS[st].bg} ${STATUS_COLORS[st].text} ${STATUS_COLORS[st].border} border px-3 py-1`}>
            <StatusDot status={st}/>{s.quality_distribution[st]} {STATUS_COLORS[st].label}
          </Badge>
        ))}
      </div>

      {/* Gap Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-[#0f0f1a] border-red-900/40" data-testid="gap-alerts">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-400 flex items-center gap-2"><AlertTriangle size={16}/>Data Gap Alerts ({alerts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-48 overflow-y-auto">
            {alerts.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-zinc-800/50 last:border-0">
                <Badge variant={a.severity === "high" ? "destructive" : "secondary"} className="text-[10px] px-1.5">{a.severity}</Badge>
                <span className="text-zinc-300 font-medium">{a.employee_name}</span>
                <span className="text-zinc-500">{a.message}</span>
              </div>
            ))}
            {alerts.length > 10 && <div className="text-zinc-500 text-xs pt-1">+{alerts.length - 10} more alerts</div>}
          </CardContent>
        </Card>
      )}

      {/* Employee Table */}
      <Card className="bg-[#0f0f1a] border-zinc-800" data-testid="quality-employee-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300">Employee Data Quality ({emps.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="text-left px-4 py-2">Employee</th>
                  <th className="text-center px-3 py-2">Quality</th>
                  <th className="text-center px-3 py-2">Biomarkers</th>
                  <th className="text-center px-3 py-2">Wearable</th>
                  <th className="text-center px-3 py-2">Lab Panels</th>
                  <th className="text-center px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emps.map(emp => {
                  const sc = STATUS_COLORS[emp.overall_status] || STATUS_COLORS.red;
                  const isExpanded = expandedEmp === emp.employee_id;
                  return (
                    <tr key={emp.employee_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 cursor-pointer" onClick={() => setExpandedEmp(isExpanded ? null : emp.employee_id)} data-testid={`quality-row-${emp.employee_name.replace(/\s/g, "-").toLowerCase()}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusDot status={emp.overall_status}/>
                          <div>
                            <div className="text-white font-medium text-xs">{emp.employee_name}</div>
                            <div className="text-zinc-500 text-[10px]">{emp.department}</div>
                          </div>
                          {isExpanded ? <ChevronUp size={12} className="text-zinc-500"/> : <ChevronDown size={12} className="text-zinc-500"/>}
                        </div>
                      </td>
                      <td className="text-center px-3">
                        <span className={`font-bold text-xs ${sc.text}`}>{emp.quality_score}%</span>
                        <QualityBar pct={emp.quality_score} status={emp.overall_status}/>
                      </td>
                      <td className="text-center px-3">
                        <span className={`text-xs ${STATUS_COLORS[emp.biomarker.status]?.text || "text-zinc-400"}`}>{emp.biomarker.count}/{emp.biomarker.expected}</span>
                      </td>
                      <td className="text-center px-3">
                        {emp.wearable.fresh ? <CheckCircle size={14} className="text-emerald-400 mx-auto"/> : emp.wearable.connected ? <Watch size={14} className="text-amber-400 mx-auto"/> : <XCircle size={14} className="text-red-400 mx-auto"/>}
                      </td>
                      <td className="text-center px-3">
                        <span className={`text-xs ${STATUS_COLORS[emp.lab_panels.status]?.text || "text-zinc-400"}`}>{emp.lab_panels.completed}/{emp.lab_panels.expected}</span>
                      </td>
                      <td className="text-center px-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-center">
                          {emp.overall_status !== "green" && (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-400/10" onClick={() => sendNudge(emp)} disabled={nudging === emp.employee_id} data-testid={`nudge-${emp.employee_id}`}>
                                <Send size={10} className="mr-1"/>{nudging === emp.employee_id ? "..." : "Nudge"}
                              </Button>
                              {emp.overall_status === "red" && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-400 hover:bg-red-400/10" onClick={() => escalate(emp)} data-testid={`escalate-${emp.employee_id}`}>
                                  <AlertTriangle size={10} className="mr-1"/>Escalate
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
