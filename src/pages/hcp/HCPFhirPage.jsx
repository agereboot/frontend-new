import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Globe, Server, Users, Activity, ClipboardList,
  Pill, FlaskConical, RefreshCcw,
  Stethoscope, Download, Upload, Plus, Shield, Syringe, Scissors, X,
} from "lucide-react";

const RESOURCES = [
  { type: "Patient", icon: Users, color: "#7B35D8", desc: "Members as FHIR R4 Patient" },
  { type: "Observation", icon: Activity, color: "#0F9F8F", desc: "Biomarkers as Observation (LOINC)", writable: true },
  { type: "Encounter", icon: Stethoscope, color: "#10B981", desc: "Clinical encounters / telehealth" },
  { type: "CarePlan", icon: ClipboardList, color: "#6366F1", desc: "Longevity care plans" },
  { type: "MedicationRequest", icon: Pill, color: "#D97706", desc: "Pharmacy / nutraceutical orders" },
  { type: "DiagnosticReport", icon: FlaskConical, color: "#EF4444", desc: "Lab orders and results" },
  { type: "Condition", icon: Shield, color: "#F97316", desc: "Diagnoses / conditions (SNOMED CT)", writable: true },
  { type: "AllergyIntolerance", icon: Shield, color: "#DC2626", desc: "Drug and food allergies" },
  { type: "Immunization", icon: Syringe, color: "#8B5CF6", desc: "Vaccination records (CVX)" },
  { type: "Procedure", icon: Scissors, color: "#EC4899", desc: "Surgical / diagnostic procedures" },
];

