import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Pill, Plus, Search, RefreshCw, Clock, CheckCircle,
  XCircle, AlertTriangle,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const STATUS_CONFIG = {
  active: { color: "#10B981", label: "Active" },
  dispensed: { color: "#6366F1", label: "Dispensed" },
  completed: { color: "#475569", label: "Completed" },
  cancelled: { color: "#EF4444", label: "Cancelled" },
};
const TYPE_COLORS = {
  supplement: "#0F9F8F",
  pharmaceutical: "#7B35D8",
  nutraceutical: "#D97706",
};

export default function HCPPrescriptionsPage() {
  const [rxs, setRxs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    member_id: "", medication_name: "", medication_type: "supplement",
    dosage: "", frequency: "", route: "oral", duration_days: 90,
    refills_allowed: 0, clinical_notes: "", diagnosis_code: "",
  });

  useEffect(() => {
    Promise.all([
      api.get("/emr/e-prescribe").then(r => setRxs(r.data.prescriptions)),
      api.get("/cc/members").then(r => setMembers(r.data.members)),
    ]).finally(() => setLoading(false));
  }, []);

  const createRx = async () => {
    if (!form.member_id || !form.medication_name) { toast.error("Select member and enter medication"); return; }
    setCreating(true);
    try {
      const res = await api.post("/emr/e-prescribe", form);
      setRxs(prev => [res.data, ...prev]);
      toast.success(`Prescription ${res.data.rx_number} created`);
      setShowCreate(false);
      setForm({ member_id: "", medication_name: "", medication_type: "supplement", dosage: "", frequency: "", route: "oral", duration_days: 90, refills_allowed: 0, clinical_notes: "", diagnosis_code: "" });
    } catch { toast.error("Failed to create prescription"); }
    finally { setCreating(false); }
  };

  const updateStatus = async (rxId, status) => {
    try {
      await api.put(`/emr/e-prescribe/${rxId}`, { status });
      setRxs(prev => prev.map(r => r.id === rxId ? { ...r, status } : r));
      toast.success(`Prescription ${status}`);
    } catch { toast.error("Update failed"); }
  };

  const refill = async (rxId) => {
    try {
      const res = await api.post(`/emr/e-prescribe/${rxId}/refill`, { notes: "" });
      setRxs(prev => prev.map(r => r.id === rxId ? { ...r, refills_used: (r.refills_used || 0) + 1 } : r));
      toast.success(`Refill processed. ${res.data.refills_remaining} remaining`);
    } catch (err) { toast.error(err.response?.data?.detail || "Refill failed"); }
  };

  const filtered = filter ? rxs.filter(r => r.member_name?.toLowerCase().includes(filter.toLowerCase()) || r.medication_name?.toLowerCase().includes(filter.toLowerCase())) : rxs;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-prescriptions-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            E-<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#6366F1]">Prescribe</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Prescription Management & Refills</p>
        </div>
        <Button data-testid="create-rx-btn" onClick={() => setShowCreate(!showCreate)} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">
          <Plus size={16} className="mr-2" /> New Prescription
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-6 space-y-4" data-testid="rx-form">
          <h3 className="font-display text-base font-bold text-white">Create Prescription</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Member</label>
              <AppSelect data-testid="rx-member" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
                <AppSelectOption value="">Select member...</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Medication</label>
              <Input data-testid="rx-medication" value={form.medication_name} onChange={e => setForm(p => ({ ...p, medication_name: e.target.value }))}
                placeholder="e.g. NMN 500mg" className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Type</label>
              <AppSelect data-testid="rx-type" value={form.medication_type} onChange={e => setForm(p => ({ ...p, medication_type: e.target.value }))}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
                <AppSelectOption value="supplement">Supplement</AppSelectOption>
                <AppSelectOption value="pharmaceutical">Pharmaceutical</AppSelectOption>
                <AppSelectOption value="nutraceutical">Nutraceutical</AppSelectOption>
              </AppSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Input value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} placeholder="Dosage" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
            <Input value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} placeholder="Frequency" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
            <AppSelect value={form.route} onChange={e => setForm(p => ({ ...p, route: e.target.value }))}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
              <AppSelectOption value="oral">Oral</AppSelectOption><AppSelectOption value="sublingual">Sublingual</AppSelectOption><AppSelectOption value="topical">Topical</AppSelectOption><AppSelectOption value="injection">Injection</AppSelectOption>
            </AppSelect>
            <Input type="number" value={form.duration_days} onChange={e => setForm(p => ({ ...p, duration_days: parseInt(e.target.value) || 0 }))} placeholder="Days" className="bg-black/30 border-white/10 text-white text-sm" />
            <Input type="number" value={form.refills_allowed} onChange={e => setForm(p => ({ ...p, refills_allowed: parseInt(e.target.value) || 0 }))} placeholder="Refills" className="bg-black/30 border-white/10 text-white text-sm" />
          </div>
          <textarea data-testid="rx-notes" value={form.clinical_notes} onChange={e => setForm(p => ({ ...p, clinical_notes: e.target.value }))}
            placeholder="Clinical notes..." className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600 h-16 resize-none" />
          <div className="flex gap-3">
            <Button data-testid="submit-rx" onClick={createRx} disabled={creating} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">{creating ? "Creating..." : "Submit Prescription"}</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 text-slate-300 hover:bg-white/5 font-body text-sm">Cancel</Button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input data-testid="rx-search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search prescriptions..."
          className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-slate-600 font-body text-sm h-10" />
      </div>

      <div className="space-y-3" data-testid="prescriptions-list">
        {filtered.length > 0 ? filtered.map(rx => {
          const sc = STATUS_CONFIG[rx.status] || STATUS_CONFIG.active;
          const tc = TYPE_COLORS[rx.medication_type] || "#7B35D8";
          return (
            <div key={rx.id} className="rounded-xl border border-white/5 bg-black/20 p-5" data-testid={`rx-${rx.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Pill size={18} style={{ color: tc }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-white">{rx.medication_name}</span>
                      <Badge className="font-mono text-[7px]" style={{ backgroundColor: tc + "15", color: tc, border: `1px solid ${tc}30` }}>{rx.medication_type}</Badge>
                    </div>
                    <p className="font-mono text-[9px] text-slate-500 mt-0.5">{rx.rx_number} &middot; {rx.member_name} &middot; {rx.prescriber_name}</p>
                  </div>
                </div>
                <Badge className="font-mono text-[8px]" style={{ backgroundColor: sc.color + "15", color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-mono text-[9px] text-slate-400">{rx.dosage}</span>
                <span className="font-mono text-[9px] text-slate-400">{rx.frequency}</span>
                <span className="font-mono text-[9px] text-slate-400">{rx.route}</span>
                <span className="font-mono text-[9px] text-slate-400">{rx.duration_days}d</span>
                <span className="font-mono text-[9px] text-slate-400">Refills: {rx.refills_used || 0}/{rx.refills_allowed}</span>
              </div>
              {rx.clinical_notes && <p className="font-body text-xs text-slate-400 mt-2">{rx.clinical_notes}</p>}
              <div className="flex gap-2 mt-3">
                {rx.status === "active" && rx.refills_used < rx.refills_allowed && (
                  <Button size="sm" onClick={() => refill(rx.id)} className="h-7 bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#6366F1]/20 font-mono text-[9px]">
                    <RefreshCw size={10} className="mr-1" /> Refill
                  </Button>
                )}
                {rx.status === "active" && (
                  <Button size="sm" onClick={() => updateStatus(rx.id, "cancelled")} className="h-7 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-mono text-[9px]">
                    <XCircle size={10} className="mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        }) : <p className="text-slate-500 text-sm text-center py-12">No prescriptions found.</p>}
      </div>
    </div>
  );
}
