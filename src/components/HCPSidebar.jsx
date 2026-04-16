import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Bell, BookOpen,
  ShieldCheck, LogOut, Stethoscope, Dumbbell,
  BarChart3, FlaskConical, Brain, Activity,
  Apple, Workflow, Truck, Globe,
  Calendar, ClipboardList, ClipboardCheck,
  Shield, HeartPulse, MessageSquare,
  FileText, Salad, Zap, Target,
  Pill, AlertTriangle, Sparkles, TrendingUp,
  Trophy, CheckSquare, UserCheck, FolderOpen,
  Settings, Gauge, Building2, Clipboard,
  Scale, UtensilsCrossed, Leaf, ArrowUpRight,
  Send, Network, CreditCard, Sliders,
  Database, Map,
} from "lucide-react";

const ROLE_CONFIG = {
  longevity_physician: { label: "Longevity Physician", icon: Stethoscope, color: "#7B35D8" },
  fitness_coach: { label: "Physical Fitness Coach", icon: Dumbbell, color: "#10B981" },
  psychologist: { label: "Psychology Therapist", icon: Brain, color: "#6366F1" },
  nutritional_coach: { label: "Nutritionist", icon: Apple, color: "#0F9F8F" },
  clinician: { label: "Longevity Physician", icon: Stethoscope, color: "#7B35D8" },
  coach: { label: "Physical Fitness Coach", icon: Dumbbell, color: "#10B981" },
  medical_director: { label: "Medical Director", icon: Stethoscope, color: "#7B35D8" },
  clinical_admin: { label: "Clinical Admin", icon: ShieldCheck, color: "#64748B" },
  corporate_hr_admin: { label: "Corporate HR Admin", icon: Building2, color: "#D97706" },
  corporate_wellness_head: { label: "Wellness Head", icon: HeartPulse, color: "#0F9F8F" },
};

/* ─── PHYSICIAN ─── */
const NAV_PHYSICIAN = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Dashboard", testId: "hcp-nav-dashboard" },
    { path: "/hcp/members", icon: Users, label: "Members", testId: "hcp-nav-members" },
    { path: "/hcp/alerts", icon: Bell, label: "Alerts", testId: "hcp-nav-alerts" },
  ]},
  { heading: "Clinical", items: [
    { path: "/hcp/appointments", icon: Calendar, label: "Appointments", testId: "hcp-nav-appointments" },
    { path: "/hcp/lab-orders", icon: FlaskConical, label: "Lab Orders", testId: "hcp-nav-labs" },
    // { path: "/hcp/pharmacy", icon: Truck, label: "Pharmacy Orders", testId: "hcp-nav-pharmacy" },
    { path: "/hcp/protocols", icon: BookOpen, label: "Protocols", testId: "hcp-nav-protocols" },
    { path: "/hcp/nfle", icon: Workflow, label: "Care Tasks", testId: "hcp-nav-nfle" },
    // { path: "/hcp/escalations", icon: ArrowUpRight, label: "Escalations", testId: "hcp-nav-escalations" },
    { path: "/hcp/secure-messaging", icon: MessageSquare, label: "Messages", testId: "hcp-nav-messages" },
  ]},
  { heading: "Analytics", items: [
    { path: "/hcp/population", icon: BarChart3, label: "Population", testId: "hcp-nav-population" },
    // { path: "/hcp/wearable-dashboard", icon: HeartPulse, label: "Wearables", testId: "hcp-nav-wearables" },
    { path: "/hcp/roadmap-review", icon: Map, label: "Roadmap Validation", testId: "hcp-nav-roadmap-review" },
    // { path: "/hcp/fhir", icon: Globe, label: "FHIR R4 EMR", testId: "hcp-nav-fhir" },
    // { path: "/hcp/override", icon: ShieldCheck, label: "Override", testId: "hcp-nav-override" },
  ]},
];

