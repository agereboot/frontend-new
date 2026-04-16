import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Building2, LayoutDashboard, Users, CreditCard, Activity, ShieldAlert,
  LineChart, TrendingUp, LogOut, Sparkles,
} from "lucide-react";

const ROLE_CONFIG = {
  hr_admin_demo: {
    label: "HR Admin",
    color: "#7B35D8",
    subtitle: "People Operations Demo",
    items: [
      { path: "/corp-demo/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/corp-demo/employees", label: "Employees", icon: Users },
      { path: "/corp-demo/licenses", label: "Licenses & Plans", icon: CreditCard },
      { path: "/corp-demo/engagement", label: "Engagement", icon: Activity },
    ],
  },
  hr_executive_demo: {
    label: "HR Executive",
    color: "#F59E0B",
    subtitle: "Executive Wellness Demo",
    items: [
      { path: "/corp-demo/executive", label: "Dashboard", icon: LayoutDashboard },
      { path: "/corp-demo/risk", label: "Health Risk", icon: ShieldAlert },
      { path: "/corp-demo/participation", label: "Participation & Trends", icon: LineChart },
      { path: "/corp-demo/roi", label: "ROI & Benchmarking", icon: TrendingUp },
    ],
  },
};

export default function CorporateDemoSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.hr_admin_demo;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-[260px] border-r border-white/6 bg-[#060312]/95 backdrop-blur-xl">
      <div className="border-b border-white/6 p-5">
        <button onClick={() => navigate(cfg.items[0].path)} className="flex w-full items-center gap-3 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}15` }}>
            <Building2 size={20} style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="font-display text-lg font-black"><span style={{ color: cfg.color }}>AGE</span><span className="text-white">REBOOT</span></p>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">Corporate Portal</p>
          </div>
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${cfg.color}18` }}>
              <Sparkles size={16} style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name || "Demo User"}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${cfg.color}CC` }}>{cfg.label}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{cfg.subtitle}</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-2">
        {cfg.items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? "text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
              style={active ? { background: `${cfg.color}14`, border: `1px solid ${cfg.color}30`, color: cfg.color } : undefined}
            >
              <Icon size={18} style={active ? { color: cfg.color } : undefined} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/6 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
