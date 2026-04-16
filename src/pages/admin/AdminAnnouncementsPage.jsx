import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Megaphone, Plus, Trash2, Pencil, X } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TYPE_COLORS = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  maintenance: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  feature: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/announcements?limit=50");
      setItems(res.data.announcements || []);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    await api.delete(`/admin/announcements/${id}`);
    fetch();
  };

  const handleToggle = async (item) => {
    await api.put(`/admin/announcements/${item.id}`, { is_active: !item.is_active });
    fetch();
  };

  return (
    <div className="space-y-5" data-testid="admin-announcements-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">{total} announcements</p>
        </div>
        <button onClick={() => setShowCreate(true)} data-testid="create-announcement-btn"
          className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg transition-all">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-slate-500">Loading...</div> : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><Megaphone size={32} className="mx-auto mb-2 opacity-30" /><p>No announcements yet</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className="bg-[#11111a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all" data-testid={`ann-${a.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_COLORS[a.type] || TYPE_COLORS.info}`}>{a.type}</span>
                    {a.is_pinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">pinned</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                      {a.is_active ? "active" : "inactive"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.message}</p>
                  <p className="text-[10px] text-slate-600 mt-2 font-mono">
                    Target: {a.target_roles?.join(", ")} | Created: {a.created_at?.slice(0, 10)} | By: {a.created_by_name}
                    {a.expires_at && ` | Expires: ${a.expires_at.slice(0, 10)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => handleToggle(a)} title={a.is_active ? "Deactivate" : "Activate"}
                    className={`p-1.5 rounded-md transition-all ${a.is_active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-white/5"}`}>
                    <Megaphone size={14} />
                  </button>
                  <button onClick={() => setEditing(a)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <AnnouncementModal
          existing={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={fetch}
        />
      )}
    </div>
  );
}

function AnnouncementModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing || {
    title: "", message: "", type: "info", target_roles: ["all"],
    is_dismissible: true, is_pinned: false, expires_at: "", action_url: "", action_label: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (existing?.id) {
        await api.put(`/admin/announcements/${existing.id}`, form);
      } else {
        await api.post("/admin/announcements", form);
      }
      onSaved();
      onClose();
    } catch (e) { alert(e.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="announcement-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{existing ? "Edit" : "New"} Announcement</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            data-testid="ann-title" className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <textarea placeholder="Message..." rows={3} required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            data-testid="ann-message" className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} data-testid="ann-type"
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {["info", "warning", "maintenance", "feature", "critical"].map(t => <AppSelectOption key={t} value={t}>{t}</AppSelectOption>)}
            </AppSelect>
            <input type="date" value={form.expires_at?.slice(0, 10) || ""} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" placeholder="Expires" />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="rounded" /> Pinned
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.is_dismissible} onChange={e => setForm(f => ({ ...f, is_dismissible: e.target.checked }))} className="rounded" /> Dismissible
            </label>
          </div>
          <input type="text" placeholder="Action URL (optional)" value={form.action_url || ""} onChange={e => setForm(f => ({ ...f, action_url: e.target.value }))}
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} data-testid="ann-submit"
              className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">
              {saving ? "Saving..." : existing ? "Update" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
