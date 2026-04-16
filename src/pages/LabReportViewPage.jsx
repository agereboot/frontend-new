import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { FileText, Eye, BarChart3, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

const STATUS_COLORS = { optimal: "text-emerald-400 bg-emerald-500/10", monitor: "text-amber-400 bg-amber-500/10", at_risk: "text-red-400 bg-red-500/10" };
const STATUS_LABELS = { optimal: "Optimal", monitor: "Monitor", at_risk: "Needs Attention" };

function BiomarkerCard({ marker }) {
  const pct = Math.min(100, Math.max(0, ((marker.value - marker.reference_low) / (marker.reference_high - marker.reference_low)) * 100));
  const longevityPct = Math.min(100, Math.max(0, ((marker.value - marker.longevity_low) / (marker.longevity_high - marker.longevity_low)) * 100));

  return (
    <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-4 hover:border-[#7B35D8]/30 transition-all" data-testid={`biomarker-card-${marker.biomarker_code}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white">{marker.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[marker.status]}`}>
          {STATUS_LABELS[marker.status]}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">{marker.value}</span>
        <span className="text-xs text-slate-500">{marker.unit}</span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Normal: {marker.reference_low}</span><span>{marker.reference_high}</span>
        </div>
        <div className="h-1.5 bg-[#1E1E3A] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${marker.status === "optimal" ? "bg-emerald-500" : marker.status === "monitor" ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${Math.max(5, Math.min(100, pct))}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-[#7B35D8]/70 mt-1">
          <span>Longevity: {marker.longevity_low}</span><span>{marker.longevity_high}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">{marker.explanation}</p>
    </div>
  );
}

const DOMAIN_MAP = {
  metabolic: ["fasting_glucose", "hba1c", "total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides"],
  hormonal: ["cortisol"],
  vitamins: ["vitamin_d", "vitamin_b12", "ferritin"],
  inflammation: ["hscrp"],
  kidney: ["creatinine"],
  thyroid: ["tsh"],
  longevity: ["homocysteine"],
};
const DOMAIN_LABELS = { all: "All", metabolic: "Metabolic", hormonal: "Hormonal", vitamins: "Vitamins", inflammation: "Inflammation", kidney: "Kidney", thyroid: "Thyroid", longevity: "Longevity" };

export default function LabReportViewPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [tab, setTab] = useState("visual");
  const [domainFilter, setDomainFilter] = useState("all");

  useEffect(() => {
    if (!user?.user_id) return;
    api.get(`/lab-ingestion/reports/${user.user_id}`).then(r => {
      const reps = r.data.reports || [];
      setReports(reps);
      if (reps.length > 0) loadDetail(reps[0].id);
    });
  }, [user]);

  const loadDetail = (reportId) => {
    api.get(`/lab-ingestion/report/${reportId}`).then(r => {
      setActiveReport(reportId);
      setReportDetail(r.data);
    });
  };

  const summary = reportDetail?.status_summary || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="lab-report-view-page">
      <h1 className="text-2xl font-bold text-white">Lab Reports</h1>
      {reports.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {reports.map(r => (
            <button key={r.id} onClick={() => loadDetail(r.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${activeReport === r.id ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-400"}`}>
              {r.lab_partner} - {new Date(r.uploaded_at).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}
      {reportDetail && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <CheckCircle className="mx-auto text-emerald-400 mb-1" size={24} />
              <div className="text-2xl font-bold text-emerald-400">{summary.optimal || 0}</div>
              <div className="text-xs text-slate-400">Optimal</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <AlertTriangle className="mx-auto text-amber-400 mb-1" size={24} />
              <div className="text-2xl font-bold text-amber-400">{summary.monitor || 0}</div>
              <div className="text-xs text-slate-400">Monitor</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <AlertCircle className="mx-auto text-red-400 mb-1" size={24} />
              <div className="text-2xl font-bold text-red-400">{summary.at_risk || 0}</div>
              <div className="text-xs text-slate-400">Needs Attention</div>
            </div>
          </div>
          <div className="flex gap-2 border-b border-[#1E1E3A]">
            <button onClick={() => setTab("visual")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === "visual" ? "border-[#7B35D8] text-[#7B35D8]" : "border-transparent text-slate-500"}`}>
              <BarChart3 size={14} className="inline mr-1" /> Visual Report
            </button>
            <button onClick={() => setTab("pdf")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === "pdf" ? "border-[#7B35D8] text-[#7B35D8]" : "border-transparent text-slate-500"}`}>
              <FileText size={14} className="inline mr-1" /> PDF Report
            </button>
          </div>
          {tab === "visual" ? (
            <div>
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4" data-testid="domain-filter">
                {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => setDomainFilter(key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${domainFilter === key ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-400 hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(reportDetail.visual_cards || [])
                  .filter(m => domainFilter === "all" || (DOMAIN_MAP[domainFilter] || []).includes(m.biomarker_code))
                  .map(m => <BiomarkerCard key={m.biomarker_code} marker={m} />)}
              </div>
            </div>
          ) : (
            <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-8 text-center">
              <FileText size={48} className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">PDF report from {reportDetail.report?.lab_partner}</p>
              <p className="text-xs text-slate-600 mt-1">Original lab report will be displayed here</p>
              <button className="mt-4 px-6 py-2 bg-[#7B35D8] text-white text-sm rounded-lg hover:bg-[#6B2BC8]">Download PDF</button>
            </div>
          )}
        </>
      )}
      {reports.length === 0 && <div className="text-center text-slate-500 py-12">No reports yet. Your reports will appear here after lab processing.</div>}
    </div>
  );
}
