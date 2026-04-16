import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { FileText, Apple, Coffee, Sun, Moon } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function NUTFoodDiaryPage() {
  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/cc/members").then(r => setMembers(r.data.members || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedMember) {
      api.get(`/coach/nut/food-diary/${selectedMember}`).then(r => setEntries(r.data.entries || []));
    }
  }, [selectedMember]);

  const mealIcons = { breakfast: Sun, lunch: Coffee, dinner: Moon, snack: Apple };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="food-diary-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Food <span className="text-teal-400">Diary</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">CLIENT DIETARY INTAKE REVIEW</p>
        </div>
        <AppSelect data-testid="diary-member" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none">
          <AppSelectOption value="">Select client</AppSelectOption>
          {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
        </AppSelect>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((e, i) => {
            const MealIcon = mealIcons[e.meal_type] || FileText;
            return (
              <div key={i} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 flex items-center gap-3" data-testid={`diary-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <MealIcon size={16} className="text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-white">{e.description || e.meal_type}</p>
                  <p className="font-mono text-[8px] text-slate-500">{e.date} &middot; {e.meal_type}</p>
                </div>
                {e.calories && <Badge className="font-mono text-[8px] bg-teal-500/10 text-teal-400">{e.calories} kcal</Badge>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText size={40} className="text-teal-500/20 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{selectedMember ? "No food diary entries found" : "Select a client to view their food diary"}</p>
        </div>
      )}
    </div>
  );
}
