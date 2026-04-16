import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Users, Search, Building2, UserPlus, UserX, ChevronRight, Network, Plus, X } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const DEPT_COLORS = { Engineering: "#7B35D8", Product: "#3B82F6", Design: "#EC4899", Marketing: "#F59E0B", Sales: "#10B981", Operations: "#0F9F8F", "Human Resources": "#8B5CF6", Finance: "#EF4444", Clinical: "#06B6D4", Research: "#6366F1" };

export default function AdminHRMSEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showOrgChart, setShowOrgChart] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set("search", search);
    if (deptFilter) params.set("department", deptFilter);
    if (statusFilter) params.set("status", statusFilter);
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get(`/admin/hrms/employees?${params}`),
        api.get("/admin/hrms/departments"),
      ]);
      setEmployees(empRes.data.employees || []);
      setTotal(empRes.data.total || 0);
      setDepartments(deptRes.data.departments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, deptFilter, statusFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5" data-testid="admin-hrms-employees-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-1">{total} employees</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOrgChart(true)} data-testid="org-chart-btn" className="flex items-center gap-2 px-3 py-2 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5"><Network size={16} /> Org Chart</button>
          <button onClick={() => setShowCreate(true)} data-testid="create-employee-btn" className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg"><Plus size={16} /> Add Employee</button>
        </div>
      </div>

      {/* Department Cards */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {departments.map(d => (
          <button key={d.name} onClick={() => setDeptFilter(deptFilter === d.name ? "" : d.name)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg border text-xs transition-all ${deptFilter === d.name ? "border-[#7B35D8] bg-[#7B35D8]/10 text-white" : "border-white/5 bg-[#11111a] text-slate-400 hover:border-white/10"}`}>
            <span className="font-medium">{d.name}</span>
            <span className="ml-2 font-bold" style={{ color: DEPT_COLORS[d.name] || "#7B35D8" }}>{d.headcount}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none" />
        </div>
        <AppSelect value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Status</AppSelectOption>
          <AppSelectOption value="active">Active</AppSelectOption><AppSelectOption value="on_notice">On Notice</AppSelectOption><AppSelectOption value="offboarded">Offboarded</AppSelectOption>
        </AppSelect>
      </div>

      {/* Employee Table */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full" data-testid="employees-table">
          <thead><tr className="border-b border-white/5">
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Employee</th>
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Code</th>
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Department</th>
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Designation</th>
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Type</th>
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Status</th>
            <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Joined</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading...</td></tr>
            : employees.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">No employees found</td></tr>
            : employees.map(e => (
              <tr key={e.id} onClick={() => setSelected(e.id)} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer">
                <td className="px-4 py-3"><p className="text-sm text-white font-medium">{e.first_name} {e.last_name}</p><p className="text-[10px] text-slate-500 font-mono">{e.email}</p></td>
                <td className="px-4 py-3 text-xs text-[#7B35D8] font-mono">{e.employee_code}</td>
                <td className="px-4 py-3"><span className="text-xs" style={{ color: DEPT_COLORS[e.department] || "#94a3b8" }}>{e.department}</span></td>
                <td className="px-4 py-3 text-xs text-slate-400">{e.designation || "—"}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{e.employment_type?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${e.status === "active" ? "bg-emerald-500/10 text-emerald-400" : e.status === "offboarded" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{e.status}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">{e.date_of_joining?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} onCreated={fetch} departments={departments} />}
      {selected && <EmployeeDetailModal empId={selected} onClose={() => setSelected(null)} onUpdated={fetch} />}
      {showOrgChart && <OrgChartModal onClose={() => setShowOrgChart(false)} />}
    </div>
  );
}

function CreateEmployeeModal({ onClose, onCreated, departments }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", department: "Engineering", designation: "", employment_type: "full_time", salary_annual: 0, location: "Bangalore", skills: [] });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post("/admin/hrms/employees", form); onCreated(); onClose(); }
    catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="create-employee-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="First Name" required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
            <input type="text" placeholder="Last Name" required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <input type="text" placeholder="Designation" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {["Engineering","Product","Design","Marketing","Sales","Operations","Human Resources","Finance","Legal","Customer Success","Clinical","Research"].map(d => <AppSelectOption key={d} value={d}>{d}</AppSelectOption>)}
            </AppSelect>
            <AppSelect value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {["full_time","part_time","contract","intern","consultant"].map(t => <AppSelectOption key={t} value={t}>{t.replace(/_/g," ")}</AppSelectOption>)}
            </AppSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Annual Salary" value={form.salary_annual} onChange={e => setForm(f => ({ ...f, salary_annual: parseFloat(e.target.value) || 0 }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
            <input type="text" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} data-testid="create-emp-submit" className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeDetailModal({ empId, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/admin/hrms/employees/${empId}`).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [empId]);
  if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;
  const emp = data?.employee;
  if (!emp) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="employee-detail-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{emp.first_name} {emp.last_name}</h2>
            <p className="text-xs text-[#7B35D8] font-mono">{emp.employee_code} &middot; {emp.designation}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-slate-500">Email:</span> <span className="text-white font-mono text-xs">{emp.email}</span></div>
          <div><span className="text-slate-500">Phone:</span> <span className="text-white">{emp.phone || "—"}</span></div>
          <div><span className="text-slate-500">Department:</span> <span className="text-white">{emp.department}</span></div>
          <div><span className="text-slate-500">Type:</span> <span className="text-white">{emp.employment_type?.replace(/_/g, " ")}</span></div>
          <div><span className="text-slate-500">Location:</span> <span className="text-white">{emp.location}</span></div>
          <div><span className="text-slate-500">Status:</span> <span className={emp.status === "active" ? "text-emerald-400" : "text-red-400"}>{emp.status}</span></div>
          <div><span className="text-slate-500">Joined:</span> <span className="text-white font-mono text-xs">{emp.date_of_joining}</span></div>
          <div><span className="text-slate-500">Salary:</span> <span className="text-white">{emp.salary_annual?.toLocaleString("en-IN")} {emp.salary_currency}/yr</span></div>
        </div>
        {data?.manager && <div className="p-3 bg-white/[0.02] rounded-lg mb-3"><p className="text-[10px] text-slate-500 uppercase mb-1">Reports To</p><p className="text-sm text-white">{data.manager.first_name} {data.manager.last_name} — {data.manager.designation}</p></div>}
        {data?.direct_reports?.length > 0 && <div className="p-3 bg-white/[0.02] rounded-lg mb-3"><p className="text-[10px] text-slate-500 uppercase mb-1">Direct Reports ({data.direct_reports.length})</p>{data.direct_reports.map(r => <p key={r.id} className="text-xs text-slate-300">{r.first_name} {r.last_name} — {r.designation}</p>)}</div>}
        {data?.leave_balance && <div className="p-3 bg-white/[0.02] rounded-lg mb-3"><p className="text-[10px] text-slate-500 uppercase mb-1">Leave Balance</p><div className="grid grid-cols-4 gap-2 mt-1">{["casual_leave","sick_leave","earned_leave","comp_off"].map(lt => (<div key={lt} className="text-center"><p className="text-xs font-bold text-white">{data.leave_balance[lt]?.balance || 0}</p><p className="text-[9px] text-slate-500">{lt.replace(/_/g," ")}</p></div>))}</div></div>}
        {data?.assigned_assets?.length > 0 && <div className="p-3 bg-white/[0.02] rounded-lg"><p className="text-[10px] text-slate-500 uppercase mb-1">Assigned Assets ({data.assigned_assets.length})</p>{data.assigned_assets.map(a => <p key={a.id} className="text-xs text-slate-300">{a.asset_tag} — {a.brand} {a.model} ({a.asset_type})</p>)}</div>}
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Close</button>
      </div>
    </div>
  );
}

function OrgChartModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/admin/hrms/org-chart").then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  const renderNode = (node, depth = 0) => (
    <div key={node.id} style={{ marginLeft: depth * 24 }} className="py-1">
      <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DEPT_COLORS[node.department] || "#7B35D8" }} />
        <span className="text-xs text-white font-medium">{node.first_name} {node.last_name}</span>
        <span className="text-[10px] text-slate-500">{node.designation} &middot; {node.department}</span>
      </div>
      {node.children?.map(c => renderNode(c, depth + 1))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="org-chart-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Organization Chart</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        {loading ? <div className="text-center py-8 text-slate-500">Loading...</div> :
         !data?.org_chart?.length ? <p className="text-slate-500 text-center py-8">No employees yet</p> :
         data.org_chart.map(node => renderNode(node))}
      </div>
    </div>
  );
}
