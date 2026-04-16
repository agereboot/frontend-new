import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { Bell, Check, CheckCheck, X, Megaphone, FlaskConical, AlertTriangle, Info } from "lucide-react";

const CATEGORY_CONFIG = {
  nudge: { icon: Megaphone, color: "#D97706", label: "Wellness" },
  lab: { icon: FlaskConical, color: "#10B981", label: "Lab" },
  escalation: { icon: AlertTriangle, color: "#EF4444", label: "Alert" },
  general: { icon: Info, color: "#6366F1", label: "Info" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/count");
      setUnreadCount(data.unread_count || 0);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications?limit=20");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        data-testid="notification-bell"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span data-testid="notification-badge" className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-mono font-bold px-1 animate-in zoom-in duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-panel"
          className="absolute right-0 top-11 w-[360px] bg-[#0D0D12] border border-white/10 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-top-2 duration-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="font-display text-xs font-bold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  data-testid="mark-all-read"
                  onClick={markAllRead}
                  className="font-mono text-[8px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <CheckCheck size={10} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="font-body text-xs text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const cat = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.general;
                const CatIcon = cat.icon;
                return (
                  <div
                    key={n.id}
                    data-testid={`notif-${n.id}`}
                    className={`flex gap-3 px-4 py-3 border-b border-white/[0.03] transition-all cursor-pointer hover:bg-white/[0.02] ${!n.read ? "bg-white/[0.02]" : ""}`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cat.color + "15" }}>
                      <CatIcon size={14} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-body text-[11px] ${!n.read ? "text-white font-medium" : "text-slate-400"}`}>{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      </div>
                      <p className="font-body text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="font-mono text-[7px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="text-slate-600 hover:text-emerald-400 shrink-0 mt-1"
                        title="Mark read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
