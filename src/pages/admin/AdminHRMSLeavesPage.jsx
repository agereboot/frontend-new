import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Calendar, CheckCircle, XCircle, Clock, Plus, X } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const STATUS_COLORS = { pending: "bg-amber-500/10 text-amber-400", approved: "bg-emerald-500/10 text-emerald-400", rejected: "bg-red-500/10 text-red-400", cancelled: "bg-slate-500/10 text-slate-400" };
const LEAVE_LABELS = { casual_leave: "Casual", sick_leave: "Sick", earned_leave: "Earned", comp_off: "Comp Off", maternity: "Maternity", paternity: "Paternity", bereavement: "Bereavement", unpaid: "Unpaid" };

export default function AdminHRMSLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 30 });
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("leave_type", typeFilter);
    try { const res = await api.get(`/admin/hrms/leaves?${params}`); setLeaves(res.data.leaves || []); setTotal(res.data.total || 0); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [statusFilter, typeFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleAction = async (id, action) => {
    try { await api.put(`/admin/hrms/leaves/${id}/action`, { action }); fetch(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="space-y-5" data-testid="admin-hrms-leaves-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Leave Management</h1><p className="text-sm text-slate-500 mt-1">{total} leave requests</p></div>
        <button onClick={() => setShowApply(true)} data-testid="apply-leave-btn" className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg"><Plus size={16} /> Apply Leave</button>
      </div>

      <div className="flex gap-3">
        <AppSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Status</AppSelectOption>{Object.keys(STATUS_COLORS).map(s => <AppSelectOption key={s} value={s}>{s}</AppSelectOption>)}
        </AppSelect>
        <AppSelect value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Types</AppSelectOption>{Object.entries(LEAVE_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
        </AppSelect>
      </div>

      <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full"><thead><tr className="border-b border-white/5">
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Employee</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Type</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Period</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Days</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Reason</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Status</th>
          <th className="text-right text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Action</th>
        </tr></thead><tbody>
          {loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading...</td></tr>
          : leaves.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">No leave requests</td></tr>
          : leaves.map(l => (
            <tr key={l.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-4 py-3"><p className="text-sm text-white">{l.employee_name}</p><p className="text-[10px] text-slate-500">{l.department}</p></td>
              <td className="px-4 py-3 text-xs text-slate-300">{LEAVE_LABELS[l.leave_type] || l.leave_type}</td>
              <td className="px-4 py-3 text-xs text-slate-400 font-mono">{l.start_date} to {l.end_date}</td>
              <td className="px-4 py-3 text-sm text-white font-bold">{l.days}</td>
              <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{l.reason || "—"}</td>
              <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status] || ""}`}>{l.status}</span></td>
              <td className="px-4 py-3 text-right">
                {l.status === "pending" && (
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => handleAction(l.id, "approved")} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md" title="Approve"><CheckCircle size={16} /></button>
                    <button onClick={() => handleAction(l.id, "rejected")} className="p-1 text-red-400 hover:bg-red-500/10 rounded-md" title="Reject"><XCircle size={16} /></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>

      {showApply && <ApplyLeaveModal onClose={() => setShowApply(false)} onApplied={fetch} />}
    </div>
  );
}

function ApplyLeaveModal({ onClose, onApplied }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: "", leave_type: "casual_leave", start_date: "", end_date: "", reason: "", is_half_day: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/hrms/employees?limit=200&status=active").then(r => setEmployees(r.data.employees || [])).catch(() => {}); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post("/admin/hrms/leaves/apply", form); onApplied(); onClose(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Apply Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AppSelect value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
            <AppSelectOption value="">Select Employee</AppSelectOption>{employees.map(e => <AppSelectOption key={e.id} value={e.id}>{e.first_name} {e.last_name}</AppSelectOption>)}
          </AppSelect>
          <AppSelect value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
            {Object.entries(LEAVE_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
          </AppSelect>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
            <input type="date" required value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <input type="text" placeholder="Reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Applying..." : "Apply"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
