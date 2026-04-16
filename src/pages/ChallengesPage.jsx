import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Target, Flame, Users, ArrowRight, CheckCircle, Play } from "lucide-react";

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await api.get("/employee/daily-challenge");
      setChallenges(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const handleJoin = async (id) => {
    try {
      await api.post(`/employee/challenges/${id}/join`);
      toast.success("Challenge accepted!");
      fetchChallenges();
    } catch (err) { toast.error("Failed to join"); }
  };

  const handleProgress = async (id, currentProgress) => {
    try {
      const res = await api.patch(`/employee/challenges/${id}/progress`, { progress: currentProgress+10});
      if (res.data.completed) toast.success("Challenge completed! Rewards earned!");
      else toast.success(`Progress: ${res.data.
progress_percent
}/${res.data.target}`);
      fetchChallenges();
  } catch (err) { toast.error("Failed to update"); }
  };

  const typeColors = { steps: "#0F9F8F", sleep: "#4F46E5", nutrition: "#D97706", hps_improvement: "#7B35D8", biomarker: "#EF4444", exercise: "#0F9F8F" };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up" data-testid="challenges-page">
      <div>
        <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
          <span className="text-cosmic">Active</span> Challenges
        </h1>
        <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
          Compete &middot; Earn Badges &middot; Win Credits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map(ch => {
          const progressPct = ch.target > 0 ? Math.min(100, (ch.progress / ch.target) * 100) : 0;
          const color = typeColors[ch.type] || "#7B35D8";
          return (
            <div key={ch.id} data-testid={`challenge-${ch.id}`} className="glass-card rounded-lg p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider" style={{ borderColor: `${color}40`, color }}>{ch.type}</Badge>
                <div className="flex items-center gap-1 font-mono text-[9px] text-stellar-dim">
                  <Users size={10} /> {ch.participant_count}
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-stellar">{ch.title}</h3>
              <p className="text-stellar-dim text-xs font-body leading-relaxed">{ch.description}</p>
              <div className="flex items-center gap-3 font-mono text-[9px] text-stellar-dim">
                <span>{ch.duration_days} days</span>
                <span className="text-aurora">{ch.surprise_reward} credits</span>
              </div>
              {/* Progress bar */}
              {ch.user_joined && (
                <div>
                  <div className="flex justify-between font-mono text-[9px] text-stellar-dim mb-1">
                    <span>Progress</span>
                    <span>{ch.progress}/{ch.target}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-auto">
                {!ch.user_joined ? (
                  <Button data-testid={`join-challenge-${ch.id}`} onClick={() => handleJoin(ch.id)} size="sm"
                    className="flex-1 bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider border border-cosmic-light/30">
                    <Play size={12} className="mr-1" /> Join Challenge
                  </Button>
                ) : progressPct < 100 ? (
                  <Button data-testid={`progress-${ch.id}`} onClick={() => handleProgress(ch.id,ch.progress)} size="sm"
                    className="flex-1 font-display text-xs uppercase tracking-wider border" style={{ borderColor: `${color}30`, color, background: `${color}10` }}>
                    <Target size={12} className="mr-1" /> Log Progress
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-1 font-mono text-xs text-nebula">
                    <CheckCircle size={14} /> Completed!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
