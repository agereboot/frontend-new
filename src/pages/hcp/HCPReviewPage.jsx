import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ClipboardCheck, CheckCircle, XCircle, Clock, Users,
  BookOpen, Shield, TrendingUp, AlertTriangle, ChevronDown, ChevronRight,
} from "lucide-react";

const ROLE_CATEGORIES = {
  psychologist: ["Behavioral & Psychology", "Cognitive Health", "Assessment", "Recovery & Stress"],
  physical_therapist: ["Exercise & Fitness", "Assessment", "Recovery & Stress"],
  nutritional_coach: ["Nutrition & Metabolism", "Gut Health", "Supplementation", "Assessment"],
  fitness_coach: ["Exercise & Fitness", "Assessment", "Recovery & Stress", "Social & Lifestyle"],
  coach: ["Exercise & Fitness", "Assessment", "Recovery & Stress", "Social & Lifestyle"],
  nurse_navigator: null,
};

export default function HCPReviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingPlans, setPendingPlans] = useState([]);
  const [pendingProtocols, setPendingProtocols] = useState([]);
  const [directClients, setDirectClients] = useState([]);
  const [assignMode, setAssignMode] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [expandedClient, setExpandedClient] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/cc/review/pending-plans").then(r => setPendingPlans(r.data.plans || [])).catch(() => {}),
      api.get("/cc/review/pending-protocols").then(r => setPendingProtocols(r.data.protocols || [])).catch(() => {}),
      api.get("/cc/review/direct-clients").then(r => setDirectClients(r.data.clients || [])).catch(() => {}),
      api.get("/cc/protocols").then(r => {
        const roleCats = ROLE_CATEGORIES[user?.role];
        const filtered = roleCats ? r.data.protocols.filter(p => roleCats.includes(p.category)) : r.data.protocols;
        setProtocols(filtered);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user?.role]);

  const handleApprove = async (planId) => {
    try {
      await api.put(`/cc/review/plans/${planId}/approve`);
      setPendingPlans(prev => prev.filter(p => p.id !== planId));
      toast.success("Care plan approved");
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async (planId) => {
    try {
      await api.put(`/cc/review/plans/${planId}/reject`);
      setPendingPlans(prev => prev.filter(p => p.id !== planId));
      toast.success("Care plan sent back for revision");
    } catch { toast.error("Failed to reject"); }
  };

  const handleApproveProtocol = async (protocolId) => {
    try {
      await api.put(`/cc/review/protocols/${protocolId}/approve`);
      setPendingProtocols(prev => prev.filter(p => p.id !== protocolId));
      toast.success("Protocol approved");
    } catch { toast.error("Failed to approve protocol"); }
  };

  const handleAssignProtocol = async (clientId, protocolId) => {
    try {
      await api.post(`/cc/review/assign-protocol`, { client_id: clientId, protocol_id: protocolId });
      toast.success("Protocol assigned to client");
      setAssignMode(null);
    } catch { toast.error("Failed to assign protocol"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="review-loading">
      <div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="review-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Review & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#4F46E5]">Approve</span>
        </h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">
          Physician-assigned care plans and longevity protocols for your review
        </p>
      </div>

      {/* Pending Care Plans */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="pending-plans-section">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck size={16} className="text-violet-400" />
          <h2 className="font-display text-sm font-bold text-white">Pending Care Plans</h2>
          {pendingPlans.length > 0 && (
            <Badge className="font-mono text-[8px] bg-amber-500/10 text-amber-400 border-amber-500/20">{pendingPlans.length} Pending</Badge>
          )}
        </div>
        {pendingPlans.length > 0 ? (
          <div className="space-y-3">
            {pendingPlans.map(plan => (
              <div key={plan.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-4" data-testid={`plan-${plan.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-white font-medium">{plan.title || "Longevity Care Plan"}</p>
                    <p className="text-[10px] text-slate-500">Patient: {plan.member_name} &middot; Assigned by {plan.created_by_name}</p>
                  </div>
                  <Badge className="text-[8px] bg-amber-500/10 text-amber-400">Pending Review</Badge>
                </div>
                {plan.protocols?.map((pp, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <Badge className="text-[7px] font-mono bg-violet-500/10 text-violet-400">{pp.lgp_id}</Badge>
                    <span className="text-xs text-white">{pp.protocol_name}</span>
                    <span className="text-[9px] text-slate-500">{pp.category}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" data-testid={`approve-plan-${plan.id}`} onClick={() => handleApprove(plan.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <CheckCircle size={12} className="mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" data-testid={`reject-plan-${plan.id}`} onClick={() => handleReject(plan.id)}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs">
                    <XCircle size={12} className="mr-1" /> Send Back
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">No pending care plans to review</p>
        )}
      </div>

      {/* Pending Longevity Protocols */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="pending-protocols-section">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-emerald-400" />
          <h2 className="font-display text-sm font-bold text-white">Longevity Protocols for Review</h2>
          {pendingProtocols.length > 0 && (
            <Badge className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{pendingProtocols.length} Awaiting</Badge>
          )}
        </div>
        {pendingProtocols.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingProtocols.map(proto => (
              <div key={proto.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-4" data-testid={`proto-${proto.id}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="text-[8px] font-mono bg-white/5 text-violet-400">{proto.lgp_id}</Badge>
                  <Badge className="text-[8px] bg-white/5 text-slate-300">{proto.category}</Badge>
                </div>
                <p className="text-sm text-white font-medium mb-1">{proto.protocol_name}</p>
                <p className="text-[10px] text-slate-500 mb-1">Patient: {proto.member_name} &middot; {proto.duration_weeks}wk</p>
                {proto.approved_by_name && <p className="text-[10px] text-slate-400">Prescribed by {proto.approved_by_name}</p>}
                <Button size="sm" data-testid={`approve-proto-${proto.id}`} onClick={() => handleApproveProtocol(proto.id)}
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full">
                  <CheckCircle size={12} className="mr-1" /> Approve & Start
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">No pending longevity protocols to review</p>
        )}
      </div>

      {/* Direct Appointment Clients — Assign Protocols */}
      <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid="direct-clients-section">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-[#7B35D8]" />
          <h2 className="font-display text-sm font-bold text-white">Direct Appointment Clients</h2>
          <p className="text-[10px] text-slate-500 ml-2">Assign role-specific care plans to clients who booked directly</p>
        </div>
        {directClients.length > 0 ? (
          <div className="space-y-2">
            {directClients.map(client => (
              <div key={client.id} className="rounded-lg border border-white/5 bg-white/[0.02]" data-testid={`direct-client-${client.id}`}>
                <button onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-all">
                  <div className="w-8 h-8 rounded-lg bg-[#7B35D8]/10 border border-[#7B35D8]/20 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-[#7B35D8]">{(client.name || "?")[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{client.name}</p>
                    <p className="text-[10px] text-slate-500">Last appointment: {client.last_appointment ? new Date(client.last_appointment).toLocaleDateString() : "N/A"}</p>
                  </div>
                  {expandedClient === client.id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                </button>
                {expandedClient === client.id && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-3">
                    <p className="text-[10px] text-slate-400 mb-2">Select a protocol to assign:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                      {protocols.slice(0, 8).map(p => (
                        <button key={p.id} data-testid={`assign-${p.id}-${client.id}`}
                          onClick={() => handleAssignProtocol(client.id, p.id)}
                          className="text-left rounded-lg border border-white/5 bg-black/20 p-2.5 hover:border-[#7B35D8]/30 hover:bg-[#7B35D8]/5 transition-all">
                          <Badge className="text-[7px] font-mono bg-white/5 text-violet-400 mb-1">{p.lgp_id}</Badge>
                          <p className="text-[11px] text-white truncate">{p.name}</p>
                          <p className="text-[9px] text-slate-500">{p.category}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">No direct-appointment clients without assigned protocols</p>
        )}
      </div>
    </div>
  );
}
