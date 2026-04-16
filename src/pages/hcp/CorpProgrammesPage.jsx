import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Plus,
  Calendar,
  Trophy,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const STATUS_COLORS = {
  active: "#10B981",
  upcoming: "#6366F1",
  completed: "#64748B",
  paused: "#D97706",
};

const DIMENSIONS = [
  "Bio-Resilience",
  "Physical Fitness",
  "Cognitive Agility",
  "Sleep & Recovery",
  "Balanced Lifestyle",
];

const createEmptyDailyChallenge = () => ({
  date: new Date().toISOString().split("T")[0],
  title: "",
  description: "",
  challenge_type: "steps",
  xp: 50,
  surprise_reward: "",
});

const extractList = (payload, primaryKey) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[primaryKey])) return payload[primaryKey];
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractItem = (payload, primaryKey) => {
  if (payload?.[primaryKey]) return payload[primaryKey];
  return payload;
};

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default function CorpProgrammesPage() {
  const [programmes, setProgrammes] = useState([]);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showDailyChallengeCreate, setShowDailyChallengeCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "challenge",
    target_dimension: DIMENSIONS[0],
    duration_days: 30,
    reward_healthcoins: 500,
  });

  const [dailyChallengeForm, setDailyChallengeForm] = useState(
    createEmptyDailyChallenge()
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [programmesRes, dailyChallengesRes] = await Promise.all([
          api.get("/corporate/programmes"),
          api.get("/hr/challenges/list"),
        ]);

        setProgrammes(extractList(programmesRes.data, "programmes"));
        setDailyChallenges(extractList(dailyChallengesRes.data, "challenges"));
      } catch (error) {
        toast.error("Failed to load programmes and daily challenges");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Name required");

    try {
      const { data } = await api.post("/corporate/programmes", form);
      const createdProgramme = extractItem(data, "programme");

      setProgrammes((prev) => [createdProgramme, ...prev]);
      setShowCreate(false);
      setForm({
        name: "",
        type: "challenge",
        target_dimension: DIMENSIONS[0],
        duration_days: 30,
        reward_healthcoins: 500,
      });

      toast.success("Programme created");
    } catch {
      toast.error("Failed to create programme");
    }
  };

  const handleDailyChallengeCreate = async () => {
    if (!dailyChallengeForm.title.trim()) {
      return toast.error("Title required");
    }

    try {
      const payload = {
        date: dailyChallengeForm.date,
        title: dailyChallengeForm.title,
        description: dailyChallengeForm.description,
        challenge_type: dailyChallengeForm.challenge_type,
        xp: Number(dailyChallengeForm.xp) || 0,
        surprise_reward: dailyChallengeForm.surprise_reward,
      };

      const { data } = await api.post("/hr/challenges/", payload);
      const createdChallenge = extractItem(data, "challenge");

      setDailyChallenges((prev) => [createdChallenge, ...prev]);
      setShowDailyChallengeCreate(false);
      setDailyChallengeForm(createEmptyDailyChallenge());
api.get("/hr/challenges/list")
      toast.success("Daily challenge created");
    } catch {
      toast.error("Failed to create daily challenge");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="space-y-8 animate-in fade-in duration-500"
      data-testid="corp-programmes-page"
    >
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Wellness <span className="text-indigo-400">Programmes</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">
            {programmes.length} PROGRAMMES • {dailyChallenges.length} DAILY
            CHALLENGES
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            data-testid="create-programme-btn"
            onClick={() => setShowCreate(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1"
          >
            <Plus size={14} />
            New Programme
          </Button>

          <Button
            data-testid="create-daily-challenge-btn"
            onClick={() => setShowDailyChallengeCreate(true)}
            size="sm"
            variant="outline"
            className="border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-white text-xs gap-1"
          >
            <Plus size={14} />
            Add Daily Challenge
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["active", "upcoming", "completed", "paused"].map((status) => (
          <div
            key={status}
            className="rounded-xl border border-white/5 bg-black/20 p-3 text-center"
          >
            <p
              className="font-mono text-2xl font-black"
              style={{ color: STATUS_COLORS[status] }}
            >
              {programmes.filter((p) => p.status === status).length}
            </p>
            <p className="font-mono text-[7px] text-slate-500 uppercase capitalize">
              {status}
            </p>
          </div>
        ))}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          data-testid="create-programme-modal"
        >
          <div className="w-full max-w-md bg-[#0D0D12] border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white">
                Create Programme
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <input
              data-testid="prog-name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Programme name"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <AppSelect
                data-testid="prog-type"
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                <AppSelectOption value="challenge">Challenge</AppSelectOption>
                <AppSelectOption value="programme">Programme</AppSelectOption>
              </AppSelect>

              <AppSelect
                data-testid="prog-dim"
                value={form.target_dimension}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target_dimension: e.target.value,
                  }))
                }
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                {DIMENSIONS.map((dimension) => (
                  <AppSelectOption key={dimension} value={dimension}>
                    {dimension}
                  </AppSelectOption>
                ))}
              </AppSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase">
                  Duration (days)
                </label>
                <input
                  data-testid="prog-days"
                  type="number"
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration_days: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none mt-1"
                />
              </div>

              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase">
                  HealthCoins Reward
                </label>
                <input
                  data-testid="prog-coins"
                  type="number"
                  value={form.reward_healthcoins}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reward_healthcoins: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none mt-1"
                />
              </div>
            </div>

            <Button
              data-testid="prog-submit"
              onClick={handleCreate}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              Create Programme
            </Button>
          </div>
        </div>
      )}

      {showDailyChallengeCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          data-testid="create-daily-challenge-modal"
        >
          <div className="w-full max-w-md bg-[#0D0D12] border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white">
                Create Daily Challenge
              </h3>
              <button
                onClick={() => setShowDailyChallengeCreate(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase">
                Date
              </label>
              <input
                type="date"
                value={dailyChallengeForm.date}
                onChange={(e) =>
                  setDailyChallengeForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase">
                Title
              </label>
              <input
                value={dailyChallengeForm.title}
                onChange={(e) =>
                  setDailyChallengeForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Challenge title"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase">
                Description
              </label>
              <textarea
                rows={4}
                value={dailyChallengeForm.description}
                onChange={(e) =>
                  setDailyChallengeForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Challenge description"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase">
                  Challenge Type
                </label>
                <input
                  value={dailyChallengeForm.challenge_type}
                  onChange={(e) =>
                    setDailyChallengeForm((prev) => ({
                      ...prev,
                      challenge_type: e.target.value,
                    }))
                  }
                  placeholder="steps"
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[8px] text-slate-500 uppercase">
                  XP
                </label>
                <input
                  type="number"
                  value={dailyChallengeForm.xp}
                  onChange={(e) =>
                    setDailyChallengeForm((prev) => ({
                      ...prev,
                      xp: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase">
                Surprise Reward
              </label>
              <input
                value={dailyChallengeForm.surprise_reward}
                onChange={(e) =>
                  setDailyChallengeForm((prev) => ({
                    ...prev,
                    surprise_reward: e.target.value,
                  }))
                }
                placeholder="Optional reward"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <Button
              onClick={handleDailyChallengeCreate}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              Create Daily Challenge
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Programmes
            </h2>
            <p className="font-mono text-[10px] text-slate-500 tracking-wider">
              CORPORATE WELLNESS PROGRAMMES
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programmes.map((prog) => (
            <div
              key={prog.id}
              className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5 hover:bg-white/[0.02] transition-all group"
              data-testid={`prog-${prog.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10">
                    <Target size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-body text-xs font-medium text-white">
                      {prog.name}
                    </p>
                    <Badge
                      className="font-mono text-[6px]"
                      style={{
                        backgroundColor:
                          (STATUS_COLORS[prog.status] || "#64748B") + "15",
                        color: STATUS_COLORS[prog.status] || "#64748B",
                      }}
                    >
                      {prog.status || "unknown"}
                    </Badge>
                  </div>
                </div>

                <Badge className="font-mono text-[6px] bg-white/5 text-slate-400 capitalize">
                  {prog.type}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Target size={10} />
                  <span className="font-mono text-[9px]">
                    {prog.target_dimension}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={10} />
                  <span className="font-mono text-[9px]">
                    {prog.duration_days} days
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Trophy size={10} />
                  <span className="font-mono text-[9px]">
                    {prog.reward_healthcoins} HealthCoins
                  </span>
                </div>
              </div>

              {prog.enrolled > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono text-[8px] text-slate-500">
                      {prog.enrolled} enrolled
                    </span>
                    <span className="font-mono text-[8px] text-emerald-400">
                      {prog.completed} completed
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                      style={{
                        width: `${
                          prog.enrolled > 0
                            ? Math.round((prog.completed / prog.enrolled) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            Daily Challenges
          </h2>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider">
            HR/CHALLENGES LIST
          </p>
        </div>

        {dailyChallenges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <p className="font-body text-sm text-slate-300">
              No daily challenges found
            </p>
            <p className="font-mono text-[10px] text-slate-500 mt-1">
              CREATE ONE USING THE BUTTON ABOVE
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyChallenges.map((challenge, index) => (
              <div
                key={
                  challenge.id ||
                  `${challenge.title || "challenge"}-${challenge.date || index}`
                }
                className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5 hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
                      <CheckCircle size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-body text-xs font-medium text-white">
                        {challenge.title}
                      </p>
                      <Badge className="font-mono text-[6px] bg-emerald-500/10 text-emerald-300 capitalize">
                        {challenge.challenge_type || "challenge"}
                      </Badge>
                    </div>
                  </div>

                  <Badge className="font-mono text-[6px] bg-white/5 text-slate-300">
                    {challenge.xp ?? 0} XP
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={10} />
                    <span className="font-mono text-[9px]">
                      {formatDate(challenge.date)}
                    </span>
                  </div>

                  {challenge.description ? (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {challenge.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No description
                    </p>
                  )}

                  {challenge.surprise_reward ? (
                    <div className="flex items-center gap-2 text-amber-300 pt-2">
                      <Trophy size={10} />
                      <span className="font-mono text-[9px]">
                        Reward: {challenge.surprise_reward}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}