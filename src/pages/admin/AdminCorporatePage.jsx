import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Building2, Plus, Search, Users } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function AdminCorporatePage() {
  const [corps, setCorps] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchCorps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20 });
      if (search) params.set("search", search);
      const res = await api.get(`/admin/corporates?${params}`);
      setCorps(res.data.corporates || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCorps(); }, [fetchCorps]);

  return (
    <div className="space-y-5" data-testid="admin-corporate-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Corporate Clients</h1>
          <p className="text-sm text-slate-500 mt-1">{total} corporate accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} data-testid="create-corporate-btn"
          className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg transition-all">
          <Plus size={16} /> Add Corporate
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..."
          data-testid="corporate-search"
          className="w-full pl-10 pr-4 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : corps.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Building2 size={32} className="mx-auto mb-2 opacity-30" />
          <p>No corporate clients yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corps.map(c => (
            <div key={c.id} className="bg-[#11111a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all" data-testid={`corp-card-${c.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#7B35D8]/10 flex-shrink-0">
                  <Building2 size={18} className="text-[#7B35D8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white truncate">{c.company_name}</h3>
                  <p className="text-xs text-slate-500">{c.industry}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div><span className="text-slate-500">Employees:</span> <span className="text-white">{c.enrolled_employees || 0}</span></div>
                <div><span className="text-slate-500">License:</span> <span className="text-white">{c.license_count}</span></div>
                <div><span className="text-slate-500">Plan:</span> <span className="text-white">{c.plan?.replace(/_/g, " ")}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className={c.status === "active" ? "text-emerald-400" : "text-red-400"}>{c.status}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateCorporateModal onClose={() => setShowCreate(false)} onCreated={fetchCorps} />}
    </div>
  );
}

function CreateCorporateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ company_name: "", industry: "Technology", admin_email: "", license_count: 100, plan: "velocity_circuit" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/corporates", form);
      onCreated();
      onClose();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="create-corporate-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Corporate Client</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Company Name" required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
            data-testid="create-corp-name"
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <input type="text" placeholder="Industry" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <input type="email" placeholder="Admin Email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="License Count" value={form.license_count} onChange={e => setForm(f => ({ ...f, license_count: parseInt(e.target.value) || 0 }))}
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
            <AppSelect value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              <AppSelectOption value="velocity_circuit">Velocity Circuit</AppSelectOption>
              <AppSelectOption value="titan_arena">Titan Arena</AppSelectOption>
              <AppSelectOption value="apex_nexus">Apex Nexus</AppSelectOption>
            </AppSelect>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} data-testid="create-corp-submit"
              className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
