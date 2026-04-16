import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Briefcase, Plus, Eye } from "lucide-react";
import { toast } from "sonner";

const ACCENT = "#0F9F8F";

export default function CXOInvestorPage() {
  const [updates, setUpdates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "Q1 2026 Investor Health Update", quarter: "Q1 2026", narrative: "", highlights: [] });

  const load = () => api.get("/cxo/reports/investor").then(r => setUpdates(r.data.updates)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await api.post("/cxo/reports/investor", form); toast.success("Investor update created"); setShowCreate(false); load(); } catch { toast.error("Failed"); }
  };

  const view = async (id) => {
    try { const r = await api.get(`/cxo/reports/investor/${id}`); setSelected(r.data); } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-investor-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Investor <span className="text-teal-400">Updates</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Quarterly wellness ROI updates for investors and board</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="create-update-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-all">
          <Plus size={14} /> New Update
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-teal-500/20 bg-[#11111a] p-5 animate-in slide-in-from-top-2 duration-300" data-testid="investor-form">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" data-testid="inv-title" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Quarter</label>
              <input value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" data-testid="inv-quarter" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Custom Narrative (leave blank for auto-generated)</label>
              <textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} rows={3}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 resize-none" data-testid="inv-narrative" />
            </div>
          </div>
          <button onClick={create} data-testid="create-update-submit"
            className="px-6 py-2 rounded-lg text-sm font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-all">Create Update</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* List */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {updates.length === 0 ? (
            <div className="text-center py-12 text-slate-500"><Briefcase size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No investor updates yet</p></div>
          ) : updates.map(u => (
            <button key={u.id} onClick={() => view(u.id)} data-testid={`inv-${u.id}`}
              className={`w-full text-left rounded-xl border p-4 transition-all ${selected?.id === u.id ? "border-teal-500/30 bg-teal-500/5" : "border-white/5 bg-[#11111a] hover:border-white/10"}`}>
              <p className="text-sm text-white font-medium">{u.title}</p>
              <p className="text-[10px] text-slate-500 mt-1">{u.quarter} &middot; {new Date(u.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="col-span-12 lg:col-span-8">
          {selected ? (
            <div className="rounded-xl border border-white/5 bg-[#11111a] p-6" data-testid="inv-preview">
              <h2 className="text-lg font-bold text-white mb-1">{selected.title}</h2>
              <p className="text-xs text-slate-500 mb-4">{selected.quarter} &middot; Created: {new Date(selected.created_at).toLocaleString()}</p>

              {/* KPIs */}
              {selected.kpis && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {selected.kpis.wvi && <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center"><p className="text-[9px] text-slate-500 font-mono uppercase">WVI</p><p className="text-xl font-bold" style={{ color: "#CFB53B" }}>{selected.kpis.wvi.score}</p></div>}
                  {selected.kpis.roi && <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center"><p className="text-[9px] text-slate-500 font-mono uppercase">ROI</p><p className="text-xl font-bold text-emerald-400">{selected.kpis.roi.ratio}x</p></div>}
                  {selected.kpis.esg && <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center"><p className="text-[9px] text-slate-500 font-mono uppercase">ESG</p><p className="text-xl font-bold text-teal-400">{selected.kpis.esg.composite}%</p></div>}
                  {selected.kpis.franchise_rank && <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center"><p className="text-[9px] text-slate-500 font-mono uppercase">Rank</p><p className="text-xl font-bold text-amber-400">#{selected.kpis.franchise_rank.rank}</p></div>}
                </div>
              )}

              {/* Highlights */}
              {selected.highlights?.length > 0 && (
                <div className="mb-4">
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2">Key Highlights</p>
                  <ul className="space-y-1.5">
                    {selected.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold bg-teal-500/10 text-teal-400 mt-0.5">{i + 1}</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Narrative */}
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2">Executive Narrative</p>
                <p className="text-sm text-slate-300 leading-relaxed">{selected.narrative}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[#11111a] p-12 text-center text-slate-500">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an update to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
