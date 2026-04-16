import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  HeartPulse, Activity, Wind, Scale, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Calendar, Clock, Video, MapPin, FileText, Pill, Check, AlertCircle, RefreshCw,
  Mail, X, Target, Dumbbell, Apple, Eye, Brain, Stethoscope, Scissors, Moon as MoonIcon, Heart
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const VITAL_ICONS = { "heart-pulse": HeartPulse, "activity": Activity, "wind": Wind, "scale": Scale };
const TREND_ICONS = { improving: TrendingUp, deteriorating: TrendingDown, stable: Minus };
const TREND_COLORS = { improving: "#0F9F8F", deteriorating: "#EF4444", stable: "#D97706" };
const STATUS_COLORS = { improving: "#0F9F8F", stable: "#D97706", deteriorating: "#EF4444" };
const CAT_ICONS = { movement: Dumbbell, nutrition: Apple, monitoring: Eye, medication: Pill, exercise: Dumbbell, review: FileText, wellness: Heart };

export default function HealthOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCond, setExpandedCond] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookForm, setBookForm] = useState({ service: "", mode: "virtual", date: "", time: "10:00 AM", notes: "" });
  const [booking, setBooking] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "" });
  const [sendingDigest, setSendingDigest] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/health/overview");
      setData(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogMed = async (medId) => {
    try {
      const res = await api.post(`/health/medications/${medId}/log`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to log"); }
  };

  const handleBook = async () => {
    if (!bookForm.service || !bookForm.date) { toast.error("Select service and date"); return; }
    setBooking(true);
    try {
      await api.post("/health/appointments/book", bookForm);
      toast.success("Appointment booked!");
      setBookingOpen(false);
      setBookForm({ service: "", mode: "virtual", date: "", time: "10:00 AM", notes: "" });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to book"); } finally { setBooking(false); }
  };

  const handleReschedule = async (aptId) => {
    if (!rescheduleForm.date) { toast.error("Select new date"); return; }
    try {
      await api.put(`/health/appointments/${aptId}/reschedule`, rescheduleForm);
      toast.success("Appointment rescheduled!");
      setRescheduleId(null);
      fetchData();
    } catch (err) { toast.error("Failed to reschedule"); }
  };

  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await api.post("/health/digest/send");
      toast.success(res.data.message);
    } catch (err) { toast.error("Failed to send digest"); } finally { setSendingDigest(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full" data-testid="health-loading">
      <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-stellar-dim text-center py-20">Failed to load health data.</div>;

  return (
    <div className="space-y-5 animate-slide-up" data-testid="health-overview-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Health <span className="text-cosmic">Overview</span>
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            Complete health snapshot &middot; {user?.name}
          </p>
        </div>
        <Button data-testid="send-digest-btn" onClick={handleSendDigest} disabled={sendingDigest}
          className="bg-cosmic/10 hover:bg-cosmic/20 text-cosmic border border-cosmic/20 font-mono text-xs">
          <Mail size={14} className="mr-2" />
          {sendingDigest ? "Sending..." : "Send Health Digest"}
        </Button>
      </div>

      {/* Row 1: HPS Snapshot + Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* HPS Snapshot */}
        <div className="lg:col-span-3 glass-card rounded-lg p-5 text-center cosmic-glow" data-testid="hps-snapshot">
          <p className="font-mono text-[9px] tracking-[0.2em] text-stellar-dim uppercase mb-2">Latest HPS</p>
          <p className="font-display text-5xl font-black text-cosmic">{data.hps_score?.score || "—"}</p>
          <Badge variant="outline" className="mt-2 border-cosmic/30 text-cosmic font-mono text-[10px]">
            {data.hps_score?.tier || "Compute First"}
          </Badge>
          {data.hps_score?.timestamp && (
            <p className="font-mono text-[9px] text-stellar-dim mt-2">
              {new Date(data.hps_score.timestamp).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Vitals Grid */}
        <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="vitals-panel">
          {data.vitals?.map((v) => {
            const Icon = VITAL_ICONS[v.icon] || HeartPulse;
            const TIcon = TREND_ICONS[v.trend] || Minus;
            return (
              <div key={v.code} className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={16} className="text-cosmic" />
                  <div className="flex items-center gap-1" style={{ color: TREND_COLORS[v.trend] }}>
                    <TIcon size={12} />
                    <span className="font-mono text-[9px] uppercase">{v.trend}</span>
                  </div>
                </div>
                <p className="font-mono text-2xl font-black text-stellar">{v.value}</p>
                <p className="font-mono text-[9px] text-stellar-dim">{v.unit}</p>
                <p className="font-body text-[11px] text-stellar-dim mt-1 truncate">{v.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Active Medical Conditions */}
      <div className="glass-card rounded-lg p-5" data-testid="medical-conditions">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-cosmic" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Active Medical Conditions</p>
          </div>
          <Badge variant="outline" className="border-white/10 text-stellar-dim font-mono text-[9px]">
            {data.conditions?.length || 0} conditions
          </Badge>
        </div>
        <div className="space-y-3">
          {data.conditions?.map((cond) => {
            const isExpanded = expandedCond === cond.code;
            const statusColor = STATUS_COLORS[cond.status] || "#D97706";
            const plan = cond.care_plan || {};
            return (
              <div key={cond.code} className="border border-white/5 rounded-lg overflow-hidden" data-testid={`condition-${cond.code}`}>
                {/* Header */}
                <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedCond(isExpanded ? null : cond.code)}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                    <div className="text-left">
                      <p className="font-body text-sm font-medium text-stellar">{cond.name}</p>
                      <p className="font-mono text-[9px] text-stellar-dim">
                        ICD-10: {cond.icd10} &middot; Diagnosed {cond.diagnosed_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-[9px]"
                      style={{ borderColor: statusColor + "40", color: statusColor }}>
                      {cond.status?.toUpperCase()}
                    </Badge>
                    {plan.total_hps_potential > 0 && (
                      <Badge variant="outline" className="border-cosmic/30 text-cosmic font-mono text-[9px]">
                        +{plan.total_hps_potential} HPS potential
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-stellar-dim" /> : <ChevronDown size={16} className="text-stellar-dim" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4 bg-white/[0.01]">
                    {/* Care Plan Goal */}
                    {plan.goal && (
                      <div className="bg-cosmic/5 border border-cosmic/10 rounded-md p-3">
                        <p className="font-mono text-[9px] text-cosmic uppercase tracking-wider mb-1">Care Plan Goal</p>
                        <p className="font-body text-sm text-stellar">{plan.goal}</p>
                      </div>
                    )}

                    {/* Daily & Weekly Activities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.daily_activities?.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-2">Daily Activities</p>
                          <div className="space-y-1.5">
                            {plan.daily_activities.map((act, i) => {
                              const AIcon = CAT_ICONS[act.category] || Target;
                              return (
                                <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-sm border border-white/5">
                                  <AIcon size={12} className="text-stellar-dim shrink-0" />
                                  <span className="font-body text-xs text-stellar flex-1">{act.action}</span>
                                  {act.measurable && act.hps_impact ? (
                                    <Badge variant="outline" className="border-aurora/30 text-aurora font-mono text-[8px] shrink-0">
                                      +{act.hps_impact} HPS
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-white/10 text-stellar-dim/60 font-mono text-[8px] shrink-0">
                                      lifestyle
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {plan.weekly_activities?.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-2">Weekly Activities</p>
                          <div className="space-y-1.5">
                            {plan.weekly_activities.map((act, i) => {
                              const AIcon = CAT_ICONS[act.category] || Target;
                              return (
                                <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-sm border border-white/5">
                                  <AIcon size={12} className="text-stellar-dim shrink-0" />
                                  <span className="font-body text-xs text-stellar flex-1">{act.action}</span>
                                  {act.measurable && act.hps_impact ? (
                                    <Badge variant="outline" className="border-aurora/30 text-aurora font-mono text-[8px] shrink-0">
                                      +{act.hps_impact} HPS
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-white/10 text-stellar-dim/60 font-mono text-[8px] shrink-0">
                                      lifestyle
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Biomarker Trends */}
                    {cond.biomarker_trends?.length > 0 && (
                      <div>
                        <p className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider mb-2">Relevant Biomarkers</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {cond.biomarker_trends.map((bt) => (
                            <div key={bt.code} className="bg-white/[0.03] border border-white/5 rounded-sm p-2.5">
                              <p className="font-mono text-[8px] text-stellar-dim uppercase truncate">{bt.name}</p>
                              <p className="font-mono text-lg font-bold text-stellar">{bt.latest} <span className="text-[9px] text-stellar-dim">{bt.unit}</span></p>
                              {bt.values?.length > 1 && (
                                <div className="flex gap-0.5 mt-1 h-4 items-end">
                                  {bt.values.map((v, i) => (
                                    <div key={i} className="flex-1 bg-cosmic/40 rounded-[1px]"
                                      style={{ height: `${Math.max(15, (v / Math.max(...bt.values)) * 100)}%` }} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Appointments + Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appointments */}
        <div className="glass-card rounded-lg p-5" data-testid="appointments-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-cosmic" />
              <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Appointments</p>
            </div>
            <Button data-testid="book-appointment-btn" onClick={() => setBookingOpen(true)} size="sm"
              className="bg-cosmic/10 hover:bg-cosmic/20 text-cosmic border border-cosmic/20 font-mono text-[10px] h-7">
              Book New
            </Button>
          </div>

          {/* Upcoming Appointments */}
          {data.appointments?.map((apt) => (
            <div key={apt.id} className="bg-white/[0.03] border border-white/5 rounded-md p-3 mb-2" data-testid={`appointment-${apt.id}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-body text-sm font-medium text-stellar">{apt.service_name}</span>
                <Badge variant="outline" className="font-mono text-[8px] border-aurora/30 text-aurora">{apt.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-stellar-dim font-mono text-[10px]">
                <span className="flex items-center gap-1"><Calendar size={10} /> {apt.date}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {apt.time}</span>
                <span className="flex items-center gap-1">
                  {apt.mode === "virtual" ? <Video size={10} /> : <MapPin size={10} />}
                  {apt.mode}
                </span>
              </div>
              <p className="font-mono text-[9px] text-stellar-dim mt-1">{apt.provider}</p>
              {apt.notes && <p className="font-body text-[11px] text-stellar-dim mt-1 italic">{apt.notes}</p>}
              <div className="mt-2 flex gap-2">
                {rescheduleId === apt.id ? (
                  <div className="flex gap-2 items-center flex-1">
                    <input type="date" value={rescheduleForm.date} onChange={e => setRescheduleForm(p => ({...p, date: e.target.value}))}
                      className="bg-space border border-white/10 text-stellar text-xs rounded px-2 py-1 flex-1" />
                    <input type="text" value={rescheduleForm.time} onChange={e => setRescheduleForm(p => ({...p, time: e.target.value}))}
                      placeholder="10:00 AM" className="bg-space border border-white/10 text-stellar text-xs rounded px-2 py-1 w-24" />
                    <Button size="sm" onClick={() => handleReschedule(apt.id)} className="bg-cosmic text-white text-[10px] h-6 px-3">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRescheduleId(null)} className="text-stellar-dim text-[10px] h-6 px-2">Cancel</Button>
                  </div>
                ) : (
                  <Button data-testid={`reschedule-${apt.id}`} size="sm" variant="ghost"
                    onClick={() => { setRescheduleId(apt.id); setRescheduleForm({ date: apt.date, time: apt.time }); }}
                    className="text-cosmic text-[10px] h-6 px-2 font-mono">
                    <RefreshCw size={10} className="mr-1" /> Reschedule
                  </Button>
                )}
              </div>
            </div>
          ))}
          {(!data.appointments || data.appointments.length === 0) && (
            <p className="text-stellar-dim text-xs text-center py-4 font-body">No upcoming appointments</p>
          )}
        </div>

        {/* Medications */}
        <div className="glass-card rounded-lg p-5" data-testid="medications-section">
          <div className="flex items-center gap-2 mb-4">
            <Pill size={16} className="text-cosmic" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Medications</p>
          </div>
          <div className="space-y-2">
            {data.medications?.map((med) => (
              <div key={med.id} className={`border rounded-md p-3 transition-colors ${med.taken_today ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.03] border-white/5"}`}
                data-testid={`medication-${med.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Pill size={13} className={med.taken_today ? "text-emerald-400" : "text-stellar-dim"} />
                    <span className="font-body text-sm font-medium text-stellar">{med.name}</span>
                  </div>
                  {med.taken_today ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-[8px]">
                      <Check size={8} className="mr-1" /> Taken
                    </Badge>
                  ) : (
                    <Button data-testid={`log-med-${med.id}`} size="sm" onClick={() => handleLogMed(med.id)}
                      className="bg-cosmic/10 hover:bg-cosmic/20 text-cosmic border border-cosmic/20 font-mono text-[9px] h-6 px-2">
                      Log (+{med.compliance_reward}cr)
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono text-[9px] text-stellar-dim mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={9} /> {med.schedule === "morning" ? "AM" : "PM"} &middot; {med.time}
                  </span>
                  <span>{med.with_food ? "With food" : "Empty stomach"}</span>
                  <span className="text-stellar-dim/50">{med.condition}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="font-body text-[10px] text-stellar-dim/70 italic">{med.instructions}</p>
                  <span className="font-mono text-[8px] text-stellar-dim shrink-0 ml-2">
                    Refill: {med.refill_remaining}d ({med.refill_date})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Latest Lab Reports */}
      <div className="glass-card rounded-lg p-5" data-testid="lab-reports">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-cosmic" />
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase">Latest Lab Reports</p>
        </div>
        {data.lab_reports?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.lab_reports.map((lr, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-sm p-3">
                <p className="font-mono text-[8px] text-stellar-dim uppercase truncate tracking-wider">{lr.name || lr.biomarker_code}</p>
                <p className="font-mono text-lg font-bold text-stellar mt-1">{typeof lr.value === "number" ? lr.value.toFixed(1) : lr.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[9px] text-stellar-dim">{lr.unit}</span>
                  <Badge variant="outline" className="font-mono text-[7px] border-white/10 text-stellar-dim">{lr.source}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stellar-dim text-xs text-center py-4 font-body">No lab reports yet. Upload via Biomarkers & Reports.</p>
        )}
      </div>

      {/* Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="booking-modal">
          <div className="glass-card rounded-lg p-6 w-full max-w-lg mx-4 border border-cosmic/20 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-stellar">Book Appointment</h3>
              <button onClick={() => setBookingOpen(false)} className="text-stellar-dim hover:text-stellar"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider block mb-1">Service</label>
                <AppSelect data-testid="booking-service" value={bookForm.service}
                  onChange={e => setBookForm(p => ({...p, service: e.target.value}))}
                  className="w-full bg-space border border-white/10 text-stellar text-sm rounded-md p-2.5 outline-none focus:border-cosmic/50">
                  <AppSelectOption value="">Select a service...</AppSelectOption>
                  {data.services?.map(s => (
                    <AppSelectOption key={s.code} value={s.code}>{s.name} ({s.duration}min)</AppSelectOption>
                  ))}
                </AppSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider block mb-1">Mode</label>
                  <AppSelect value={bookForm.mode} onChange={e => setBookForm(p => ({...p, mode: e.target.value}))}
                    className="w-full bg-space border border-white/10 text-stellar text-sm rounded-md p-2.5 outline-none focus:border-cosmic/50">
                    <AppSelectOption value="virtual">Virtual</AppSelectOption>
                    <AppSelectOption value="physical">Physical</AppSelectOption>
                  </AppSelect>
                </div>
                <div>
                  <label className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider block mb-1">Date</label>
                  <input data-testid="booking-date" type="date" value={bookForm.date}
                    onChange={e => setBookForm(p => ({...p, date: e.target.value}))}
                    className="w-full bg-space border border-white/10 text-stellar text-sm rounded-md p-2.5 outline-none focus:border-cosmic/50" />
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider block mb-1">Time</label>
                <input type="text" value={bookForm.time} onChange={e => setBookForm(p => ({...p, time: e.target.value}))}
                  placeholder="10:00 AM" className="w-full bg-space border border-white/10 text-stellar text-sm rounded-md p-2.5 outline-none focus:border-cosmic/50" />
              </div>
              <div>
                <label className="font-mono text-[9px] text-stellar-dim uppercase tracking-wider block mb-1">Notes (optional)</label>
                <textarea value={bookForm.notes} onChange={e => setBookForm(p => ({...p, notes: e.target.value}))}
                  placeholder="Reason for visit..." rows={2}
                  className="w-full bg-space border border-white/10 text-stellar text-sm rounded-md p-2.5 outline-none focus:border-cosmic/50 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setBookingOpen(false)} className="flex-1 border-white/10 text-stellar-dim">Cancel</Button>
              <Button data-testid="confirm-booking-btn" onClick={handleBook} disabled={booking}
                className="flex-1 bg-cosmic hover:bg-cosmic-light text-white font-display font-bold">
                {booking ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
