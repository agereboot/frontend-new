import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Clock, CheckCircle, AlertTriangle, Send, User } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const API = process.env.REACT_APP_BACKEND_URL;

export default function CorpCareEscalationPage() {
  const { token } = useAuth();
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: "", employee_name: "", reason: "", type: "clinical_review", urgency: "normal" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [escRes, empRes] = await Promise.all([
        fetch(`${API}/api/corporate/care-team-escalations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/corporate/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (escRes.ok) { const d = await escRes.json(); setEscalations(d.escalations || []); }
      if (empRes.ok) { const d = await empRes.json(); setEmployees(d.employees || d || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.employee_id || !form.reason) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/corporate/escalate-to-care-team`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowForm(false); setForm({ employee_id: "", employee_name: "", reason: "", type: "clinical_review", urgency: "normal" }); fetchData(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const TYPES = { clinical_review: "Clinical Review", prescription_request: "Prescription Request", data_gap_followup: "Data Gap Follow-up", intervention_needed: "Intervention Needed" };
  const URGENCY_COLORS = { high: "bg-red-500/10 text-red-400", normal: "bg-amber-500/10 text-amber-400", low: "bg-zinc-500/10 text-zinc-400" };

  return (
    <div className="space-y-6" data-testid="care-escalation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ArrowUpRight size={24} className="text-orange-400"/>Escalate to Care Team</h1>
          <p className="text-zinc-400 text-sm mt-1">Route clinical matters to the appropriate care team members</p>
        </div>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowForm(true)} data-testid="new-escalation-btn">
          <Send size={14} className="mr-1"/>New Escalation
        </Button>
      </div>

      {/* New Escalation Form */}
      {showForm && (
        <Card className="bg-[#0f0f1a] border-orange-900/40" data-testid="escalation-form">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Employee</label>
                <AppSelect className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white" value={form.employee_id} onChange={e => { const emp = employees.find(x => x.id === e.target.value); setForm(f => ({ ...f, employee_id: e.target.value, employee_name: emp?.name || "" })); }} data-testid="escalation-employee-select">
                  <AppSelectOption value="">Select employee...</AppSelectOption>
                  {employees.map(emp => <AppSelectOption key={emp.id} value={emp.id}>{emp.name}</AppSelectOption>)}
                </AppSelect>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Type</label>
                <AppSelect className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} data-testid="escalation-type-select">
                  {Object.entries(TYPES).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
                </AppSelect>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Reason</label>
              <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white min-h-[60px]" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Describe the clinical concern..." data-testid="escalation-reason-input"/>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400">Urgency:</label>
              {["low", "normal", "high"].map(u => (
                <Button key={u} variant={form.urgency === u ? "default" : "outline"} size="sm" onClick={() => setForm(f => ({ ...f, urgency: u }))} className={`text-xs capitalize ${form.urgency === u ? (u === "high" ? "bg-red-600" : u === "normal" ? "bg-amber-600" : "bg-zinc-600") : "border-zinc-700 text-zinc-400"}`}>{u}</Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={handleSubmit} disabled={submitting || !form.employee_id || !form.reason} data-testid="submit-escalation-btn">
                {submitting ? "Sending..." : "Escalate to Care Team"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escalation History */}
      <Card className="bg-[#0f0f1a] border-zinc-800" data-testid="escalation-list">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">Escalation History ({escalations.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading && <div className="text-zinc-500 text-center py-8">Loading...</div>}
          {!loading && escalations.length === 0 && <div className="text-zinc-500 text-center py-8">No escalations yet</div>}
          {escalations.map(esc => (
            <div key={esc.id} className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50" data-testid={`escalation-${esc.id}`}>
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0"><User size={14} className="text-orange-400"/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{esc.employee_name || esc.employee_id}</span>
                  <Badge className={`text-[10px] ${URGENCY_COLORS[esc.urgency] || URGENCY_COLORS.normal}`}>{esc.urgency}</Badge>
                  <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700">{TYPES[esc.type] || esc.type}</Badge>
                </div>
                <div className="text-xs text-zinc-400 mt-1">{esc.reason}</div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={`text-[10px] ${esc.status === "open" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {esc.status === "open" ? <Clock size={10} className="mr-1"/> : <CheckCircle size={10} className="mr-1"/>}{esc.status}
                  </Badge>
                  <span className="text-[10px] text-zinc-500">{esc.created_at ? new Date(esc.created_at).toLocaleString() : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
