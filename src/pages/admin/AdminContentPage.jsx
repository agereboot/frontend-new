import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { FileText, Plus, Trash2, Pencil, X, Eye, EyeOff } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const STATUS_COLORS = { draft: "bg-slate-500/10 text-slate-400", published: "bg-emerald-500/10 text-emerald-400", archived: "bg-amber-500/10 text-amber-400" };
const TYPE_LABELS = { health_tip: "Health Tip", article: "Article", faq: "FAQ", notification_template: "Notification", onboarding_step: "Onboarding" };

export default function AdminContentPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 30 });
    if (typeFilter) params.set("content_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    try {
      const res = await api.get(`/admin/content?${params}`);
      setItems(res.data.content || []);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter, search]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this content?")) return;
    await api.delete(`/admin/content/${id}`);
    fetch();
  };

  return (
    <div className="space-y-5" data-testid="admin-content-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-sm text-slate-500 mt-1">{total} content items</p>
        </div>
        <button onClick={() => setShowCreate(true)} data-testid="create-content-btn"
          className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg transition-all">
          <Plus size={16} /> New Content
        </button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none w-64" />
        <AppSelect value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Types</AppSelectOption>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
        </AppSelect>
        <AppSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Status</AppSelectOption>
          <AppSelectOption value="draft">Draft</AppSelectOption><AppSelectOption value="published">Published</AppSelectOption><AppSelectOption value="archived">Archived</AppSelectOption>
        </AppSelect>
      </div>

      {loading ? <div className="text-center py-12 text-slate-500">Loading...</div> : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><FileText size={32} className="mx-auto mb-2 opacity-30" /><p>No content items</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(c => (
            <div key={c.id} className="bg-[#11111a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all" data-testid={`content-${c.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7B35D8]/10 text-[#7B35D8]">{TYPE_LABELS[c.content_type] || c.content_type}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || ""}`}>{c.status}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="p-1 text-slate-500 hover:text-white"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white truncate">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.body?.slice(0, 120)}</p>
              <p className="text-[10px] text-slate-600 mt-2 font-mono">{c.author_name} | {c.updated_at?.slice(0, 10)} | Views: {c.view_count || 0}</p>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <ContentModal existing={editing} onClose={() => { setShowCreate(false); setEditing(null); }} onSaved={fetch} />
      )}
    </div>
  );
}

function ContentModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing || { title: "", body: "", content_type: "health_tip", category: "", tags: [], status: "draft", target_roles: ["all"] });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (existing?.id) { await api.put(`/admin/content/${existing.id}`, form); }
      else { await api.post("/admin/content", form); }
      onSaved(); onClose();
    } catch (e) { alert(e.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="content-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{existing ? "Edit" : "New"} Content</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            data-testid="content-title" className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
          <textarea placeholder="Body content..." rows={5} required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            data-testid="content-body" className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <AppSelectOption key={k} value={k}>{v}</AppSelectOption>)}
            </AppSelect>
            <AppSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              <AppSelectOption value="draft">Draft</AppSelectOption><AppSelectOption value="published">Published</AppSelectOption><AppSelectOption value="archived">Archived</AppSelectOption>
            </AppSelect>
          </div>
          <div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none" />
              <button type="button" onClick={addTag} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white">Add</button>
            </div>
            {form.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">{form.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-[#7B35D8]/10 text-[#7B35D8] rounded-full flex items-center gap-1">
                  {t} <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X size={10} /></button>
                </span>
              ))}</div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} data-testid="content-submit"
              className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">
              {saving ? "Saving..." : existing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
