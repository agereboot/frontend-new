import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { X, AlertTriangle, Info, Wrench, Sparkles, AlertCircle, ExternalLink } from "lucide-react";

const TYPE_CONFIG = {
  info: { icon: Info, bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-300", accent: "text-blue-400" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-300", accent: "text-amber-400" },
  maintenance: { icon: Wrench, bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-300", accent: "text-purple-400" },
  feature: { icon: Sparkles, bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300", accent: "text-emerald-400" },
  critical: { icon: AlertCircle, bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-300", accent: "text-red-400" },
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    const role = user.role || "employee";
    api.get(`/admin/announcements/active?role=${role}`)
      .then(r => setAnnouncements(r.data.announcements || []))
      .catch(() => {});
  }, [user]);

  const handleDismiss = async (annId) => {
    setDismissed(prev => new Set([...prev, annId]));
    try { await api.post(`/admin/announcements/${annId}/dismiss?user_id=${user?.id}`); } catch {}
  };

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4" data-testid="announcement-banner-container">
      {visible.map(a => {
        const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div key={a.id} className={`${cfg.bg} ${cfg.border} border rounded-xl px-4 py-3 flex items-start gap-3`} data-testid={`announcement-banner-${a.id}`}>
            <Icon size={18} className={`${cfg.accent} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${cfg.text}`}>{a.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a.message}</p>
              {a.action_url && (
                <a href={a.action_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-xs ${cfg.accent} hover:underline mt-1`}>
                  {a.action_label || "Learn more"} <ExternalLink size={10} />
                </a>
              )}
            </div>
            {a.is_dismissible && (
              <button onClick={() => handleDismiss(a.id)} className="text-slate-500 hover:text-white p-0.5" data-testid={`dismiss-announcement-${a.id}`}>
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