/* ─── PFC: Physical Fitness Coach (Audit Section 6) ─── */
const NAV_PFC = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Dashboard", testId: "hcp-nav-dashboard" },
    { path: "/hcp/members", icon: Users, label: "My Members", testId: "hcp-nav-members" },
    { path: "/hcp/nfle", icon: Zap, label: "Task Queue", testId: "hcp-nav-tasks" },
  ]},
  { heading: "Coaching Workflows", items: [
    { path: "/hcp/programmes", icon: Target, label: "Programmes", testId: "hcp-nav-programmes" },
    { path: "/hcp/challenges", icon: Trophy, label: "Challenges", testId: "hcp-nav-challenges" },
    { path: "/hcp/check-ins", icon: CheckSquare, label: "Check-Ins", testId: "hcp-nav-checkins" },
    { path: "/hcp/habits", icon: Activity, label: "Habits", testId: "hcp-nav-habits" },
    { path: "/hcp/goals", icon: TrendingUp, label: "Goals", testId: "hcp-nav-goals" },
  ]},
  { heading: "Engagement", items: [
    { path: "/hcp/appointments", icon: Calendar, label: "Appointments", testId: "hcp-nav-appointments" },
    { path: "/hcp/session-log", icon: FileText, label: "Session Logger", testId: "hcp-nav-session-log" },
    { path: "/hcp/secure-messaging", icon: MessageSquare, label: "Messages", testId: "hcp-nav-messaging" },
    { path: "/hcp/escalations", icon: ArrowUpRight, label: "Escalate", testId: "hcp-nav-escalations" },
    { path: "/hcp/resources", icon: FolderOpen, label: "Resources", testId: "hcp-nav-resources" },
  ]},
  { heading: "Insights", items: [
    { path: "/hcp/wearable-feed", icon: HeartPulse, label: "Wearable Feed", testId: "hcp-nav-wearable" },
    { path: "/hcp/coach-insights", icon: BarChart3, label: "Coach Insights", testId: "hcp-nav-insights" },
    { path: "/hcp/corporate", icon: Building2, label: "Corporate View", testId: "hcp-nav-corporate" },
    { path: "/hcp/roadmap-review", icon: Map, label: "Roadmap Validation", testId: "hcp-nav-roadmap-review" },
    { path: "/hcp/review", icon: ClipboardCheck, label: "Review & Approve", testId: "hcp-nav-review" },
  ]},
  { heading: "Settings", items: [
    { path: "/hcp/coach-profile", icon: Settings, label: "Profile & Settings", testId: "hcp-nav-profile" },
    { path: "/hcp/protocols", icon: BookOpen, label: "Protocols", testId: "hcp-nav-protocols" },
  ]},
];

/* ─── PSY: Psychology Therapist (Audit Section 7) ─── */
const NAV_PSY = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Dashboard", testId: "hcp-nav-dashboard" },
    { path: "/hcp/members", icon: Users, label: "Patients", testId: "hcp-nav-members" },
    { path: "/hcp/nfle", icon: Zap, label: "Task Queue", testId: "hcp-nav-tasks" },
  ]},
  { heading: "Clinical Tools", items: [
    { path: "/hcp/assessments", icon: ClipboardList, label: "Assessments", testId: "hcp-nav-assessments" },
    { path: "/hcp/cbt-modules", icon: Brain, label: "CBT Modules", testId: "hcp-nav-cbt" },
    { path: "/hcp/appointments", icon: Calendar, label: "Sessions", testId: "hcp-nav-appointments" },
    { path: "/hcp/session-notes", icon: FileText, label: "Session Notes", testId: "hcp-nav-notes" },
    { path: "/hcp/therapy-programs", icon: Clipboard, label: "Therapy Programs", testId: "hcp-nav-therapy" },
    { path: "/hcp/crisis", icon: AlertTriangle, label: "Crisis Alerts", testId: "hcp-nav-crisis" },
  ]},
  { heading: "Care Management", items: [
    { path: "/hcp/check-ins", icon: CheckSquare, label: "Check-Ins", testId: "hcp-nav-checkins" },
    { path: "/hcp/goals", icon: TrendingUp, label: "Goals", testId: "hcp-nav-goals" },
    { path: "/hcp/roadmap-review", icon: Map, label: "Roadmap Validation", testId: "hcp-nav-roadmap-review" },
    { path: "/hcp/review", icon: ClipboardCheck, label: "Review & Approve", testId: "hcp-nav-review" },
    { path: "/hcp/secure-messaging", icon: MessageSquare, label: "Messages", testId: "hcp-nav-messaging" },
    { path: "/hcp/escalations", icon: ArrowUpRight, label: "Escalate", testId: "hcp-nav-escalations" },
    { path: "/hcp/resources", icon: FolderOpen, label: "Resources", testId: "hcp-nav-resources" },
  ]},
  { heading: "Insights", items: [
    { path: "/hcp/mental-outcomes", icon: BarChart3, label: "Mental Health Outcomes", testId: "hcp-nav-outcomes" },
    { path: "/hcp/corporate", icon: Building2, label: "Corporate Wellness", testId: "hcp-nav-corporate" },
  ]},
  { heading: "Settings", items: [
    { path: "/hcp/coach-profile", icon: Settings, label: "Profile & Settings", testId: "hcp-nav-profile" },
    { path: "/hcp/protocols", icon: BookOpen, label: "Protocols", testId: "hcp-nav-protocols" },
  ]},
];

