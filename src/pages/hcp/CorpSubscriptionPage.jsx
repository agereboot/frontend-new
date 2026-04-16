import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, CheckCircle, X, Star, Zap, Crown,
  Shield, Sparkles,
} from "lucide-react";

const PLAN_ICONS = { spark: Zap, pulse: Star, vitality: Shield, pinnacle: Crown, executive: Sparkles };

export default function CorpSubscriptionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/corporate/subscriptions").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { plans, current_plan } = data;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="corp-subscription-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Subscription <span className="text-amber-400">Plans</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">5-TIER ARCHITECTURE &bull; ROLE-TO-PLAN FEATURE MATRIX</p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-5" data-testid="current-plan">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <CreditCard size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white">Current Plan: <span className="text-amber-400">{current_plan.plan_name}</span></p>
              <p className="font-mono text-[8px] text-slate-500">{current_plan.seats_used}/{current_plan.seats_purchased} seats &bull; Renews {current_plan.renewal_date} &bull; INR {current_plan.monthly_cost_inr?.toLocaleString()}/mo</p>
            </div>
          </div>
          <Badge className="font-mono text-[8px] bg-emerald-500/15 text-emerald-400">{current_plan.status}</Badge>
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3" data-testid="plan-grid">
        {plans.map(plan => {
          const Icon = PLAN_ICONS[plan.id] || Star;
          const isCurrent = plan.id === current_plan.plan_id;
          return (
            <div key={plan.id} className={`rounded-xl border p-5 transition-all ${isCurrent ? "border-amber-500/40 bg-amber-500/[0.06] ring-1 ring-amber-500/20" : "border-white/5 bg-black/20 hover:bg-white/[0.02]"}`} data-testid={`plan-${plan.id}`}>
              <div className="text-center mb-4">
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: plan.color + "15" }}>
                  <Icon size={20} style={{ color: plan.color }} />
                </div>
                <p className="font-display text-sm font-bold" style={{ color: plan.color }}>{plan.name}</p>
                <p className="font-mono text-xs font-bold text-white mt-1">{plan.price_label}</p>
                {plan.max_employees > 0 && <p className="font-mono text-[7px] text-slate-500">Up to {plan.max_employees} employees</p>}
                {plan.max_employees === -1 && <p className="font-mono text-[7px] text-slate-500">Unlimited employees</p>}
                {isCurrent && <Badge className="font-mono text-[7px] bg-amber-500/15 text-amber-400 mt-2">Current Plan</Badge>}
              </div>

              <div className="space-y-1.5 mb-3">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-1.5">
                    <CheckCircle size={10} style={{ color: plan.color }} className="mt-0.5 shrink-0" />
                    <span className="font-mono text-[8px] text-slate-300">{f}</span>
                  </div>
                ))}
              </div>

              {plan.excluded.length > 0 && (
                <div className="space-y-1 border-t border-white/5 pt-2">
                  {plan.excluded.map(f => (
                    <div key={f} className="flex items-start gap-1.5">
                      <X size={10} className="text-slate-600 mt-0.5 shrink-0" />
                      <span className="font-mono text-[8px] text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
