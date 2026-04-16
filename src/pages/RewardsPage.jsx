import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Zap, FlaskConical, Shield, TrendingUp, Crown, Flame, ArrowUp,
  Rocket, Watch, FileText, Map, Trophy, Award, MessageCircle, Star, Moon, Apple
} from "lucide-react";

const ICON_MAP = {
  zap: Zap, flask: FlaskConical, shield: Shield, "trending-up": TrendingUp, crown: Crown,
  flame: Flame, "arrow-up": ArrowUp, rocket: Rocket, watch: Watch, "file-text": FileText,
  map: Map, trophy: Trophy, award: Award, "message-circle": MessageCircle, star: Star,
  moon: Moon, apple: Apple,
};
const TIER_STYLES = {
  bronze: { bg: "bg-amber-800/20", border: "border-amber-700/30", text: "text-amber-500", glow: "shadow-amber-800/20" },
  silver: { bg: "bg-slate-300/10", border: "border-slate-400/30", text: "text-slate-300", glow: "shadow-slate-400/20" },
  gold: { bg: "bg-aurora/20", border: "border-aurora/40", text: "text-aurora", glow: "shadow-aurora/30" },
};

export default function RewardsPage() {
  const { user } = useAuth();
  const [myBadges, setMyBadges] = useState({ badges: [], total_earned: 0, total_points: 0, streak_days: 0, catalog_total: 0 });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [myRes, catRes] = await Promise.all([api.get("/rewards/my-badges"), api.get("/rewards/badges")]);
        setMyBadges(myRes.data);
        setCatalog(catRes.data?.badges || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const earnedCodes = new Set(myBadges.badges.map(b => b.badge_code));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up" data-testid="rewards-page">
      <div>
        <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
          <span className="text-cosmic">Rewards</span> & Badges
        </h1>
        <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">Achievements &middot; Streaks &middot; Dopamine Architecture</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Badges Earned", value: `${myBadges.total_earned}/${myBadges.catalog_total}`, icon: Trophy, color: "#D97706" },
          { label: "Total Points", value: myBadges.total_points, icon: Star, color: "#7B35D8" },
          { label: "Streak", value: `${myBadges.streak_days} days`, icon: Flame, color: "#EF4444" },
          { label: "Completion", value: `${myBadges.catalog_total > 0 ? Math.round((myBadges.total_earned / myBadges.catalog_total) * 100) : 0}%`, icon: Award, color: "#0F9F8F" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-stellar">{value}</p>
              <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Badge Grid */}
      <div>
        <h2 className="font-display text-lg font-bold text-stellar mb-4 uppercase tracking-wide">Achievement Collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {catalog.map(badge => {
            const earned = earnedCodes.has(badge.code);
            const ts = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
            const Icon = ICON_MAP[badge.icon] || Star;
            return (
              <div key={badge.code} data-testid={`badge-${badge.code}`}
                className={`rounded-lg p-4 text-center transition-all duration-300 border ${
                  earned ? `${ts.bg} ${ts.border} shadow-lg ${ts.glow}` : "bg-white/[0.02] border-white/5 opacity-40"
                }`}>
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${earned ? ts.bg : "bg-white/5"}`}
                  style={earned ? { border: `2px solid`, borderColor: badge.tier === "gold" ? "#D97706" : badge.tier === "silver" ? "#94A3B8" : "#B45309" } : {}}>
                  <Icon size={22} className={earned ? ts.text : "text-stellar-dim"} />
                </div>
                <p className={`font-display text-xs font-bold ${earned ? "text-stellar" : "text-stellar-dim"}`}>{badge.name}</p>
                <p className="font-mono text-[8px] text-stellar-dim mt-1 leading-tight">{badge.description}</p>
                <Badge variant="outline" className={`mt-2 font-mono text-[7px] uppercase tracking-wider ${earned ? `${ts.border} ${ts.text}` : "border-white/10 text-stellar-dim"}`}>
                  {badge.tier} &middot; {{"bronze": 10, "silver": 25, "gold": 50}[badge.tier]} pts
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
