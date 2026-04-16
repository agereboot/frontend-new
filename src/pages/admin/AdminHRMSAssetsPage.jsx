import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Laptop, Monitor, Plus, ArrowRightLeft, X } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TYPE_ICONS = { laptop: Laptop, monitor: Monitor };
const STATUS_COLORS = { available: "bg-emerald-500/10 text-emerald-400", assigned: "bg-blue-500/10 text-blue-400", under_repair: "bg-amber-500/10 text-amber-400", retired: "bg-slate-500/10 text-slate-400", lost: "bg-red-500/10 text-red-400" };

export default function AdminHRMSAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 30 });
    if (typeFilter) params.set("asset_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    try {
      const [aRes, sRes] = await Promise.all([api.get(`/admin/hrms/assets?${params}`), api.get("/admin/hrms/assets/summary")]);
      setAssets(aRes.data.assets || []); setTotal(aRes.data.total || 0); setSummary(sRes.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [typeFilter, statusFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleUnassign = async (id) => { await api.post(`/admin/hrms/assets/${id}/unassign`); fetch(); };

  return (
    <div className="space-y-5" data-testid="admin-hrms-assets-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Asset Management</h1><p className="text-sm text-slate-500 mt-1">{total} assets</p></div>
        <button onClick={() => setShowCreate(true)} data-testid="create-asset-btn" className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg"><Plus size={16} /> Add Asset</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase font-mono">Total Assets</p><p className="text-xl font-bold text-white mt-1">{summary?.total || 0}</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase font-mono">Assigned</p><p className="text-xl font-bold text-blue-400 mt-1">{summary?.assigned || 0}</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase font-mono">Available</p><p className="text-xl font-bold text-emerald-400 mt-1">{summary?.available || 0}</p></div>
      </div>

      <div className="flex gap-3">
        <AppSelect value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Types</AppSelectOption>{["laptop","monitor","keyboard","mouse","headset","phone","desk","chair","access_card","software_license","other"].map(t => <AppSelectOption key={t} value={t}>{t.replace(/_/g," ")}</AppSelectOption>)}
        </AppSelect>
        <AppSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Status</AppSelectOption>{Object.keys(STATUS_COLORS).map(s => <AppSelectOption key={s} value={s}>{s.replace(/_/g," ")}</AppSelectOption>)}
        </AppSelect>
      </div>

      <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full"><thead><tr className="border-b border-white/5">
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Tag</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Type</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Brand / Model</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Serial</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Assigned To</th>
          <th className="text-left text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Status</th>
          <th className="text-right text-[10px] text-slate-500 uppercase px-4 py-3 font-mono">Action</th>
        </tr></thead><tbody>
          {loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading...</td></tr>
          : assets.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-500">No assets</td></tr>
          : assets.map(a => (
            <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-xs text-[#7B35D8] font-mono font-bold">{a.asset_tag}</td>
              <td className="px-4 py-3 text-xs text-slate-300">{a.asset_type?.replace(/_/g," ")}</td>
              <td className="px-4 py-3 text-sm text-white">{a.brand} {a.model}</td>
              <td className="px-4 py-3 text-xs text-slate-500 font-mono">{a.serial_number || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-300">{a.assigned_to_name || "—"}</td>
              <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || ""}`}>{a.status?.replace(/_/g," ")}</span></td>
              <td className="px-4 py-3 text-right">
                {a.status === "available" && <button onClick={() => setShowAssign(a.id)} className="text-xs text-[#7B35D8] hover:underline">Assign</button>}
                {a.status === "assigned" && <button onClick={() => handleUnassign(a.id)} className="text-xs text-amber-400 hover:underline">Unassign</button>}
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>

      {showCreate && <CreateAssetModal onClose={() => setShowCreate(false)} onCreated={fetch} />}
      {showAssign && <AssignAssetModal assetId={showAssign} onClose={() => setShowAssign(null)} onAssigned={fetch} />}
    </div>
  );
}

function CreateAssetModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ asset_type: "laptop", brand: "", model: "", serial_number: "", purchase_cost: 0 });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post("/admin/hrms/assets", form); onCreated(); onClose(); } catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Asset</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AppSelect value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
            {["laptop","monitor","keyboard","mouse","headset","phone","desk","chair","access_card","software_license","other"].map(t => <AppSelectOption key={t} value={t}>{t.replace(/_/g," ")}</AppSelectOption>)}
          </AppSelect>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Brand" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
            <input type="text" placeholder="Model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          </div>
          <input type="text" placeholder="Serial Number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <input type="number" placeholder="Purchase Cost" value={form.purchase_cost} onChange={e => setForm(f => ({ ...f, purchase_cost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignAssetModal({ assetId, onClose, onAssigned }) {
  const [employees, setEmployees] = useState([]);
  const [empId, setEmpId] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/hrms/employees?limit=200&status=active").then(r => setEmployees(r.data.employees || [])).catch(() => {}); }, []);
  const handleAssign = async () => {
    if (!empId) return; setSaving(true);
    try { await api.post(`/admin/hrms/assets/${assetId}/assign`, { employee_id: empId }); onAssigned(); onClose(); } catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-white mb-4">Assign Asset</h2>
        <AppSelect value={empId} onChange={e => setEmpId(e.target.value)} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none mb-3">
          <AppSelectOption value="">Select Employee</AppSelectOption>{employees.map(e => <AppSelectOption key={e.id} value={e.id}>{e.first_name} {e.last_name}</AppSelectOption>)}
        </AppSelect>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
          <button onClick={handleAssign} disabled={saving || !empId} className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Assigning..." : "Assign"}</button>
        </div>
      </div>
    </div>
  );
}
