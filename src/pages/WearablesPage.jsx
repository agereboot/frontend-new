import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Watch, RefreshCw, Check, Wifi, Link2, FileText, Upload, Unlink } from "lucide-react";

const DEVICES = [
  { id: "oura", name: "Oura Ring", desc: "HRV, Deep Sleep, Recovery, Temperature", icon: "ring", hasOAuth: true },
  { id: "apple_watch", name: "Apple Watch", desc: "HR, HRV, Steps, Sleep, SpO2", icon: "watch", hasOAuth: false },
  { id: "garmin", name: "Garmin", desc: "VO2 Max, HRV, Body Battery, Sleep", icon: "gps", hasOAuth: true },
  { id: "whoop", name: "Whoop", desc: "HRV, Recovery, Sleep Coach, Strain", icon: "band", hasOAuth: true },
  { id: "fitbit", name: "Fitbit", desc: "HR, Sleep Stages, SpO2, Stress", icon: "watch", hasOAuth: true },
  { id: "withings", name: "Withings", desc: "Weight, Body Fat, BP, ECG", icon: "scale", hasOAuth: true },
];

export default function WearablesPage() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState({});
  const [synced, setSynced] = useState({});
  const [connections, setConnections] = useState([]);
  const [connecting, setConnecting] = useState({});
  const [labResults, setLabResults] = useState("");
  const [labName, setLabName] = useState("Thyrocare");
  const [labText, setLabText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await api.get("/wearable/connections");
      setConnections(res.data?.connections || []);
      const connected = {};
      (res.data?.connections || []).forEach(c => { connected[c.device] = true; });
      setSynced(connected);
    } catch { }
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleConnect = async (deviceId) => {
    setConnecting(s => ({ ...s, [deviceId]: true }));
    try {
      await api.post(`/wearable/connect/${deviceId}`);
      toast.success(`${deviceId} connected.`);
      fetchConnections();
    } catch (err) { toast.error("Connection failed"); }
    finally { setConnecting(s => ({ ...s, [deviceId]: false })); }
  };

  const handleSync = async (deviceId) => {
    setSyncing(s => ({ ...s, [deviceId]: true }));
    try {
      const res = await api.post("/wearable/sync", { device: deviceId, sync_type: "simulated" });
      toast.success(`${deviceId} synced: ${res.data.ingested} metrics imported`);
      setSynced(s => ({ ...s, [deviceId]: true }));
    } catch (err) { toast.error("Sync failed"); }
    finally { setSyncing(s => ({ ...s, [deviceId]: false })); }
  };

  const handleLabUpload = async () => {
    setUploading(true);
    try {
      const results = {};
      labResults.split("\n").forEach(line => {
        const [code, val] = line.split(":").map(s => s.trim());
        if (code && val && !isNaN(parseFloat(val))) results[code] = parseFloat(val);
      });
      if (Object.keys(results).length === 0) { toast.error("No valid results found"); setUploading(false); return; }
      const res = await api.post("/lab/upload", { lab_name: labName, results });
      toast.success(`Lab results processed: ${res.data.ingested} biomarkers`);
      setLabResults("");
    } catch (err) { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleOcrUpload = async () => {
    if (!labText.trim()) return;
    setOcrProcessing(true);
    try {
      const res = await api.post("/lab/upload-text", { text: labText });
      if (res.data.parsed > 0) {
        toast.success(`OCR extracted ${res.data.parsed} biomarkers: ${Object.keys(res.data.extracted).join(", ")}`);
        setLabText("");
      } else {
        toast.warning("No biomarkers detected. Try structured format.");
      }
    } catch (err) { toast.error("OCR processing failed"); }
    finally { setOcrProcessing(false); }
  };

  const isConnected = (deviceId) => connections.some(c => c.device === deviceId);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
          <span className="text-cosmic">Wearables</span> & Lab Integration
        </h1>
        <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
          Connect devices &middot; Import lab results &middot; Sync biomarker data
        </p>
      </div>

      {/* Wearable Devices */}
      <div>
        <h2 className="font-display text-lg font-bold text-stellar mb-3 uppercase tracking-wide">Connected Devices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEVICES.map(d => {
            const connected = isConnected(d.id);
            return (
              <div key={d.id} className={`glass-card rounded-lg p-5 flex flex-col gap-3 ${connected ? "border-nebula/20" : ""}`} data-testid={`device-${d.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${connected ? "bg-nebula/10 border border-nebula/20" : "bg-cosmic/10 border border-cosmic/20"}`}>
                      <Watch size={20} className={connected ? "text-nebula" : "text-cosmic"} />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-stellar">{d.name}</p>
                      <p className="font-mono text-[9px] text-stellar-dim">{d.desc}</p>
                    </div>
                  </div>
                  {connected && <Badge className="bg-nebula/10 text-nebula border-nebula/20 font-mono text-[8px]">Connected</Badge>}
                </div>
                <div className="flex gap-2">
                  {!connected ? (
                    <Button data-testid={`connect-${d.id}-btn`} onClick={() => handleConnect(d.id)} disabled={connecting[d.id]}
                      size="sm" className="flex-1 bg-cosmic/10 hover:bg-cosmic/20 text-cosmic border border-cosmic/20 font-mono text-xs uppercase tracking-wider">
                      <Link2 size={12} className="mr-1.5" />
                      {connecting[d.id] ? "Connecting..." : d.hasOAuth ? "OAuth Connect" : "Connect"}
                    </Button>
                  ) : (
                    <Button data-testid={`sync-${d.id}-btn`} onClick={() => handleSync(d.id)} disabled={syncing[d.id]}
                      size="sm" className="flex-1 bg-nebula/10 hover:bg-nebula/20 text-nebula border border-nebula/20 font-mono text-xs uppercase tracking-wider">
                      {syncing[d.id] ? <RefreshCw size={12} className="animate-spin mr-1.5" /> : <Wifi size={12} className="mr-1.5" />}
                      {syncing[d.id] ? "Syncing..." : "Sync Now"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lab Tabs */}
      <Tabs defaultValue="structured" className="w-full">
        <TabsList className="bg-space-light/50 border border-white/5">
          <TabsTrigger value="structured" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
            <FileText size={14} className="mr-1.5" /> Structured Entry
          </TabsTrigger>
          <TabsTrigger value="ocr" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
            <Upload size={14} className="mr-1.5" /> OCR Text Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structured" className="mt-4">
          <div className="glass-card rounded-lg p-6">
            <h2 className="font-display text-lg font-bold text-stellar mb-1 uppercase tracking-wide">Lab Report Entry</h2>
            <p className="text-stellar-dim text-xs font-body mb-4">
              Enter lab results in format: biomarker_code: value (one per line)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <textarea data-testid="lab-results-input" value={labResults} onChange={e => setLabResults(e.target.value)}
                  placeholder={"fasting_glucose: 85\nhba1c: 5.2\nldl_c: 95\nhdl_c: 62\ntriglycerides: 88\nhscrp: 0.4\nvitamin_d: 45"}
                  rows={8}
                  className="w-full bg-space border border-white/10 rounded-sm p-3 text-stellar font-mono text-sm placeholder:text-slate-600 focus:border-cosmic focus:outline-none resize-none"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-xs text-stellar-dim uppercase tracking-widest">Lab Name</label>
                  <input data-testid="lab-name-input" value={labName} onChange={e => setLabName(e.target.value)}
                    className="w-full mt-1 bg-space border border-white/10 rounded-sm px-3 py-2 text-stellar font-mono text-sm focus:border-cosmic focus:outline-none" />
                </div>
                <Button data-testid="upload-lab-btn" onClick={handleLabUpload} disabled={uploading || !labResults.trim()}
                  className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider border border-cosmic-light/30">
                  {uploading ? "Processing..." : "Process Lab Results"}
                </Button>
                <div className="p-3 bg-white/[0.03] rounded-sm border border-white/5">
                  <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-1">Supported Codes</p>
                  <p className="font-mono text-[9px] text-stellar-dim leading-relaxed">
                    fasting_glucose, hba1c, ldl_c, hdl_c, triglycerides, hscrp, vitamin_d,
                    vo2_max, grip_strength, body_fat_pct, resting_hr, hrv_rmssd
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ocr" className="mt-4">
          <div className="glass-card rounded-lg p-6">
            <h2 className="font-display text-lg font-bold text-stellar mb-1 uppercase tracking-wide">OCR Lab Report Parsing</h2>
            <p className="text-stellar-dim text-xs font-body mb-4">
              Paste raw lab report text — AgeReboot will extract biomarker values automatically using pattern recognition (NLP).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <textarea data-testid="ocr-text-input" value={labText} onChange={e => setLabText(e.target.value)}
                  placeholder={"Paste your lab report text here. Example:\n\nPatient: John Doe | Age: 35\nTest Results:\nFasting Glucose: 92 mg/dL\nHbA1c: 5.4%\nLDL Cholesterol: 110 mg/dL\nHDL Cholesterol: 55 mg/dL\nTriglycerides: 120 mg/dL\nhsCRP: 1.2 mg/L\nVitamin D (25-OH): 32 ng/mL\nResting Heart Rate: 68 bpm"}
                  rows={10}
                  className="w-full bg-space border border-white/10 rounded-sm p-3 text-stellar font-mono text-sm placeholder:text-slate-600 focus:border-cosmic focus:outline-none resize-none"
                />
              </div>
              <div className="space-y-3">
                <Button data-testid="process-ocr-btn" onClick={handleOcrUpload} disabled={ocrProcessing || !labText.trim()}
                  className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider border border-cosmic-light/30">
                  <Upload size={16} className="mr-2" />
                  {ocrProcessing ? "Processing OCR..." : "Extract Biomarkers"}
                </Button>
                <div className="p-3 bg-white/[0.03] rounded-sm border border-white/5">
                  <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-1">How it works</p>
                  <p className="font-mono text-[9px] text-stellar-dim leading-relaxed">
                    Our NLP parser uses regex pattern matching to identify biomarker values from unstructured lab text. Supports common lab report formats from Thyrocare, SRL, Metropolis, Quest, LabCorp.
                  </p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-sm border border-white/5">
                  <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-1">Detected Patterns</p>
                  <p className="font-mono text-[9px] text-stellar-dim leading-relaxed">
                    Glucose, HbA1c, LDL, HDL, Triglycerides, hsCRP, Vitamin D, Heart Rate, TSH
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
