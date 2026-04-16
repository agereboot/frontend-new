import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Download, FlaskConical, Watch, Activity, Database } from "lucide-react";

export default function MyHealthPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [recRes, sumRes] = await Promise.all([api.get("/health/records"), api.get("/health/records/summary")]);
        setRecords(recRes.data);
        setSummary(sumRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDownloadPDF = () => {
    if (!summary) return;
    // Generate a text-based report for download
    const s = summary;
    const lines = [
      "═══════════════════════════════════════════════",
      `   AGEREBOOT HEALTH REPORT — ${s.user?.name || "Athlete"}`,
      `   Generated: ${new Date(s.generated_at).toLocaleString()}`,
      "═══════════════════════════════════════════════",
      "",
      `ATHLETE PROFILE`,
      `  Name: ${s.user?.name}   Age: ${s.user?.age}   Sex: ${s.user?.sex}`,
      `  Franchise: ${s.user?.franchise}   Ethnicity: ${s.user?.ethnicity}`,
      "",
    ];
    if (s.hps) {
      lines.push(`HEALTH PERFORMANCE SCORE: ${s.hps.hps_final}/1000 (${s.hps.tier?.tier})`);
      lines.push(`  Confidence: ±${s.hps.confidence_interval} pts | Metrics: ${s.hps.n_metrics_tested}`);
      lines.push(`  Alert: ${s.hps.alert?.level} — ${s.hps.alert?.message}`);
      lines.push("");
      lines.push("PILLAR BREAKDOWN:");
      Object.entries(s.hps.pillars || {}).forEach(([code, p]) => {
        lines.push(`  ${p.name}: ${p.score}/${p.max_points} (${p.percentage}%)`);
      });
      lines.push("");
    }
    lines.push(`BIOMARKER RESULTS (${s.biomarker_count} recorded):`);
    (s.biomarkers || []).forEach(bm => {
      lines.push(`  ${bm.name}: ${bm.value} ${bm.unit} [${bm.source}]`);
    });
    lines.push("");
    lines.push("═══════════════════════════════════════════════");
    lines.push("  AgeReboot HPS Engine v3.0 | Riviea Life Pte. Ltd.");
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AgeReboot_Health_Report_${s.user?.name?.replace(/\s+/g, "_") || "report"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Health report downloaded.");
  };

  const sourceIcons = { MANUAL: FlaskConical, SEED_DATA: Database, LAB_OCR: FileText };
  const sourceCols = { MANUAL: "#7B35D8", SEED_DATA: "#4F46E5", LAB_OCR: "#D97706" };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up" data-testid="my-health-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            <span className="text-cosmic">My</span> Health Records
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            {records?.total_records || 0} records &middot; Digital + PDF Export
          </p>
        </div>
        <Button data-testid="download-report-btn" onClick={handleDownloadPDF}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
          <Download size={16} className="mr-2" /> Download Report
        </Button>
      </div>

      {/* HPS Summary */}
      {records?.latest_hps && (
        <div className="glass-card rounded-lg p-6 cosmic-glow">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Latest Health Performance Score</p>
            <Badge variant="outline" className="font-mono text-[9px] border-cosmic/30 text-cosmic uppercase">{records.latest_hps.tier?.tier}</Badge>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="font-mono text-5xl font-bold text-stellar">{Math.round(records.latest_hps.hps_final)}</p>
              <p className="font-mono text-xs text-stellar-dim">/1000 &middot; ±{records.latest_hps.confidence_interval} pts</p>
            </div>
            <div className="flex-1 grid grid-cols-5 gap-2">
              {Object.entries(records.latest_hps.pillars || {}).map(([code, p]) => (
                <div key={code} className="text-center">
                  <div className="h-16 flex items-end justify-center">
                    <div className="w-6 rounded-t-sm transition-all" style={{ height: `${p.percentage}%`, backgroundColor: p.color, minHeight: "4px" }} />
                  </div>
                  <p className="font-mono text-[7px] text-stellar-dim mt-1 leading-tight">{p.name.split(" ")[0]}</p>
                  <p className="font-mono text-[9px] font-bold" style={{ color: p.color }}>{Math.round(p.percentage)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(records?.by_source || {}).map(([src, count]) => {
          const Icon = Object.entries(sourceIcons).find(([k]) => src.includes(k))?.[1] || Activity;
          const color = Object.entries(sourceCols).find(([k]) => src.includes(k))?.[1] || "#7B35D8";
          return (
            <div key={src} className="glass-card rounded-lg p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-stellar">{count}</p>
                <p className="font-mono text-[8px] text-stellar-dim uppercase tracking-wider">{src.replace(/_/g, " ")}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wearable Connections */}
      {records?.connections?.length > 0 && (
        <div className="glass-card rounded-lg p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Connected Devices</p>
          <div className="flex gap-3 flex-wrap">
            {records.connections.map(c => (
              <div key={c.id} className="bg-nebula/10 border border-nebula/20 rounded-sm px-3 py-2 flex items-center gap-2">
                <Watch size={14} className="text-nebula" />
                <span className="font-mono text-xs text-stellar">{c.device_name || c.device}</span>
                <Badge className="bg-nebula/20 text-nebula border-nebula/30 font-mono text-[7px]">{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biomarker Records Table */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">All Biomarker Records ({records?.total_records || 0})</p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {(records?.biomarkers || []).slice(0, 50).map(bm => (
            <div key={bm.id} className="px-5 py-2.5 border-b border-white/5 grid grid-cols-12 gap-2 hover:bg-white/[0.02]">
              <span className="col-span-4 font-body text-sm text-stellar truncate self-center">{bm.name}</span>
              <span className="col-span-2 font-mono text-sm font-bold text-stellar self-center">{bm.value} <span className="text-[9px] text-stellar-dim">{bm.unit}</span></span>
              <span className="col-span-2 font-mono text-[9px] text-stellar-dim self-center uppercase">{bm.pillar}</span>
              <span className="col-span-2 font-mono text-[9px] text-stellar-dim self-center">{bm.source?.replace(/_/g, " ")}</span>
              <span className="col-span-2 font-mono text-[9px] text-stellar-dim self-center text-right">{new Date(bm.collected_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
