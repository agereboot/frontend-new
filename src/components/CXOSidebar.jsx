import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, TrendingUp, DollarSign, Activity,
  Zap, Trophy, Shield, Globe, Users, Target,
  Sliders, FileText, Briefcase, LogOut,
  BarChart3, AlertTriangle, Crown, Radio,
} from "lucide-react";

const NAV_CXO = [
  { heading: null, items: [
    { path: "/cxo", icon: LayoutDashboard, label: "Command Centre", testId: "cxo-nav-dashboard" },
    { path: "/cxo/mission-control", icon: Radio, label: "Mission Control", testId: "cxo-nav-mission" },
  ]},
  { heading: "Deep Dive", items: [
    { path: "/cxo/workforce-vitality", icon: TrendingUp, label: "Workforce Vitality", testId: "cxo-nav-wvi" },
    { path: "/cxo/financial", icon: DollarSign, label: "Financial ROI", testId: "cxo-nav-financial" },
    { path: "/cxo/operations", icon: Activity, label: "Operations Centre", testId: "cxo-nav-operations" },
    { path: "/cxo/esg", icon: Globe, label: "ESG Intelligence", testId: "cxo-nav-esg" },
    { path: "/cxo/competitive", icon: Trophy, label: "Competitive Intel", testId: "cxo-nav-competitive" },
    { path: "/cxo/profit-share", icon: Crown, label: "Profit-Share Admin", testId: "cxo-nav-profitshare" },
  ]},
  { heading: "Strategic Tools", items: [
    { path: "/cxo/simulator", icon: Sliders, label: "What-If Simulator", testId: "cxo-nav-simulator" },
    { path: "/cxo/interventions", icon: Target, label: "Interventions Planner", testId: "cxo-nav-interventions" },
  ]},
  { heading: "Reporting", items: [
    { path: "/cxo/board-reports", icon: FileText, label: "Board Reports", testId: "cxo-nav-reports" },
    { path: "/cxo/investor", icon: Briefcase, label: "Investor Updates", testId: "cxo-nav-investor" },
  ]},
];

const ACCENT = "#CFB53B";

export function CXOSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#050217]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col" data-testid="cxo-sidebar">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ACCENT + "15", border: `1px solid ${ACCENT}30` }}>
            <Crown size={18} style={{ color: ACCENT }} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white truncate">{user?.name || "Executive"}</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.15em]" style={{ color: ACCENT + "BB" }}>CXO Executive</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {NAV_CXO.map((section, si) => (
          <div key={si}>
            {section.heading && (
              <p className="font-mono text-[7px] text-slate-600 uppercase tracking-[0.2em] px-3 pt-3 pb-1">{section.heading}</p>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path || (item.path !== "/cxo" && location.pathname.startsWith(item.path + "/"));
              return (
                <button key={item.path} data-testid={item.testId} onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[13px] ${
                    active ? "text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                  style={active ? { backgroundColor: ACCENT + "12", color: ACCENT } : {}}>
                  <Icon size={16} style={active ? { color: ACCENT } : {}} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="px-3 py-1.5 mb-2">
          <p className="font-display text-[10px] font-black tracking-wider">
            <span style={{ color: ACCENT }}>AGE</span><span className="text-white">REBOOT</span>
          </p>
          <p className="font-mono text-[7px] text-slate-600 tracking-[0.15em]">EXECUTIVE COMMAND CENTRE v1.0</p>
        </div>
        <button data-testid="cxo-logout-btn" onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all text-[13px]">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