export default function HCPFhirPage() {
  const [metadata, setMetadata] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ patientId: "", code: "", display: "", value: "", unit: "", text: "", onset: "" });

  useEffect(() => {
    api.get("/fhir/metadata").then(r => setMetadata(r.data)).catch(() => {});
  }, []);

  const fetchResource = useCallback(async (type) => {
    setSelectedResource(type);
    setLoading(true);
    try {
      const { data } = await api.get(`/fhir/${type}`);
      setResourceData(data);
    } catch { setResourceData(null); }
    setLoading(false);
  }, []);

  const handleExport = async () => {
    try {
      const { data } = await api.get("/fhir/$export?_type=Patient,Observation,Condition,DiagnosticReport,Encounter");
      setExportData(data);
      toast.success(`Bulk export prepared — ${data.output?.length || 0} resource types`);
    } catch { toast.error("Export failed"); }
  };

  const handleCreate = async () => {
    const res = RESOURCES.find(r => r.type === selectedResource);
    if (!res?.writable) return;
    try {
      if (selectedResource === "Observation") {
        await api.post("/fhir/Observation", {
          subject: { reference: `Patient/${createForm.patientId}` },
          code: { coding: [{ code: createForm.code, display: createForm.display }], text: createForm.display },
          valueQuantity: { value: parseFloat(createForm.value), unit: createForm.unit },
          effectiveDateTime: new Date().toISOString(),
        });
      } else if (selectedResource === "Condition") {
        await api.post("/fhir/Condition", {
          subject: { reference: `Patient/${createForm.patientId}` },
          code: { text: createForm.text },
          onsetDateTime: createForm.onset || new Date().toISOString(),
        });
      }
      toast.success(`${selectedResource} created`);
      setShowCreate(false);
      setCreateForm({ patientId: "", code: "", display: "", value: "", unit: "", text: "", onset: "" });
      fetchResource(selectedResource);
    } catch { toast.error("Create failed"); }
  };

  const capRes = metadata?.rest?.[0]?.resource || [];

  return (
    <div className="space-y-6" data-testid="fhir-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-bold text-white">FHIR R4 EMR Integration</h1>
          <p className="font-body text-xs text-slate-400 mt-0.5">Interoperable health data exchange — Read &amp; Write</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="fhir-export-btn" size="sm" onClick={handleExport}
            className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/30 font-mono text-[9px]">
            <Download size={12} className="mr-1" /> Bulk Export
          </Button>
        </div>
      </div>

      {/* Server Info */}
      {metadata && (
        <div className="rounded-xl border border-[#7B35D8]/15 bg-gradient-to-r from-[#7B35D8]/5 to-transparent p-4" data-testid="fhir-metadata">
          <div className="flex items-center gap-2 mb-3">
            <Server size={14} className="text-[#7B35D8]" />
            <span className="font-display text-xs font-bold text-white">AgeReboot FHIR R4 Server</span>
            <Badge className="ml-auto font-mono text-[7px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">FHIR {metadata.fhirVersion}</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="font-mono text-[7px] text-slate-500 uppercase">Software</span>
              <p className="font-mono text-xs text-white">{metadata.software?.name}</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="font-mono text-[7px] text-slate-500 uppercase">Version</span>
              <p className="font-mono text-xs text-white">v{metadata.software?.version}</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="font-mono text-[7px] text-slate-500 uppercase">Resources</span>
              <p className="font-mono text-xs text-white">{capRes.length} supported</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="font-mono text-[7px] text-slate-500 uppercase">Format</span>
              <p className="font-mono text-xs text-white">{metadata.format?.join(", ")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Summary */}
      {exportData && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4" data-testid="fhir-export-result">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs font-bold text-indigo-300">Bulk Export Summary</span>
            <button onClick={() => setExportData(null)} className="text-slate-500 hover:text-white"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {exportData.output?.map(o => (
              <div key={o.type} className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
                <span className="font-mono text-[8px] text-indigo-400">{o.type}</span>
                <p className="font-mono text-sm text-white">{o.count} records</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2" data-testid="fhir-resources">
        {RESOURCES.map(r => {
          const RIcon = r.icon;
          const isActive = selectedResource === r.type;
          return (
            <button key={r.type} data-testid={`fhir-${r.type}`}
              onClick={() => fetchResource(r.type)}
              className={`text-left rounded-xl border p-3 transition-all ${
                isActive ? "border-[#7B35D8]/40 bg-[#7B35D8]/5 shadow-[0_0_30px_rgba(123,53,216,0.15)]"
                : "border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10"
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.color + "15" }}>
                  <RIcon size={14} style={{ color: r.color }} />
                </div>
                {r.writable && <Badge className="font-mono text-[6px] bg-amber-500/10 text-amber-400 border-amber-500/20 px-1">R/W</Badge>}
              </div>
              <span className="font-display text-[11px] font-bold text-white block">{r.type}</span>
              <p className="font-body text-[9px] text-slate-500 mt-0.5">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Resource Data */}
      {selectedResource && (
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden" data-testid="fhir-result">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[#7B35D8]" />
              <span className="font-mono text-xs text-white">GET /api/fhir/{selectedResource}</span>
            </div>
            <div className="flex items-center gap-2">
              {resourceData && (
                <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {resourceData.total || 0} entries
                </Badge>
              )}
              {RESOURCES.find(r => r.type === selectedResource)?.writable && (
                <Button data-testid="fhir-create-btn" size="sm" onClick={() => setShowCreate(!showCreate)}
                  className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-mono text-[8px]">
                  <Plus size={10} className="mr-1" /> Create
                </Button>
              )}
              <Button size="sm" onClick={() => fetchResource(selectedResource)} disabled={loading}
                className="bg-white/5 text-white border border-white/10 hover:bg-white/10 font-mono text-[8px]">
                <RefreshCcw size={10} className={`mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]" data-testid="fhir-create-form">
              <p className="font-display text-[10px] text-amber-400 font-bold mb-2">Create {selectedResource}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                <input data-testid="fhir-create-patient" placeholder="Patient ID" value={createForm.patientId}
                  onChange={e => setCreateForm(f => ({ ...f, patientId: e.target.value }))}
                  className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono placeholder:text-slate-600" />
                {selectedResource === "Observation" && (
                  <>
                    <input data-testid="fhir-create-code" placeholder="LOINC code" value={createForm.code}
                      onChange={e => setCreateForm(f => ({ ...f, code: e.target.value }))}
                      className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono placeholder:text-slate-600" />
                    <input placeholder="Display name" value={createForm.display}
                      onChange={e => setCreateForm(f => ({ ...f, display: e.target.value }))}
                      className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono placeholder:text-slate-600" />
                    <div className="flex gap-1">
                      <input placeholder="Value" type="number" value={createForm.value}
                        onChange={e => setCreateForm(f => ({ ...f, value: e.target.value }))}
                        className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono w-20 placeholder:text-slate-600" />
                      <input placeholder="Unit" value={createForm.unit}
                        onChange={e => setCreateForm(f => ({ ...f, unit: e.target.value }))}
                        className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono flex-1 placeholder:text-slate-600" />
                    </div>
                  </>
                )}
                {selectedResource === "Condition" && (
                  <>
                    <input placeholder="Condition name" value={createForm.text}
                      onChange={e => setCreateForm(f => ({ ...f, text: e.target.value }))}
                      className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono col-span-2 placeholder:text-slate-600" />
                    <input type="date" value={createForm.onset}
                      onChange={e => setCreateForm(f => ({ ...f, onset: e.target.value }))}
                      className="rounded-lg bg-black/40 border border-white/10 text-white text-[10px] px-2 py-1.5 font-mono placeholder:text-slate-600" />
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button data-testid="fhir-create-submit" size="sm" onClick={handleCreate}
                  className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 font-mono text-[8px]">
                  <Upload size={10} className="mr-1" /> Submit FHIR Resource
                </Button>
                <Button size="sm" onClick={() => setShowCreate(false)}
                  className="bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 font-mono text-[8px]">Cancel</Button>
              </div>
            </div>
          )}

          <div className="p-4 max-h-[400px] overflow-auto custom-scrollbar">
            {loading ? (
              <div className="text-center py-6"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin mx-auto" /></div>
            ) : resourceData ? (
              <pre className="font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(resourceData, null, 2)}
              </pre>
            ) : (
              <p className="font-body text-sm text-slate-400 text-center py-6">Failed to load resource data.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
