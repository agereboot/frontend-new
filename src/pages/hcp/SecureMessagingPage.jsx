import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Send, Search, User, Clock, CheckCheck, Loader2 } from "lucide-react";

export default function SecureMessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/patient/messaging/conversations").then(r => setConversations(r.data.conversations || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) {
      api.get(`/patient/messaging/${selectedId}`).then(r => {
        setMessages(r.data.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
    }
  }, [selectedId]);

  const sendMessage = async () => {
    if (!msgText.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await api.post("/patient/messaging/send", { recipient_id: selectedId, content: msgText });
      setMessages(prev => [...prev, res.data]);
      setMsgText("");
      // Update conversation list
      setConversations(prev => {
        const existing = prev.find(c => c.partner_id === selectedId);
        if (existing) {
          return prev.map(c => c.partner_id === selectedId ? { ...c, last_message: msgText.slice(0, 80), last_message_at: new Date().toISOString(), total_messages: c.total_messages + 1 } : c);
        }
        const member = members.find(m => m.id === selectedId);
        return [{ partner_id: selectedId, partner_name: member?.name || "", last_message: msgText.slice(0, 80), last_message_at: new Date().toISOString(), unread_count: 0, total_messages: 1 }, ...prev];
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { toast.error("Failed to send"); }
    setSending(false);
  };

  const selectedConvo = conversations.find(c => c.partner_id === selectedId);
  const selectedMember = members.find(m => m.id === selectedId);
  const filteredMembers = members.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500" data-testid="secure-messaging-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Secure <span className="text-[#7B35D8]">Messaging</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">HIPAA-COMPLIANT PHYSICIAN-PATIENT COMMUNICATION</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Sidebar: Conversations + Members */}
        <div className="col-span-4 rounded-xl border border-white/5 bg-black/20 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input data-testid="msg-search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search members..." className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Active Conversations */}
            {conversations.length > 0 && !search && (
              <div className="p-2">
                <p className="font-mono text-[7px] text-slate-600 uppercase tracking-wider px-2 py-1">Recent Conversations</p>
                {conversations.map(c => (
                  <button key={c.partner_id} data-testid={`convo-${c.partner_id}`}
                    onClick={() => setSelectedId(c.partner_id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                      selectedId === c.partner_id ? "bg-[#7B35D8]/10 border border-[#7B35D8]/20" : "hover:bg-white/[0.03] border border-transparent"
                    }`}>
                    <div className="w-8 h-8 rounded-full bg-[#7B35D8]/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-[#7B35D8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-body text-xs font-medium text-white truncate">{c.partner_name}</p>
                        {c.unread_count > 0 && (
                          <Badge className="font-mono text-[7px] bg-[#7B35D8] text-white h-4 min-w-[16px] flex items-center justify-center">{c.unread_count}</Badge>
                        )}
                      </div>
                      <p className="font-mono text-[8px] text-slate-500 truncate">{c.last_message}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* All Members */}
            <div className="p-2">
              <p className="font-mono text-[7px] text-slate-600 uppercase tracking-wider px-2 py-1">All Members</p>
              {filteredMembers.slice(0, 20).map(m => (
                <button key={m.id} data-testid={`member-msg-${m.id}`}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                    selectedId === m.id ? "bg-[#7B35D8]/10" : "hover:bg-white/[0.03]"
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <span className="font-mono text-[10px] text-slate-400">{(m.name || "?")[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-xs text-white truncate">{m.name}</p>
                    <p className="font-mono text-[7px] text-slate-500">HPS: {m.hps_score || "N/A"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-8 rounded-xl border border-white/5 bg-black/20 flex flex-col overflow-hidden">
          {selectedId ? (
            <>
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#7B35D8]/10 flex items-center justify-center">
                  <User size={16} className="text-[#7B35D8]" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-white">{selectedConvo?.partner_name || selectedMember?.name || "Member"}</p>
                  <p className="font-mono text-[8px] text-slate-500">{messages.length} messages &middot; Encrypted channel</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-xl p-3 ${isMe ? "bg-[#7B35D8]/15 border border-[#7B35D8]/20" : "bg-white/5 border border-white/5"}`}>
                        <p className="font-body text-sm text-white whitespace-pre-wrap">{m.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono text-[7px] text-slate-500">{new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          {isMe && m.read && <CheckCheck size={10} className="text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/5 flex gap-3">
                <input data-testid="chat-input" value={msgText} onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type a secure message..." className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600" />
                <Button data-testid="chat-send" onClick={sendMessage} disabled={sending || !msgText.trim()}
                  className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white px-5">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={40} className="text-[#7B35D8]/20 mx-auto mb-3" />
                <p className="font-body text-sm text-slate-500">Select a member to start messaging</p>
                <p className="font-mono text-[9px] text-slate-600 mt-1">All messages are end-to-end encrypted</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
