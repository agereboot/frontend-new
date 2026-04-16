import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Stethoscope, Star, Calendar, MessageSquare, Clock, CheckCircle,
  ChevronRight, Send, ThumbsUp, User, Coins, Video, Phone, Globe, Briefcase, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function CareTeamPage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({ member_index: -1, date: "", time: "", reason: "", appointment_type: "consultation" });
  const [reviewForm, setReviewForm] = useState({ member_index: -1, rating: 0, nps_score: 8, review_text: "" });
  const [showBooking, setShowBooking] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, aRes, rRes] = await Promise.all([
        api.get("/care-team"),
        api.get("/care-team/appointments"),
        api.get("/care-team/reviews"),
      ]);
      setTeam(tRes.data);
      setAppointments(aRes.data?.appointments || []);
      setReviews(rRes.data?.member_stats || {});
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBook = async () => {
    if (bookingForm.member_index < 0 || !bookingForm.date || !bookingForm.time) { toast.error("Fill all required fields"); return; }
    try {
      await api.post("/care-team/appointments", bookingForm);
      toast.success("Appointment booked!");
      setShowBooking(false);
      setBookingForm({ member_index: -1, date: "", time: "", reason: "", appointment_type: "consultation" });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Booking failed"); }
  };

  const handleReview = async () => {
    if (reviewForm.member_index < 0 || reviewForm.rating < 1) { toast.error("Select rating"); return; }
    try {
      await api.post("/care-team/reviews", reviewForm);
      toast.success("Review submitted!");
      setShowReview(false);
      setReviewForm({ member_index: -1, rating: 0, nps_score: 8, review_text: "" });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Review failed"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="care-team-loading">
      <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  const members = team?.members || [];

  return (
    <div className="space-y-5 animate-slide-up" data-testid="care-team-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            My Care <span className="text-gradient-cosmic">Team</span>
          </h1>
          <p className="font-mono text-[10px] text-stellar-dim tracking-[0.25em] mt-2 uppercase">{members.length} care professionals assigned</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="book-appointment-btn" onClick={() => { setShowBooking(!showBooking); setShowReview(false); }}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs">
            <Calendar size={14} className="mr-2" /> Book Appointment
          </Button>
          <Button data-testid="leave-review-btn" onClick={() => { setShowReview(!showReview); setShowBooking(false); }}
            variant="outline" className="border-cosmic/20 text-cosmic font-display font-bold uppercase tracking-wider text-xs">
            <Star size={14} className="mr-2" /> Leave Review
          </Button>
        </div>
      </div>

      {/* Booking Form */}
      {showBooking && (
        <div className="glass-premium rounded-2xl p-6" data-testid="booking-form">
          <h3 className="font-display text-sm font-bold text-stellar mb-4">Schedule Appointment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Care Professional</label>
              <AppSelect value={bookingForm.member_index} onChange={e => setBookingForm(p => ({...p, member_index: parseInt(e.target.value)}))}
                data-testid="booking-member-select"
                className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
                <AppSelectOption value={-1}>Select provider...</AppSelectOption>
                {members.map((m, i) => <AppSelectOption key={i} value={i}>{m.name} — {m.role}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Type</label>
              <AppSelect value={bookingForm.appointment_type} onChange={e => setBookingForm(p => ({...p, appointment_type: e.target.value}))}
                className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
                <AppSelectOption value="consultation">Consultation</AppSelectOption>
                <AppSelectOption value="follow_up">Follow-up</AppSelectOption>
                <AppSelectOption value="lab_review">Lab Review</AppSelectOption>
                <AppSelectOption value="coaching">Coaching Session</AppSelectOption>
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Date</label>
              <input type="date" value={bookingForm.date} onChange={e => setBookingForm(p => ({...p, date: e.target.value}))}
                data-testid="booking-date-input"
                className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Time</label>
              <input type="time" value={bookingForm.time} onChange={e => setBookingForm(p => ({...p, time: e.target.value}))}
                data-testid="booking-time-input"
                className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none" />
            </div>
          </div>
          <input value={bookingForm.reason} onChange={e => setBookingForm(p => ({...p, reason: e.target.value}))}
            placeholder="Reason for visit (optional)" data-testid="booking-reason-input"
            className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 mb-3 focus:border-cosmic/30 focus:outline-none" />
          <Button data-testid="confirm-booking-btn" onClick={handleBook}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs">
            <CheckCircle size={14} className="mr-2" /> Confirm Booking
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReview && (
        <div className="glass-premium rounded-2xl p-6" data-testid="review-form">
          <h3 className="font-display text-sm font-bold text-stellar mb-4">Rate Your Experience</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Care Professional</label>
              <AppSelect value={reviewForm.member_index} onChange={e => setReviewForm(p => ({...p, member_index: parseInt(e.target.value)}))}
                data-testid="review-member-select"
                className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg px-3 py-2.5 focus:border-cosmic/30 focus:outline-none">
                <AppSelectOption value={-1}>Select provider...</AppSelectOption>
                {members.map((m, i) => <AppSelectOption key={i} value={i}>{m.name} — {m.role}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-1 block">Rating (1-5 Stars)</label>
              <div className="flex gap-1.5" data-testid="review-stars">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewForm(p => ({...p, rating: s}))} data-testid={`star-${s}`}
                    className="transition-transform hover:scale-110">
                    <Star size={24} className={`${s <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-stellar-dim/30"} transition-colors`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="font-mono text-[8px] text-stellar-dim/50 uppercase tracking-wider mb-2 block">
              How likely are you to recommend? (NPS: 0-10)
            </label>
            <div className="flex gap-1.5" data-testid="review-nps">
              {Array.from({length: 11}, (_, i) => i).map(n => (
                <button key={n} onClick={() => setReviewForm(p => ({...p, nps_score: n}))} data-testid={`nps-${n}`}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border transition-all ${
                    n === reviewForm.nps_score
                      ? n >= 9 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : n >= 7 ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        : "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-white/15"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <textarea value={reviewForm.review_text} onChange={e => setReviewForm(p => ({...p, review_text: e.target.value}))}
            placeholder="Share your experience..." data-testid="review-text-input" rows={3}
            className="w-full bg-space/80 border border-white/8 text-stellar text-xs rounded-lg p-3 mb-3 resize-none focus:border-cosmic/30 focus:outline-none font-body" />
          <Button data-testid="submit-review-btn" onClick={handleReview}
            className="bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider text-xs">
            <Send size={14} className="mr-2" /> Submit Review
          </Button>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="care-team-members">
        {members.map((m, i) => {
          const stats = reviews[i];
          return (
            <div key={i} className="glass-premium rounded-2xl p-5 hover:border-white/15 transition-all" data-testid={`member-card-${i}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cosmic/10 border border-cosmic/20 flex items-center justify-center">
                  <User size={22} className="text-cosmic" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-stellar">{m.name}</h3>
                  <p className="font-body text-xs text-stellar-dim">{m.role}</p>
                  {m.credits_per_session && (
                    <div className="flex items-center gap-1 mt-1">
                      <Coins size={10} className="text-amber-400" />
                      <span className="font-mono text-[9px] text-amber-400 font-bold">{m.credits_per_session} credits</span>
                      <span className="font-mono text-[8px] text-stellar-dim/50">/session</span>
                    </div>
                  )}
                </div>
                {stats && (
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="font-mono text-lg font-bold text-amber-400">{stats.avg_rating}</span>
                      <span className="font-mono text-[8px] text-stellar-dim/50">/5</span>
                    </div>
                    <span className="font-mono text-[8px] text-stellar-dim/50">{stats.total_reviews} reviews</span>
                  </div>
                )}
              </div>

              {/* Specialization badges */}
              {m.specialization && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(Array.isArray(m.specialization) ? m.specialization : [m.specialization]).map((s, j) => (
                    <Badge key={j} variant="outline" className="border-white/8 text-stellar-dim font-mono text-[8px]">{s}</Badge>
                  ))}
                </div>
              )}

              {/* NPS */}
              {stats && stats.nps_score !== undefined && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl mb-3">
                  <ThumbsUp size={14} className={stats.nps_score >= 50 ? "text-emerald-400" : stats.nps_score >= 0 ? "text-amber-400" : "text-red-400"} />
                  <div className="flex-1">
                    <span className="font-mono text-[8px] text-stellar-dim/50 uppercase">NPS Score</span>
                    <p className={`font-mono text-sm font-bold ${stats.nps_score >= 50 ? "text-emerald-400" : stats.nps_score >= 0 ? "text-amber-400" : "text-red-400"}`}>
                      {stats.nps_score > 0 ? "+" : ""}{stats.nps_score}
                    </p>
                  </div>
                  <Badge className={`font-mono text-[7px] ${
                    stats.nps_score >= 50 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                    : stats.nps_score >= 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                    : "bg-red-500/10 text-red-400 border border-red-500/15"
                  }`}>{stats.nps_score >= 50 ? "Excellent" : stats.nps_score >= 0 ? "Good" : "Needs Improvement"}</Badge>
                </div>
              )}

              {/* Recent reviews */}
              {stats?.reviews?.slice(0, 2).map((r) => (
                <div key={r.id} className="flex items-start gap-2 p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-lg mb-1.5">
                  <MessageSquare size={12} className="text-stellar-dim/40 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} size={9} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-stellar-dim/20"} />)}
                      </div>
                      <span className="font-mono text-[7px] text-stellar-dim/40">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.review_text && <p className="font-body text-[11px] text-stellar-dim truncate">{r.review_text}</p>}
                  </div>
                </div>
              ))}

              {/* Quick actions — Practo-style CTAs */}
              <div className="flex gap-2 mt-3">
                <Button size="sm" data-testid={`chat-${i}`}
                  onClick={() => navigate("/chat")}
                  className="bg-[#7B35D8] hover:bg-[#6B2BC8] text-white font-mono text-[9px] flex-1">
                  <MessageSquare size={11} className="mr-1" /> Chat
                </Button>
                <Button size="sm" data-testid={`video-book-${i}`}
                  onClick={() => navigate("/video-consultation")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] flex-1">
                  <Video size={11} className="mr-1" /> Book Video
                </Button>
                <Button size="sm" variant="outline" data-testid={`quick-book-${i}`}
                  onClick={() => { setBookingForm(p => ({...p, member_index: i})); setShowBooking(true); setShowReview(false); }}
                  className="border-white/8 text-stellar-dim font-mono text-[9px]">
                  <Calendar size={11} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <div className="glass-premium rounded-2xl p-5" data-testid="appointments-list">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-cosmic" />
            <h3 className="font-display text-sm font-bold text-stellar">Appointments</h3>
            <Badge className="bg-white/5 text-stellar-dim font-mono text-[8px] border border-white/5 ml-auto">{appointments.length}</Badge>
          </div>
         <div className="space-y-2">
  {appointments.map((a) => (
    <div key={a.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-cosmic/10 border border-cosmic/15 flex items-center justify-center shrink-0">
        <Clock size={16} className="text-cosmic" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-medium text-stellar">{a.member_name}</p>
        <p className="font-mono text-[8px] text-stellar-dim">{a.appointment_type} &middot; {a.reason || "General"}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-xs text-stellar">{a.date}</p>
        <p className="font-mono text-[9px] text-cosmic">{a.time}</p>
      </div>
      <Badge className={`font-mono text-[7px] ${a.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-amber-500/10 text-amber-400 border border-amber-500/15"}`}>
        {a.status}
      </Badge>
      
      {/* Join button - only shown if google_meet_link exists */}
      {a.google_meet_link && (
        <button
          onClick={() => window.open(a.google_meet_link, '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-1 font-mono text-[8px] text-blue-400  px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 transition-all shrink-0"
        >
          <Video size={11} /> Join
        </button>
      )}
    </div>
  ))}
</div>
        </div>
      )}
    </div>
  );
}
