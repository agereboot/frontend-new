import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Send, Users, Target, Zap, Activity, AlertTriangle,
  Star, TrendingDown, ChevronRight, ChevronDown, ChevronUp,
  X, MessageSquare, Clock, CheckCircle, Eye, Mail,
} from "lucide-react";

const SEGMENT_ICONS = {
  inactive_14d: Clock, inactive_30d: AlertTriangle, near_profit_share: Target,
  high_bri: Zap, low_ehs: Activity, new_joiners: Users, top_performers: Star, declining_hps: TrendingDown,
};

export default function CorpNudgePage() {
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentEmployees, setSegmentEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customMessage, setCustomMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/corporate/nudge/segments").then(r => setSegments(r.data.segments || [])),
      api.get("/corporate/nudge/campaigns").then(r => setCampaigns(r.data.campaigns || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const selectSegment = async (seg) => {
    setSelectedSegment(seg);
    setShowCompose(false);
    try {
      const { data } = await api.get(`/corporate/nudge/segments/${seg.id}/employees`);
      setSegmentEmployees(data.employees || []);
      setTemplates(data.templates || []);
      setSelectedTemplate(0);
      setCustomMessage(data.templates?.[0] || "");
    } catch { toast.error("Failed to load segment"); }
  };

  const sendCampaign = async () => {
    if (!selectedSegment) return;
    setSending(true);
    try {
      const { data } = await api.post("/corporate/nudge/campaigns", {
        name: campaignName || `${selectedSegment.label} Nudge`,
        segment_id: selectedSegment.id,
        message_template: customMessage || templates[selectedTemplate] || "",
        channel: "in_app",
      });
      setCampaigns(c => [data, ...c]);
      setShowCompose(false);
      setSelectedSegment(null);
      toast.success(`Campaign sent to ${data.target_count} employees`);
    } catch { toast.error("Failed to send campaign"); }
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-nudge-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Nudge <span className="text-amber-400">Engine</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">TARGETED PUSH CAMPAIGNS &bull; AI-POWERED MESSAGING</p>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="segment-grid">
        {segments.map(seg => {
          const Icon = SEGMENT_ICONS[seg.id] || Users;
          const isActive = selectedSegment?.id === seg.id;
          return (
            <button key={seg.id} onClick={() => selectSegment(seg)} data-testid={`segment-${seg.id}`}
              className={`rounded-xl border p-4 text-left transition-all ${isActive ? "border-amber-500/40 bg-amber-500/[0.06]" : "border-white/5 bg-black/20 hover:bg-white/[0.03]"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: seg.color + "15" }}>
                  <Icon size={14} style={{ color: seg.color }} />
                </div>
                <Badge className="font-mono text-[8px]" style={{ backgroundColor: seg.color + "15", color: seg.color }}>{seg.count}</Badge>
              </div>
              <p className="font-body text-xs text-white">{seg.label}</p>
              <p className="font-mono text-[7px] text-slate-500 mt-0.5">{seg.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Segment Detail + Compose */}
      {selectedSegment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in slide-in-from-top-4 duration-300">
          {/* Employee List */}
          <div className="lg:col-span-5 rounded-xl border border-white/5 bg-black/20 p-4" data-testid="segment-employees">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs font-bold text-white">{selectedSegment.label} ({segmentEmployees.length})</h3>
              <Button data-testid="compose-nudge-btn" size="sm" onClick={() => setShowCompose(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] gap-1"><Send size={12} />Compose Nudge</Button>
            </div>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {segmentEmployees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="font-body text-[11px] text-white">{emp.name}</p>
                    <p className="font-mono text-[7px] text-slate-500">{emp.department} &bull; HPS {emp.hps}</p>
                  </div>
                  <div className="text-right">
                    {emp.days_inactive > 0 && <p className="font-mono text-[9px] text-red-400">{emp.days_inactive}d inactive</p>}
                  </div>
                </div>
              ))}
              {segmentEmployees.length === 0 && <p className="font-mono text-xs text-slate-500 py-4 text-center">No employees in this segment</p>}
            </div>
          </div>

          {/* Compose Panel */}
          <div className="lg:col-span-7 rounded-xl border border-white/5 bg-black/20 p-5" data-testid="compose-panel">
            {showCompose ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-white">Compose Campaign</h3>
                  <button onClick={() => setShowCompose(false)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                </div>
                <input data-testid="campaign-name" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                  placeholder="Campaign name (optional)"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none" />
                <div>
                  <p className="font-mono text-[8px] text-slate-500 uppercase mb-2">AI-Generated Templates</p>
                  <div className="space-y-2">
                    {templates.map((t, i) => (
                      <button key={i} onClick={() => { setSelectedTemplate(i); setCustomMessage(t); }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTemplate === i ? "border-amber-500/30 bg-amber-500/[0.05]" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                        <p className="font-body text-[11px] text-slate-300">{t}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[8px] text-slate-500 uppercase mb-1">Customize Message</p>
                  <textarea data-testid="nudge-message" value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none resize-none" />
                  <p className="font-mono text-[7px] text-slate-600 mt-1">Variables: {"{name}"}, {"{hps}"}, {"{dept}"}, {"{gap}"}</p>
                </div>
                <div className="flex gap-2">
                  <Button data-testid="send-campaign-btn" onClick={sendCampaign} disabled={sending}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1">
                    <Send size={12} />{sending ? "Sending..." : `Send to ${segmentEmployees.length} employees`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare size={32} className="text-slate-600 mb-3" />
                <p className="font-body text-sm text-slate-400">Select a segment and click "Compose Nudge"</p>
                <p className="font-mono text-[9px] text-slate-600 mt-1">AI will generate personalized message templates</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaign History */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid="campaign-history">
        <h3 className="font-display text-xs font-bold text-white mb-3">Campaign History</h3>
        {campaigns.length === 0 ? (
          <p className="font-mono text-xs text-slate-500 text-center py-8">No campaigns sent yet. Select a segment above to get started.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Send size={14} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-white">{c.name}</p>
                  <p className="font-mono text-[7px] text-slate-500">{c.segment_label} &bull; {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center"><p className="font-mono text-xs font-bold text-white">{c.target_count}</p><p className="font-mono text-[6px] text-slate-500">SENT</p></div>
                  <div className="text-center"><p className="font-mono text-xs font-bold text-emerald-400">{c.delivered_count}</p><p className="font-mono text-[6px] text-slate-500">DELIVERED</p></div>
                  <div className="text-center"><p className="font-mono text-xs font-bold text-amber-400">{c.opened_count}</p><p className="font-mono text-[6px] text-slate-500">OPENED</p></div>
                  <div className="text-center">
                    <p className="font-mono text-xs font-bold text-indigo-400">{c.target_count ? Math.round((c.opened_count / c.target_count) * 100) : 0}%</p>
                    <p className="font-mono text-[6px] text-slate-500">OPEN RATE</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
