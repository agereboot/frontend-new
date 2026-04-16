import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Building2, Activity,
  HeartPulse, DollarSign, ScrollText, LifeBuoy,
  LogOut, Shield, BarChart3, Megaphone, FileText,
  Server, UserCog, Wallet, Target, Calendar,
  Laptop, Headphones, Brain, FlaskConical,
} from "lucide-react";

const NAV_ADMIN = [
  { heading: null, items: [
    { path: "/admin", icon: LayoutDashboard, label: "Platform Overview", testId: "admin-nav-overview" },
    { path: "/admin/executive-brief", icon: Brain, label: "AI Executive Brief", testId: "admin-nav-exec-brief" },
  ]},
  { heading: "Management", items: [
    { path: "/admin/users", icon: Users, label: "Users & Roles", testId: "admin-nav-users" },
    { path: "/admin/corporates", icon: Building2, label: "Corporate Clients", testId: "admin-nav-corporates" },
    { path: "/admin/announcements", icon: Megaphone, label: "Announcements", testId: "admin-nav-announcements" },
    { path: "/admin/content", icon: FileText, label: "Content", testId: "admin-nav-content" },
  ]},
  { heading: "Monitoring", items: [
    { path: "/admin/hps-engine", icon: HeartPulse, label: "HPS Engine", testId: "admin-nav-hps" },
    { path: "/admin/protocol-effectiveness", icon: FlaskConical, label: "Protocol Effectiveness", testId: "admin-nav-protocol-eff" },
    { path: "/admin/financial", icon: DollarSign, label: "Financial", testId: "admin-nav-financial" },
    { path: "/admin/system-health", icon: Server, label: "System Health", testId: "admin-nav-system" },
  ]},
  { heading: "Operations", items: [
    { path: "/admin/support", icon: LifeBuoy, label: "Support Tickets", testId: "admin-nav-support" },
    { path: "/admin/support/analytics", icon: BarChart3, label: "Support Analytics", testId: "admin-nav-support-analytics" },
    { path: "/admin/audit-logs", icon: ScrollText, label: "Audit Logs", testId: "admin-nav-audit" },
  ]},
  { heading: "HRMS", items: [
    { path: "/admin/hrms/employees", icon: UserCog, label: "Employees", testId: "admin-nav-hrms-employees" },
    { path: "/admin/hrms/payroll", icon: Wallet, label: "Payroll", testId: "admin-nav-hrms-payroll" },
    { path: "/admin/hrms/performance", icon: Target, label: "Performance", testId: "admin-nav-hrms-performance" },
    { path: "/admin/hrms/leaves", icon: Calendar, label: "Leave Mgmt", testId: "admin-nav-hrms-leaves" },
    { path: "/admin/hrms/assets", icon: Laptop, label: "Assets", testId: "admin-nav-hrms-assets" },
    { path: "/admin/hrms/helpdesk", icon: Headphones, label: "Helpdesk", testId: "admin-nav-hrms-helpdesk" },
  ]},
];

const ACCENT = "#7B35D8";

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#050217]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col" data-testid="admin-sidebar">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ACCENT + "15", border: `1px solid ${ACCENT}30` }}>
            <Shield size={18} style={{ color: ACCENT }} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white truncate">{user?.name || "Admin"}</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.15em]" style={{ color: ACCENT + "BB" }}>
              {user?.role === "super_admin" ? "Super Admin" : "Support Agent"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {NAV_ADMIN.map((section, si) => (
          <div key={si}>
            {section.heading && (
              <p className="font-mono text-[7px] text-slate-600 uppercase tracking-[0.2em] px-3 pt-3 pb-1">{section.heading}</p>
            )}
            {section.items.map(item => {
              const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path + "/"));
              const Icon = item.icon;
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  data-testid={item.testId}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                    active ? "bg-[#7B35D8]/15 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                  }`}>
                  <Icon size={15} style={active ? { color: ACCENT } : undefined} />
                  <span className="text-[12px] font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button onClick={() => { logout(); navigate("/login"); }}
          data-testid="admin-logout-btn"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-[12px]">
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
