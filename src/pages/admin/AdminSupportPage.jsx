import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { LifeBuoy, AlertTriangle, Clock, CheckCircle, ArrowUpRight, MessageSquare, ChevronLeft } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const PRIORITY_COLORS = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};
const STATUS_COLORS = {
  open: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-400",
  waiting_for_user: "bg-purple-500/10 text-purple-400",
  escalated: "bg-red-500/10 text-red-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 30 });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/admin/support/tickets?${params}`);
      setTickets(res.data.tickets || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  if (selected) return <TicketDetail ticketId={selected} onBack={() => { setSelected(null); fetchTickets(); }} />;

  return (
    <div className="space-y-5" data-testid="admin-support-page">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">{total} tickets</p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
          data-testid="support-search"
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none w-64" />
        <AppSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} data-testid="support-status-filter"
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Status</AppSelectOption>
          {Object.keys(STATUS_COLORS).map(s => <AppSelectOption key={s} value={s}>{s.replace(/_/g, " ")}</AppSelectOption>)}
        </AppSelect>
        <AppSelect value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} data-testid="support-priority-filter"
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Priority</AppSelectOption>
          {Object.keys(PRIORITY_COLORS).map(p => <AppSelectOption key={p} value={p}>{p}</AppSelectOption>)}
        </AppSelect>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <LifeBuoy size={32} className="mx-auto mb-2 opacity-30" />
            No tickets found
          </div>
        ) : tickets.map(t => (
          <button key={t.id} onClick={() => setSelected(t.id)} data-testid={`ticket-${t.id}`}
            className="w-full bg-[#11111a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all text-left">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#7B35D8]">{t.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority] || ""}`}>{t.priority}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || ""}`}>{t.status?.replace(/_/g, " ")}</span>
                </div>
                <h3 className="text-sm text-white font-medium truncate">{t.subject}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.user_name} ({t.user_email}) &middot; {t.category?.replace(/_/g, " ")} &middot; {t.created_at?.slice(0, 10)}</p>
              </div>
              <ArrowUpRight size={16} className="text-slate-600 flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TicketDetail({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userCtx, setUserCtx] = useState(null);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get(`/admin/support/tickets/${ticketId}`);
      setTicket(res.data.ticket);
      setMessages(res.data.messages || []);
      setUserCtx(res.data.user_context);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.post(`/admin/support/tickets/${ticketId}/reply`, { message: reply, is_internal_note: isInternal });
      setReply("");
      fetch();
    } catch (e) {
      alert("Failed to send reply");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/admin/support/tickets/${ticketId}/status`, { status: newStatus });
      fetch();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleEscalate = async (level) => {
    try {
      await api.post(`/admin/support/tickets/${ticketId}/escalate`, { level });
      fetch();
    } catch (e) {
      alert("Failed to escalate");
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-4" data-testid="ticket-detail-view">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white" data-testid="ticket-back-btn">
        <ChevronLeft size={16} /> Back to tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-white">{ticket?.subject}</h2>
                <p className="text-xs text-slate-500 mt-1">{ticket?.id} &middot; {ticket?.category?.replace(/_/g, " ")} &middot; {ticket?.created_at?.slice(0, 16).replace("T", " ")}</p>
              </div>
              <div className="flex gap-2">
                <AppSelect value={ticket?.status} onChange={e => handleStatusChange(e.target.value)} data-testid="ticket-status-dropdown"
                  className="px-2 py-1 bg-[#0a0a12] border border-white/10 rounded-md text-xs text-white focus:outline-none">
                  {Object.keys(STATUS_COLORS).map(s => <AppSelectOption key={s} value={s}>{s.replace(/_/g, " ")}</AppSelectOption>)}
                </AppSelect>
                <AppSelect onChange={e => { if (e.target.value) handleEscalate(e.target.value); e.target.value = ""; }} data-testid="ticket-escalate-dropdown"
                  className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 focus:outline-none">
                  <AppSelectOption value="">Escalate...</AppSelectOption>
                  <AppSelectOption value="L2">L2 Technical</AppSelectOption>
                  <AppSelectOption value="clinical_review">Clinical Review</AppSelectOption>
                </AppSelect>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No messages yet</p>
              ) : messages.map(m => (
                <div key={m.id} className={`p-3 rounded-lg ${m.is_internal_note ? "bg-amber-500/5 border border-amber-500/10" : "bg-white/[0.03] border border-white/5"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white">{m.sender_name}</span>
                    {m.is_internal_note && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 rounded">Internal Note</span>}
                    <span className="text-[10px] text-slate-600 font-mono ml-auto">{m.sent_at?.slice(11, 16)}</span>
                  </div>
                  <p className="text-sm text-slate-300">{m.message}</p>
                </div>
              ))}
            </div>

            {/* Reply */}
            <div className="border-t border-white/5 pt-3">
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Type a reply..."
                data-testid="ticket-reply-input"
                className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none resize-none" />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                    data-testid="ticket-internal-note-checkbox"
                    className="rounded border-white/20" />
                  Internal note (not visible to user)
                </label>
                <button onClick={handleReply} data-testid="ticket-send-reply"
                  className="px-4 py-1.5 bg-[#7B35D8] text-white text-sm rounded-lg hover:bg-[#6B25C8]">
                  <MessageSquare size={14} className="inline mr-1" /> Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: User Context */}
        <div className="space-y-4">
          <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="ticket-user-context">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">User Context</h3>
            {userCtx?.user ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="text-white">{userCtx.user.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-white font-mono text-xs">{userCtx.user.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="text-white">{userCtx.user.role?.replace(/_/g, " ")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="text-white">{userCtx.user.plan?.replace(/_/g, " ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Age/Sex</span><span className="text-white">{userCtx.user.age} / {userCtx.user.sex}</span></div>
                {userCtx.latest_hps && (
                  <>
                    <div className="border-t border-white/5 pt-2 mt-2">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Latest HPS</p>
                      <p className="text-2xl font-bold text-[#7B35D8]">{userCtx.latest_hps.hps_final || userCtx.latest_hps.total_score || "—"}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No user linked</p>
            )}
          </div>

          <div className="bg-[#11111a] border border-white/5 rounded-xl p-4">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-3">Ticket Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Priority</span><span className={PRIORITY_COLORS[ticket?.priority]?.split(" ")[1]}>{ticket?.priority}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Escalation</span><span className="text-white">{ticket?.escalation_level}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Assigned</span><span className="text-white">{ticket?.assigned_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="text-white font-mono text-xs">{ticket?.created_at?.slice(0, 10)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
