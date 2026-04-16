import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  Coins, Bell, ShoppingCart, Settings, Globe, FileText, HelpCircle, LogOut,
  ChevronDown, User, CreditCard
} from "lucide-react";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    api.get("/credits").then(r => setCredits(r.data)).catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const menuItems = [
    { label: "Settings", icon: Settings, action: () => navigate("/settings") },
    { label: "Language", icon: Globe, action: () => {} , sub: "English" },
    { label: "Subscription", icon: CreditCard, action: () => navigate("/profile"), sub: (user?.plan || "rookie_league").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
    { label: "Help Center", icon: HelpCircle, action: () => {} },
    { divider: true },
    { label: "Log Out", icon: LogOut, action: handleLogout, danger: true },
  ];

  const notifications = [
    { id: 1, text: "Your HPS score improved by +12 pts this week", time: "2h", read: false },
    { id: 2, text: "Dr. Sharma reviewed your latest biomarkers", time: "5h", read: false },
    { id: 3, text: "New challenge available: 7-Day Hydration Sprint", time: "1d", read: true },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  const hasPhoto = user?.profile_photo;

  return (
    <div className="flex items-center gap-3 mb-6 justify-end" data-testid="topbar">
      {/* Credits */}
      <button
        data-testid="topbar-credits"
        onClick={() => navigate("/profile")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:border-amber-500/20 transition-all group"
      >
        <Coins size={14} className="text-amber-400" />
        <span className="font-mono text-xs font-bold text-amber-400">{credits?.available ?? "—"}</span>
        <span className="font-mono text-[9px] text-stellar-dim group-hover:text-stellar transition-colors">credits</span>
      </button>

      {/* Buy Credits */}
      <button
        data-testid="topbar-buy-credits"
        onClick={() => navigate("/profile")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cosmic/10 border border-cosmic/20 hover:bg-cosmic/20 transition-all text-cosmic text-xs font-display uppercase tracking-wider"
      >
        <ShoppingCart size={12} /> Buy
      </button>

      {/* Notifications */}
      {/* <div className="relative" ref={notifRef}>
        <button
          data-testid="topbar-notifications"
          onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
          className="relative p-2 rounded-full bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
        >
          <Bell size={16} className="text-stellar-dim" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-mono font-bold flex items-center justify-center border border-space">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-[#0D0821]/98 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="font-display text-xs font-bold text-stellar uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && <span className="text-[9px] font-mono text-cosmic">{unreadCount} new</span>}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.read ? "bg-cosmic/[0.03]" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-cosmic mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-body text-stellar leading-relaxed">{n.text}</p>
                      <span className="text-[9px] font-mono text-stellar-dim">{n.time} ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div> */}

      {/* Profile Avatar + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          data-testid="topbar-profile"
          onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
        >
          {hasPhoto ? (
            <img src={`${api.defaults.baseURL}/profile/photo/${user.id}`} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cosmic to-violet-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-[11px]">{user?.name?.[0] || "A"}</span>
            </div>
          )}
          <ChevronDown size={12} className={`text-stellar-dim transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#0D0821]/98 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
            {/* User header */}
            <div className="px-4 py-3 border-b border-white/5">
              <p className="font-body text-sm font-semibold text-stellar truncate">{user?.name}</p>
              <p className="font-mono text-[9px] text-stellar-dim truncate">{user?.email}</p>
            </div>
            {menuItems.map((item, i) => 
              item.divider ? (
                <div key={i} className="border-t border-white/5 my-1" />
              ) : (
                <button
                  key={i}
                  data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => { item.action(); setDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[12px] font-body transition-colors ${
                    item.danger ? "text-red-400 hover:bg-red-500/5" : "text-stellar-dim hover:text-stellar hover:bg-white/[0.03]"
                  }`}
                >
                  <item.icon size={14} />
                  <span className="flex-1">{item.label}</span>
                  {item.sub && <span className="text-[9px] font-mono text-stellar-dim/50">{item.sub}</span>}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
