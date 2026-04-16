import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Headphones, Plus, MessageSquare, CheckCircle, X } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const CAT_LABELS = { it_hardware: "IT Hardware", it_software: "IT Software", it_access: "IT Access", hr_policy: "HR Policy", hr_payroll: "HR Payroll", hr_leave: "HR Leave", facilities: "Facilities", admin_request: "Admin", other: "Other" };
const STATUS_COLORS = { open: "bg-blue-500/10 text-blue-400", in_progress: "bg-amber-500/10 text-amber-400", waiting_for_info: "bg-purple-500/10 text-purple-400", resolved: "bg-emerald-500/10 text-emerald-400", closed: "bg-slate-500/10 text-slate-400" };
const PRI_COLORS = { critical: "text-red-400", high: "text-orange-400", medium: "text-amber-400", low: "text-slate-400" };

export default function AdminHRMSHelpdeskPage() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 30 });
    if (statusFilter) params.set("status", statusFilter);
    if (catFilter) params.set("category", catFilter);
    try {
      const [tRes, aRes] = await Promise.all([api.get(`/admin/hrms/helpdesk?${params}`), api.get("/admin/hrms/helpdesk/analytics")]);
      setTickets(tRes.data.tickets || []); setTotal(tRes.data.total || 0); setAnalytics(aRes.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [statusFilter, catFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  if (selected) return <HelpdeskDetail ticketId={selected} onBack={() => { setSelected(null); fetch(); }} />;

  return (
    <div className="space-y-5" data-testid="admin-hrms-helpdesk-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Internal Helpdesk</h1><p className="text-sm text-slate-500 mt-1">{total} tickets</p></div>
        <button onClick={() => setShowCreate(true)} data-testid="create-helpdesk-btn" className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg"><Plus size={16} /> New Ticket</button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-3 text-center"><p className="text-lg font-bold text-blue-400">{analytics?.open || 0}</p><p className="text-[10px] text-slate-500">Open</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-3 text-center"><p className="text-lg font-bold text-amber-400">{analytics?.in_progress || 0}</p><p className="text-[10px] text-slate-500">In Progress</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-3 text-center"><p className="text-lg font-bold text-emerald-400">{analytics?.resolved || 0}</p><p className="text-[10px] text-slate-500">Resolved</p></div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-3 text-center"><p className="text-lg font-bold text-white">{analytics?.total || 0}</p><p className="text-[10px] text-slate-500">Total</p></div>
      </div>

      <div className="flex gap-3">
        <AppSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Status</AppSelectOption>{Object.keys(STATUS_COLORS).map(s => <AppSelectOption key={s} value={s}>{s.replace(/_/g," ")}</AppSelectOption>)}
        </AppSelect>
        <AppSelect value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Categories</AppSelectOption>{Object.entries(CAT_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
        </AppSelect>
      </div>

      <div className="space-y-2">
        {loading ? <div className="text-center py-12 text-slate-500">Loading...</div> : tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><Headphones size={32} className="mx-auto mb-2 opacity-30" />No tickets</div>
        ) : tickets.map(t => (
          <button key={t.id} onClick={() => setSelected(t.id)} className="w-full bg-[#11111a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[#7B35D8]">{t.id}</span>
              <span className={`text-[10px] ${PRI_COLORS[t.priority] || ""}`}>{t.priority}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || ""}`}>{t.status?.replace(/_/g," ")}</span>
              <span className="text-[10px] text-slate-600">{CAT_LABELS[t.category] || t.category}</span>
            </div>
            <h3 className="text-sm text-white font-medium">{t.subject}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.employee_name} &middot; {t.department} &middot; {t.created_at?.slice(0, 10)}</p>
          </button>
        ))}
      </div>

      {showCreate && <CreateHelpdeskModal onClose={() => setShowCreate(false)} onCreated={fetch} />}
    </div>
  );
}

function HelpdeskDetail({ ticketId, onBack }) {
  const [data, setData] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    try { const res = await api.get(`/admin/hrms/helpdesk/${ticketId}`); setData(res.data); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [ticketId]);
  useEffect(() => { fetch(); }, [fetch]);
  const sendReply = async (isResolution = false) => {
    if (!reply.trim()) return;
    await api.post(`/admin/hrms/helpdesk/${ticketId}/reply`, { message: reply, is_resolution: isResolution });
    setReply(""); fetch();
  };
  if (loading) return <div className="text-center py-12 text-slate-500">Loading...</div>;
  const ticket = data?.ticket;
  return (
    <div className="space-y-4" data-testid="helpdesk-detail">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">Back to tickets</button>
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white">{ticket?.subject}</h2>
        <p className="text-xs text-slate-500 mt-1">{ticket?.id} | {ticket?.employee_name} | {CAT_LABELS[ticket?.category]} | {ticket?.created_at?.slice(0, 16).replace("T", " ")}</p>
        {ticket?.description && <p className="text-sm text-slate-300 mt-3 p-3 bg-white/[0.02] rounded-lg">{ticket.description}</p>}
        <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto">
          {(data?.messages || []).map(m => (
            <div key={m.id} className={`p-3 rounded-lg ${m.is_resolution ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-white/[0.02] border border-white/5"}`}>
              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium text-white">{m.sender_name}</span>{m.is_resolution && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded">Resolution</span>}<span className="text-[10px] text-slate-600 ml-auto">{m.sent_at?.slice(11, 16)}</span></div>
              <p className="text-sm text-slate-300">{m.message}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/5 pt-3">
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="Type a reply..." className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none resize-none" />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => sendReply(false)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-white text-xs rounded-lg hover:bg-white/10">Reply</button>
            <button onClick={() => sendReply(true)} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20">Resolve</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateHelpdeskModal({ onClose, onCreated }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: "", category: "it_hardware", subject: "", description: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/hrms/employees?limit=200&status=active").then(r => setEmployees(r.data.employees || [])).catch(() => {}); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post("/admin/hrms/helpdesk", form); onCreated(); onClose(); } catch (e) { alert(e.response?.data?.detail || "Failed"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">New Helpdesk Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AppSelect value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
            <AppSelectOption value="">Select Employee</AppSelectOption>{employees.map(e => <AppSelectOption key={e.id} value={e.id}>{e.first_name} {e.last_name}</AppSelectOption>)}
          </AppSelect>
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {Object.entries(CAT_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
            </AppSelect>
            <AppSelect value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {["critical","high","medium","low"].map(p => <AppSelectOption key={p} value={p}>{p}</AppSelectOption>)}
            </AppSelect>
          </div>
          <input type="text" placeholder="Subject" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <textarea placeholder="Description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none resize-none" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
