import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { Calendar, Clock, MapPin, Phone, CheckCircle, Truck, FlaskConical, FileCheck } from "lucide-react";

const STATUS_CONFIG = {
  booking_confirmed: { label: "Booking Confirmed", icon: CheckCircle, color: "text-emerald-400" },
  phlebotomist_assigned: { label: "Technician Assigned", icon: Phone, color: "text-blue-400" },
  phlebotomist_en_route: { label: "Technician En Route", icon: Truck, color: "text-amber-400" },
  phlebotomist_arrived: { label: "Technician Arrived", icon: MapPin, color: "text-purple-400" },
  sample_collected: { label: "Sample Collected", icon: FlaskConical, color: "text-teal-400" },
  sample_dispatched: { label: "Sample Dispatched", icon: Truck, color: "text-blue-400" },
  sample_received_at_lab: { label: "Received at Lab", icon: FlaskConical, color: "text-indigo-400" },
  sample_under_analysis: { label: "Under Analysis", icon: FlaskConical, color: "text-amber-400" },
  report_ready: { label: "Report Ready!", icon: FileCheck, color: "text-emerald-400" },
};
const STATUS_ORDER = Object.keys(STATUS_CONFIG);

function BookingFlow({ onBooked }) {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [fasting, setFasting] = useState(false);
  const [booking, setBooking] = useState(false);
  const [postConsult, setPostConsult] = useState(null);
  const [panels, setPanels] = useState(null);
  const [address, setAddress] = useState({ address_line: "", city: "", pin_code: "", landmark: "" });
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  useEffect(() => {
    api.get("/patient-booking/available-slots").then(r => setSlots(r.data.available_dates || []));
    api.get("/patient-booking/post-consultation").then(r => setPostConsult(r.data));
    api.get("/video-consultation/biomarker-panels").then(r => setPanels(r.data));
    api.get("/employee/address").then(r => {
      if (r.data.address?.address_line) { setAddress(r.data.address); setAddressConfirmed(true); }
    }).catch(() => {});
  }, []);

  const bookNow = async () => {
    setBooking(true);
    try {
      const r = await api.post("/api/patient-booking/book-sample-collection", {
        preferred_date: selectedDate, preferred_slot: selectedSlot, fasting_confirmed: fasting,
        panel_ids: postConsult?.pending_lab_orders?.map(o => o.id) || [],
        address_line: address.address_line, city: address.city, pin_code: address.pin_code, landmark: address.landmark,
      });
      onBooked(r.data.booking);
    } catch {} finally { setBooking(false); }
  };

  const STEPS = [
    { num: 1, label: "Test Info" },
    { num: 2, label: "Address" },
    { num: 3, label: "Date & Slot" },
    { num: 4, label: "Fasting" },
    { num: 5, label: "Confirm" },
  ];

  return (
    <div className="space-y-6" data-testid="booking-flow">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.num ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-600"}`}>{s.num}</div>
            <span className={`text-[10px] ml-1 ${step >= s.num ? "text-white" : "text-slate-600"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? "bg-[#7B35D8]" : "bg-[#1E1E3A]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Panel Card / Test Info */}
      {step === 1 && (
        <div className="space-y-4">
          {postConsult?.has_pending_orders && (
            <div className="bg-[#7B35D8]/10 border border-[#7B35D8]/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#7B35D8]">Pending Lab Orders</h3>
              <p className="text-xs text-slate-400 mt-1">Your doctor ordered {postConsult.pending_lab_orders.length} test(s).</p>
            </div>
          )}
          {panels?.prebuilt_panels && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Available Test Panels</h3>
              <div className="space-y-2">
                {panels.prebuilt_panels.map(p => (
                  <div key={p.id} className="bg-[#1E1E3A] rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.markers} markers — {p.description}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.fasting ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {p.fasting ? "Fasting" : "Non-fasting"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setStep(2)} className="w-full bg-[#7B35D8] hover:bg-[#6B2BC8] text-white py-3 rounded-xl font-medium">Continue</button>
        </div>
      )}

      {/* Step 2: Address Confirmation */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Confirm Collection Address</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Address *</label>
              <textarea value={address.address_line} onChange={e => setAddress(p => ({ ...p, address_line: e.target.value }))} rows={2}
                className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">City *</label>
                <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                  className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">PIN *</label>
                <input value={address.pin_code} onChange={e => setAddress(p => ({ ...p, pin_code: e.target.value }))}
                  className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 bg-[#1E1E3A] text-slate-300 py-3 rounded-xl font-medium">Back</button>
            <button onClick={() => setStep(3)} disabled={!address.address_line || !address.city}
              className="flex-1 bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-xl font-medium">Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Date & Slot */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white mb-3">Select Date</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slots.map(d => (
              <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-all ${selectedDate === d.date ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-300 hover:bg-[#2A2A4A]"}`}>
                <div className="text-xs font-medium">{d.label.split(",")[0]}</div>
                <div className="text-lg font-bold">{d.date.split("-")[2]}</div>
              </button>
            ))}
          </div>
          {selectedDate && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Select Time Slot</h3>
              <div className="grid grid-cols-2 gap-2">
                {slots.find(d => d.date === selectedDate)?.slots?.filter(s => s.available).map(s => (
                  <button key={s.code} onClick={() => setSelectedSlot(s.code)}
                    className={`p-3 rounded-lg text-sm transition-all ${selectedSlot === s.code ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-300 hover:bg-[#2A2A4A]"}`}>
                    <div className="flex items-center gap-2"><Clock size={14} /> {s.label}</div>
                    {s.fasting_friendly && <div className="text-[10px] mt-1 text-emerald-400">Fasting-friendly</div>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 bg-[#1E1E3A] text-slate-300 py-3 rounded-xl font-medium">Back</button>
            <button onClick={() => setStep(4)} disabled={!selectedDate || !selectedSlot}
              className="flex-1 bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-xl font-medium">Continue</button>
          </div>
        </div>
      )}

      {/* Step 4: Fasting */}
      {step === 4 && (
        <div className="space-y-4">
          <label className="flex items-center gap-3 bg-[#1E1E3A] p-4 rounded-lg cursor-pointer" data-testid="fasting-checkbox">
            <input type="checkbox" checked={fasting} onChange={e => setFasting(e.target.checked)} className="accent-[#7B35D8] w-5 h-5" />
            <div><span className="text-sm text-white font-medium">I confirm I will be fasting</span><div className="text-xs text-slate-500 mt-1">8-12 hours fasting required for accurate metabolic markers (glucose, lipids, insulin)</div></div>
          </label>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 bg-[#1E1E3A] text-slate-300 py-3 rounded-xl font-medium">Back</button>
            <button onClick={() => setStep(5)} className="flex-1 bg-[#7B35D8] hover:bg-[#6B2BC8] text-white py-3 rounded-xl font-medium">Continue</button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Booking Summary</h3>
          <div className="bg-[#1E1E3A] rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="text-white">{selectedDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Slot</span><span className="text-white">{selectedSlot}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Address</span><span className="text-white text-right max-w-[60%]">{address.address_line}, {address.city}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Fasting</span><span className={fasting ? "text-emerald-400" : "text-amber-400"}>{fasting ? "Yes" : "No"}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="flex-1 bg-[#1E1E3A] text-slate-300 py-3 rounded-xl font-medium">Back</button>
            <button onClick={bookNow} disabled={booking} data-testid="confirm-booking-btn"
              className="flex-1 bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-xl font-medium">
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingTracker({ booking }) {
  const currentIdx = STATUS_ORDER.indexOf(booking.status);
  return (
    <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-6" data-testid="booking-tracker">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Sample Collection</h3>
        <span className={`text-xs px-3 py-1 rounded-full ${booking.status === "report_ready" ? "bg-emerald-500/20 text-emerald-400" : "bg-[#7B35D8]/20 text-[#7B35D8]"}`}>
          {STATUS_CONFIG[booking.status]?.label || booking.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Calendar size={12} /> {booking.preferred_date} <Clock size={12} className="ml-2" /> {booking.preferred_slot}
      </div>
      <div className="space-y-0">
        {STATUS_ORDER.map((status, idx) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          const reached = idx <= currentIdx;
          const entry = booking.status_history?.find(h => h.status === status);
          return (
            <div key={status} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${reached ? "bg-[#7B35D8]" : "bg-[#1E1E3A]"}`}>
                  <Icon size={14} className={reached ? "text-white" : "text-slate-600"} />
                </div>
                {idx < STATUS_ORDER.length - 1 && <div className={`w-0.5 h-8 ${reached ? "bg-[#7B35D8]" : "bg-[#1E1E3A]"}`} />}
              </div>
              <div className="pb-6">
                <div className={`text-sm ${reached ? "text-white font-medium" : "text-slate-600"}`}>{cfg.label}</div>
                {entry && <div className="text-[10px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {booking.phlebotomist && (
        <div className="mt-4 bg-[#1E1E3A] rounded-lg p-3">
          <div className="text-xs text-slate-400">Your Technician</div>
          <div className="text-sm text-white font-medium">{booking.phlebotomist.name}</div>
          {booking.phlebotomist.phone && <div className="text-xs text-[#7B35D8]">{booking.phlebotomist.phone}</div>}
        </div>
      )}
    </div>
  );
}

export default function BookLabTestPage() {
  const [bookings, setBookings] = useState([]);
  const [showBooking, setShowBooking] = useState(true);

  useEffect(() => {
    api.get("/patient-booking/my-bookings").then(r => {
      const b = r.data.bookings || [];
      setBookings(b);
      if (b.length > 0) setShowBooking(false);
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="book-lab-test-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lab Test & Sample Collection</h1>
          <p className="text-sm text-slate-400 mt-1">Book home sample collection or track your existing bookings</p>
        </div>
        <button onClick={() => setShowBooking(!showBooking)}
          className="px-4 py-2 bg-[#7B35D8] text-white text-sm rounded-lg hover:bg-[#6B2BC8] transition-all">
          {showBooking ? "View Bookings" : "New Booking"}
        </button>
      </div>
      {showBooking ? (
        <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-6">
          <BookingFlow onBooked={b => { setBookings(prev => [b, ...prev]); setShowBooking(false); }} />
        </div>
      ) : (
        bookings.length > 0 ? bookings.map(b => <BookingTracker key={b.id} booking={b} />) :
        <div className="text-center text-slate-500 py-12">No bookings yet. Click "New Booking" to schedule.</div>
      )}
    </div>
  );
}
