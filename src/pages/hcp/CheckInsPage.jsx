import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckSquare, Plus, Smile, Zap, Moon, Brain, Loader2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function CheckInsPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [checkIns, setCheckIns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "weekly", mood_rating: 5, energy_level: 5, sleep_quality: 5, stress_level: 5, adherence_self_rating: 7, barriers: "", wins: "", goals_update: "", plan_adjustments: "", coach_notes: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/cc/members").then(r => { setMembers(r.data.members || []); setLoading(false); }); }, []);
  useEffect(() => { if (selectedId) api.get(`/coach-v2/check-ins/${selectedId}`).then(r => setCheckIns(r.data.check_ins || [])); }, [selectedId]);

  const saveCheckIn = async () => {
    if (!selectedId) { toast.error("Select a member"); return; }
    const member = members.find(m => m.id === selectedId);
    try {
      const res = await api.post("/coach-v2/check-ins", { ...form, member_id: selectedId, member_name: member?.name });
      setCheckIns(prev => [res.data, ...prev]);
      setShowForm(false);
      toast.success("Check-in saved");
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  const RatingSlider = ({ label, icon: Icon, value, onChange, color }) => (
    <div className="flex items-center gap-3">
      <Icon size={14} style={{ color }} />
      <span className="font-mono text-[9px] text-slate-400 w-20">{label}</span>
      <input type="range" min="1" max="10" value={value} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-indigo-500 h-1.5" />
      <span className="font-mono text-sm font-bold text-white w-6 text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="check-ins-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Client <span className="text-indigo-400">Check-Ins</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">WEEKLY & MONTHLY COACHING REVIEWS</p>
        </div>
        <div className="flex items-center gap-3">
          <AppSelect data-testid="ci-member" value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none min-w-[200px]">
            <AppSelectOption value="">Select member</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          {selectedId && <Button data-testid="new-checkin" onClick={() => setShowForm(!showForm)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs"><Plus size={14} className="mr-1" /> New Check-In</Button>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-indigo-500/20 bg-black/30 p-5 space-y-4" data-testid="checkin-form">
          <div className="flex gap-3">
            <AppSelect value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none">
              <AppSelectOption value="weekly">Weekly</AppSelectOption><AppSelectOption value="monthly">Monthly</AppSelectOption>
            </AppSelect>
          </div>
          <div className="space-y-3">
            <RatingSlider label="Mood" icon={Smile} value={form.mood_rating} onChange={v => setForm(p => ({ ...p, mood_rating: v }))} color="#F59E0B" />
            <RatingSlider label="Energy" icon={Zap} value={form.energy_level} onChange={v => setForm(p => ({ ...p, energy_level: v }))} color="#10B981" />
            <RatingSlider label="Sleep" icon={Moon} value={form.sleep_quality} onChange={v => setForm(p => ({ ...p, sleep_quality: v }))} color="#6366F1" />
            <RatingSlider label="Stress" icon={Brain} value={form.stress_level} onChange={v => setForm(p => ({ ...p, stress_level: v }))} color="#EF4444" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <textarea value={form.wins} onChange={e => setForm(p => ({ ...p, wins: e.target.value }))} placeholder="Wins this week..." rows={2}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />
            <textarea value={form.barriers} onChange={e => setForm(p => ({ ...p, barriers: e.target.value }))} placeholder="Barriers faced..." rows={2}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <textarea value={form.coach_notes} onChange={e => setForm(p => ({ ...p, coach_notes: e.target.value }))} placeholder="Coach notes & action items..." rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="text-xs border-white/10 text-slate-300">Cancel</Button>
            <Button data-testid="save-checkin" onClick={saveCheckIn} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">Save Check-In</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {checkIns.map(ci => (
          <div key={ci.id} className="rounded-xl border border-white/5 bg-black/20 p-4" data-testid={`ci-${ci.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-[7px] bg-indigo-500/10 text-indigo-400">{ci.type}</Badge>
                <span className="font-body text-sm text-white">{ci.member_name}</span>
              </div>
              <span className="font-mono text-[8px] text-slate-500">{new Date(ci.created_at).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-2">
              {[["Mood", ci.mood_rating, "#F59E0B"], ["Energy", ci.energy_level, "#10B981"], ["Sleep", ci.sleep_quality, "#6366F1"], ["Stress", ci.stress_level, "#EF4444"]].map(([l, v, c]) => (
                <div key={l} className="text-center">
                  <p className="font-mono text-lg font-black" style={{ color: c }}>{v}</p>
                  <p className="font-mono text-[7px] text-slate-500">{l}</p>
                </div>
              ))}
            </div>
            {ci.coach_notes && <p className="font-body text-xs text-slate-300 bg-white/[0.02] rounded-lg p-2 mt-1">{ci.coach_notes}</p>}
          </div>
        ))}
        {!selectedId && <p className="text-slate-500 text-sm text-center py-12">Select a member to view check-in history</p>}
      </div>
    </div>
  );
}
