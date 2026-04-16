import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText, CheckCircle, XCircle, Clock,
  GitBranch, BarChart3, Layers
} from "lucide-react";

import { PILLAR_META } from "@/components/biomarkers/constants";
import { BiomarkerBlade } from "@/components/biomarkers/BiomarkerBlade";
import { CorrelationMatrix } from "@/components/biomarkers/CorrelationMatrix";
import { BenchmarkDashboard } from "@/components/biomarkers/BenchmarkDashboard";
import { BiomarkerCompare } from "@/components/biomarkers/BiomarkerCompare";
import { ReportsSection } from "@/components/biomarkers/ReportsSection";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function BiomarkersPage() {
  const [pillarData, setPillarData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [manualEntries, setManualEntries] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("BR");
  const [expandedBm, setExpandedBm] = useState(null);
  const [manualForm, setManualForm] = useState({ biomarker_code: "", value: "", notes: "" });
  const [uploadContent, setUploadContent] = useState("");
  const [uploadType, setUploadType] = useState("hps");
  const [uploading, setUploading] = useState(false);
  const [benchmarking, setBenchmarking] = useState(null);
    const savedUser = localStorage.getItem("agereboot_user");
    console.log("BiomarkersPage rendered. User:", savedUser ? JSON.parse(savedUser) : null);
  const fetchData = useCallback(async () => {
    try {
      const [pRes, predRes, corrRes, meRes, rpRes, bmRes] = await Promise.all([
        api.get("/biomarkers/pillar-dashboard"),
        api.get("/biomarkers/predictions"),
        api.get("/biomarkers/correlation-matrix"),
        api.get("/biomarkers/manual-entries"),
        api.get("/reports/repository"), 
        api.get("/biomarkers/benchmarking"),


      ]);
      setPillarData(pRes.data?.pillars);
      setPredictions(predRes.data);
      setCorrelations(corrRes.data);
      setManualEntries(meRes.data?.entries || []);
      setReports(rpRes.data?.reports || []);
      setBenchmarking(bmRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleManualSubmit = async () => {
    if (!manualForm.biomarker_code || !manualForm.value) { toast.error("Fill code and value"); return; }
    try {
      await api.post("/biomarkers/manual-entry", { ...manualForm, value: parseFloat(manualForm.value) });
      toast.success("Entry submitted for clinician validation");
      setManualForm({ biomarker_code: "", value: "", notes: "" });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  const handleUpload = async () => {
    if (!uploadContent.trim()) { toast.error("Paste report content"); return; }
    setUploading(true);
    try {
      const res = await api.post("/reports/upload", { content: uploadContent, is_hps_report: uploadType === "hps" });
      const params = res.data?.extracted_parameters?.length || 0;
      toast.success(uploadType === "hps" ? `Report parsed! ${params} parameters extracted.` : "Report saved to your records.");
      setUploadContent("");
      fetchData();
    } catch (err) { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const pillars = pillarData || {};
  const totalGreen = Object.values(pillars).reduce((s, p) => s + (p.green || 0), 0);
  const totalYellow = Object.values(pillars).reduce((s, p) => s + (p.yellow || 0), 0);
  const totalRed = Object.values(pillars).reduce((s, p) => s + (p.red || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="biomarkers-loading">
      <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up" data-testid="biomarkers-page">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="text-left">
          <h1 className="font-display text-4xl font-bold text-stellar tracking-tight">
            Biomarkers <span className="text-gradient-cosmic">&amp; Reports</span>
          </h1>
          <p className="font-mono text-[10px] text-stellar-dim tracking-[0.25em] mt-2 uppercase">5-Pillar Health Intelligence System</p>
        </div>
        <div className="flex items-center gap-5 glass-premium rounded-lg px-4 py-2.5">
          {[["Optimal", totalGreen, "#0F9F8F"], ["Watch", totalYellow, "#D97706"], ["At Risk", totalRed, "#EF4444"]].map(([l, v, c]) => (
            <div key={l} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full status-glow" style={{ color: c, backgroundColor: c }} />
              <span className="font-mono text-sm font-bold" style={{ color: c }}>{v}</span>
              <span className="font-mono text-[8px] text-stellar-dim/60 uppercase">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2" data-testid="pillar-navigation">
        {Object.entries(PILLAR_META).map(([code, meta]) => {
          const p = pillars[code];
          const Icon = meta.icon;
          const isActive = activeTab === code;
          return (
            <button key={code} data-testid={`pillar-tab-${code}`}
              onClick={() => setActiveTab(code)}
              aria-selected={isActive}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 overflow-hidden group ${
                isActive
                  ? "pillar-tile-active border-opacity-50 scale-[1.02]"
                  : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
              }`}
              style={isActive ? {
                backgroundColor: meta.color + "12",
                borderColor: meta.color + "50",
                boxShadow: `0 0 20px ${meta.color}25`,
              } : {}}>
              {isActive && <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${meta.color} 0%, transparent 70%)` }} />}
              <Icon size={20} className="relative z-10 mb-1.5 transition-colors" style={{ color: isActive ? meta.color : "#64748B" }} />
              <span className={`relative z-10 font-display text-[10px] font-bold tracking-wide ${isActive ? "text-stellar" : "text-stellar-dim"}`}>
                {meta.short}
              </span>
              {p && (
                <div className="relative z-10 flex gap-1 mt-1.5">
                  {p.green > 0 && <span className="font-mono text-[8px] text-emerald-400/80">{p.green}</span>}
                  {p.yellow > 0 && <span className="font-mono text-[8px] text-amber-400/80">{p.yellow}</span>}
                  {p.red > 0 && <span className="font-mono text-[8px] text-red-400/80">{p.red}</span>}
                </div>
              )}
            </button>
          );
        })}
        {[
          { key: "correlations", icon: GitBranch, label: "Links", badge: correlations?.red_biomarkers?.length > 0 ? correlations.red_biomarkers.length : null, badgeClass: "text-red-400" },
          { key: "compare", icon: Layers, label: "Compare" },
          { key: "benchmark", icon: BarChart3, label: "Rank", badge: benchmarking?.overall_health_percentile ? `P${Math.round(benchmarking.overall_health_percentile)}` : null, badgeClass: "text-cosmic" },
          { key: "reports", icon: FileText, label: "Reports", badge: reports.length > 0 ? reports.length : null, badgeClass: "text-stellar-dim" },
        ].map(({ key, icon: TabIcon, label, badge, badgeClass }) => (
          <button key={key} data-testid={`pillar-tab-${key}`} onClick={() => setActiveTab(key)}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
              activeTab === key
                ? "bg-cosmic/12 border-cosmic/50 pillar-tile-active scale-[1.02]"
                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
            }`}>
            <TabIcon size={20} className={`mb-1.5 ${activeTab === key ? "text-cosmic" : "text-stellar-dim"}`} />
            <span className={`font-display text-[10px] font-bold tracking-wide ${activeTab === key ? "text-stellar" : "text-stellar-dim"}`}>{label}</span>
            {badge && <span className={`font-mono text-[8px] mt-1 ${badgeClass}`}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* Pillar Content */}
      {Object.entries(PILLAR_META).map(([code, meta]) => {
        if (activeTab !== code) return null;
        const p = pillars[code];
        if (!p) return null;
        const Icon = meta.icon;
        const measured = p.biomarkers.filter(b => b.value !== null).length;
        const total = p.biomarkers.length;
        return (
          <div key={code} className="space-y-4">
            <div className="glass-premium rounded-2xl p-6 relative overflow-hidden" data-testid={`pillar-summary-${code}`}>
              <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]"
                style={{ background: `radial-gradient(circle at top right, ${meta.color}, transparent 70%)` }} />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}08)`, border: `1px solid ${meta.color}30` }}>
                  <Icon size={28} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="font-display text-xl font-bold text-stellar">{meta.name}</h2>
                  <p className="font-body text-xs text-stellar-dim mt-0.5">{meta.desc}</p>
                </div>
                <div className="flex gap-5">
                  {[["Optimal", p.green, "#0F9F8F"], ["Watch", p.yellow, "#D97706"], ["At Risk", p.red, "#EF4444"]].map(([label, count, color]) => (
                    <div key={label} className="text-left">
                      <p className="font-mono text-2xl font-black" style={{ color }}>{count}</p>
                      <p className="font-mono text-[7px] text-stellar-dim/60 uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {measured > 0 && (
                <div className="mt-5 relative z-10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[8px] text-stellar-dim/50">{measured}/{total} measured</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
                    {p.green > 0 && <div className="transition-all duration-500" style={{ width: `${(p.green / measured) * 100}%`, backgroundColor: "#0F9F8F" }} />}
                    {p.yellow > 0 && <div className="transition-all duration-500" style={{ width: `${(p.yellow / measured) * 100}%`, backgroundColor: "#D97706" }} />}
                    {p.red > 0 && <div className="transition-all duration-500" style={{ width: `${(p.red / measured) * 100}%`, backgroundColor: "#EF4444" }} />}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              {p.biomarkers.map((bm) => (
                <BiomarkerBlade key={bm.code} bm={bm} predictions={predictions}
                  expanded={expandedBm === bm.code}
                  onToggle={() => setExpandedBm(expandedBm === bm.code ? null : bm.code)} />
              ))}
            </div>

            <div className="glass-premium rounded-xl p-5" data-testid="manual-entry-form">
              <p className="font-mono text-[9px] tracking-[0.25em] text-stellar-dim/60 uppercase mb-3 text-left">Nurse Entry &rarr; Clinician Validation</p>
              <div className="flex gap-3 flex-wrap">
                <AppSelect value={manualForm.biomarker_code} onChange={e => setManualForm(prev => ({...prev, biomarker_code: e.target.value}))}
                  className="bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2 flex-1 min-w-[200px] focus:border-cosmic/30 focus:outline-none transition-colors">
                  <AppSelectOption value="">Select biomarker...</AppSelectOption>
                  {p.biomarkers.map(b => <AppSelectOption key={b.code} value={b.code}>{b.name} ({b.unit})</AppSelectOption>)}
                </AppSelect>
                <input type="number" step="any" value={manualForm.value} onChange={e => setManualForm(prev => ({...prev, value: e.target.value}))}
                  placeholder="Value" className="bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2 w-24 focus:border-cosmic/30 focus:outline-none" />
                <input value={manualForm.notes} onChange={e => setManualForm(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Notes" className="bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2 flex-1 min-w-[150px] focus:border-cosmic/30 focus:outline-none" />
                <Button data-testid="submit-manual-entry" onClick={handleManualSubmit} size="sm"
                  className="bg-cosmic/10 text-cosmic border border-cosmic/20 font-mono text-[10px] rounded-lg hover:bg-cosmic/20 transition-colors">
                  Submit
                </Button>
              </div>
              {manualEntries.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {manualEntries.slice(0, 3).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-xs">
                      {e.status === "validated" ? <CheckCircle size={11} className="text-emerald-400" /> :
                       e.status === "rejected" ? <XCircle size={11} className="text-red-400" /> :
                       <Clock size={11} className="text-amber-400" />}
                      <span className="font-mono text-stellar-dim">{e.biomarker_name}: {e.value} {e.unit}</span>
                      <Badge variant="outline" className="font-mono text-[7px]" style={{
                        borderColor: e.status === "validated" ? "#0F9F8F40" : e.status === "rejected" ? "#EF444440" : "#D9770640",
                        color: e.status === "validated" ? "#0F9F8F" : e.status === "rejected" ? "#EF4444" : "#D97706"
                      }}>{e.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {activeTab === "correlations" && <CorrelationMatrix data={correlations} />}
      {activeTab === "compare" && <BiomarkerCompare allBiomarkers={Object.values(pillars).flatMap(p => p.biomarkers)} />}
      {activeTab === "benchmark" && <BenchmarkDashboard data={benchmarking} />}
      {activeTab === "reports" && (
        <ReportsSection
          reports={reports}
          uploadContent={uploadContent}
          setUploadContent={setUploadContent}
          uploadType={uploadType}
          setUploadType={setUploadType}
          uploading={uploading}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}
