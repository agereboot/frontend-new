import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Watch, HeartPulse, Activity, Footprints, BedDouble, Zap, Loader2, User } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function WearableDashboardPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [wearables, setWearables] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wLoading, setWLoading] = useState(false);

  useEffect(() => {
    api.get("/cc/members").then(r => { setMembers(r.data.members || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) {
      setWLoading(true);
      api.get(`/patient/${selectedId}/wearables`).then(r => { setWearables(r.data); setWLoading(false); }).catch(() => setWLoading(false));
    }
  }, [selectedId]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="wearable-dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Wearable <span className="text-[#0F9F8F]">Dashboard</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">APPLE WATCH / OURA / WHOOP / GARMIN DATA FEED</p>
        </div>
        <AppSelect data-testid="wearable-member-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#0F9F8F] focus:outline-none min-w-[200px]">
          <AppSelectOption value="">Select a member</AppSelectOption>
          {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
        </AppSelect>
      </div>

      {!selectedId && (
        <div className="text-center py-16">
          <Watch size={48} className="text-[#0F9F8F]/20 mx-auto mb-3" />
          <p className="font-body text-sm text-slate-500">Select a member to view wearable data</p>
        </div>
      )}

      {wLoading && (
        <div className="text-center py-16"><Loader2 className="animate-spin mx-auto text-[#0F9F8F]" size={24} /></div>
      )}

      {selectedId && wearables && !wLoading && (
        <>
          {/* Summary Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3" data-testid="wearable-summary">
            {[
              { label: "Resting HR", value: wearables.summary?.avg_resting_hr, unit: "bpm", icon: HeartPulse, color: "#EF4444" },
              { label: "HRV", value: wearables.summary?.avg_hrv, unit: "ms", icon: Activity, color: "#6366F1" },
              { label: "Steps/Day", value: wearables.summary?.avg_steps?.toLocaleString(), unit: "", icon: Footprints, color: "#10B981" },
              { label: "Sleep", value: wearables.summary?.avg_sleep_score, unit: "/100", icon: BedDouble, color: "#7B35D8" },
              { label: "Recovery", value: wearables.summary?.avg_recovery, unit: "%", icon: Zap, color: "#0F9F8F" },
              { label: "VO2 Max", value: wearables.summary?.vo2max, unit: "mL/kg", icon: Activity, color: "#D97706" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center hover:bg-white/[0.02] transition-all">
                <s.icon size={18} style={{ color: s.color }} className="mx-auto mb-2" />
                <p className="font-mono text-xl font-black text-white">{s.value ?? "N/A"}<span className="text-[10px] text-slate-500 ml-0.5">{s.unit}</span></p>
                <p className="font-mono text-[7px] text-slate-500 uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* HR + HRV Chart */}
          {wearables.daily?.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-black/20 p-5">
              <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                <HeartPulse size={14} className="text-red-400" /> Heart Rate & Heart Rate Variability
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wearables.daily}>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Line type="monotone" dataKey="resting_hr" name="Resting HR" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#6366F1" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Steps Chart */}
          {wearables.daily?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Footprints size={14} className="text-emerald-400" /> Daily Steps
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wearables.daily}>
                      <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 7 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                      <Bar dataKey="steps" fill="#10B981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <BedDouble size={14} className="text-[#7B35D8]" /> Sleep & Recovery Scores
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wearables.daily}>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 7 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                      <Legend wrapperStyle={{ fontSize: "9px" }} />
                      <Line type="monotone" dataKey="sleep_score" name="Sleep" stroke="#7B35D8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="recovery_score" name="Recovery" stroke="#0F9F8F" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Connected Devices */}
          <div className="rounded-xl border border-white/5 bg-black/20 p-5">
            <h3 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Watch size={14} className="text-[#0F9F8F]" /> Connected Devices
            </h3>
            {wearables.connections?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {wearables.connections.map((c, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                    <Watch size={20} className="text-[#0F9F8F] mx-auto mb-1.5" />
                    <p className="font-body text-xs text-white">{c.device || "Device"}</p>
                    <Badge className="font-mono text-[7px] bg-emerald-500/10 text-emerald-400 mt-1">{c.status || "Connected"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="font-mono text-xs text-slate-500">Showing demo wearable data</p>
                <p className="font-mono text-[8px] text-slate-600 mt-1">Connect Apple Watch, Oura Ring, Whoop, or Garmin for live data</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
