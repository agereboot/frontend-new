import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield, Eye, Share2, Brain, Lock, FileCheck, Watch, Smartphone, Wifi, WifiOff,
  RefreshCw, ChevronRight, Heart, Activity, Moon, Zap, Footprints, Droplet,
  Thermometer, Scale, CircleDot, Image, ImageOff, CheckCircle, Loader2
} from "lucide-react";

/* ─── Privacy Settings Config ─── */
const PRIVACY_SETTINGS = [
  { key: "share_hps", label: "Share HPS Score", desc: "Allow your HPS score to appear on leaderboards", icon: Eye, category: "Sharing" },
  { key: "share_biomarkers", label: "Share Biomarker Data", desc: "Allow biomarker details to be visible to franchise", icon: Share2, category: "Sharing" },
  { key: "share_to_franchise", label: "Share to Franchise", desc: "Allow your franchise admin to view your performance data", icon: Share2, category: "Sharing" },
  { key: "share_to_care_team", label: "Share to Care Team", desc: "Allow your assigned clinicians to view your health records", icon: Shield, category: "Sharing" },
  { key: "consent_data_processing", label: "Data Processing Consent", desc: "Consent to process your health data for scoring and analytics", icon: FileCheck, category: "Consent" },
  { key: "consent_ai_analysis", label: "AgeReboot Analysis Consent", desc: "Consent to AgeReboot-powered roadmap generation and recommendations", icon: Brain, category: "Consent" },
  { key: "allow_photo_posts", label: "Allow Photo Posts", desc: "Enable photo uploads in your community feed posts", icon: Image, category: "Photos" },
  { key: "blur_photos_non_team", label: "Blur Photos for Outsiders", desc: "Blur your posted photos for users outside your franchise team", icon: ImageOff, category: "Photos" },
];

/* ─── Wearable Device Icons ─── */
const DEVICE_ICONS = {
  phone: Smartphone, watch: Watch, ring: CircleDot, band: Activity, scale: Scale,
};

const METRIC_ICONS = {
  "Heart Rate": Heart, "HRV": Activity, "HRV RMSSD": Activity, "HRV Status": Activity,
  "Steps": Footprints, "Sleep": Moon, "Sleep Stages": Moon, "Sleep Score": Moon,
  "Sleep Performance": Moon, "Deep Sleep": Moon, "REM": Moon, "Nightly Recharge": Moon,
  "SpO2": Droplet, "VO2 Max": Zap, "Active Energy": Zap, "Active Zone Minutes": Zap,
  "Strain Score": Zap, "Training Load": Zap, "Cardio Load": Zap, "Running Index": Zap,
  "Body Battery": Zap, "Recovery Score": RefreshCw, "Readiness": RefreshCw,
  "Stress": Brain, "Stress Level": Brain, "Stress Score": Brain, "Mindful Minutes": Brain,
  "Body Temperature": Thermometer, "Skin Temperature": Thermometer,
  "Blood Pressure": Heart, "Blood Glucose": Droplet, "ECG": Heart,
  "Weight": Scale, "Body Fat %": Scale, "Body Composition": Scale,
  "Pulse Wave Velocity": Heart, "Respiratory Rate": Activity,
  "PAI Score": Zap, "Base Fitness": Zap,
};

const CATEGORY_ORDER = ["phone", "watch", "ring", "band", "scale"];
const CATEGORY_LABELS = { phone: "Phone Health Apps", watch: "Smartwatches", ring: "Smart Rings", band: "Fitness Bands", scale: "Smart Scales" };

