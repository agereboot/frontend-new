import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, TrendingUp, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [athRes, frRes] = await Promise.all([
        api.get("/leaderboard"),
        api.get("/leaderboard/franchises"),
      ]);
      setAthletes(athRes.data?.leaderboard || []);
      setFranchises(frRes.data?.franchises || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tierBadge = (tier) => {
    const colors = {
      "CENTENARIAN": "bg-aurora/20 text-aurora border-aurora/30",
      "MASTERY": "bg-violet-500/20 text-violet-400 border-violet-500/30",
      "RESILIENCE": "bg-nebula/20 text-nebula border-nebula/30",
      "LONGEVITY": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      "VITALITY": "bg-cosmic/20 text-cosmic border-cosmic/30",
      "FOUNDATION": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "AWAKENING": "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[tier?.tier] || "bg-white/10 text-stellar-dim border-white/10";
  };

  const rankDecor = (rank) => {
    if (rank === 1) return "text-aurora";
    if (rank === 2) return "text-stellar";
    if (rank === 3) return "text-amber-600";
    return "text-stellar-dim";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
          <span className="text-cosmic">League</span> Standings
        </h1>
        <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
          Season III &middot; India National League &middot; {athletes.length} Athletes
        </p>
      </div>

      <Tabs defaultValue="athletes">
        <TabsList className="bg-space-light/50 border border-white/5">
          <TabsTrigger value="athletes" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
            <Users size={14} className="mr-1.5" /> Athletes
          </TabsTrigger>
          <TabsTrigger value="franchises" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
            <Trophy size={14} className="mr-1.5" /> Franchises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="athletes" className="mt-4">
          <div className="glass-card rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <span className="col-span-1 font-mono text-[9px] text-stellar-dim uppercase tracking-widest">Rank</span>
              <span className="col-span-4 font-mono text-[9px] text-stellar-dim uppercase tracking-widest">Athlete</span>
              <span className="col-span-3 font-mono text-[9px] text-stellar-dim uppercase tracking-widest">Franchise</span>
              <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase tracking-widest text-right">HPS</span>
              <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase tracking-widest text-right">Tier</span>
            </div>
            {/* Rows */}
            {athletes.map((a, i) => (
              <div key={a.user_id} data-testid={`leaderboard-row-${i}`}
                className={`grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${a.user_id === user?.id ? "bg-cosmic/5 border-l-2 border-l-cosmic" : ""}`}>
                <div className="col-span-1 flex items-center">
                  {a.rank <= 3 ? (
                    <Crown size={16} className={rankDecor(a.rank)} />
                  ) : (
                    <span className={`font-mono text-sm font-bold ${rankDecor(a.rank)}`}>{String(a.rank).padStart(2, "0")}</span>
                  )}
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm bg-cosmic/10 border border-cosmic/20 flex items-center justify-center font-display text-xs font-bold text-cosmic">
                    {a.name?.charAt(0)}
                  </div>
                  <span className="font-body text-sm text-stellar truncate">{a.name}</span>
                </div>
                <span className="col-span-3 font-mono text-xs text-stellar-dim self-center truncate">{a.franchise}</span>
                <span className="col-span-2 font-mono text-lg font-bold text-stellar text-right self-center">{Math.round(a.hps_final)}</span>
                <div className="col-span-2 flex justify-end self-center">
                  <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-wider ${tierBadge(a.tier)}`}>
                    {a.tier?.tier || "—"}
                  </Badge>
                </div>
              </div>
            ))}
            {athletes.length === 0 && (
              <div className="p-12 text-center">
                <Trophy size={28} className="text-cosmic mx-auto mb-3" />
                <p className="text-stellar-dim font-body">No scores computed yet. Seed demo data to populate the leaderboard.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="franchises" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {franchises.map((f, i) => (
              <div key={f.franchise} data-testid={`franchise-card-${i}`}
                className={`glass-card rounded-lg p-5 ${i === 0 ? "border-aurora/20 cosmic-glow" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {i < 3 && <Crown size={16} className={i === 0 ? "text-aurora" : i === 1 ? "text-stellar" : "text-amber-600"} />}
                    <span className={`font-mono text-sm font-bold ${rankDecor(i + 1)}`}>#{String(f.rank).padStart(2, "0")}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[9px] border-white/10 text-stellar-dim">
                    {f.members} members
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold text-stellar truncate">{f.franchise}</h3>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-widest">Avg HPS</p>
                    <p className="font-mono text-3xl font-bold text-stellar">{Math.round(f.avg_hps)}</p>
                  </div>
                  <TrendingUp size={20} className="text-nebula" />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
