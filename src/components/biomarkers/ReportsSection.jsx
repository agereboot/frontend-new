import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, FileUp, FlaskConical, Lock, Plus, Upload } from "lucide-react";

export function ReportsSection({ reports, uploadContent, setUploadContent, uploadType, setUploadType, uploading, onUpload }) {
  return (
    <div className="space-y-5">
      <div className="glass-premium rounded-2xl p-6 relative overflow-hidden" data-testid="report-upload">
        <div className="scan-line absolute inset-0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
              <FileUp size={22} className="text-cosmic" />
            </div>
            <div className="text-left">
              <h3 className="font-display text-lg font-bold text-stellar">Upload Report</h3>
              <p className="font-body text-xs text-stellar-dim">Paste report data for automatic extraction</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button data-testid="upload-type-hps" onClick={() => setUploadType("hps")}
              className={`relative p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden ${
                uploadType === "hps"
                  ? "border-cosmic/40 bg-cosmic/8 shadow-[0_0_15px_rgba(123,53,216,0.15)]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
              }`}>
              {uploadType === "hps" && <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-cosmic to-transparent" />}
              <div className="relative z-10 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${uploadType === "hps" ? "bg-cosmic/15 border border-cosmic/25" : "bg-white/5 border border-white/5"}`}>
                  <FlaskConical size={16} className={uploadType === "hps" ? "text-cosmic" : "text-stellar-dim"} />
                </div>
                <div>
                  <p className={`font-display text-sm font-bold ${uploadType === "hps" ? "text-cosmic" : "text-stellar-dim"}`}>HPS Lab Report</p>
                  <p className="font-mono text-[8px] text-stellar-dim/50 mt-0.5">Auto-extracts biomarkers to HPS</p>
                </div>
              </div>
            </button>
            <button data-testid="upload-type-other" onClick={() => setUploadType("other")}
              className={`relative p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden ${
                uploadType === "other"
                  ? "border-indigo-500/40 bg-indigo-500/8 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
              }`}>
              {uploadType === "other" && <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-indigo-500 to-transparent" />}
              <div className="relative z-10 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${uploadType === "other" ? "bg-indigo-500/15 border border-indigo-500/25" : "bg-white/5 border border-white/5"}`}>
                  <Plus size={16} className={uploadType === "other" ? "text-indigo-400" : "text-stellar-dim"} />
                </div>
                <div>
                  <p className={`font-display text-sm font-bold ${uploadType === "other" ? "text-indigo-400" : "text-stellar-dim"}`}>Other Report</p>
                  <p className="font-mono text-[8px] text-stellar-dim/50 mt-0.5">X-ray, imaging, prescriptions</p>
                </div>
              </div>
            </button>
          </div>

          <textarea value={uploadContent} onChange={e => setUploadContent(e.target.value)}
            data-testid="upload-content-textarea"
            placeholder={uploadType === "hps"
              ? "Paste your lab report here...\n\nExample:\nFasting Glucose: 92 mg/dL\nHbA1c: 5.4%\nhsCRP: 0.8 mg/L"
              : "Paste report content, notes, or findings here..."}
            rows={5}
            className="w-full bg-space/60 border border-white/8 text-stellar text-xs rounded-xl p-4 resize-none font-mono focus:border-cosmic/30 focus:outline-none transition-all placeholder:text-stellar-dim/25" />

          <Button data-testid="upload-report-btn" onClick={onUpload} disabled={uploading || !uploadContent.trim()}
            className={`w-full mt-4 h-11 font-display font-bold uppercase tracking-[0.15em] text-xs rounded-xl transition-all ${
              uploadType === "hps"
                ? "bg-gradient-to-r from-cosmic to-indigo-600 hover:from-cosmic-light hover:to-indigo-500 text-white shadow-[0_4px_20px_rgba(123,53,216,0.3)]"
                : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25"
            }`}>
            {uploading ? (
              <span className="flex items-center gap-2"><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</span>
            ) : (
              <span className="flex items-center gap-2"><Upload size={14} /> {uploadType === "hps" ? "Upload & Auto-Extract" : "Save to Records"}</span>
            )}
          </Button>
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6" data-testid="report-repository">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-stellar-dim/40" />
            <h3 className="font-display text-base font-bold text-stellar">Secure Repository</h3>
          </div>
          <Badge className="bg-white/5 text-stellar-dim font-mono text-[8px] border border-white/5">{reports.length} reports</Badge>
        </div>
        {reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} data-testid={`report-${r.id}`}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  r.is_hps_report === false
                    ? "bg-indigo-500/10 border border-indigo-500/15 group-hover:bg-indigo-500/15"
                    : "bg-cosmic/10 border border-cosmic/15 group-hover:bg-cosmic/15"
                }`}>
                  {r.is_hps_report === false ? <FileText size={18} className="text-indigo-400" /> : <FlaskConical size={18} className="text-cosmic" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-body text-sm font-medium text-stellar truncate group-hover:text-white transition-colors">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[8px] text-stellar-dim/60">{r.report_type}</span>
                    <span className="text-stellar-dim/20">&middot;</span>
                    <span className="font-mono text-[8px] text-stellar-dim/60">{new Date(r.uploaded_at).toLocaleDateString()}</span>
                    {r.parameters_extracted > 0 && (
                      <>
                        <span className="text-stellar-dim/20">&middot;</span>
                        <span className="font-mono text-[8px] text-cosmic">{r.parameters_extracted} params extracted</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={`font-mono text-[7px] shrink-0 ${
                  r.is_hps_report === false ? "border-indigo-500/20 text-indigo-400" : "border-cosmic/20 text-cosmic"
                }`}>{r.is_hps_report === false ? "General" : "HPS"}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Lock size={32} className="text-stellar-dim/20 mx-auto mb-3" />
            <p className="text-stellar-dim text-xs font-body">No reports in the vault yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
