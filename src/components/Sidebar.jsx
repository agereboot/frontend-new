import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard, HeartPulse, FlaskConical, Salad, Map, Trophy, MessageCircle,
  Award, Stethoscope, Settings, User, LogOut, Brain, Camera, Video, MessageSquare,
  TestTube2, FileBarChart, Target, MapPin
} from "lucide-react";

const EMPLOYEE_NAV = [
  { section: "OVERVIEW", items: [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  ]},
  { section: "HEALTH", items: [
    { to: "/health-overview", icon: HeartPulse, label: "Health Overview" },
    { to: "/biomarkers", icon: FlaskConical, label: "Biomarkers & Reports" },
    { to: "/lab-reports", icon: FileBarChart, label: "Lab Reports" },
    { to: "/mind", icon: Brain, label: "Mind & Cognition" },
    { to: "/nutrition", icon: Salad, label: "My Nutrition" },
    { to: "/snapshots", icon: Camera, label: "Health Snapshots" },
  ]},
  { section: "CARE SERVICES", items: [
    { to: "/care-team", icon: Stethoscope, label: "My Care Team" },
    { to: "/chat", icon: MessageSquare, label: "Chat with Doctor" },
    { to: "/video-consultation", icon: Video, label: "Video Consultation" },
    { to: "/book-lab-test", icon: TestTube2, label: "Book Lab Test" },
    { to: "/longevity-protocol", icon: Target, label: "Longevity Protocol" },
  ]},
  { section: "PERFORMANCE", items: [
    { to: "/roadmap", icon: Map, label: "Longevity Roadmap" },
    { to: "/challenges", icon: Trophy, label: "Challenges" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  ]},
  { section: "COMMUNITY", items: [
    { to: "/feed", icon: MessageCircle, label: "Social Feed" },
    { to: "/rewards", icon: Award, label: "Rewards & Badges" },
  ]},
  { section: "ACCOUNT", items: [
    { to: "/location-setup", icon: MapPin, label: "My Address" },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/profile", icon: User, label: "Profile & Credits" },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };
console.log(user)
  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-space-light/50 border-r border-white/5 flex flex-col z-50 overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-white/5 shrink-0">
        <h1 className="font-display text-xl font-black tracking-tight">
          <span className="text-cosmic">AGE</span><span className="text-stellar">REBOOT</span>
        </h1>
        <p className="font-mono text-[9px] tracking-[0.12em] text-stellar-dim mt-0.5 uppercase">HPS Engine v3.2</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2.5 overflow-y-auto">
        {EMPLOYEE_NAV.map(({ section, items }) => (
          <div key={section} className="mb-2">
            <p className="font-mono text-[8px] tracking-[0.2em] text-stellar-dim/50 uppercase px-3 py-1.5">{section}</p>
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === "/"}
                data-testid={`nav-${label.toLowerCase().replace(/[\s&]+/g, "-")}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-body transition-all duration-200 ${
                    isActive
                      ? "bg-cosmic/15 text-cosmic border border-cosmic/20 shadow-[0_0_8px_-3px_rgba(123,53,216,0.3)]"
                      : "text-stellar-dim hover:text-stellar hover:bg-white/5 border border-transparent"
                  }`
                }>
                <Icon size={15} />
                <span className="font-medium truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-cosmic/20 border border-cosmic/30 flex items-center justify-center font-display font-bold text-cosmic text-xs">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-stellar text-xs font-body font-medium truncate">{user?.name || "Athlete"}</p>
            <p className="text-stellar-dim font-mono text-[8px] truncate uppercase tracking-wider">{user?.franchise || "Independent"}</p>
          </div>
          {/* <NotificationBell /> */}
          <button data-testid="logout-btn" onClick={handleLogout} className="p-1.5 text-stellar-dim hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
