import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { Video, Calendar, Clock, User, Phone, MessageSquare, CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

function DoctorSlotPicker({ doctorId, onBook }) {
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
console.log("DoctorSlotPicker rendered with doctorId:", doctorId);
  useEffect(() => {
    if (!doctorId) return;
    api.get(`/video-consultation/available-slots/${doctorId.id}`).then(r => {
      setDoctor(r.data.doctor); setSlots(r.data.slots || []);
    });
  }, [doctorId]);

  const handleBook = async () => {
    setBooking(true);
    try {
      const r = await api.post("/video-consultation/book", {
        doctor_id: doctorId.id, scheduled_date: selectedDate, scheduled_time: selectedTime, reason,
      });
      onBook(r.data.consultation);
    } catch {} finally { setBooking(false); }
  };

  return (
    <div className="space-y-4" data-testid="slot-picker">
      {doctor && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#7B35D8]/20 flex items-center justify-center"><User size={20} className="text-[#7B35D8]" /></div>
          <div><div className="text-white font-semibold">{doctor.name}</div><div className="text-xs text-slate-400">{doctor.role?.replace(/_/g, " ")}</div></div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Select Date</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {slots.map(d => (
            <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedTime(null); }}
              className={`flex-shrink-0 w-20 py-3 rounded-xl text-center transition-all ${selectedDate === d.date ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-300 hover:bg-[#2A2A4A]"}`}>
              <div className="text-xs">{d.label.split(",")[0]}</div>
              <div className="text-lg font-bold">{d.date.split("-")[2]}</div>
            </button>
          ))}
        </div>
      </div>
      {selectedDate && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Select Time</h3>
          <div className="grid grid-cols-4 gap-2">
            {slots.find(d => d.date === selectedDate)?.time_slots?.filter(s => s.available).map(s => (
              <button key={s.time} onClick={() => setSelectedTime(s.time)}
                className={`p-2 rounded-lg text-sm text-center transition-all ${selectedTime === s.time ? "bg-[#7B35D8] text-white" : s.is_morning ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" : "bg-[#1E1E3A] text-slate-300 hover:bg-[#2A2A4A]"}`}>
                {s.time}
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedTime && (
        <div>
          <label className="text-xs text-slate-400 block mb-1">Reason (optional)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
            className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none" placeholder="Brief reason for consultation..." />
        </div>
      )}
      <button onClick={handleBook} disabled={!selectedDate || !selectedTime || booking} data-testid="book-consultation-btn"
        className="w-full bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
        <Video size={16} /> {booking ? "Booking..." : "Book Video Consultation"}
      </button>
    </div>
  );
}

function ConsultationCard({ c, onJoin }) {
  const isUpcoming = c.status === "scheduled";
  const isLive = c.status === "in_progress";
  return (
    <div className={`bg-[#12122A] border rounded-xl p-4 ${isLive ? "border-emerald-500/50" : "border-[#1E1E3A]"}`} data-testid={`consultation-${c.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLive ? "bg-emerald-500/20" : "bg-[#7B35D8]/20"}`}>
            <Video size={18} className={isLive ? "text-emerald-400" : "text-[#7B35D8]"} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{c.doctor_name || c.patient_name}</div>
            <div className="text-xs text-slate-500">Video Consultation</div>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${isLive ? "bg-emerald-500/20 text-emerald-400" : isUpcoming ? "bg-[#7B35D8]/20 text-[#7B35D8]" : "bg-[#1E1E3A] text-slate-500"}`}>
          {c.status === "completed" ? "Completed" : isLive ? "Live Now" : "Upcoming"}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
        <span className="flex items-center gap-1"><Calendar size={12} /> {c.scheduled_date}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {c.scheduled_time}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {c.duration_min} min</span>
      </div>
      {c.reason && <p className="text-xs text-slate-500 mb-3">{c.reason}</p>}
      {(isUpcoming || isLive) && (
        <button onClick={() => onJoin(c.id)} data-testid={`join-call-${c.id}`}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${isLive ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-[#7B35D8] hover:bg-[#6B2BC8] text-white"}`}>
          {isLive ? "Rejoin Call" : "Join Call"}
        </button>
      )}
    </div>
  );
}

export default function VideoConsultationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [careTeam, setCareTeam] = useState([]);


  useEffect(() => {
    api.get("/video-consultation/my-consultations").then(r => setConsultations(r.data.consultations || []));
    api.get("/care-team").then(r => setCareTeam(r.data.members || [])).catch(() => {});
  }, []);

const handleJoin = async (consultationId) => {
  const newTab = window.open("", "_blank");

  try {
    const res = await api.post(`/video-consultation/join/${consultationId}`);
    const meetLink = res?.data?.meet_link;

    if (meetLink) {
      if (newTab) {
        newTab.location.href = meetLink;
        newTab.focus();
      } else {
        window.location.href = meetLink;
      }
    } else {
      if (newTab) newTab.close();
      console.error("meet_link not found in response", res?.data);
    }
  } catch (error) {
    if (newTab) newTab.close();
    console.error("Failed to join consultation:", error);
  }
};

  const upcoming = consultations.filter(c => c.status === "scheduled" || c.status === "in_progress");
  const past = consultations.filter(c => c.status === "completed");

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="video-consultation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Video Consultations</h1>
          <p className="text-sm text-slate-400 mt-1">Book and manage your teleconsultations</p>
        </div>
        <button onClick={() => setShowBooking(!showBooking)}
          className="px-4 py-2 bg-[#7B35D8] text-white text-sm rounded-lg hover:bg-[#6B2BC8] flex items-center gap-2">
          <Video size={14} /> {showBooking ? "View Consultations" : "Book New"}
        </button>
      </div>
      {showBooking ? (
        <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-6">
          {!selectedDoctor ? (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Select Doctor</h3>
              <div className="space-y-2">
                {careTeam.map(doc => (
                <button key={doc.id} onClick={() => {
  console.log("Selected doctor:", doc);
  setSelectedDoctor(doc);
}}
                    className="w-full flex items-center gap-3 p-3 bg-[#1E1E3A] rounded-lg hover:bg-[#2A2A4A] transition-all text-left">
                    <div className="w-10 h-10 rounded-full bg-[#7B35D8]/20 flex items-center justify-center"><User size={18} className="text-[#7B35D8]" /></div>
                    <div className="flex-1"><div className="text-sm text-white">{doc.name}</div><div className="text-xs text-slate-500">{doc.role?.replace(/_/g, " ")}</div></div>
                    <ChevronRight size={16} className="text-slate-600" />
                  </button>
                ))}
                {careTeam.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No care team assigned yet.</p>}
              </div>
            </div>
          ) : (
            <DoctorSlotPicker doctorId={selectedDoctor} onBook={c => { setConsultations(prev => [c, ...prev]); setShowBooking(false); setSelectedDoctor(null); }} />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">UPCOMING</h3>
              <div className="space-y-3">{upcoming.map(c => <ConsultationCard key={c.id} c={c} onJoin={handleJoin} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">PAST CONSULTATIONS</h3>
              <div className="space-y-3">{past.map(c => <ConsultationCard key={c.id} c={c} onJoin={() => {}} />)}</div>
            </div>
          )}
          {consultations.length === 0 && <div className="text-center text-slate-500 py-12">No consultations yet. Book your first video consultation.</div>}
        </div>
      )}
    </div>
  );
}