/* ─── NUT: Nutritional Coach / Dietitian (Audit Section 7) ─── */
const NAV_NUT = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Dashboard", testId: "hcp-nav-dashboard" },
    { path: "/hcp/members", icon: Users, label: "Clients", testId: "hcp-nav-members" },
    { path: "/hcp/nfle", icon: Zap, label: "Task Queue", testId: "hcp-nav-tasks" },
  ]},
  { heading: "Nutrition Tools", items: [
    { path: "/hcp/meal-plans", icon: Salad, label: "Meal Plans", testId: "hcp-nav-meals" },
    { path: "/hcp/food-diary", icon: UtensilsCrossed, label: "Food Diary", testId: "hcp-nav-food-diary" },
    { path: "/hcp/supplements", icon: Pill, label: "Supplements", testId: "hcp-nav-supplements" },
    { path: "/hcp/body-comp", icon: Scale, label: "Body Composition", testId: "hcp-nav-bodycomp" },
  ]},
  { heading: "Care Management", items: [
    { path: "/hcp/appointments", icon: Calendar, label: "Consultations", testId: "hcp-nav-appointments" },
    { path: "/hcp/consult-notes", icon: FileText, label: "Consult Notes", testId: "hcp-nav-consultnotes" },
    { path: "/hcp/goals", icon: TrendingUp, label: "Goals", testId: "hcp-nav-goals" },
    { path: "/hcp/roadmap-review", icon: Map, label: "Roadmap Validation", testId: "hcp-nav-roadmap-review" },
    { path: "/hcp/review", icon: ClipboardCheck, label: "Review & Approve", testId: "hcp-nav-review" },
    { path: "/hcp/secure-messaging", icon: MessageSquare, label: "Messages", testId: "hcp-nav-messaging" },
    { path: "/hcp/escalations", icon: ArrowUpRight, label: "Escalate", testId: "hcp-nav-escalations" },
    { path: "/hcp/resources", icon: FolderOpen, label: "Resources", testId: "hcp-nav-resources" },
  ]},
  { heading: "Insights", items: [
    { path: "/hcp/nutrition-analytics", icon: BarChart3, label: "Nutrition Analytics", testId: "hcp-nav-nutanalytics" },
    { path: "/hcp/corporate", icon: Building2, label: "Corporate Nutrition", testId: "hcp-nav-corporate" },
  ]},
  { heading: "Settings", items: [
    { path: "/hcp/coach-profile", icon: Settings, label: "Profile & Settings", testId: "hcp-nav-profile" },
    { path: "/hcp/protocols", icon: BookOpen, label: "Protocols", testId: "hcp-nav-protocols" },
  ]},
];

/* ─── CHA: Corporate HR Admin (Streamlined — no clinical features) ─── */
const NAV_CHA = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Command Centre", testId: "corp-nav-dashboard" },
    { path: "/hcp/corp-employees", icon: Users, label: "Employees", testId: "corp-nav-employees" },
    { path: "/hcp/corp-outliers", icon: AlertTriangle, label: "Outlier Detection", testId: "corp-nav-outliers" },
  ]},
  { heading: "Monitoring", items: [
    { path: "/hcp/corp-engagement", icon: Activity, label: "Engagement Monitor", testId: "corp-nav-engagement" },
    { path: "/hcp/corp-burnout", icon: Zap, label: "Burnout Risk Index", testId: "corp-nav-burnout" },
    { path: "/hcp/corp-departments", icon: Building2, label: "Department Analytics", testId: "corp-nav-departments" },
    { path: "/hcp/corp-manager", icon: Sliders, label: "Manager Dashboard", testId: "corp-nav-manager" },
  ]},
  { heading: "Operations", items: [
    { path: "/hcp/corp-programmes", icon: Target, label: "Wellness Programmes", testId: "corp-nav-programmes" },
    { path: "/hcp/corp-nudge", icon: Send, label: "Nudge Engine", testId: "corp-nav-nudge" },
    { path: "/hcp/corp-franchise", icon: Trophy, label: "Franchise & League", testId: "corp-nav-franchise" },
    { path: "/hcp/corp-profitshare", icon: TrendingUp, label: "Profit-Share", testId: "corp-nav-profitshare" },
    { path: "/hcp/corp-hr-escalations", icon: Shield, label: "HR Escalations", testId: "corp-nav-hr-esc" },
    { path: "/hcp/corp-care-escalation", icon: ArrowUpRight, label: "Escalate to Care Team", testId: "corp-nav-care-esc" },
  ]},
  { heading: "Intelligence", items: [
    { path: "/hcp/corp-analytics", icon: BarChart3, label: "Analytics & ROI", testId: "corp-nav-analytics" },
    { path: "/hcp/corp-organogram", icon: Network, label: "Organogram", testId: "corp-nav-organogram" },
  ]},
];