function timeAgo(ts) {
  if (!ts) return "Never synced";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/* ─── Device Card ─── */
function DeviceCard({ device, onConnect, onDisconnect, onSync, syncing }) {
  const isConnected = device.status === "connected";
  const CategoryIcon = DEVICE_ICONS[device.category] || Watch;
  const [connecting, setConnecting] = useState(false);

  const handleToggle = async () => {
    setConnecting(true);
    try {
      if (isConnected) {
        await onDisconnect(device.id);
      } else {
        await onConnect(device.id);
      }
    } finally { setConnecting(false); }
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        isConnected
          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
          : "border-white/5 bg-white/[0.02] hover:border-white/10"
      }`}
      data-testid={`device-${device.id}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isConnected ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/5"
        }`}>
          <CategoryIcon size={18} className={isConnected ? "text-emerald-400" : "text-stellar-dim"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-stellar truncate">{device.name}</span>
            {isConnected && <CheckCircle size={12} className="text-emerald-400 shrink-0" />}
          </div>
          <div className="text-[10px] font-mono text-stellar-dim mt-0.5">
            {isConnected ? (
              <span className="text-emerald-400/70">Connected · Last sync: {timeAgo(device.last_sync)}</span>
            ) : (
              <span>{device.metrics?.length || 0} health metrics available</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && (
            <Button
              data-testid={`sync-${device.id}`}
              onClick={() => onSync(device.id)}
              disabled={syncing === device.id}
              size="sm"
              className="bg-white/[0.03] hover:bg-white/[0.06] text-stellar-dim border border-white/5 h-8 px-3 rounded-lg"
            >
              {syncing === device.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </Button>
          )}
          <button
            data-testid={`toggle-device-${device.id}`}
            onClick={handleToggle}
            disabled={connecting}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
              isConnected ? "bg-emerald-500" : "bg-white/10"
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
              isConnected ? "left-[22px]" : "left-0.5"
            }`} />
          </button>
        </div>
      </div>

      {/* Metrics pills */}
      {isConnected && device.metrics && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
          {device.metrics.map(m => {
            const MIcon = METRIC_ICONS[m] || Activity;
            return (
              <span key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5 text-[9px] font-mono text-stellar-dim">
                <MIcon size={9} className="text-emerald-400/60" /> {m}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════ */
export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("privacy");
  const [settings, setSettings] = useState({});
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [privRes, devRes] = await Promise.all([
        api.get("/settings/privacy"),
        api.get("/wearable/devices"),
      ]);
      setSettings(privRes.data || {});
      setDevices(devRes.data?.devices || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, user_id, ...privacyData } = settings;
      await api.post("/settings/privacy", privacyData);
      toast.success("Settings saved successfully");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleConnect = async (deviceId) => {
    try {
      await api.post(`/wearable/connect/${deviceId}`);
      toast.success(`Connected to ${devices.find(d => d.id === deviceId)?.name}`);
      const res = await api.get("/wearable/devices");
      setDevices(res.data?.devices || []);
    } catch (err) { toast.error(err.response?.data?.detail || "Connection failed"); }
  };

  const handleDisconnect = async (deviceId) => {
    try {
      await api.post(`/wearable/disconnect/${deviceId}`);
      toast.success("Device disconnected");
      const res = await api.get("/wearable/devices");
      setDevices(res.data?.devices || []);
    } catch { toast.error("Disconnect failed"); }
  };

  const handleSync = async (deviceId) => {
    setSyncing(deviceId);
    try {
      await api.post("/wearable/sync", { device: deviceId });
      toast.success("Sync complete — new data ingested!");
      const res = await api.get("/wearable/devices");
      setDevices(res.data?.devices || []);
    } catch { toast.error("Sync failed"); }
    finally { setSyncing(null); }
  };

  const tabs = [
    { id: "privacy", label: "Privacy & Data", icon: Shield },
    { id: "wearables", label: "Wearable Devices", icon: Watch },
  ];

  const privacyCategories = [...new Set(PRIVACY_SETTINGS.map(s => s.category))];
  const catIcons = { Sharing: Share2, Consent: FileCheck, Photos: Image };
  const connectedCount = devices.filter(d => d.status === "connected").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto" />
        <p className="mt-4 font-mono text-xs text-stellar-dim tracking-wider uppercase">Loading Settings...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-slide-up" data-testid="settings-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            <span className="text-cosmic">Settings</span> & Privacy
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            Privacy Controls · Wearable Integrations · Data Management
          </p>
        </div>
        {activeTab === "privacy" && (
          <Button data-testid="save-settings-btn" onClick={handleSave} disabled={saving}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider px-5 rounded-full border border-cosmic-light/30 shadow-[0_0_20px_rgba(123,53,216,0.25)]">
            <Lock size={14} className="mr-1.5" /> {saving ? "Saving..." : "Save Settings"}
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/5 w-fit">
        {tabs.map(t => {
          const TIcon = t.icon;
          return (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs uppercase tracking-wider transition-all duration-300 ${
                activeTab === t.id
                  ? "bg-cosmic/15 text-cosmic border border-cosmic/20"
                  : "text-stellar-dim hover:text-stellar hover:bg-white/[0.03]"
              }`}
            >
              <TIcon size={14} />
              {t.label}
              {t.id === "wearables" && connectedCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono border border-emerald-500/30">
                  {connectedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ PRIVACY TAB ═══ */}
      {activeTab === "privacy" && (
        <div className="space-y-5">
          {privacyCategories.map(cat => {
            const CatIcon = catIcons[cat] || Shield;
            return (
              <div key={cat} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
                <h3 className="font-display text-xs font-bold text-stellar mb-4 uppercase tracking-[0.15em] flex items-center gap-2">
                  <CatIcon size={14} className="text-cosmic" /> {cat}
                </h3>
                <div className="space-y-1">
                  {PRIVACY_SETTINGS.filter(s => s.category === cat).map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:border-cosmic/20 transition-colors">
                            <Icon size={14} className="text-stellar-dim group-hover:text-cosmic transition-colors" />
                          </div>
                          <div>
                            <Label className="font-body text-sm text-stellar cursor-pointer">{s.label}</Label>
                            <p className="font-mono text-[9px] text-stellar-dim mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                        <Switch data-testid={`toggle-${s.key}`} checked={!!settings[s.key]} onCheckedChange={() => handleToggle(s.key)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-5">
            <h3 className="font-display text-xs font-bold text-red-400 mb-2 uppercase tracking-[0.15em]">Danger Zone</h3>
            <p className="text-stellar-dim text-[11px] font-body mb-3">These actions are irreversible. Contact support for data deletion requests.</p>
            <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 font-mono text-[10px] uppercase tracking-wider rounded-lg h-8">
              Request Data Export
            </Button>
          </div>
        </div>
      )}

      {/* ═══ WEARABLES TAB ═══ */}
      {activeTab === "wearables" && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                connectedCount > 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/5"
              }`}>
                {connectedCount > 0 ? <Wifi size={18} className="text-emerald-400" /> : <WifiOff size={18} className="text-stellar-dim" />}
              </div>
              <div>
                <span className="font-body text-sm font-semibold text-stellar">
                  {connectedCount > 0 ? `${connectedCount} Device${connectedCount > 1 ? "s" : ""} Connected` : "No Devices Connected"}
                </span>
                <p className="font-mono text-[9px] text-stellar-dim mt-0.5">
                  {connectedCount > 0 ? "Your health data syncs automatically" : "Connect a device to start tracking real-time health metrics"}
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-stellar-dim px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
              {devices.length} available
            </span>
          </div>

          {/* Note */}
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-3 flex items-start gap-2">
            <Smartphone size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-body text-stellar-dim leading-relaxed">
              <strong className="text-amber-400">Phone Health Apps</strong> (Apple Health, Google Health Connect, Samsung Health) sync directly from your phone. 
              <strong className="text-stellar"> Wearable devices</strong> connect via their companion apps and OAuth. All connections are currently in <strong className="text-cosmic">simulated mode</strong> for demo purposes.
            </p>
          </div>

          {/* Device Categories */}
          {CATEGORY_ORDER.map(cat => {
            const catDevices = devices.filter(d => d.category === cat);
            if (catDevices.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="font-display text-[10px] font-bold text-stellar-dim uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  {CATEGORY_LABELS[cat] || cat}
                  <span className="font-mono text-[9px] text-cosmic/50">{catDevices.length}</span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {catDevices.map(d => (
                    <DeviceCard
                      key={d.id}
                      device={d}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onSync={handleSync}
                      syncing={syncing}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
