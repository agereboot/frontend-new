import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Trophy, Users, Plus, Play, Crown, ArrowRight } from "lucide-react";

export default function SeasonsPage() {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [standings, setStandings] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", description: "" });

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await api.get("/seasons");
      setSeasons(res.data?.seasons || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  const fetchStandings = async (seasonId) => {
    try {
      const res = await api.get(`/seasons/${seasonId}/standings`);
      setStandings(res.data);
      setSelectedSeason(seasonId);
    } catch (err) { toast.error("Failed to load standings"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/seasons", form);
      toast.success("Season created.");
      setShowCreate(false);
      setForm({ name: "", start_date: "", end_date: "", description: "" });
      fetchSeasons();
    } catch (err) { toast.error("Failed to create season"); }
    finally { setCreating(false); }
  };

  const handleJoin = async (seasonId) => {
    try {
      await api.post(`/seasons/${seasonId}/join`);
      toast.success("Joined season.");
      if (selectedSeason === seasonId) fetchStandings(seasonId);
    } catch (err) { toast.error("Failed to join season"); }
  };

  const tierColors = {
    "CENTENARIAN": "#D97706", "MASTERY": "#A855F7", "RESILIENCE": "#0F9F8F",
    "LONGEVITY": "#4F46E5", "VITALITY": "#7B35D8", "FOUNDATION": "#F59E0B", "AWAKENING": "#EF4444",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up" data-testid="seasons-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            <span className="text-cosmic">Competition</span> Seasons
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            League management &middot; Season standings &middot; Competition tracking
          </p>
        </div>
        <Button data-testid="create-season-btn" onClick={() => setShowCreate(!showCreate)}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider px-6 border border-cosmic-light/30">
          <Plus size={16} className="mr-2" /> New Season
        </Button>
      </div>

      {/* Create Season Form */}
      {showCreate && (
        <div className="glass-card rounded-lg p-6 border-cosmic/20">
          <h3 className="font-display text-lg font-bold text-stellar mb-4 uppercase tracking-wide">Create Competition Season</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">Season Name</Label>
              <Input data-testid="season-name-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Season IV — 2026" required className="mt-1 bg-space border-white/10 text-stellar font-mono h-10" />
            </div>
            <div>
              <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">Start Date</Label>
              <Input data-testid="season-start-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                required className="mt-1 bg-space border-white/10 text-stellar font-mono h-10" />
            </div>
            <div>
              <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">End Date</Label>
              <Input data-testid="season-end-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                required className="mt-1 bg-space border-white/10 text-stellar font-mono h-10" />
            </div>
            <Button data-testid="create-season-submit" type="submit" disabled={creating}
              className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider h-10 border border-cosmic-light/30">
              {creating ? "Creating..." : "Launch Season"}
            </Button>
          </form>
        </div>
      )}

      {/* Seasons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seasons.map(s => {
          const isActive = s.status === "active";
          const isSelected = selectedSeason === s.id;
          return (
            <div key={s.id} data-testid={`season-card-${s.id}`}
              className={`glass-card rounded-lg p-5 cursor-pointer transition-all hover:border-cosmic/20 ${isSelected ? "border-cosmic/40 cosmic-glow" : ""}`}
              onClick={() => fetchStandings(s.id)}>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-wider ${isActive ? "border-nebula/30 text-nebula" : "border-white/10 text-stellar-dim"}`}>
                  {isActive ? "Active" : s.status}
                </Badge>
                <span className="font-mono text-[9px] text-stellar-dim">{s.participants?.length || 0} athletes</span>
              </div>
              <h3 className="font-display text-lg font-bold text-stellar">{s.name}</h3>
              <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-stellar-dim">
                <Calendar size={11} />
                <span>{s.start_date}</span>
                <ArrowRight size={9} />
                <span>{s.end_date}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button data-testid={`join-season-${s.id}`} onClick={(e) => { e.stopPropagation(); handleJoin(s.id); }}
                  size="sm" className="bg-cosmic/10 hover:bg-cosmic/20 text-cosmic border border-cosmic/20 font-mono text-xs uppercase tracking-wider">
                  <Play size={11} className="mr-1" /> Join
                </Button>
                <Button onClick={(e) => { e.stopPropagation(); fetchStandings(s.id); }}
                  size="sm" variant="outline" className="border-white/10 text-stellar-dim font-mono text-xs uppercase tracking-wider">
                  <Trophy size={11} className="mr-1" /> Standings
                </Button>
              </div>
            </div>
          );
        })}

        {seasons.length === 0 && (
          <div className="glass-card rounded-lg p-12 text-center col-span-full">
            <Trophy size={32} className="text-cosmic mx-auto mb-3" />
            <p className="text-stellar-dim font-body">No competition seasons yet. Create the first season to start competing.</p>
          </div>
        )}
      </div>

      {/* Standings */}
      {standings && (
        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-stellar uppercase tracking-wide flex items-center gap-2">
              <Trophy size={18} className="text-aurora" /> {standings.season?.name} — Standings
            </h3>
            <Badge variant="outline" className="font-mono text-[9px] border-white/10 text-stellar-dim">
              {standings.participant_count || 0} participants
            </Badge>
          </div>
          {standings.standings?.length > 0 ? (
            <div className="space-y-2">
              {standings.standings.map((s, i) => (
                <div key={s.user_id} data-testid={`standing-row-${i}`}
                  className="grid grid-cols-12 gap-3 px-4 py-3 bg-white/[0.02] rounded-sm border border-white/5">
                  <div className="col-span-1 flex items-center">
                    {i < 3 ? <Crown size={16} className={i === 0 ? "text-aurora" : i === 1 ? "text-stellar" : "text-amber-600"} />
                      : <span className="font-mono text-sm text-stellar-dim">{s.rank}</span>}
                  </div>
                  <span className="col-span-4 font-body text-sm text-stellar self-center">{s.name}</span>
                  <span className="col-span-3 font-mono text-xs text-stellar-dim self-center">{s.franchise}</span>
                  <span className="col-span-2 font-mono text-lg font-bold text-stellar text-right self-center">{Math.round(s.hps_final)}</span>
                  <div className="col-span-2 flex justify-end self-center">
                    <Badge variant="outline" className="font-mono text-[8px] uppercase"
                      style={{ borderColor: `${tierColors[s.tier?.tier]}40`, color: tierColors[s.tier?.tier] }}>
                      {s.tier?.tier || "—"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stellar-dim font-body text-sm text-center py-6">No standings yet. Athletes need to join and compute their HPS.</p>
          )}
        </div>
      )}
    </div>
  );
}
