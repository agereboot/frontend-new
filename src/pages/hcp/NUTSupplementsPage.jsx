import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pill, Plus, CheckCircle, AlertTriangle } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function NUTSupplementsPage() {
  const [supplements, setSupplements] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.get("/coach/nut/supplements").then(r => setSupplements(r.data.supplements || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const assignStack = async () => {
    if (!selectedMember || selected.size === 0) { toast.error("Select client and supplements"); return; }
    const member = members.find(m => m.id === selectedMember);
    const stack = supplements.filter(s => selected.has(s.id));
    try {
      await api.post("/coach/nut/supplements/assign", {
        member_id: selectedMember, member_name: member?.name || "",
        supplements: stack,
      });
      toast.success(`${stack.length} supplements assigned to ${member?.name}`);
      setSelected(new Set());
    } catch { toast.error("Failed to assign"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="supplements-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Supplement <span className="text-emerald-400">Manager</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">LONGEVITY SUPPLEMENT LIBRARY & ASSIGNMENT</p>
        </div>
        <div className="flex items-center gap-2">
          <AppSelect data-testid="supp-member" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none">
            <AppSelectOption value="">Select client</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          {selected.size > 0 && selectedMember && (
            <Button data-testid="assign-stack" onClick={assignStack} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              <CheckCircle size={12} className="mr-1" /> Assign {selected.size} Supplements
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {supplements.map(s => (
          <button key={s.id} onClick={() => toggleSelect(s.id)} data-testid={`supp-${s.id}`}
            className={`rounded-xl border p-4 text-left transition-all ${selected.has(s.id) ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/5 bg-black/20 hover:bg-white/[0.02]"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected.has(s.id) ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-white/5 border border-white/5"}`}>
                  <Pill size={14} className={selected.has(s.id) ? "text-emerald-400" : "text-slate-400"} />
                </div>
                <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{s.category}</Badge>
              </div>
              {s.evidence_grade && <Badge className={`font-mono text-[7px] ${s.evidence_grade === "A" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>Grade {s.evidence_grade}</Badge>}
            </div>
            <p className="font-display text-sm font-bold text-white">{s.name}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
              <span>{s.dose}</span>
              <span>{s.timing}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
