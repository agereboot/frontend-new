import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Bell, BookOpen,
  ShieldCheck, LogOut, Stethoscope, Dumbbell,
  BarChart3, FlaskConical,
  Brain, Activity, Apple, HeartPulse, Workflow,
  Truck, Globe, Calendar,
} from "lucide-react";

const ROLE_CONFIG = {
  longevity_physician: { label: "Longevity Physician", icon: Stethoscope, color: "#7B35D8" },
  fitness_coach: { label: "Fitness Coach", icon: Dumbbell, color: "#10B981" },
  psychologist: { label: "Psychologist", icon: Brain, color: "#6366F1" },
  physical_therapist: { label: "Physical Therapist", icon: Activity, color: "#D97706" },
  nutritional_coach: { label: "Nutritional Coach", icon: Apple, color: "#0F9F8F" },
  nurse_navigator: { label: "Nurse Navigator", icon: HeartPulse, color: "#EF4444" },
  clinician: { label: "Longevity Physician", icon: Stethoscope, color: "#7B35D8" },
  coach: { label: "Fitness Coach", icon: Dumbbell, color: "#10B981" },
};

const PRESCRIBING_ROLES = new Set(["longevity_physician", "clinician", "medical_director"]);

const NAV_SECTIONS = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Dashboard", testId: "hcp-nav-dashboard", roles: "all" },
    { path: "/hcp/members", icon: Users, label: "Members", testId: "hcp-nav-members", roles: "all" },
    { path: "/hcp/alerts", icon: Bell, label: "Alerts", testId: "hcp-nav-alerts", roles: "all" },
  ]},
  { heading: "Clinical", items: [
    { path: "/hcp/appointments", icon: Calendar, label: "Appointments", testId: "hcp-nav-appointments", roles: "all" },
    { path: "/hcp/lab-orders", icon: FlaskConical, label: "Lab Orders", testId: "hcp-nav-labs", roles: "all" },
    { path: "/hcp/pharmacy", icon: Truck, label: "Pharmacy Orders", testId: "hcp-nav-pharmacy", roles: "all" },
    { path: "/hcp/protocols", icon: BookOpen, label: "Protocols", testId: "hcp-nav-protocols", roles: "all" },
    { path: "/hcp/nfle", icon: Workflow, label: "NFLE Tasks", testId: "hcp-nav-nfle", roles: "all" },
  ]},
  { heading: "Analytics", items: [
    { path: "/hcp/population", icon: BarChart3, label: "Population", testId: "hcp-nav-population", roles: "all" },
    { path: "/hcp/fhir", icon: Globe, label: "FHIR R4 EMR", testId: "hcp-nav-fhir", roles: "prescribers" },
    { path: "/hcp/override", icon: ShieldCheck, label: "Override", testId: "hcp-nav-override", roles: "prescribers" },
  ]},
];

export function CCSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || "longevity_physician";
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.longevity_physician;
  const RoleIcon = rc.icon;
  const isPrescriber = PRESCRIBING_ROLES.has(role);

  const isVisible = (item) => {
    if (item.roles === "all") return true;
    if (item.roles === "prescribers") return isPrescriber;
    return true;
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#050217]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col" data-testid="cc-sidebar">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: rc.color + "15", border: `1px solid ${rc.color}30` }}>
            <RoleIcon size={18} style={{ color: rc.color }} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white truncate">{user?.name || "HCP"}</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.15em]" style={{ color: rc.color + "BB" }}>{rc.label}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter(isVisible);
          if (visibleItems.length === 0) return null;
          return (
            <div key={si}>
              {section.heading && (
                <p className="font-mono text-[7px] text-slate-600 uppercase tracking-[0.2em] px-3 pt-3 pb-1">{section.heading}</p>
              )}
              {visibleItems.map(({ path, icon: Icon, label, testId }) => {
                const isActive = location.pathname === path || (path !== "/hcp" && location.pathname.startsWith(path));
                return (
                  <button key={path} data-testid={testId} onClick={() => navigate(path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-[#7B35D8]/12 border border-[#7B35D8]/30 text-white shadow-[0_0_12px_rgba(123,53,216,0.08)]"
                        : "border border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                    }`}>
                    <Icon size={15} className={`shrink-0 transition-colors ${isActive ? "text-[#7B35D8]" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span className="font-body text-[12px] font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-2.5 border-t border-white/5">
        <button data-testid="cc-logout" onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={15} />
          <span className="font-body text-xs">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
