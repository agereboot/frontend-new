import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building, Users, TrendingUp, DollarSign, Shield, Heart, Zap, Brain, Moon,
  AlertTriangle, Crown, ArrowUp, ArrowDown, Minus, BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const TIER_COLORS = {
  "CENTENARIAN": "#D97706", "MASTERY": "#A855F7", "RESILIENCE": "#0F9F8F",
  "LONGEVITY": "#4F46E5", "VITALITY": "#7B35D8", "FOUNDATION": "#F59E0B", "AWAKENING": "#EF4444",
};
const ALERT_COLORS = { "GREEN": "#10B981", "YELLOW": "#EAB308", "ORANGE": "#F97316", "RED": "#EF4444" };
const PILLAR_ICONS = { "Biological Resilience": Heart, "Physical Fitness": Zap, "Cognitive Health": Brain, "Sleep & Recovery": Moon, "Behaviour & Lifestyle": Shield };

function KPICard({ label, value, subtitle, icon: Icon, color = "#7B35D8", trend }) {
  return (
    <div className="glass-card rounded-lg p-5" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 font-mono text-[10px] ${trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-stellar-dim"}`}>
            {trend > 0 ? <ArrowUp size={10} /> : trend < 0 ? <ArrowDown size={10} /> : <Minus size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="font-mono text-3xl font-bold text-stellar">{value}</p>
      <p className="font-mono text-[10px] text-stellar-dim uppercase tracking-widest mt-1">{label}</p>
      {subtitle && <p className="font-mono text-[9px] text-stellar-dim mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function FranchiseAdminPage() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(false);

  const fetchFranchises = useCallback(async () => {
    try {
      const res = await api.get("/franchise/list");
      setFranchises(res.data?.franchises || []);
      if (user?.franchise && user.franchise !== "Independent") {
        setSelectedFranchise(user.franchise);
      } else if (res.data?.franchises?.length > 0) {
        setSelectedFranchise(res.data.franchises[0].name);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchFranchises(); }, [fetchFranchises]);

  const fetchDashboard = useCallback(async () => {
    if (!selectedFranchise) return;
    setDashLoading(true);
    try {
      const res = await api.get(`/franchise/dashboard/${encodeURIComponent(selectedFranchise)}`);
      setDashboard(res.data);
    } catch (err) { toast.error("Failed to load franchise dashboard"); }
    finally { setDashLoading(false); }
  }, [selectedFranchise]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const tierChartData = dashboard ? Object.entries(dashboard.tier_distribution).map(([tier, count]) => ({
    name: tier, value: count, color: TIER_COLORS[tier] || "#7B35D8",
  })).filter(d => d.value > 0) : [];

  const alertChartData = dashboard ? Object.entries(dashboard.alert_distribution).map(([level, count]) => ({
    name: level, value: count, color: ALERT_COLORS[level] || "#10B981",
  })).filter(d => d.value > 0) : [];

  const pillarRadarData = dashboard?.pillar_averages ? Object.entries(dashboard.pillar_averages).map(([code, p]) => ({
    pillar: p.name.split(" ")[0], pct: p.avg_pct, fullMark: 100,
  })) : [];

  const ageChartData = dashboard?.demographics?.age_groups ? Object.entries(dashboard.demographics.age_groups).map(([group, count]) => ({
    group, count,
  })) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up" data-testid="franchise-admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            <span className="text-cosmic">Franchise</span> Command Centre
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            Team Analytics &middot; ROI Metrics &middot; Performance Intel
          </p>
        </div>
        <Select value={selectedFranchise} onValueChange={setSelectedFranchise}>
          <SelectTrigger data-testid="franchise-selector" className="w-64 bg-space border-white/10 text-stellar h-11 font-mono text-sm">
            <SelectValue placeholder="Select franchise..." />
          </SelectTrigger>
          <SelectContent className="bg-space-light border-white/10">
            {franchises.map(f => (
              <SelectItem key={f.name} value={f.name} className="font-mono text-xs">
                {f.name} ({f.members})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dashLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto" />
            <p className="mt-3 font-mono text-xs text-stellar-dim">Loading franchise telemetry...</p>
          </div>
        </div>
      ) : !dashboard ? (
        <div className="glass-card rounded-lg p-16 text-center">
          <Building size={40} className="text-cosmic mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-stellar mb-2">Select a Franchise</h2>
          <p className="text-stellar-dim font-body">Choose a franchise above to view team analytics.</p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Avg HPS" value={Math.round(dashboard.kpis.avg_hps)} subtitle={`Median: ${Math.round(dashboard.kpis.median_hps)}`} icon={BarChart3} color="#7B35D8" />
            <KPICard label="Participation" value={`${Math.round(dashboard.participation_rate)}%`} subtitle={`${dashboard.scored_members}/${dashboard.total_members} scored`} icon={Users} color="#0F9F8F" />
            <KPICard label="Annual Savings" value={`$${(dashboard.roi.total_annual_savings / 1000).toFixed(0)}K`} subtitle={`${dashboard.roi.healthcare_cost_reduction_pct}% cost reduction`} icon={DollarSign} color="#D97706" />
            <KPICard label="Productivity" value={`+${dashboard.roi.productivity_gain_pct}%`} subtitle={`${dashboard.roi.sick_days_saved_total} sick days saved`} icon={TrendingUp} color="#4F46E5" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier Distribution */}
            <div className="glass-card rounded-lg p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Tier Distribution</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tierChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                      {tierChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0F0A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tierChartData.map(t => (
                  <div key={t.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="font-mono text-[8px] text-stellar-dim">{t.name} ({t.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pillar Radar */}
            <div className="glass-card rounded-lg p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Pillar Averages</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pillarRadarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fill: "#94A3B8", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="pct" stroke="#7B35D8" fill="#7B35D8" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alert Distribution */}
            <div className="glass-card rounded-lg p-5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">System Alerts</p>
              <div className="space-y-3 mt-2">
                {Object.entries(dashboard.alert_distribution).map(([level, count]) => {
                  const total = Object.values(dashboard.alert_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (count / total * 100) : 0;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="font-mono text-[10px] w-14 uppercase tracking-wider" style={{ color: ALERT_COLORS[level] }}>{level}</span>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ALERT_COLORS[level] }} />
                      </div>
                      <span className="font-mono text-xs text-stellar w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              {/* Demographics mini chart */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-2">Demographics</p>
                <div className="flex gap-3 font-mono text-[9px]">
                  <span className="text-stellar-dim">M: <span className="text-stellar">{dashboard.demographics?.sex_distribution?.M || 0}</span></span>
                  <span className="text-stellar-dim">F: <span className="text-stellar">{dashboard.demographics?.sex_distribution?.F || 0}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Details */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="font-display text-lg font-bold text-stellar mb-4 uppercase tracking-wide flex items-center gap-2">
              <DollarSign size={18} className="text-aurora" /> ROI Impact Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Healthcare Cost Reduction", value: `${dashboard.roi.healthcare_cost_reduction_pct}%`, sub: `vs. baseline` },
                { label: "Savings/Employee/Year", value: `$${dashboard.roi.annual_savings_per_employee.toLocaleString()}`, sub: `at $${dashboard.roi.avg_healthcare_cost_assumed.toLocaleString()} baseline` },
                { label: "Total Annual Savings", value: `$${dashboard.roi.total_annual_savings.toLocaleString()}`, sub: `${dashboard.total_members} employees` },
                { label: "ROI Multiplier", value: `${dashboard.roi.roi_multiplier}x`, sub: `vs. $500/yr program cost` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white/[0.03] rounded-sm p-4 border border-white/5">
                  <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-widest">{label}</p>
                  <p className="font-mono text-2xl font-bold text-aurora mt-1">{value}</p>
                  <p className="font-mono text-[9px] text-stellar-dim mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers + Member Table */}
          <Tabs defaultValue="performers" className="w-full">
            <TabsList className="bg-space-light/50 border border-white/5">
              <TabsTrigger value="performers" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
                <Crown size={14} className="mr-1.5" /> Top 10
              </TabsTrigger>
              <TabsTrigger value="members" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
                <Users size={14} className="mr-1.5" /> All Members ({dashboard.total_members})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performers" className="mt-4">
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="col-span-1 font-mono text-[9px] text-stellar-dim uppercase">#</span>
                  <span className="col-span-4 font-mono text-[9px] text-stellar-dim uppercase">Athlete</span>
                  <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase">Age/Sex</span>
                  <span className="col-span-3 font-mono text-[9px] text-stellar-dim uppercase text-right">HPS</span>
                  <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase text-right">Tier</span>
                </div>
                {dashboard.top_performers.map((p, i) => (
                  <div key={p.user_id} data-testid={`top-performer-${i}`}
                    className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-1 flex items-center">
                      {i < 3 ? <Crown size={14} className={i === 0 ? "text-aurora" : i === 1 ? "text-stellar" : "text-amber-600"} /> :
                        <span className="font-mono text-sm text-stellar-dim">{i + 1}</span>}
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-sm bg-cosmic/10 border border-cosmic/20 flex items-center justify-center font-display text-xs font-bold text-cosmic">
                        {p.name?.charAt(0)}
                      </div>
                      <span className="font-body text-sm text-stellar truncate">{p.name}</span>
                    </div>
                    <span className="col-span-2 font-mono text-xs text-stellar-dim self-center">{p.age}{p.sex}</span>
                    <span className="col-span-3 font-mono text-lg font-bold text-stellar text-right self-center">{Math.round(p.hps_final)}</span>
                    <div className="col-span-2 flex justify-end self-center">
                      <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider"
                        style={{ borderColor: `${TIER_COLORS[p.tier?.tier]}40`, color: TIER_COLORS[p.tier?.tier] }}>
                        {p.tier?.tier || "—"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-4">
              <div className="glass-card rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02] sticky top-0 z-10">
                  <span className="col-span-4 font-mono text-[9px] text-stellar-dim uppercase">Name</span>
                  <span className="col-span-1 font-mono text-[9px] text-stellar-dim uppercase">Age</span>
                  <span className="col-span-1 font-mono text-[9px] text-stellar-dim uppercase">Sex</span>
                  <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase text-right">HPS</span>
                  <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase text-right">Tier</span>
                  <span className="col-span-2 font-mono text-[9px] text-stellar-dim uppercase text-right">Status</span>
                </div>
                {dashboard.members.map((m, i) => (
                  <div key={m.user_id} className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <span className="col-span-4 font-body text-sm text-stellar truncate self-center">{m.name}</span>
                    <span className="col-span-1 font-mono text-xs text-stellar-dim self-center">{m.age}</span>
                    <span className="col-span-1 font-mono text-xs text-stellar-dim self-center">{m.sex}</span>
                    <span className="col-span-2 font-mono text-sm font-bold text-stellar text-right self-center">
                      {m.hps_final ? Math.round(m.hps_final) : "—"}
                    </span>
                    <div className="col-span-2 flex justify-end self-center">
                      {m.tier ? (
                        <Badge variant="outline" className="font-mono text-[8px] uppercase"
                          style={{ borderColor: `${TIER_COLORS[m.tier?.tier]}40`, color: TIER_COLORS[m.tier?.tier] }}>
                          {m.tier?.tier}
                        </Badge>
                      ) : <span className="font-mono text-[9px] text-stellar-dim">—</span>}
                    </div>
                    <div className="col-span-2 flex justify-end self-center">
                      {m.alert ? (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ALERT_COLORS[m.alert?.level] || "#10B981" }} />
                      ) : <span className="font-mono text-[9px] text-stellar-dim">N/A</span>}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
