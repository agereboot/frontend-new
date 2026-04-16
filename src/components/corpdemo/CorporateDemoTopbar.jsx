import { Bell, Search, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ROLE_COLORS = {
  hr_admin_demo: "#7B35D8",
  hr_executive_demo: "#F59E0B",
};

const ROLE_LABELS = {
  hr_admin_demo: "HR Admin",
  hr_executive_demo: "HR Executive",
};

export default function CorporateDemoTopbar() {
  const { user } = useAuth();
  const color = ROLE_COLORS[user?.role] || "#7B35D8";
  const label = ROLE_LABELS[user?.role] || "Corporate Demo";

  return (
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-between gap-4 rounded-[24px] border border-white/6 bg-[#080518]/85 px-5 py-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-4">
        <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border md:flex" style={{ borderColor: `${color}35`, background: `${color}14` }}>
          <UserCircle2 size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">Unified HR Experience</p>
          <p className="truncate text-sm text-slate-300">Theme, typography, sidebar, and header aligned with the AgeReboot platform.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 md:flex">
          <Search size={14} className="text-slate-500" />
          <input className="w-52 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search UI sections" />
        </div>
        <button className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-slate-300 transition hover:bg-white/[0.05]">
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ background: color }} />
        </button>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-right">
          <p className="text-sm font-semibold text-white">{user?.name || "Demo User"}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${color}CC` }}>{label}</p>
        </div>
      </div>
    </div>
  );
}
