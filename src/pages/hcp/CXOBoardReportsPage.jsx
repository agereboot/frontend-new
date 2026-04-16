import { useState, useEffect } from "react";
import api from "@/lib/api";
import { FileText, Plus, Trash2, CheckCircle, Eye, Download } from "lucide-react";
import { toast } from "sonner";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const ACCENT = "#6366F1";
const SECTION_LABELS = { wvi: "Workforce Vitality", financial: "Financial ROI", engagement: "Engagement", burnout: "Burnout Risk", franchise: "Franchise", profitshare: "Profit-Share", esg: "ESG", talent: "Talent Brand" };
const STATUS_C = { draft: "#F59E0B", finalized: "#10B981", shared: "#3B82F6" };

function fmt(v) { return v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v?.toLocaleString() || 0}`; }

export default function CXOBoardReportsPage() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "Q1 2026 Board Health Report", report_type: "quarterly", sections: ["wvi", "financial", "esg", "franchise", "talent"], notes: "" });

  const load = () => api.get("/cxo/reports/board").then(r => setReports(r.data.reports)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    try { await api.post("/cxo/reports/board", form); toast.success("Report generated"); setShowCreate(false); load(); } catch { toast.error("Failed"); }
  };

  const view = async (id) => {
    try { const r = await api.get(`/cxo/reports/board/${id}`); setSelected(r.data); } catch { toast.error("Failed to load report"); }
  };

  const finalize = async (id) => {
    try { await api.patch(`/cxo/reports/board/${id}/finalize`); toast.success("Report finalized"); load(); if (selected?.id === id) setSelected(s => ({ ...s, status: "finalized" })); } catch { toast.error("Failed"); }
  };

  const remove = async (id) => {
    try { await api.delete(`/cxo/reports/board/${id}`); toast.success("Deleted"); load(); if (selected?.id === id) setSelected(null); } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-reports-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Board-Ready <span className="text-indigo-400">Reports</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.2em] mt-1 uppercase">Generate, review, and finalize board health reports</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="gen-report-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
          <Plus size={14} /> Generate Report
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-indigo-500/20 bg-[#11111a] p-5 animate-in slide-in-from-top-2 duration-300" data-testid="report-form">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Report Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" data-testid="rpt-title" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <AppSelect value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none" data-testid="rpt-type">
                {["quarterly", "annual", "custom"].map(t => <AppSelectOption key={t} value={t}>{t}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Sections</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(SECTION_LABELS).map(([k, label]) => (
                  <button key={k} onClick={() => setForm(f => ({ ...f, sections: f.sections.includes(k) ? f.sections.filter(s => s !== k) : [...f.sections, k] }))}
                    className={`px-2 py-1 rounded text-[10px] transition-all ${form.sections.includes(k) ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-white/5 text-slate-400 border border-white/5"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={generate} data-testid="gen-report-submit"
            className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">Generate</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Report List */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-500"><FileText size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No reports yet</p></div>
          ) : reports.map(r => (
            <button key={r.id} onClick={() => view(r.id)} data-testid={`rpt-${r.id}`}
              className={`w-full text-left rounded-xl border p-4 transition-all ${selected?.id === r.id ? "border-indigo-500/30 bg-indigo-500/5" : "border-white/5 bg-[#11111a] hover:border-white/10"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase" style={{ backgroundColor: STATUS_C[r.status] + "15", color: STATUS_C[r.status] }}>{r.status}</span>
                <span className="text-[10px] text-slate-500">{new Date(r.generated_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-white font-medium mt-1">{r.title}</p>
              <p className="text-[10px] text-slate-500 mt-1">{r.report_type} &middot; {r.sections?.length || 0} sections</p>
            </button>
          ))}
        </div>

        {/* Report Preview */}
        <div className="col-span-12 lg:col-span-8">
          {selected ? (
            <div className="rounded-xl border border-white/5 bg-[#11111a] p-6" data-testid="rpt-preview">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                  <p className="text-xs text-slate-500">Generated: {new Date(selected.generated_at).toLocaleString()} &middot; {selected.total_employees} employees</p>
                </div>
                <div className="flex gap-2">
                  {selected.status === "draft" && <button onClick={() => finalize(selected.id)} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"><CheckCircle size={12} className="inline mr-1" />Finalize</button>}
                  <button onClick={() => remove(selected.id)} className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"><Trash2 size={12} className="inline mr-1" />Delete</button>
                </div>
              </div>
              {selected.data_snapshot && Object.entries(selected.data_snapshot).map(([section, d]) => (
                <div key={section} className="mb-4 p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2">{SECTION_LABELS[section] || section}</p>
                  {section === "wvi" && d.score != null && <p className="text-2xl font-bold" style={{ color: "#CFB53B" }}>WVI: {d.score}/1000</p>}
                  {section === "financial" && <p className="text-2xl font-bold text-emerald-400">ROI: {d.roi_ratio}x &middot; Return: {fmt(d.total_return)}</p>}
                  {section === "esg" && <p className="text-2xl font-bold text-teal-400">ESG: {d.composite_score}% &middot; GRI: {d.gri_403}%</p>}
                  {section === "franchise" && <p className="text-2xl font-bold text-amber-400">Rank #{d.rank} of {d.total_teams}</p>}
                  {section === "talent" && <p className="text-2xl font-bold text-violet-400">Attrition: {d.attrition_rate}% (was {d.attrition_pre_agereboot}%)</p>}
                  {section === "engagement" && <p className="text-2xl font-bold text-indigo-400">Score: {d.score} ({d.tier})</p>}
                  {section === "burnout" && <p className="text-2xl font-bold text-red-400">Safe Zones: {d.green_yellow_pct}%</p>}
                  {section === "profitshare" && <p className="text-2xl font-bold" style={{ color: "#CFB53B" }}>Eligible: {d.eligible_count} ({d.eligible_pct}%)</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[#11111a] p-12 text-center text-slate-500">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a report to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
