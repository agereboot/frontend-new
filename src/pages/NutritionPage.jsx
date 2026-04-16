import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid
} from "recharts";
import {
  Salad, Camera, AlertTriangle, CheckCircle, UtensilsCrossed,
  ArrowDown, ArrowUp, Target, Clock, Flame, Beef, Wheat, Droplet, Apple,
  Calendar, ChevronRight, Leaf, Ban, TrendingUp, Award, Pill, Zap,
  ShieldCheck, Fish, Milk, Sun, Heart
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const MACRO_CONFIG = [
  { key: "calories", label: "Calories", unit: "kcal", icon: Flame, color: "#EF4444" },
  { key: "protein", label: "Protein", unit: "g", icon: Beef, color: "#0F9F8F" },
  { key: "carbs", label: "Carbs", unit: "g", icon: Wheat, color: "#D97706" },
  { key: "fats", label: "Total Fats", unit: "g", icon: Droplet, color: "#6366F1" },
  { key: "fiber", label: "Fiber", unit: "g", icon: Leaf, color: "#84CC16" },
];

const FAT_DETAIL_CONFIG = [
  { key: "pufa", label: "PUFA", unit: "g", color: "#06B6D4" },
  { key: "non_pufa", label: "Non-PUFA", unit: "g", color: "#8B5CF6" },
  { key: "omega3", label: "Omega-3", unit: "g", color: "#0EA5E9" },
  { key: "omega6", label: "Omega-6", unit: "g", color: "#A855F7" },
];

const VITAMIN_CONFIG = [
  { key: "vitamin_a", label: "Vit A", unit: "mcg", color: "#F97316" },
  { key: "vitamin_c", label: "Vit C", unit: "mg", color: "#FBBF24" },
  { key: "vitamin_d", label: "Vit D", unit: "mcg", color: "#FCD34D" },
  { key: "vitamin_e", label: "Vit E", unit: "mg", color: "#A3E635" },
  { key: "vitamin_k", label: "Vit K", unit: "mcg", color: "#34D399" },
  { key: "vitamin_b12", label: "B12", unit: "mcg", color: "#F472B6" },
  { key: "folate", label: "Folate", unit: "mcg", color: "#C084FC" },
];

const MINERAL_CONFIG = [
  { key: "iron", label: "Iron", unit: "mg", color: "#DC2626" },
  { key: "calcium", label: "Calcium", unit: "mg", color: "#F5F5F4" },
  { key: "magnesium", label: "Magnesium", unit: "mg", color: "#7DD3FC" },
  { key: "zinc", label: "Zinc", unit: "mg", color: "#CBD5E1" },
  { key: "potassium", label: "Potassium", unit: "mg", color: "#FB923C" },
  { key: "sodium", label: "Sodium", unit: "mg", color: "#94A3B8" },
  { key: "selenium", label: "Selenium", unit: "mcg", color: "#E879F9" },
];

const ANTIOXIDANT_CONFIG = [
  { key: "antioxidants", label: "Antioxidants", unit: "ORAC", color: "#F43F5E" },
];

const ALL_CUISINES = [
  "indian", "mexican", "continental", "chinese", "mediterranean",
  "japanese", "thai", "korean", "middle_eastern", "italian", "american"
];

function NutrientBar({ label, current, target, unit, color, status }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 150) : 0;
  const isHigh = pct > 120;
  const isLow = pct < 50 && current > 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="font-mono text-[9px] text-stellar-dim w-16 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isHigh ? "#EF4444" : isLow ? "#D97706" : color }} />
      </div>
      <span className="font-mono text-[8px] w-20 text-right" style={{ color: isHigh ? "#EF4444" : isLow ? "#D97706" : "#94A3B8" }}>
        {Math.round(current)}/{target} {unit}
      </span>
      {status && status !== "on_track" && (
        <Badge className={`font-mono text-[6px] px-1 ${status === "over" ? "bg-red-500/10 text-red-400 border-red-500/15" : "bg-amber-500/10 text-amber-400 border-amber-500/15"}`}>
          {status === "over" ? "OVER" : "LOW"}
        </Badge>
      )}
    </div>
  );
}

