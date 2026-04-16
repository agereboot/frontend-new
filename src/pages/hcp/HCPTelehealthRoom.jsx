import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare,
  Send, Maximize2, Minimize2, Clock, FileText,
  CheckCircle, Edit3, Stethoscope,
} from "lucide-react";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];

export default function HCPTelehealthRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [soapNote, setSoapNote] = useState(null);
  const [showSoapReview, setShowSoapReview] = useState(false);
  const [endingCall, setEndingCall] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); }
    if (peerRef.current) { peerRef.current.close(); }
    if (wsRef.current) { wsRef.current.close(); }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    api.get(`/telehealth/sessions/${sessionId}`)
      .then(r => { setSession(r.data); setChatMessages(r.data.chat_messages || []); setLoading(false); })
      .catch(() => { toast.error("Session not found"); navigate("/hcp/telehealth"); });
    return () => { cleanup(); };
  }, [sessionId, navigate, cleanup]);

  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [connected]);

  const startMedia = async (type) => {
    try {
      const constraints = type === "video" ? { video: true, audio: true } : type === "audio" ? { video: false, audio: true } : { video: false, audio: false };
      if (constraints.video || constraints.audio) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoRef.current && constraints.video) { localVideoRef.current.srcObject = stream; }
      }
      connectSignaling();
    } catch (err) {
      toast.error("Could not access camera/microphone. Check permissions.");
      connectSignaling();
    }
  };

  const connectSignaling = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const wsUrl = backendUrl.replace("https://", "wss://").replace("http://", "ws://") + `/api/telehealth/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      toast.success("Connected to session");
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "chat") {
        setChatMessages(prev => [...prev, msg.message]);
        return;
      }

      if (msg.type === "peer_joined") {
        // Initiate WebRTC connection
        createPeerConnection();
        if (peerRef.current && localStreamRef.current) {
          const offer = await peerRef.current.createOffer();
          await peerRef.current.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
        }
        return;
      }

      if (msg.type === "offer") {
        createPeerConnection();
        await peerRef.current.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: msg.sdp }));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", sdp: answer.sdp }));
        return;
      }

      if (msg.type === "answer") {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp }));
        }
        return;
      }

      if (msg.type === "ice_candidate") {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
        return;
      }

      if (msg.type === "peer_left") {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        toast.info("Remote participant disconnected");
      }
    };

    ws.onclose = () => { setConnected(false); };
    ws.onerror = () => { toast.error("Connection error"); };
  };

  const createPeerConnection = () => {
    if (peerRef.current) return;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = event.streams[0]; }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ice_candidate", candidate: event.candidate }));
      }
    };
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoEnabled(prev => !prev);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setAudioEnabled(prev => !prev);
    }
  };

  const endCall = async () => {
    cleanup();
    setEndingCall(true);
    try {
      const res = await api.put(`/telehealth/sessions/${sessionId}/end`, { clinical_notes: "" });
      if (res.data.ai_soap) {
        setSoapNote(res.data.ai_soap);
        setShowSoapReview(true);
        toast.success("Session ended — AgeReboot SOAP note generated!");
      } else {
        toast.success("Session ended");
        navigate("/hcp/telehealth");
      }
    } catch {
      toast.success("Session ended");
      navigate("/hcp/telehealth");
    }
    setEndingCall(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      const res = await api.post(`/telehealth/sessions/${sessionId}/chat`, { content: chatInput });
      setChatMessages(prev => [...prev, res.data]);
      setChatInput("");
    } catch { toast.error("Failed to send message"); }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  // Post-session AgeReboot SOAP Note review
  if (showSoapReview && soapNote) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 animate-in fade-in duration-500" data-testid="soap-review">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">AgeReboot SOAP Note</h2>
          <p className="font-body text-sm text-slate-400 mt-1">Review and finalize the clinical encounter from your telehealth session</p>
          {soapNote.encounter_id && (
            <Badge className="font-mono text-[8px] bg-[#7B35D8]/10 text-[#7B35D8] border border-[#7B35D8]/20 mt-2">
              Auto-saved to EMR &middot; Encounter ID: {soapNote.encounter_id.slice(0, 8)}...
            </Badge>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
          {soapNote.chief_complaint && (
            <div className="p-4 border-b border-white/5">
              <p className="font-mono text-[9px] text-amber-400 uppercase tracking-wider mb-1">Chief Complaint</p>
              <p className="font-body text-sm text-white">{soapNote.chief_complaint}</p>
            </div>
          )}
          {[
            { key: "subjective", label: "Subjective", color: "#7B35D8", letter: "S" },
            { key: "objective", label: "Objective", color: "#6366F1", letter: "O" },
            { key: "assessment", label: "Assessment", color: "#0F9F8F", letter: "A" },
            { key: "plan", label: "Plan", color: "#10B981", letter: "P" },
          ].map(({ key, label, color, letter }) => soapNote[key] && (
            <div key={key} className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-black" style={{ backgroundColor: color + "15", color, border: `1px solid ${color}30` }}>{letter}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color }}>{label}</span>
              </div>
              <p className="font-body text-sm text-slate-300 leading-relaxed">{soapNote[key]}</p>
            </div>
          ))}
          {soapNote.follow_up && (
            <div className="p-4 border-b border-white/5">
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-1">Follow-up</p>
              <p className="font-body text-sm text-slate-300">{soapNote.follow_up}</p>
            </div>
          )}
          {soapNote.summary && (
            <div className="p-4 bg-[#7B35D8]/5">
              <p className="font-mono text-[9px] text-[#7B35D8] uppercase tracking-wider mb-1">Summary</p>
              <p className="font-body text-sm text-white">{soapNote.summary}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button data-testid="soap-finalize" onClick={() => { toast.success("SOAP note finalized in EMR"); navigate("/hcp/telehealth"); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-body text-sm px-6">
            <CheckCircle size={16} className="mr-2" /> Finalize & Save
          </Button>
          <Button data-testid="soap-edit-emr" onClick={() => navigate("/hcp/emr")} variant="outline"
            className="border-white/10 text-slate-300 hover:bg-white/5 font-body text-sm">
            <Edit3 size={14} className="mr-2" /> Edit in EMR
          </Button>
          <Button variant="outline" onClick={() => navigate("/hcp/telehealth")}
            className="border-white/10 text-slate-300 hover:bg-white/5 font-body text-sm">
            Skip & Return
          </Button>
        </div>
      </div>
    );
  }

  const isVideoSession = session?.session_type === "video";
  const isAudioSession = session?.session_type === "audio";

  if (!connected && session) {
    return (
      <div className="flex items-center justify-center h-[80vh]" data-testid="telehealth-lobby">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-[#7B35D8]/15 border border-[#7B35D8]/25 flex items-center justify-center mx-auto mb-6">
            {isVideoSession ? <Video size={36} className="text-[#7B35D8]" /> : isAudioSession ? <Mic size={36} className="text-[#7B35D8]" /> : <MessageSquare size={36} className="text-[#7B35D8]" />}
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            {isVideoSession ? "Video" : isAudioSession ? "Audio" : "Text"} Consultation
          </h2>
          <p className="font-body text-sm text-slate-400 mb-2">with {session.member_name}</p>
          <p className="font-mono text-[9px] text-slate-500 mb-4">Room Code: {session.room_code}</p>

          {/* Indian Telemedicine Compliance - Consent */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-left" data-testid="consent-panel">
            <p className="font-mono text-[9px] text-amber-400 uppercase tracking-wider mb-2">Telemedicine Practice Guidelines 2020 - Consent</p>
            <ul className="space-y-1 text-[11px] text-slate-400 mb-3">
              <li>This teleconsultation is conducted per the Telemedicine Practice Guidelines 2020 issued by the Board of Governors, MCI</li>
              <li>The session may be recorded for clinical documentation and medicolegal purposes</li>
              <li>Patient identity has been verified prior to this session</li>
              <li>Prescriptions are limited to List A drugs for first consultations</li>
            </ul>
            <label className="flex items-center gap-2 cursor-pointer" data-testid="consent-checkbox-label">
              <input type="checkbox" data-testid="consent-checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/30 accent-emerald-500" />
              <span className="text-xs text-white">I confirm patient consent has been obtained for this teleconsultation</span>
            </label>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button data-testid="join-call-btn" onClick={() => startMedia(session.session_type)} disabled={!consentGiven}
              className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white font-body text-base px-10 py-3 shadow-[0_0_30px_rgba(123,53,216,0.3)] disabled:opacity-40 disabled:cursor-not-allowed">
              {isVideoSession ? <Video size={18} className="mr-2" /> : isAudioSession ? <Mic size={18} className="mr-2" /> : <MessageSquare size={18} className="mr-2" />}
              Join Session
            </Button>
            <Button variant="outline" onClick={() => navigate("/hcp/telehealth")} className="border-white/10 text-slate-300 font-body text-sm">
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullscreen ? "fixed inset-0 z-50" : ""} bg-[#050217] flex flex-col`} data-testid="telehealth-room" style={{ height: fullscreen ? "100vh" : "calc(100vh - 48px)" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-body text-sm text-white font-medium">{session?.member_name}</span>
          <span className="font-mono text-[9px] text-slate-500">Room: {session?.room_code}</span>
          <span className="font-mono text-[7px] text-amber-400/70 px-2 py-0.5 rounded-full border border-amber-400/20 bg-amber-400/5">TPG 2020 Compliant</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <Clock size={12} className="text-red-400" />
            <span className="font-mono text-xs text-red-400">{formatTime(elapsed)}</span>
          </div>
          <button onClick={() => setFullscreen(f => !f)} className="text-slate-400 hover:text-white">
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className={`flex-1 flex items-center justify-center relative ${showChat ? "" : ""}`}>
          {isVideoSession ? (
            <>
              {/* Remote Video */}
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black rounded-none" data-testid="remote-video" />
              {/* Local Video (PiP) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" data-testid="local-video" />
              </div>
              {/* No remote video placeholder */}
              {!remoteVideoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-[#7B35D8]/10 border border-[#7B35D8]/20 flex items-center justify-center mx-auto mb-4">
                      <span className="font-display text-3xl font-bold text-[#7B35D8]">{session?.member_name?.[0] || "?"}</span>
                    </div>
                    <p className="font-body text-sm text-slate-400">Waiting for {session?.member_name} to join...</p>
                  </div>
                </div>
              )}
            </>
          ) : isAudioSession ? (
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-[#7B35D8]/10 border-2 border-[#7B35D8]/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <span className="font-display text-5xl font-bold text-[#7B35D8]">{session?.member_name?.[0] || "?"}</span>
              </div>
              <p className="font-body text-lg text-white font-medium">{session?.member_name}</p>
              <p className="font-mono text-xs text-slate-400 mt-1">Audio call in progress</p>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-4 text-[#7B35D8]/30" />
              <p className="font-body text-sm">Text-only session. Use the chat panel.</p>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 border-l border-white/5 bg-black/30 flex flex-col" data-testid="telehealth-chat">
            <div className="p-3 border-b border-white/5">
              <h3 className="font-display text-sm font-bold text-white">Session Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((m, i) => {
                const isMe = m.sender_role === "clinician" || m.sender_role === "coach";
                return (
                  <div key={m.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl p-2.5 ${isMe ? "bg-[#7B35D8]/15 border border-[#7B35D8]/20" : "bg-white/5 border border-white/5"}`}>
                      <p className="font-body text-xs text-white">{m.content}</p>
                      <p className="font-mono text-[7px] text-slate-500 mt-1">{m.sender_name} &middot; {m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-white/5 flex gap-2">
              <input data-testid="telehealth-chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Message..." className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600" />
              <Button data-testid="telehealth-chat-send" size="sm" onClick={sendChat} className="bg-[#7B35D8] hover:bg-[#6D28D9] text-white px-3">
                <Send size={12} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-white/5 bg-black/40 backdrop-blur-lg">
        {(isVideoSession || isAudioSession) && (
          <button data-testid="toggle-audio" onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${audioEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}>
            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
        )}
        {isVideoSession && (
          <button data-testid="toggle-video" onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}>
            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        )}
        <button data-testid="toggle-chat" onClick={() => setShowChat(s => !s)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showChat ? "bg-[#7B35D8]/20 text-[#7B35D8]" : "bg-white/10 text-white hover:bg-white/20"}`}>
          <MessageSquare size={20} />
        </button>
        <button data-testid="end-call" onClick={endCall} disabled={endingCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50">
          {endingCall ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PhoneOff size={22} />}
        </button>
      </div>
    </div>
  );
}
