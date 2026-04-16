import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { Dumbbell, Brain, Moon, Salad, Heart, Target, Calendar, CheckCircle2, ChevronDown, ChevronRight, Award, Zap } from "lucide-react";

const CATEGORY_ICONS = { Exercise: Dumbbell, Strength: Dumbbell, Supplements: Heart, Diet: Salad, Nutrition: Salad, Sleep: Moon, Recovery: Moon, Cognitive: Brain, Social: Brain, Stress: Brain, Prevention: Target, Longevity: Target, Maintenance: Target, Optimization: Target };
const PRIORITY_COLORS = { high: "border-l-red-400 bg-red-500/5", medium: "border-l-amber-400 bg-amber-500/5", low: "border-l-emerald-400 bg-emerald-500/5" };

function PlanSection({ title, timeframe, items, color }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-[#1E1E3A]/50 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Calendar size={18} className="text-white" /></div>
          <div className="text-left"><div className="text-white font-semibold">{title}</div><div className="text-xs text-slate-500">{timeframe}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{items.length} actions</span>
          {open ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item, idx) => {
            const Icon = CATEGORY_ICONS[item.category] || Target;
            return (
              <div key={idx} className={`border-l-2 ${PRIORITY_COLORS[item.priority] || "border-l-slate-600"} rounded-r-lg p-3 flex items-start gap-3`}>
                <Icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-[#7B35D8] font-medium">{item.category}</span>
                  <div className="text-sm text-white mt-0.5">{item.action}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.priority === "high" ? "bg-red-500/20 text-red-400" : item.priority === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{item.priority}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DailyChallenges({ challenges }) {
  const [completed, setCompleted] = useState(new Set());
  return (
    <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-4" data-testid="daily-challenges">
      <div className="flex items-center gap-2 mb-3"><Zap size={16} className="text-amber-400" /><h3 className="text-sm font-semibold text-white">Today's Challenges</h3></div>
      <div className="space-y-2">
        {challenges.map((c, idx) => (
          <button key={idx} onClick={() => setCompleted(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${completed.has(idx) ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#1E1E3A] hover:bg-[#2A2A4A]"}`}>
            <CheckCircle2 size={18} className={completed.has(idx) ? "text-emerald-400" : "text-slate-600"} />
            <span className={`text-sm ${completed.has(idx) ? "text-emerald-300 line-through" : "text-white"}`}>{c.title}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-500 text-center">{completed.size}/{challenges.length} completed</div>
    </div>
  );
}

function WeeklyGoals({ goals }) {
  return (
    <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-4" data-testid="weekly-goals">
      <div className="flex items-center gap-2 mb-3"><Award size={16} className="text-[#7B35D8]" /><h3 className="text-sm font-semibold text-white">Weekly Goals</h3></div>
      <div className="space-y-3">
        {goals.map((g, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-white">{g.title}</span>
              <span className="text-xs text-slate-500">{g.target}</span>
            </div>
            <div className="h-2 bg-[#1E1E3A] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#7B35D8] to-[#0F9F8F] rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LongevityProtocolPage() {
  const { user } = useAuth();
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/longevity-protocol/my-protocol").then(r => setProtocol(r.data.protocol)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-slate-500">Loading your protocol...</div>;

  if (!protocol) return (
    <div className="max-w-2xl mx-auto text-center py-16" data-testid="no-protocol">
      <Target size={48} className="mx-auto text-slate-600 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No Longevity Protocol Yet</h2>
      <p className="text-sm text-slate-400">Your personalised longevity plan will appear here once your doctor reviews your lab results and HPS score.</p>
    </div>
  );

  const isPending = protocol.status === "pending_review";

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="longevity-protocol-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Longevity Protocol</h1>
          <p className="text-sm text-slate-400 mt-1">Personalised 3/6/9-month health optimisation plan</p>
        </div>
        {isPending ? (
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400">Pending Doctor Review</span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400">Approved by {protocol.approved_by_name}</span>
        )}
      </div>
      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm text-amber-300">Your protocol has been generated and is awaiting your doctor's review and approval. You'll be notified once it's ready.</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <PlanSection title="Phase 1: Foundation" timeframe="Months 1-3" items={protocol.three_month_plan || []} color="bg-[#7B35D8]" />
          <PlanSection title="Phase 2: Optimization" timeframe="Months 4-6" items={protocol.six_month_plan || []} color="bg-[#0F9F8F]" />
          <PlanSection title="Phase 3: Mastery" timeframe="Months 7-9" items={protocol.nine_month_plan || []} color="bg-indigo-600" />
        </div>
        <div className="space-y-4">
          <DailyChallenges challenges={protocol.daily_challenges || []} />
          <WeeklyGoals goals={protocol.weekly_goals || []} />
        </div>
      </div>
      {protocol.doctor_notes && (
        <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Doctor's Notes</h3>
          <p className="text-sm text-slate-400">{protocol.doctor_notes}</p>
        </div>
      )}
    </div>
  );
}
