import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { DollarSign, FileText, CheckCircle, Clock, Plus, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function AdminHRMSPayrollPage() {
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [monthFilter, setMonthFilter] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 30 });
    if (monthFilter) params.set("month", monthFilter);
    params.set("year", "2026");
    try {
      const [pRes, sRes] = await Promise.all([
        api.get(`/admin/hrms/payroll?${params}`),
        api.get(`/admin/hrms/payroll/summary?year=2026${monthFilter ? `&month=${monthFilter}` : ""}`),
      ]);
      setPayslips(pRes.data.payslips || []);
      setTotal(pRes.data.total || 0);
      setSummary(sRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [monthFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkPaid = async (id) => {
    await api.put(`/admin/hrms/payroll/${id}/mark-paid`);
    fetch();
  };

  const fmt = (v) => (v || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-5" data-testid="admin-hrms-payroll-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
          <p className="text-sm text-slate-500 mt-1">{total} payslips</p>
        </div>
        <button onClick={() => setShowGenerate(true)} data-testid="generate-payslip-btn" className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg"><Plus size={16} /> Generate Payslip</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Gross</p><p className="text-xl font-bold text-white mt-1">{fmt(summary?.total_gross)}</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Net</p><p className="text-xl font-bold text-emerald-400 mt-1">{fmt(summary?.total_net)}</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Tax Collected</p><p className="text-xl font-bold text-amber-400 mt-1">{fmt(summary?.total_tax)}</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">PF Collected</p><p className="text-xl font-bold text-blue-400 mt-1">{fmt(summary?.total_pf)}</p></div>
      </div>

      <div className="flex gap-3">
        <AppSelect value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value={0}>All Months</AppSelectOption>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <AppSelectOption key={m} value={m}>{new Date(2026, m-1).toLocaleString("en", { month: "long" })}</AppSelectOption>)}
        </AppSelect>
      </div>

      {/* Payslips Table */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/5">
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Employee</th>
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Period</th>
            <th className="text-right text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Gross</th>
            <th className="text-right text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Deductions</th>
            <th className="text-right text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Net Pay</th>
            <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Status</th>
            <th className="text-right text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Action</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading...</td></tr>
            : payslips.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">No payslips generated</td></tr>
            : payslips.map(p => (
              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-4 py-3"><p className="text-sm text-white">{p.employee_name}</p><p className="text-[10px] text-slate-500">{p.employee_code}</p></td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{new Date(2026, p.month-1).toLocaleString("en", { month: "short" })} {p.year}</td>
                <td className="px-4 py-3 text-sm text-white text-right font-mono">{fmt(p.earnings?.gross)}</td>
                <td className="px-4 py-3 text-sm text-red-400 text-right font-mono">{fmt(p.deductions?.total)}</td>
                <td className="px-4 py-3 text-sm text-emerald-400 text-right font-bold font-mono">{fmt(p.net_pay)}</td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${p.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{p.payment_status}</span></td>
                <td className="px-4 py-3 text-right">{p.payment_status === "pending" && <button onClick={() => handleMarkPaid(p.id)} className="text-xs text-[#7B35D8] hover:underline">Mark Paid</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showGenerate && <GeneratePayslipModal onClose={() => setShowGenerate(false)} onGenerated={fetch} />}
    </div>
  );
}

function GeneratePayslipModal({ onClose, onGenerated }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: "", month: new Date().getMonth() + 1, year: 2026, bonus: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/hrms/employees?limit=200&status=active").then(r => setEmployees(r.data.employees || [])).catch(() => {}); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post("/admin/hrms/payroll/generate", form); onGenerated(); onClose(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="generate-payslip-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Generate Payslip</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AppSelect value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
            <AppSelectOption value="">Select Employee</AppSelectOption>
            {employees.map(e => <AppSelectOption key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</AppSelectOption>)}
          </AppSelect>
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <AppSelectOption key={m} value={m}>{new Date(2026, m-1).toLocaleString("en", { month: "long" })}</AppSelectOption>)}
            </AppSelect>
            <input type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: parseFloat(e.target.value) || 0 }))} placeholder="Bonus" className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} data-testid="gen-payslip-submit" className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Generating..." : "Generate"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
