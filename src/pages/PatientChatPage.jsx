import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { Send, ArrowLeft, Image, Mic, User, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ThreadList({ threads, activeThread, onSelect }) {
  return (
    <div className="w-80 border-r border-[#1E1E3A] overflow-y-auto" data-testid="chat-thread-list">
      <div className="p-4 border-b border-[#1E1E3A]">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <p className="text-xs text-slate-500">Chat with your care team</p>
      </div>
      {threads.map(t => (
        <div key={t.id} onClick={() => onSelect(t)} data-testid={`thread-${t.id}`}
          className={`p-4 cursor-pointer border-b border-[#1E1E3A]/50 hover:bg-[#1E1E3A]/50 transition-all ${activeThread?.id === t.id ? "bg-[#7B35D8]/10 border-l-2 border-l-[#7B35D8]" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7B35D8]/20 flex items-center justify-center">
              <User size={18} className="text-[#7B35D8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white truncate">{t.hcp_name || t.patient_name}</span>
                {t.unread_count > 0 && <span className="w-5 h-5 bg-[#7B35D8] text-white text-xs rounded-full flex items-center justify-center">{t.unread_count}</span>}
              </div>
              <div className="text-xs text-slate-500 truncate">{t.hcp_role?.replace(/_/g, " ") || ""}</div>
              <div className="text-xs text-slate-600 truncate mt-0.5">{t.last_message || "No messages yet"}</div>
            </div>
          </div>
        </div>
      ))}
      {threads.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No conversations yet.<br />Visit Care Team to start chatting.</div>}
    </div>
  );
}

function ChatMessages({ thread, messages, onSend, userId }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  if (!thread) return (
    <div className="flex-1 flex items-center justify-center text-slate-500">
      <div className="text-center"><Bot size={48} className="mx-auto mb-3 opacity-30" /><p>Select a conversation</p></div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col" data-testid="chat-messages-area">
      <div className="p-4 border-b border-[#1E1E3A] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#7B35D8]/20 flex items-center justify-center"><User size={16} className="text-[#7B35D8]" /></div>
        <div>
          <div className="text-sm font-semibold text-white">{thread.hcp_name || thread.patient_name}</div>
          <div className="text-xs text-slate-500">{thread.hcp_role?.replace(/_/g, " ")}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : m.message_type === "system" ? "justify-center" : "justify-start"}`}>
            {m.message_type === "system" ? (
              <div className="bg-[#1E1E3A]/50 text-slate-400 text-xs px-3 py-1.5 rounded-full">{m.content}</div>
            ) : (
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === userId ? "bg-[#7B35D8] text-white rounded-br-md" : "bg-[#1E1E3A] text-slate-200 rounded-bl-md"}`}>
                {m.sender_id !== userId && <div className="text-xs font-medium text-[#7B35D8] mb-1">{m.sender_name}</div>}
                <div>{m.content}</div>
                <div className={`text-[10px] mt-1 ${m.sender_id === userId ? "text-white/50" : "text-slate-500"}`}>
                  {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {m.sender_id === userId && <span className="ml-1">{m.read ? "Read" : "Sent"}</span>}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-[#1E1E3A]">
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:text-slate-300"><Image size={18} /></button>
          <button className="p-2 text-slate-500 hover:text-slate-300"><Mic size={18} /></button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Type a message..." data-testid="chat-message-input"
            className="flex-1 bg-[#0A0A1A] border border-[#2A2A4A] rounded-full px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#7B35D8] outline-none" />
          <button onClick={handleSend} disabled={!input.trim()} data-testid="chat-send-btn"
            className="p-2.5 bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 rounded-full text-white transition-all">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientChatPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polling, setPolling] = useState(null);

  useEffect(() => {
    api.get("/patient-chat/threads").then(r => setThreads(r.data.threads || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    const load = () => api.get(`/patient-chat/threads/${activeThread.patient_id}/messages`).then(r => setMessages(r.data.messages || [])).catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [activeThread?.id]);

  const sendMessage = async (content) => {
    if (!activeThread) return;
    const recipientId = user.id === activeThread.patient_id ? activeThread.hcp_id : activeThread.patient_id;
    try {
      const r = await api.post(`/patient-chat/threads/${activeThread.patient_id}/messages`, { recipient_id: recipientId, content });
      setMessages(prev => [...prev, r.data]);
    } catch {}
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#0A0A1A] rounded-xl border border-[#1E1E3A] overflow-hidden" data-testid="patient-chat-page">
      <ThreadList threads={threads} activeThread={activeThread} onSelect={setActiveThread} />
      <ChatMessages thread={activeThread} messages={messages} onSend={sendMessage} userId={user?.id} />
    </div>
  );
}