/* ─── CWH: Corporate Wellness Head (Non-clinical — escalates to care team) ─── */
const NAV_CWH = [
  { heading: null, items: [
    { path: "/hcp", icon: LayoutDashboard, label: "Command Centre", testId: "corp-nav-dashboard" },
    { path: "/hcp/corp-employees", icon: Users, label: "Employees", testId: "corp-nav-employees" },
    { path: "/hcp/corp-data-quality", icon: Database, label: "Data Quality", testId: "corp-nav-data-quality" },
  ]},
  { heading: "Monitoring", items: [
    { path: "/hcp/corp-engagement", icon: Activity, label: "Engagement Monitor", testId: "corp-nav-engagement" },
    { path: "/hcp/corp-burnout", icon: Zap, label: "Burnout Risk Index", testId: "corp-nav-burnout" },
    { path: "/hcp/corp-departments", icon: Building2, label: "Department Analytics", testId: "corp-nav-departments" },
    { path: "/hcp/corp-outliers", icon: AlertTriangle, label: "Outlier Detection", testId: "corp-nav-outliers" },
  ]},
  { heading: "Programme Management", items: [
    { path: "/hcp/corp-programmes", icon: Target, label: "Wellness Programmes", testId: "corp-nav-programmes" },
    { path: "/hcp/corp-nudge", icon: Send, label: "Nudge Engine", testId: "corp-nav-nudge" },
    { path: "/hcp/corp-franchise", icon: Trophy, label: "Franchise & League", testId: "corp-nav-franchise" },
    { path: "/hcp/corp-profitshare", icon: TrendingUp, label: "Profit-Share", testId: "corp-nav-profitshare" },
  ]},
  { heading: "Escalation & Intelligence", items: [
    { path: "/hcp/corp-care-escalation", icon: ArrowUpRight, label: "Escalate to Care Team", testId: "corp-nav-care-esc" },
    { path: "/hcp/corp-analytics", icon: BarChart3, label: "Analytics & ROI", testId: "corp-nav-analytics" },
    { path: "/hcp/corp-ai-hub", icon: Brain, label: "AI Intelligence Hub", testId: "corp-nav-ai-hub" },
  ]},
];

function getNavForRole(role) {
  switch (role) {
    case "corporate_hr_admin": return NAV_CHA;
    case "corporate_wellness_head": return NAV_CWH;
    case "psychologist": return NAV_PSY;
    case "nutritional_coach": return NAV_NUT;
    case "fitness_coach":
    case "coach": return NAV_PFC;
    default: return NAV_PHYSICIAN;
  }
}

export function HCPSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || "longevity_physician";
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.longevity_physician;
  const RoleIcon = rc.icon;
  const sections = getNavForRole(role);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#050217]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col" data-testid="hcp-sidebar">
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
        {sections.map((section, si) => (
          <div key={si}>
            {section.heading && (
              <p className="font-mono text-[7px] text-slate-600 uppercase tracking-[0.2em] px-3 pt-3 pb-1">{section.heading}</p>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path || (item.path !== "/hcp" && location.pathname.startsWith(item.path + "/"));
              return (
                <button key={item.path} data-testid={item.testId} onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[13px] ${
                    active ? "text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                  style={active ? { backgroundColor: rc.color + "12", color: rc.color } : {}}>
                  <Icon size={16} style={active ? { color: rc.color } : {}} />
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
            <span style={{ color: rc.color }}>AGE</span><span className="text-white">REBOOT</span>
          </p>
          <p className="font-mono text-[7px] text-slate-600 tracking-[0.15em]">COACH INTELLIGENCE v2.0</p>
        </div>
        <button data-testid="hcp-logout-btn" onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all text-[13px]">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
