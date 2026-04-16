import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Scale, Plus, TrendingDown, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function NUTBodyCompPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight_kg: "", body_fat_pct: "", lean_mass_kg: "", bmi: "", waist_cm: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/cc/members").then(r => { setMembers(r.data.members || []); setLoading(false); }); }, []);
  useEffect(() => { if (selectedId) api.get(`/coach-v2/nut/body-comp/${selectedId}`).then(r => setEntries(r.data.entries || [])); }, [selectedId]);

  const logEntry = async () => {
    if (!selectedId) { toast.error("Select a client"); return; }
    try {
      await api.post("/coach-v2/nut/body-comp", {
        member_id: selectedId,
        weight_kg: Number(form.weight_kg) || null,
        body_fat_pct: Number(form.body_fat_pct) || null,
        lean_mass_kg: Number(form.lean_mass_kg) || null,
        bmi: Number(form.bmi) || null,
        waist_cm: Number(form.waist_cm) || null,
      });
      api.get(`/coach-v2/nut/body-comp/${selectedId}`).then(r => setEntries(r.data.entries || []));
      setShowForm(false);
      toast.success("Body composition logged");
    } catch { toast.error("Failed"); }
  };

  const latest = entries[entries.length - 1] || {};
  const prev = entries.length > 1 ? entries[entries.length - 2] : {};

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="body-comp-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Body <span className="text-teal-400">Composition</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">WEIGHT, BODY FAT, LEAN MASS & BMI TRACKING</p>
        </div>
        <div className="flex items-center gap-3">
          <AppSelect data-testid="bc-member" value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 focus:outline-none min-w-[200px]">
            <AppSelectOption value="">Select client</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          {selectedId && <Button data-testid="new-bc" onClick={() => setShowForm(!showForm)} className="bg-teal-500 hover:bg-teal-600 text-white text-xs"><Plus size={14} className="mr-1" /> Log Entry</Button>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-teal-500/20 bg-black/30 p-5" data-testid="bc-form">
          <div className="grid grid-cols-5 gap-3 mb-3">
            {[["Weight (kg)", "weight_kg"], ["Body Fat %", "body_fat_pct"], ["Lean Mass (kg)", "lean_mass_kg"], ["BMI", "bmi"], ["Waist (cm)", "waist_cm"]].map(([label, key]) => (
              <div key={key}>
                <label className="font-mono text-[8px] text-slate-400 block mb-1">{label}</label>
                <input type="number" step="0.1" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:border-teal-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-bc" onClick={logEntry} className="bg-teal-500 hover:bg-teal-600 text-white text-xs">Save</Button>
          </div>
        </div>
      )}

      {selectedId && entries.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-3" data-testid="bc-summary">
            {[
              { label: "Weight", val: latest.weight_kg, prevVal: prev.weight_kg, unit: "kg", color: "#0F9F8F" },
              { label: "Body Fat", val: latest.body_fat_pct, prevVal: prev.body_fat_pct, unit: "%", color: "#D97706" },
              { label: "Lean Mass", val: latest.lean_mass_kg, prevVal: prev.lean_mass_kg, unit: "kg", color: "#10B981" },
              { label: "BMI", val: latest.bmi, prevVal: prev.bmi, unit: "", color: "#6366F1" },
              { label: "Waist", val: latest.waist_cm, prevVal: prev.waist_cm, unit: "cm", color: "#EF4444" },
            ].map(s => {
              const diff = s.val && s.prevVal ? (s.val - s.prevVal).toFixed(1) : null;
              return (
                <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                  <p className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.val ? Number(s.val).toFixed(1) : "N/A"}<span className="text-[10px] text-slate-500 ml-0.5">{s.unit}</span></p>
                  <p className="font-mono text-[7px] text-slate-500 uppercase">{s.label}</p>
                  {diff && <p className={`font-mono text-[8px] mt-0.5 ${Number(diff) < 0 ? "text-emerald-400" : Number(diff) > 0 ? "text-red-400" : "text-slate-500"}`}>{Number(diff) > 0 ? "+" : ""}{diff}</p>}
                </div>
              );
            })}
          </div>

          {/* Weight & Body Fat Chart */}
          <div className="rounded-xl border border-white/5 bg-black/20 p-5">
            <h3 className="font-display text-sm font-bold text-white mb-3">Weight & Body Fat Trend</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="w" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={35} />
                  <YAxis yAxisId="bf" orientation="right" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line yAxisId="w" type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#0F9F8F" strokeWidth={2} dot={{ r: 2 }} />
                  <Line yAxisId="bf" type="monotone" dataKey="body_fat_pct" name="Body Fat %" stroke="#D97706" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lean Mass & Waist Chart */}
          <div className="rounded-xl border border-white/5 bg-black/20 p-5">
            <h3 className="font-display text-sm font-bold text-white mb-3">Lean Mass & Waist Circumference</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={{ background: "#0A0720", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "9px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="lean_mass_kg" name="Lean Mass (kg)" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="waist_cm" name="Waist (cm)" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!selectedId && <p className="text-slate-500 text-sm text-center py-16">Select a client to view body composition data</p>}
    </div>
  );
}
