import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileText, Plus, Search, Heart, AlertCircle, Pill, ShieldAlert,
  ChevronRight, Clock, Stethoscope,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function HCPEMRPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [chart, setChart] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [tab, setTab] = useState("encounters");
  const [showForm, setShowForm] = useState(null);
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/cc/members").then(r => { setMembers(r.data.members); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const loadChart = async (memberId) => {
    setSelectedMember(memberId);
    setChartLoading(true);
    try {
      const res = await api.get(`/emr/member/${memberId}/chart`);
      setChart(res.data);
    } catch { toast.error("Failed to load chart"); }
    finally { setChartLoading(false); }
  };

  const submitEncounter = async () => {
    try {
      await api.post("/emr/encounters", { member_id: selectedMember, ...form });
      toast.success("Encounter saved");
      setShowForm(null);
      setForm({});
      loadChart(selectedMember);
    } catch { toast.error("Failed to save encounter"); }
  };

  const submitProblem = async () => {
    try {
      await api.post(`/emr/member/${selectedMember}/problems`, form);
      toast.success("Problem added");
      setShowForm(null);
      setForm({});
      loadChart(selectedMember);
    } catch { toast.error("Failed to add problem"); }
  };

  const submitMedication = async () => {
    try {
      await api.post(`/emr/member/${selectedMember}/medications`, form);
      toast.success("Medication added");
      setShowForm(null);
      setForm({});
      loadChart(selectedMember);
    } catch { toast.error("Failed to add medication"); }
  };

  const submitAllergy = async () => {
    try {
      await api.post(`/emr/member/${selectedMember}/allergies`, form);
      toast.success("Allergy recorded");
      setShowForm(null);
      setForm({});
      loadChart(selectedMember);
    } catch { toast.error("Failed to add allergy"); }
  };

  const filtered = search ? members.filter(m => m.name?.toLowerCase().includes(search.toLowerCase())) : members;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-emr-page">
      <div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Electronic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#6366F1]">Medical Records</span>
        </h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">FHIR-Inspired Clinical Records System</p>
      </div>

      {!selectedMember ? (
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input data-testid="emr-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
              className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-slate-600 font-body text-sm h-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="emr-member-grid">
            {filtered.slice(0, 18).map(m => (
              <button key={m.id} data-testid={`emr-member-${m.id}`} onClick={() => loadChart(m.id)}
                className="group rounded-xl border border-white/5 bg-black/20 p-4 text-left hover:bg-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm font-medium text-white group-hover:text-[#7B35D8] transition-colors">{m.name}</p>
                    <p className="font-mono text-[9px] text-slate-500">{m.age}y &middot; {m.sex} &middot; HPS {Math.round(m.hps_score)}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-[#7B35D8]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : chartLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
      ) : chart ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedMember(null); setChart(null); }} className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{chart.member.name}</h2>
                <p className="font-mono text-[9px] text-slate-500">{chart.member.age}y &middot; {chart.member.sex} &middot; {chart.member.franchise || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-1 rounded-lg bg-[#7B35D8]/10 border border-[#7B35D8]/20">
                <span className="font-mono text-[8px] text-[#7B35D8] block">Encounters</span>
                <span className="font-mono text-lg font-bold text-white">{chart.encounter_count}</span>
              </div>
              <div className="text-center px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="font-mono text-[8px] text-red-400 block">Problems</span>
                <span className="font-mono text-lg font-bold text-white">{chart.active_problems}</span>
              </div>
              <div className="text-center px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-mono text-[8px] text-emerald-400 block">Medications</span>
                <span className="font-mono text-lg font-bold text-white">{chart.active_medications}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/5 pb-px" data-testid="emr-tabs">
            {[
              { key: "encounters", label: "Encounters", icon: Stethoscope },
              { key: "problems", label: "Problems", icon: AlertCircle },
              { key: "medications", label: "Medications", icon: Pill },
              { key: "allergies", label: "Allergies", icon: ShieldAlert },
            ].map(({ key, label, icon: TIcon }) => (
              <button key={key} data-testid={`emr-tab-${key}`} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm font-medium transition-all border-b-2 ${tab === key ? "border-[#7B35D8] text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                <TIcon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <Button data-testid="emr-add-btn" size="sm" onClick={() => { setShowForm(tab); setForm({}); }}
              className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-xs">
              <Plus size={14} className="mr-1" /> Add {tab === "encounters" ? "Encounter" : tab === "problems" ? "Problem" : tab === "medications" ? "Medication" : "Allergy"}
            </Button>
          </div>

          {/* Add Forms */}
          {showForm === "encounters" && (
            <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-5 space-y-3" data-testid="encounter-form">
              <h3 className="font-display text-sm font-bold text-white">New Clinical Encounter (SOAP)</h3>
              <div className="grid grid-cols-2 gap-3">
                <AppSelect value={form.encounter_type || "office_visit"} onChange={e => setForm(p => ({ ...p, encounter_type: e.target.value }))}
                  className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
                  <AppSelectOption value="office_visit">Office Visit</AppSelectOption><AppSelectOption value="telehealth">Telehealth</AppSelectOption><AppSelectOption value="follow_up">Follow-up</AppSelectOption><AppSelectOption value="urgent">Urgent</AppSelectOption>
                </AppSelect>
                <Input value={form.chief_complaint || ""} onChange={e => setForm(p => ({ ...p, chief_complaint: e.target.value }))} placeholder="Chief Complaint" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
              </div>
              {["subjective", "objective", "assessment", "plan"].map(field => (
                <div key={field}>
                  <label className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">{field.charAt(0).toUpperCase()} — {field}</label>
                  <textarea value={form[field] || ""} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none h-16 resize-none" />
                </div>
              ))}
              <div className="flex gap-3">
                <Button onClick={submitEncounter} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">Save Encounter</Button>
                <Button variant="outline" onClick={() => setShowForm(null)} className="border-white/10 text-slate-300 font-body text-sm">Cancel</Button>
              </div>
            </div>
          )}

          {showForm === "problems" && (
            <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-5 space-y-3" data-testid="problem-form">
              <h3 className="font-display text-sm font-bold text-white">Add Problem</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.problem_name || ""} onChange={e => setForm(p => ({ ...p, problem_name: e.target.value }))} placeholder="Problem name" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <Input value={form.icd10_code || ""} onChange={e => setForm(p => ({ ...p, icd10_code: e.target.value }))} placeholder="ICD-10 code" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
              </div>
              <textarea value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none h-16 resize-none" />
              <div className="flex gap-3">
                <Button onClick={submitProblem} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">Add Problem</Button>
                <Button variant="outline" onClick={() => setShowForm(null)} className="border-white/10 text-slate-300 font-body text-sm">Cancel</Button>
              </div>
            </div>
          )}

          {showForm === "medications" && (
            <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-5 space-y-3" data-testid="medication-form">
              <h3 className="font-display text-sm font-bold text-white">Add Medication</h3>
              <div className="grid grid-cols-3 gap-3">
                <Input value={form.medication_name || ""} onChange={e => setForm(p => ({ ...p, medication_name: e.target.value }))} placeholder="Medication name" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <Input value={form.dosage || ""} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} placeholder="Dosage" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <Input value={form.frequency || ""} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} placeholder="Frequency" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
              </div>
              <div className="flex gap-3">
                <Button onClick={submitMedication} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">Add Medication</Button>
                <Button variant="outline" onClick={() => setShowForm(null)} className="border-white/10 text-slate-300 font-body text-sm">Cancel</Button>
              </div>
            </div>
          )}

          {showForm === "allergies" && (
            <div className="rounded-xl border border-[#7B35D8]/20 bg-[#7B35D8]/5 p-5 space-y-3" data-testid="allergy-form">
              <h3 className="font-display text-sm font-bold text-white">Add Allergy</h3>
              <div className="grid grid-cols-3 gap-3">
                <Input value={form.allergen || ""} onChange={e => setForm(p => ({ ...p, allergen: e.target.value }))} placeholder="Allergen" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <Input value={form.reaction || ""} onChange={e => setForm(p => ({ ...p, reaction: e.target.value }))} placeholder="Reaction" className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <AppSelect value={form.severity || "moderate"} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                  className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none">
                  <AppSelectOption value="mild">Mild</AppSelectOption><AppSelectOption value="moderate">Moderate</AppSelectOption><AppSelectOption value="severe">Severe</AppSelectOption>
                </AppSelect>
              </div>
              <div className="flex gap-3">
                <Button onClick={submitAllergy} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-sm">Add Allergy</Button>
                <Button variant="outline" onClick={() => setShowForm(null)} className="border-white/10 text-slate-300 font-body text-sm">Cancel</Button>
              </div>
            </div>
          )}

          {/* Content Lists */}
          {tab === "encounters" && (
            <div className="space-y-3" data-testid="encounters-list">
              {chart.encounters.length > 0 ? chart.encounters.map(enc => (
                <div key={enc.id} className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[#7B35D8]" />
                      <span className="font-body text-sm font-medium text-white">{enc.encounter_type.replace(/_/g, " ")}</span>
                      <Badge className="font-mono text-[7px] bg-[#7B35D8]/10 text-[#7B35D8] border border-[#7B35D8]/20">{enc.status}</Badge>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500">{new Date(enc.created_at).toLocaleDateString()} &middot; {enc.clinician_name}</span>
                  </div>
                  {enc.chief_complaint && <p className="font-body text-xs text-amber-400 mb-2">CC: {enc.chief_complaint}</p>}
                  {["subjective", "objective", "assessment", "plan"].map(field => enc[field] && (
                    <div key={field} className="mb-2">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">{field.charAt(0).toUpperCase()}</span>
                      <p className="font-body text-xs text-slate-300">{enc[field]}</p>
                    </div>
                  ))}
                </div>
              )) : <p className="text-slate-500 text-sm text-center py-8">No encounters recorded.</p>}
            </div>
          )}

          {tab === "problems" && (
            <div className="space-y-2" data-testid="problems-list">
              {chart.problems.length > 0 ? chart.problems.map(p => (
                <div key={p.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-white">{p.problem_name}</span>
                      {p.icd10_code && <Badge className="font-mono text-[7px] bg-slate-500/10 text-slate-400">{p.icd10_code}</Badge>}
                    </div>
                    {p.notes && <p className="font-body text-xs text-slate-400 mt-1">{p.notes}</p>}
                  </div>
                  <Badge className={`font-mono text-[7px] ${p.status === "active" ? "bg-red-500/10 text-red-400 border-red-500/20" : p.status === "chronic" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>{p.status}</Badge>
                </div>
              )) : <p className="text-slate-500 text-sm text-center py-8">No problems recorded.</p>}
            </div>
          )}

          {tab === "medications" && (
            <div className="space-y-2" data-testid="medications-list">
              {chart.medications.length > 0 ? chart.medications.map(m => (
                <div key={m.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-center justify-between">
                  <div>
                    <span className="font-body text-sm font-medium text-white">{m.medication_name}</span>
                    <p className="font-mono text-[9px] text-slate-500 mt-0.5">{m.dosage} &middot; {m.frequency} &middot; {m.route}</p>
                  </div>
                  <Badge className={`font-mono text-[7px] ${m.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>{m.status}</Badge>
                </div>
              )) : <p className="text-slate-500 text-sm text-center py-8">No medications recorded.</p>}
            </div>
          )}

          {tab === "allergies" && (
            <div className="space-y-2" data-testid="allergies-list">
              {chart.allergies.length > 0 ? chart.allergies.map(a => (
                <div key={a.id} className="rounded-xl border border-white/5 bg-black/20 p-4 flex items-center justify-between">
                  <div>
                    <span className="font-body text-sm font-medium text-white">{a.allergen}</span>
                    {a.reaction && <p className="font-body text-xs text-slate-400 mt-0.5">Reaction: {a.reaction}</p>}
                  </div>
                  <Badge className={`font-mono text-[7px] ${a.severity === "severe" ? "bg-red-500/10 text-red-400" : a.severity === "moderate" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"}`}>{a.severity}</Badge>
                </div>
              )) : <p className="text-slate-500 text-sm text-center py-8">No allergies recorded.</p>}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
