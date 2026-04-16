import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  TrendingUp, DollarSign, Activity, Zap, Trophy, Shield, Globe,
  Users, Crown, ArrowUpRight, ArrowDownRight, Minus, ChevronRight,
  AlertTriangle, Sparkles, BarChart3, Wifi, WifiOff,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";

const ACCENT = "#CFB53B";
const BRI_COLORS = { green: "#10B981", yellow: "#EAB308", orange: "#F97316", red: "#EF4444" };
const TIER_COLORS = { Bronze: "#CD7F32", Silver: "#C0C0C0", Gold: "#FFD700", Platinum: "#E5E4E2" };
const URGENCY_COLORS = { critical: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#64748B" };

function TrendIcon({ dir }) {
  if (dir === "improving") return <ArrowUpRight size={14} className="text-emerald-400" />;
  if (dir === "worsening") return <ArrowDownRight size={14} className="text-red-400" />;
  return <Minus size={14} className="text-slate-500" />;
}

function MetricCard({ icon: Icon, label, value, sub, color, onClick, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className="bg-[#11111a] border border-white/5 rounded-xl p-5 text-left hover:border-white/10 transition-all group w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (color || ACCENT) + "15" }}>
          <Icon size={16} style={{ color: color || ACCENT }} />
        </div>
        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </button>
  );
}

export default function CXODashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState("disconnected"); // connected | disconnected | connecting
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connectWs = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const base = process.env.REACT_APP_BACKEND_URL || "";
    const wsUrl = base.replace(/^http/, "ws") + "/api/cxo/ws/cxo-live?token=" + token;
    setWsStatus("connecting");
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setWsStatus("connected");
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.wvi) { setData(msg); setLoading(false); }
        } catch {}
      };
      ws.onclose = () => {
        setWsStatus("disconnected");
        reconnectRef.current = setTimeout(connectWs, 5000);
      };
      ws.onerror = () => ws.close();
    } catch { setWsStatus("disconnected"); }
  }, []);

  useEffect(() => {
    // REST fallback — always fetch once, then try WebSocket
    api.get("/cxo/dashboard").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs]);

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]" data-testid="cxo-dash-loading">
      <div className="text-center">
        <div className="w-12 h-12 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: ACCENT + "30", borderTopColor: ACCENT }} />
        <p className="font-mono text-xs text-slate-500 mt-4">Loading Executive Intelligence...</p>
      </div>
    </div>
  );
  if (!data) return <div className="text-slate-400 text-center py-20" data-testid="cxo-dash-error">Failed to load dashboard</div>;

  const { wvi, financial_roi, engagement, burnout_risk, franchise, profit_share, esg, talent, operational_risk, ceo_actions, meta } = data;
  const wviTrend = wvi.trend_90d?.slice(-12) || [];
  const briPie = Object.entries(burnout_risk.distribution).map(([k, v]) => ({ name: k, value: v, fill: BRI_COLORS[k] }));
  const tierPie = Object.entries(profit_share.tier_distribution).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v, fill: TIER_COLORS[k] }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cxo-dashboard">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Executive <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, #E5C158)` }}>Command Centre</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">
            AgeReboot CXO Strategic Intelligence Platform &middot; {meta.total_employees} employees tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/5" data-testid="ws-status">
            {wsStatus === "connected" ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><Wifi size={12} className="text-emerald-400" /><span className="font-mono text-[9px] text-emerald-400">LIVE</span></>
            ) : wsStatus === "connecting" ? (
              <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span className="font-mono text-[9px] text-amber-400">CONNECTING</span></>
            ) : (
              <><WifiOff size={12} className="text-slate-500" /><span className="font-mono text-[9px] text-slate-500">OFFLINE</span></>
            )}
          </div>
          <p className="font-mono text-xs text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Row 1: WVI Hero + Key Metrics */}
      <div className="grid grid-cols-12 gap-4">
        {/* WVI Hero Card */}
        <div className="col-span-12 lg:col-span-4 rounded-xl border border-white/5 bg-[#11111a] p-6 flex flex-col items-center cursor-pointer hover:border-white/10 transition-all"
             onClick={() => navigate("/cxo/workforce-vitality")} data-testid="wvi-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-2">Workforce Vitality Index</p>
          <div className="relative w-36 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
                data={[{ value: wvi.score, fill: ACCENT }]} startAngle={180} endAngle={0} barSize={12}>
                <RadialBar background clockWise dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-black" style={{ color: ACCENT }}>{wvi.score}</span>
              <span className="font-mono text-[8px] text-slate-500">/1000</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span>Benchmark: <strong className="text-white">{wvi.industry_benchmark}</strong></span>
            <span>Rank: <strong className="text-white">#{wvi.peer_rank}</strong>/{wvi.peer_total}</span>
          </div>
          <div className="w-full mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wviTrend}>
                <Area type="monotone" dataKey="value" stroke={ACCENT} fill={ACCENT + "20"} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="font-mono text-[8px] text-slate-600 mt-1">90-day trend</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 xl:grid-cols-3 gap-4">
          <MetricCard icon={DollarSign} label="Wellness ROI" value={`${financial_roi.roi_ratio}x`}
            sub={`₹${(financial_roi.total_return / 100000).toFixed(1)}L return`} color="#10B981"
            onClick={() => navigate("/cxo/financial")} testId="roi-card" />
          <MetricCard icon={Activity} label="Engagement Index" value={`${engagement.score}`}
            sub={`${engagement.active_users_pct}% active users`} color="#6366F1"
            onClick={() => navigate("/cxo/operations")} testId="engagement-card" />
          <MetricCard icon={Trophy} label="Franchise Rank" value={`#${franchise.rank}`}
            sub={`Season IV — ${franchise.qualification_pct}% qualified`} color="#F59E0B"
            onClick={() => navigate("/cxo/competitive")} testId="franchise-card" />
          <MetricCard icon={Globe} label="ESG Score" value={`${esg.composite_score}%`}
            sub={`+${esg.yoy_delta}% YoY`} color="#0F9F8F"
            onClick={() => navigate("/cxo/esg")} testId="esg-card" />
          <MetricCard icon={Users} label="Talent Retention" value={`${talent.attrition_rate}%`}
            sub={`Down from ${talent.attrition_pre_agereboot}% (Delta: ${talent.attrition_delta}%)`} color="#8B5CF6"
            onClick={() => navigate("/cxo/competitive")} testId="talent-card" />
          <MetricCard icon={Crown} label="Profit-Share Eligible" value={profit_share.eligible_count}
            sub={`${profit_share.eligible_pct}% of workforce`} color={ACCENT}
            onClick={() => navigate("/cxo/profit-share")} testId="profitshare-card" />
        </div>
      </div>

      {/* Row 2: Burnout Risk + Operational Risk + CEO Actions */}
      <div className="grid grid-cols-12 gap-4">
        {/* Burnout Risk */}
        <div className="col-span-12 lg:col-span-3 rounded-xl border border-white/5 bg-[#11111a] p-5 cursor-pointer hover:border-white/10 transition-all"
             onClick={() => navigate("/cxo/operations")} data-testid="burnout-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-3">Burnout Risk</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={briPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                {briPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs mt-2">
            {Object.entries(burnout_risk.distribution).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: BRI_COLORS[k] }} />
                <span className="text-slate-400 capitalize">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">{burnout_risk.green_yellow_pct}% in safe zones</p>
        </div>

        {/* Operational Risk Heatmap */}
        <div className="col-span-12 lg:col-span-5 rounded-xl border border-white/5 bg-[#11111a] p-5 cursor-pointer hover:border-white/10 transition-all"
             onClick={() => navigate("/cxo/operations")} data-testid="oprisk-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-3">Operational Risk Heatmap</p>
          <div className="grid grid-cols-4 gap-2">
            {operational_risk.departments.map(d => (
              <div key={d.name} className="rounded-lg p-2 border border-white/5 text-center" style={{ backgroundColor: BRI_COLORS[d.bri_zone] + "15" }}>
                <p className="text-[10px] text-slate-300 truncate font-medium">{d.name}</p>
                <p className="text-[9px] font-mono mt-0.5" style={{ color: BRI_COLORS[d.bri_zone] }}>{d.avg_hps}</p>
                <TrendIcon dir={d.trajectory} />
              </div>
            ))}
          </div>
        </div>

        {/* CEO Action Intelligence */}
        <div className="col-span-12 lg:col-span-4 rounded-xl border border-white/5 bg-[#11111a] p-5" data-testid="ceo-actions-card">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: ACCENT }} />
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em]">CEO Action Intelligence</p>
          </div>
          <div className="space-y-3">
            {ceo_actions.map((a, i) => (
              <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold" style={{ backgroundColor: URGENCY_COLORS[a.urgency] + "20", color: URGENCY_COLORS[a.urgency] }}>
                    {a.priority}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white font-medium leading-snug">{a.action}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{a.impact}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase" style={{ backgroundColor: URGENCY_COLORS[a.urgency] + "15", color: URGENCY_COLORS[a.urgency] }}>
                      {a.urgency} &middot; {a.department}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Financial ROI Trend + Profit-Share Tiers + ESG Compliance */}
      <div className="grid grid-cols-12 gap-4">
        {/* Financial ROI Trend */}
        <div className="col-span-12 lg:col-span-5 rounded-xl border border-white/5 bg-[#11111a] p-5 cursor-pointer hover:border-white/10 transition-all"
             onClick={() => navigate("/cxo/financial")} data-testid="roi-trend-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1">Cumulative ROI Trajectory</p>
          <p className="text-xs text-slate-400 mb-3">Payback: {financial_roi.payback_months} months &middot; Benchmark: {financial_roi.benchmark.industry_avg_roi}x avg</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financial_roi.trend}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ backgroundColor: "#11111a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                         formatter={(v) => [`₹${(v / 100000).toFixed(1)}L`, ""]} />
                <Area type="monotone" dataKey="cumulative_roi" stroke="#10B981" fill="#10B98120" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit-Share Tiers */}
        <div className="col-span-12 lg:col-span-3 rounded-xl border border-white/5 bg-[#11111a] p-5 cursor-pointer hover:border-white/10 transition-all"
             onClick={() => navigate("/cxo/profit-share")} data-testid="ps-tiers-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-3">Profit-Share Tiers</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={tierPie} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" strokeWidth={0}>
                {tierPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {Object.entries(profit_share.tier_distribution).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[k] }} />
                  <span className="text-slate-400">{k}</span>
                </div>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2">Pool: ₹{(profit_share.pool_size / 10000000).toFixed(1)}Cr</p>
        </div>

        {/* ESG Compliance */}
        <div className="col-span-12 lg:col-span-4 rounded-xl border border-white/5 bg-[#11111a] p-5 cursor-pointer hover:border-white/10 transition-all"
             onClick={() => navigate("/cxo/esg")} data-testid="esg-detail-card">
          <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-3">ESG Framework Compliance</p>
          {[
            { label: "GRI 403", value: esg.gri_403, color: "#10B981" },
            { label: "BRSR P3", value: esg.brsr_p3, color: "#6366F1" },
            { label: "SDG 3", value: esg.sdg_3, color: "#F59E0B" },
            { label: "SDG 8", value: esg.sdg_8, color: "#EF4444" },
          ].map(item => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-white/5">
            <span className="text-slate-500">Compliance Items</span>
            <span className="text-white">{esg.compliance_items.completed}/{esg.compliance_items.total}</span>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono pt-2">
        <span>Data completeness: {meta.data_completeness}%</span>
        <span>Last refreshed: {new Date(meta.generated_at).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