export default function NutritionPage() {
  const [logs, setLogs] = useState([]);
  const [flags, setFlags] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [trends, setTrends] = useState(null);
  const [gaps, setGaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planForm, setPlanForm] = useState({
    goal: "general_health", dietary_preferences: [], allergies: [], cuisine_preferences: ["indian", "continental"], auto_suggest: true
  });
  const [mealType, setMealType] = useState("lunch");
  const [trendNutrient, setTrendNutrient] = useState("calories");
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [fRes, pRes, tRes, gRes, lRes] = await Promise.all([
        api.get("/nutrition/intake-flags"),
        api.get("/nutrition/plan").catch(() => ({ data: null })),
        api.get("/nutrition/trends").catch(() => ({ data: null })),
        api.get("/nutrition/gap-adjustment").catch(() => ({ data: null })),
        api.get("/nutrition/logs").catch(() => ({ data: { logs: [] } })),
      ]);
      setFlags(fRes.data);
      if (pRes.data?.plan && (pRes.data.plan.meals || Array.isArray(pRes.data.plan))) setMealPlan(pRes.data);
      setTrends(tRes.data);
      setGaps(gRes.data);
      setLogs(lRes.data?.logs || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    setAnalyzing(true);
    setPhotoAnalysis(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        try {
          const res = await api.post("/nutrition/analyze-photo", { image_base64: base64, meal_type: mealType });
          setPhotoAnalysis(res.data?.analysis);
          toast.success("Meal analyzed!");
        } catch { toast.error("Analysis failed"); }
        finally { setAnalyzing(false); }
      };
      reader.readAsDataURL(file);
    } catch { setAnalyzing(false); toast.error("Upload failed"); }
  };

  const logAnalyzedMeal = async () => {
    if (!photoAnalysis) return;
    try {
      await api.post("/nutrition/log", {
        meal_type: mealType,
        foods: photoAnalysis.items?.map(i => i.item) || [photoAnalysis.meal_name],
        items: photoAnalysis.items || [],
        total_calories: photoAnalysis.total?.calories || 0,
        macros: { protein: photoAnalysis.total?.protein || 0, carbs: photoAnalysis.total?.carbs || 0, fats: photoAnalysis.total?.fats || 0 },
      });
      toast.success("Meal logged! Points earned");
      setPhotoAnalysis(null);
      fetchData();
    } catch { toast.error("Failed to log meal"); }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/nutrition/generate-plan", planForm);
      setMealPlan(res.data);
      toast.success(res.data?.generated ? "Personalized plan generated!" : "Default plan loaded");
    } catch { toast.error("Generation failed"); }
    finally { setGenerating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="nutrition-loading">
      <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  const totals = flags?.totals || {};
  const targets = flags?.targets || {};

  return (
    <div className="space-y-5 animate-slide-up" data-testid="nutrition-page">
      <div>
        <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
          My <span className="text-gradient-cosmic">Nutrition</span>
        </h1>
        <p className="font-mono text-[10px] text-stellar-dim tracking-[0.25em] mt-2 uppercase">AgeReboot-powered meal tracking &amp; planning</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-space-light/50 border border-white/5 p-1 h-auto">
          <TabsTrigger value="overview" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">Overview</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">Trends</TabsTrigger>
          <TabsTrigger value="log" data-testid="tab-log-meal" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">Log Meal</TabsTrigger>
          <TabsTrigger value="planner" data-testid="tab-meal-planner" className="text-xs font-mono data-[state=active]:bg-cosmic/15 data-[state=active]:text-cosmic">Meal Planner</TabsTrigger>
        </TabsList>

        {/* ====================== OVERVIEW ====================== */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Today's Macros */}
          <div className="glass-premium rounded-2xl p-5" data-testid="daily-macros">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-stellar">Today&apos;s Intake</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/5 text-stellar-dim font-mono text-[8px] border border-white/5">{flags?.meals_logged || 0} meals</Badge>
                {flags?.meals_logged > 0 && <Badge className="bg-cosmic/10 text-cosmic font-mono text-[8px] border border-cosmic/15"><Award size={8} className="mr-1" />Points earned</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {MACRO_CONFIG.map(({ key, label, unit, icon: Icon, color }) => {
                const current = totals[key] || 0;
                const target = targets[key] || 1;
                const pct = Math.min((current / target) * 100, 150);
                const isHigh = pct > 120;
                const isLow = pct < 50 && flags?.meals_logged > 0;
                return (
                  <div key={key} className="glass-premium rounded-xl p-3" data-testid={`macro-${key}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} style={{ color }} />
                      <span className="font-mono text-[8px] text-stellar-dim uppercase">{label}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className="font-mono text-xl font-black" style={{ color: isHigh ? "#EF4444" : isLow ? "#D97706" : color }}>{Math.round(current)}</span>
                      <span className="font-mono text-[8px] text-stellar-dim">/ {target} {unit}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isHigh ? "#EF4444" : isLow ? "#D97706" : color }} />
                    </div>
                    {(isHigh || isLow) && (
                      <div className="flex items-center gap-1 mt-1">
                        {isHigh ? <ArrowUp size={8} className="text-red-400" /> : <ArrowDown size={8} className="text-amber-400" />}
                        <span className={`font-mono text-[7px] ${isHigh ? "text-red-400" : "text-amber-400"}`}>
                          {isHigh ? `${Math.round(pct - 100)}% over` : `${Math.round(100 - pct)}% under`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fat Details: PUFA / Non-PUFA */}
          <div className="glass-premium rounded-2xl p-5" data-testid="fat-details">
            <div className="flex items-center gap-2 mb-3">
              <Fish size={14} className="text-cyan-400" />
              <h3 className="font-display text-sm font-bold text-stellar">Fat Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FAT_DETAIL_CONFIG.map(({ key, label, unit, color }) => (
                <NutrientBar key={key} label={label} current={totals[key] || 0} target={targets[key] || 0} unit={unit} color={color} />
              ))}
            </div>
          </div>

          {/* Vitamins */}
          <div className="glass-premium rounded-2xl p-5" data-testid="vitamins-panel">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={14} className="text-amber-400" />
              <h3 className="font-display text-sm font-bold text-stellar">Vitamins</h3>
            </div>
            <div className="space-y-0.5">
              {VITAMIN_CONFIG.map(({ key, label, unit, color }) => (
                <NutrientBar key={key} label={label} current={totals[key] || 0} target={targets[key] || 0} unit={unit} color={color} />
              ))}
            </div>
          </div>

          {/* Minerals */}
          <div className="glass-premium rounded-2xl p-5" data-testid="minerals-panel">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={14} className="text-slate-300" />
              <h3 className="font-display text-sm font-bold text-stellar">Minerals</h3>
            </div>
            <div className="space-y-0.5">
              {MINERAL_CONFIG.map(({ key, label, unit, color }) => (
                <NutrientBar key={key} label={label} current={totals[key] || 0} target={targets[key] || 0} unit={unit} color={color} />
              ))}
            </div>
          </div>

          {/* Antioxidants */}
          <div className="glass-premium rounded-2xl p-5" data-testid="antioxidants-panel">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-rose-400" />
              <h3 className="font-display text-sm font-bold text-stellar">Antioxidants</h3>
            </div>
            {ANTIOXIDANT_CONFIG.map(({ key, label, unit, color }) => (
              <NutrientBar key={key} label={label} current={totals[key] || 0} target={targets[key] || 0} unit={unit} color={color} />
            ))}
          </div>

          {/* Intake Flags */}
          {flags?.flags?.length > 0 && (
            <div className="glass-premium rounded-2xl p-5" data-testid="intake-flags">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-400" />
                <h3 className="font-display text-sm font-bold text-stellar">Intake Alerts</h3>
              </div>
              <div className="space-y-2">
                {flags.flags.map((f, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${f.level === "high" ? "bg-red-500/5 border-red-500/15" : f.level === "low" ? "bg-amber-500/5 border-amber-500/15" : "bg-white/[0.02] border-white/5"}`} data-testid={`flag-${f.macro}`}>
                    {f.level === "high" ? <ArrowUp size={14} className="text-red-400" /> : <ArrowDown size={14} className="text-amber-400" />}
                    <p className={`font-body text-xs flex-1 ${f.level === "high" ? "text-red-400" : "text-amber-400"}`}>{f.message}</p>
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: (f.level === "high" ? "#EF4444" : "#D97706") + "15", color: f.level === "high" ? "#EF4444" : "#D97706", border: `1px solid ${f.level === "high" ? "#EF4444" : "#D97706"}30` }}>
                      {f.current}/{f.target} {f.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gap Adjustment */}
          {gaps && Object.keys(gaps.daily_gaps || {}).length > 0 && (
            <div className="glass-premium rounded-2xl p-5" data-testid="gap-adjustment">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-cosmic" />
                <h3 className="font-display text-sm font-bold text-stellar">Next Day Adjustment</h3>
                <span className="font-mono text-[7px] text-stellar-dim ml-auto">Compensating today&apos;s gaps</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["calories", "protein", "carbs", "fats", "fiber", "omega3", "iron", "calcium"].map(k => {
                  const adj = gaps.next_day_adjustments?.[k];
                  const gap = gaps.daily_gaps?.[k];
                  if (!adj || !gap) return null;
                  const isDeficit = gap.gap > 0;
                  return (
                    <div key={k} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg" data-testid={`gap-${k}`}>
                      <span className="font-mono text-[8px] text-stellar-dim uppercase block mb-1">{k.replace("_", " ")}</span>
                      <div className="flex items-center gap-1">
                        {isDeficit ? <ArrowUp size={10} className="text-cosmic" /> : <ArrowDown size={10} className="text-amber-400" />}
                        <span className={`font-mono text-xs font-bold ${isDeficit ? "text-cosmic" : "text-amber-400"}`}>
                          {adj.adjustment > 0 ? "+" : ""}{Math.round(adj.adjustment)}
                        </span>
                      </div>
                      <span className="font-mono text-[7px] text-stellar-dim">Target: {Math.round(adj.adjusted_target)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Logs */}
          {logs.length > 0 && (
            <div className="glass-premium rounded-2xl p-5" data-testid="recent-logs">
              <h3 className="font-display text-sm font-bold text-stellar mb-3">Recent Meals</h3>
              <div className="space-y-2">
                {logs.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <UtensilsCrossed size={14} className="text-cosmic shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-stellar capitalize">{l.meal_type}</p>
                      <p className="font-mono text-[8px] text-stellar-dim truncate">{l.foods?.join(", ") || "No details"}</p>
                    </div>
                    <span className="font-mono text-xs text-stellar-dim shrink-0">{l.total_calories || l.totals?.calories || 0} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ====================== TRENDS ====================== */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <div className="glass-premium rounded-2xl p-5" data-testid="trends-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-cosmic" />
                <h3 className="font-display text-sm font-bold text-stellar">Nutrient Trends (30 Days)</h3>
              </div>
              <AppSelect value={trendNutrient} onChange={e => setTrendNutrient(e.target.value)} data-testid="trend-nutrient-select"
                className="bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-2 py-1.5 focus:border-cosmic/30 focus:outline-none font-mono">
                <AppSelectGroup label="Macros">
                  {MACRO_CONFIG.map(c => <AppSelectOption key={c.key} value={c.key}>{c.label}</AppSelectOption>)}
                </AppSelectGroup>
                <AppSelectGroup label="Fats">
                  {FAT_DETAIL_CONFIG.map(c => <AppSelectOption key={c.key} value={c.key}>{c.label}</AppSelectOption>)}
                </AppSelectGroup>
                <AppSelectGroup label="Vitamins">
                  {VITAMIN_CONFIG.map(c => <AppSelectOption key={c.key} value={c.key}>{c.label}</AppSelectOption>)}
                </AppSelectGroup>
                <AppSelectGroup label="Minerals">
                  {MINERAL_CONFIG.map(c => <AppSelectOption key={c.key} value={c.key}>{c.label}</AppSelectOption>)}
                </AppSelectGroup>
                <AppSelectGroup label="Other">
                  {ANTIOXIDANT_CONFIG.map(c => <AppSelectOption key={c.key} value={c.key}>{c.label}</AppSelectOption>)}
                </AppSelectGroup>
              </AppSelect>
            </div>

            {trends?.daily?.length > 0 ? (
              <div className="h-64" data-testid="trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends.daily}>
                    <defs>
                      <linearGradient id="trendNutrientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7B35D8" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7B35D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ background: "#0F0A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                    <Area type="monotone" dataKey={trendNutrient} stroke="#7B35D8" strokeWidth={2} fill="url(#trendNutrientGrad)" dot={{ fill: "#7B35D8", r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Target line info */}
                {trends.targets?.[trendNutrient] && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-6 h-[2px] bg-cosmic/50" />
                    <span className="font-mono text-[8px] text-stellar-dim">Daily Target: {trends.targets[trendNutrient]} {trends.nutrient_units?.[trendNutrient] || ""}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="font-mono text-xs text-stellar-dim">Log meals to see trends</p>
              </div>
            )}
          </div>

          {/* Weekly Averages */}
          {trends?.weekly_averages && Object.keys(trends.weekly_averages).length > 0 && (
            <div className="glass-premium rounded-2xl p-5" data-testid="weekly-averages">
              <h3 className="font-display text-sm font-bold text-stellar mb-3">Weekly Averages</h3>
              <div className="space-y-2">
                {Object.entries(trends.weekly_averages).sort().reverse().slice(0, 4).map(([week, vals]) => (
                  <div key={week} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="font-mono text-[9px] text-cosmic mb-1 block">{week}</span>
                    <div className="flex flex-wrap gap-3">
                      {["calories", "protein", "carbs", "fats", "fiber"].map(k => (
                        <div key={k} className="text-center">
                          <span className="font-mono text-sm font-bold text-stellar">{Math.round(vals[k] || 0)}</span>
                          <span className="font-mono text-[7px] text-stellar-dim block">{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ====================== LOG MEAL ====================== */}
        <TabsContent value="log" className="space-y-4 mt-4">
          <div className="glass-premium rounded-2xl p-6" data-testid="meal-photo-upload">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
                <Camera size={22} className="text-cosmic" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-stellar">Snap &amp; Log</h3>
                <p className="font-body text-xs text-stellar-dim">Photo-to-nutrition: snap your meal for instant analysis</p>
              </div>
              <Badge className="bg-cosmic/10 text-cosmic font-mono text-[7px] border border-cosmic/15 ml-auto">+5 pts/day</Badge>
            </div>

            <div className="flex gap-3 mb-4">
              {["breakfast", "lunch", "dinner", "snack"].map(t => (
                <button key={t} onClick={() => setMealType(t)} data-testid={`meal-type-${t}`}
                  className={`px-4 py-2 rounded-lg border font-mono text-[10px] uppercase tracking-wider transition-all ${
                    mealType === t ? "bg-cosmic/10 border-cosmic/30 text-cosmic" : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-white/10"
                  }`}>{t}</button>
              ))}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhotoUpload} className="hidden" data-testid="photo-file-input" />

            <button onClick={() => fileInputRef.current?.click()} disabled={analyzing} data-testid="upload-photo-btn"
              className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-cosmic/30 bg-white/[0.01] hover:bg-cosmic/5 transition-all flex flex-col items-center justify-center gap-2">
              {analyzing ? (
                <>
                  <div className="w-8 h-8 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
                  <span className="font-mono text-xs text-cosmic">Analyzing your meal...</span>
                </>
              ) : (
                <>
                  <Camera size={28} className="text-stellar-dim/40" />
                  <span className="font-mono text-xs text-stellar-dim/60">Click to upload or take a photo</span>
                </>
              )}
            </button>
          </div>

          {/* Photo Analysis Results */}
          {photoAnalysis && (
            <div className="glass-premium rounded-2xl p-6" data-testid="photo-analysis-result">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-emerald-400" />
                <h3 className="font-display text-sm font-bold text-stellar">{photoAnalysis.meal_name}</h3>
                {photoAnalysis.confidence && (
                  <Badge className={`font-mono text-[7px] ml-auto ${photoAnalysis.confidence === "high" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-amber-500/10 text-amber-400 border border-amber-500/15"}`}>{photoAnalysis.confidence} confidence</Badge>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Calories", value: photoAnalysis.total?.calories, unit: "kcal", color: "#EF4444" },
                  { label: "Protein", value: photoAnalysis.total?.protein, unit: "g", color: "#0F9F8F" },
                  { label: "Carbs", value: photoAnalysis.total?.carbs, unit: "g", color: "#D97706" },
                  { label: "Fats", value: photoAnalysis.total?.fats, unit: "g", color: "#6366F1" },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="text-center p-3 bg-white/[0.02] rounded-xl">
                    <p className="font-mono text-xl font-black" style={{ color }}>{Math.round(value || 0)}</p>
                    <p className="font-mono text-[7px] text-stellar-dim">{label} ({unit})</p>
                  </div>
                ))}
              </div>
              {photoAnalysis.items?.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {photoAnalysis.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                      <Apple size={12} className="text-stellar-dim/40 shrink-0" />
                      <span className="font-body text-xs text-stellar flex-1">{item.item}</span>
                      <span className="font-mono text-[9px] text-stellar-dim">{item.portion}</span>
                      <span className="font-mono text-[9px] text-stellar-dim">{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}
              {photoAnalysis.health_notes?.length > 0 && (
                <div className="p-3 bg-cosmic/5 border border-cosmic/10 rounded-xl mb-4">
                  {photoAnalysis.health_notes.map((n, i) => (
                    <p key={i} className="font-body text-[11px] text-stellar-dim leading-relaxed">&bull; {n}</p>
                  ))}
                </div>
              )}
              <Button data-testid="log-analyzed-meal-btn" onClick={logAnalyzedMeal}
                className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs">
                <CheckCircle size={14} className="mr-2" /> Log This Meal
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ====================== MEAL PLANNER ====================== */}
        <TabsContent value="planner" className="space-y-4 mt-4">
          <div className="glass-premium rounded-2xl p-6" data-testid="meal-plan-generator">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
                <Salad size={22} className="text-cosmic" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-stellar">AgeReboot Meal Planner</h3>
                <p className="font-body text-xs text-stellar-dim">Personalized from your medical records, diagnostics &amp; activities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Health Goal</label>
                <AppSelect value={planForm.goal} onChange={e => setPlanForm(p => ({...p, goal: e.target.value}))} data-testid="plan-goal-select"
                  className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
                  <AppSelectOption value="general_health">General Health</AppSelectOption>
                  <AppSelectOption value="weight_loss">Weight Loss</AppSelectOption>
                  <AppSelectOption value="muscle_gain">Muscle Gain</AppSelectOption>
                  <AppSelectOption value="heart_health">Heart Health</AppSelectOption>
                  <AppSelectOption value="inflammation_reduction">Reduce Inflammation</AppSelectOption>
                  <AppSelectOption value="blood_sugar_control">Blood Sugar Control</AppSelectOption>
                  <AppSelectOption value="longevity">Longevity Optimization</AppSelectOption>
                  <AppSelectOption value="anti_aging">Anti-Aging</AppSelectOption>
                  <AppSelectOption value="gut_health">Gut Health</AppSelectOption>
                </AppSelect>
              </div>
              <div>
                <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Dietary Preference</label>
                <AppSelect onChange={e => { if (e.target.value) setPlanForm(p => ({...p, dietary_preferences: [...new Set([...p.dietary_preferences, e.target.value])]})); }}
                  className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
                  <AppSelectOption value="">Add preference...</AppSelectOption>
                  <AppSelectOption value="vegetarian">Vegetarian</AppSelectOption>
                  <AppSelectOption value="vegan">Vegan</AppSelectOption>
                  <AppSelectOption value="keto">Keto</AppSelectOption>
                  <AppSelectOption value="paleo">Paleo</AppSelectOption>
                  <AppSelectOption value="mediterranean">Mediterranean</AppSelectOption>
                  <AppSelectOption value="gluten_free">Gluten Free</AppSelectOption>
                  <AppSelectOption value="halal">Halal</AppSelectOption>
                  <AppSelectOption value="kosher">Kosher</AppSelectOption>
                  <AppSelectOption value="low_carb">Low Carb</AppSelectOption>
                  <AppSelectOption value="high_protein">High Protein</AppSelectOption>
                </AppSelect>
              </div>
              <div>
                <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Allergies</label>
                <AppSelect onChange={e => { if (e.target.value) setPlanForm(p => ({...p, allergies: [...new Set([...p.allergies, e.target.value])]})); }}
                  className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
                  <AppSelectOption value="">Add allergy...</AppSelectOption>
                  <AppSelectOption value="nuts">Nuts</AppSelectOption>
                  <AppSelectOption value="dairy">Dairy</AppSelectOption>
                  <AppSelectOption value="gluten">Gluten</AppSelectOption>
                  <AppSelectOption value="shellfish">Shellfish</AppSelectOption>
                  <AppSelectOption value="eggs">Eggs</AppSelectOption>
                  <AppSelectOption value="soy">Soy</AppSelectOption>
                  <AppSelectOption value="fish">Fish</AppSelectOption>
                  <AppSelectOption value="sesame">Sesame</AppSelectOption>
                </AppSelect>
              </div>
            </div>

            {/* Cuisine Selection */}
            <div className="mb-4">
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-2 block">Cuisine Preferences</label>
              <div className="flex flex-wrap gap-2" data-testid="cuisine-selection">
                {ALL_CUISINES.map(c => (
                  <button key={c} onClick={() => setPlanForm(p => ({
                    ...p, cuisine_preferences: p.cuisine_preferences.includes(c) ? p.cuisine_preferences.filter(x => x !== c) : [...p.cuisine_preferences, c]
                  }))} data-testid={`cuisine-${c}`}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[9px] capitalize transition-all ${
                      planForm.cuisine_preferences.includes(c) ? "bg-cosmic/15 border-cosmic/30 text-cosmic" : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-white/10"
                    }`}>{c.replace("_", " ")}</button>
                ))}
              </div>
            </div>

            {/* Selected tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {planForm.dietary_preferences.map(p => (
                <Badge key={p} className="bg-cosmic/10 text-cosmic border border-cosmic/15 font-mono text-[8px] cursor-pointer"
                  onClick={() => setPlanForm(prev => ({...prev, dietary_preferences: prev.dietary_preferences.filter(x => x !== p)}))}>
                  <Leaf size={8} className="mr-1" /> {p} &times;
                </Badge>
              ))}
              {planForm.allergies.map(a => (
                <Badge key={a} className="bg-red-500/10 text-red-400 border border-red-500/15 font-mono text-[8px] cursor-pointer"
                  onClick={() => setPlanForm(prev => ({...prev, allergies: prev.allergies.filter(x => x !== a)}))}>
                  <Ban size={8} className="mr-1" /> {a} &times;
                </Badge>
              ))}
            </div>

            <Button data-testid="generate-plan-btn" onClick={generatePlan} disabled={generating}
              className="bg-gradient-to-r from-cosmic to-indigo-600 hover:from-cosmic-light hover:to-indigo-500 text-white font-display font-bold uppercase tracking-[0.15em] text-xs h-11 w-full rounded-xl shadow-[0_4px_20px_rgba(123,53,216,0.3)]">
              {generating ? (
                <span className="flex items-center gap-2"><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Generating...</span>
              ) : (
                <span className="flex items-center gap-2"><Salad size={14} /> Generate Personalized Plan</span>
              )}
            </Button>
          </div>

          {/* Plan Display */}
          {mealPlan?.plan?.meals && (
            <div className="space-y-4" data-testid="meal-plan-display">
              <div className="glass-premium rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-bold text-stellar">{mealPlan.plan.plan_name || "Your Meal Plan"}</h3>
                  {mealPlan.generated && <Badge className="bg-cosmic/10 text-cosmic border border-cosmic/15 font-mono text-[7px]">AgeReboot Personalized</Badge>}
                </div>
                {mealPlan.plan.gap_compensation && (
                  <p className="font-body text-xs text-stellar-dim mb-3 p-2 bg-cosmic/5 border border-cosmic/10 rounded-lg">{mealPlan.plan.gap_compensation}</p>
                )}
                {mealPlan.daily_target && (
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(mealPlan.daily_target).slice(0, 8).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <p className="font-mono text-lg font-bold text-stellar">{typeof v === "number" ? Math.round(v) : v}</p>
                        <p className="font-mono text-[7px] text-stellar-dim uppercase">{k === "calories" ? "kcal" : k.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {Object.entries(mealPlan.plan.meals || {}).map(([mealName, items]) => {
                if (!items || items.length === 0) return null;
                const mealCal = items.reduce((s, i) => s + (i.calories || 0), 0);
                return (
                  <div key={mealName} className="glass-premium rounded-xl p-4" data-testid={`plan-meal-${mealName}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display text-sm font-bold text-stellar capitalize">{mealName.replace("_", " ")}</h4>
                      <span className="font-mono text-xs text-stellar-dim">{mealCal} kcal</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                          <UtensilsCrossed size={11} className="text-cosmic mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-xs text-stellar">{item.item}</p>
                            {item.cuisine && <Badge variant="outline" className="border-white/8 text-stellar-dim/60 font-mono text-[7px] mt-0.5">{item.cuisine}</Badge>}
                            {item.benefit && <p className="font-mono text-[8px] text-cosmic/70 mt-0.5">{item.benefit}</p>}
                            {item.recipe_brief && <p className="font-mono text-[7px] text-stellar-dim/50 mt-0.5">{item.recipe_brief}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-[9px] text-stellar-dim">{item.calories} kcal</span>
                            <div className="font-mono text-[7px] text-stellar-dim/40">P{item.protein}g C{item.carbs}g F{item.fats}g</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealPlan.plan.key_principles?.length > 0 && (
                  <div className="glass-premium rounded-xl p-4" data-testid="plan-principles">
                    <h4 className="font-display text-sm font-bold text-stellar mb-3">Key Principles</h4>
                    {mealPlan.plan.key_principles.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <ChevronRight size={10} className="text-cosmic mt-0.5 shrink-0" />
                        <p className="font-body text-xs text-stellar-dim">{p}</p>
                      </div>
                    ))}
                  </div>
                )}
                {mealPlan.plan.foods_to_avoid?.length > 0 && (
                  <div className="glass-premium rounded-xl p-4" data-testid="plan-avoid">
                    <h4 className="font-display text-sm font-bold text-stellar mb-3">Foods to Limit</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {mealPlan.plan.foods_to_avoid.map((f, i) => (
                        <Badge key={i} className="bg-red-500/8 text-red-400 border border-red-500/12 font-mono text-[8px]">
                          <Ban size={8} className="mr-1" /> {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {mealPlan.plan.supplements_suggested?.length > 0 && (
                <div className="glass-premium rounded-xl p-4" data-testid="plan-supplements">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill size={14} className="text-cosmic" />
                    <h4 className="font-display text-sm font-bold text-stellar">Suggested Supplements</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mealPlan.plan.supplements_suggested.map((s, i) => (
                      <Badge key={i} className="bg-cosmic/8 text-cosmic border border-cosmic/12 font-mono text-[8px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
