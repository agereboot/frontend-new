import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Send, Users, Clock } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function CoachMessagingPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ to_id: "", to_name: "", subject: "", body: "" });

  useEffect(() => {
    Promise.all([
      api.get("/coach/messages").then(r => setMessages(r.data.messages || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const sendMessage = async () => {
    if (!form.to_id || !form.body) { toast.error("Select recipient and write message"); return; }
    try {
      const res = await api.post("/coach/messages", form);
      setMessages(prev => [res.data, ...prev]);
      setShowCompose(false);
      setForm({ to_id: "", to_name: "", subject: "", body: "" });
      toast.success("Message sent");
    } catch { toast.error("Failed to send"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="messaging-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Team <span className="text-violet-400">Messaging</span></h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">CROSS-MODULE CLINICAL COMMUNICATION</p>
        </div>
        <Button data-testid="compose-btn" onClick={() => setShowCompose(!showCompose)} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
          <MessageSquare size={14} className="mr-1" /> Compose
        </Button>
      </div>

      {showCompose && (
        <div className="rounded-xl border border-violet-500/20 bg-black/30 p-5 space-y-3" data-testid="compose-form">
          <AppSelect value={form.to_id} onChange={e => {
            const m = members.find(mm => mm.id === e.target.value);
            setForm(p => ({ ...p, to_id: e.target.value, to_name: m?.name || "" }));
          }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none">
            <AppSelectOption value="">Select recipient (team member or patient)</AppSelectOption>
            {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
          </AppSelect>
          <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none" />
          <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Message..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none h-24 resize-none" />
          <div className="flex gap-2">
            <Button data-testid="send-msg" onClick={sendMessage} className="bg-violet-600 hover:bg-violet-700 text-white text-xs"><Send size={12} className="mr-1" /> Send</Button>
            <Button variant="outline" onClick={() => setShowCompose(false)} className="border-white/10 text-slate-300 text-xs">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {messages.map(m => (
          <div key={m.id} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid={`msg-${m.id}`}>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="font-mono text-[7px] bg-violet-500/10 text-violet-400">{m.from_id === user?.id ? "Sent" : "Received"}</Badge>
              <span className="font-body text-xs text-white font-medium">{m.from_id === user?.id ? `To: ${m.to_name}` : `From: ${m.from_name}`}</span>
              <span className="font-mono text-[7px] text-slate-500 ml-auto">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            {m.subject && <p className="font-body text-sm text-white font-medium">{m.subject}</p>}
            <p className="font-body text-xs text-slate-400 mt-0.5">{m.body}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare size={40} className="text-violet-500/20 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
