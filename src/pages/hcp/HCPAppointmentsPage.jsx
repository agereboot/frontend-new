import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Calendar, Clock, FileText, Video, MapPin, User,
  Plus, CheckCircle, XCircle, ArrowRight, Phone,
  UserPlus, RefreshCcw, DollarSign,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const STATUS_MAP = {
  scheduled: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Scheduled" },
  checked_in: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Checked In" },
  in_progress: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "In Progress" },
  completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Completed" },
  cancelled: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Cancelled" },
  no_show: { color: "bg-slate-500/10 text-slate-400 border-slate-500/20", label: "No Show" },
};

const TYPE_BADGE = {
  new: { color: "bg-[#7B35D8]/10 text-[#7B35D8] border-[#7B35D8]/20", label: "New Patient" },
  follow_up: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Follow-up" },
  review: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Review" },
  annual: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Annual" },
};

export default function HCPAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    member_id: "", appointment_type: "follow_up", mode: "physical",
    scheduled_at: "", duration_min: 30, fee_type: "paid", fee_amount: 150, reason: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchAppointments = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    Promise.all([
      api.get(`/emr/appointments${params}`),
      api.get("/cc/members"),
    ]).then(([aRes, mRes]) => {
      setAppointments(aRes.data.appointments || []);
      console.log("Fetched appointments:", aRes.data.appointments); // Debug log/
      setMembers(mRes.data.members || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [statusFilter]);

  const createAppt = async () => {
    if (!form.member_id) return;
    setCreating(true);
    try {
      const res = await api.post("/emr/appointments/create", form);
      setAppointments(prev => [...prev, res.data].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
      setShowCreate(false);
      setForm({ member_id: "", appointment_type: "follow_up", mode: "physical", scheduled_at: "", duration_min: 30, fee_type: "paid", fee_amount: 150, reason: "" });
      toast.success("Appointment created");
    } catch { toast.error("Failed"); } finally { setCreating(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.put(`/emr/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? res.data : a));
      toast.success(`Updated to ${status}`);
    } catch { toast.error("Failed"); }
  };

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
  };
  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }); } catch { return "—"; }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="appointments-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#7B35D8]">Appointments</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">
            {appointments.length} Appointments &middot; Earliest First
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="refresh-appts" onClick={fetchAppointments} size="sm"
            className="bg-white/5 text-white border border-white/10 hover:bg-white/10 font-mono text-[9px]">
            <RefreshCcw size={12} className="mr-1" /> Refresh
          </Button>
          <Button data-testid="new-appt-btn" onClick={() => setShowCreate(true)} size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white font-mono text-[9px]">
            <Plus size={12} className="mr-1" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap" data-testid="appt-status-filters">
        <button onClick={() => setStatusFilter("")}
          className={`font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${!statusFilter ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "border-white/5 text-slate-500 "}`}>
          All
        </button>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button key={k} onClick={() => setStatusFilter(statusFilter === k ? "" : k)}
            className={`font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${statusFilter === k ? v.color : "border-white/5 text-slate-500 "}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Create Appointment Form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-500/20 bg-black/30 p-5 space-y-4" data-testid="create-appt-form">
          <h3 className="font-display text-lg font-bold text-white">Schedule Appointment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Member</label>
              <AppSelect data-testid="appt-member" value={form.member_id}
                onChange={e => setForm(prev => ({ ...prev, member_id: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none font-body">
                <AppSelectOption value="">Select...</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Type</label>
              <AppSelect data-testid="appt-type" value={form.appointment_type}
                onChange={e => setForm(prev => ({ ...prev, appointment_type: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none font-body">
                <AppSelectOption value="new">New Patient</AppSelectOption>
                <AppSelectOption value="follow_up">Follow-up</AppSelectOption>
                <AppSelectOption value="review">Review</AppSelectOption>
                <AppSelectOption value="annual">Annual</AppSelectOption>
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Mode</label>
              <AppSelect data-testid="appt-mode" value={form.mode}
                onChange={e => setForm(prev => ({ ...prev, mode: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none font-body">
                <AppSelectOption value="physical">Physical</AppSelectOption>
                <AppSelectOption value="telehealth">Telehealth</AppSelectOption>
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Date & Time</label>
              <input data-testid="appt-datetime" type="datetime-local" value={form.scheduled_at}
                onChange={e => setForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none font-body" />
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Fee Type</label>
              <AppSelect data-testid="appt-fee" value={form.fee_type}
                onChange={e => setForm(prev => ({ ...prev, fee_type: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none font-body">
                <AppSelectOption value="paid">Paid</AppSelectOption>
                <AppSelectOption value="free">Free</AppSelectOption>
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Duration (min)</label>
              <input data-testid="appt-duration" type="number" value={form.duration_min}
                onChange={e => setForm(prev => ({ ...prev, duration_min: parseInt(e.target.value) || 30 }))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none font-mono" />
            </div>
          </div>
          <textarea data-testid="appt-reason" value={form.reason} placeholder="Reason for visit..."
            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-blue-500 focus:outline-none font-body resize-none placeholder:text-slate-600" rows={2} />
          <div className="flex gap-3">
            <Button onClick={() => setShowCreate(false)} variant="outline"
              className="flex-1 border-white/10 text-slate-300 hover:bg-white/5 font-body text-xs">Cancel</Button>
            <Button data-testid="save-appt" onClick={createAppt} disabled={!form.member_id || creating}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-body text-xs font-semibold">
              {creating ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden" data-testid="appointments-list">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
          <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Time</span>
          <span className="col-span-3 font-mono text-[7px] text-slate-500 uppercase">Patient</span>
          <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase">Type</span>
          <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Mode</span>
          <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Fee</span>
          <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase">Status</span>
          <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase text-right">Actions</span>
        </div>

        {appointments.map((appt) => {
          const st = STATUS_MAP[appt.status] || STATUS_MAP.scheduled;
          const tp = TYPE_BADGE[appt.appointment_type] || TYPE_BADGE.follow_up;
          return (
            <div key={appt.id} data-testid={`appt-row-${appt.id}`}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all items-center">
              {/* Time */}
              <div className="col-span-1">
                <span className="font-mono text-xs text-white font-bold">{formatTime(appt.scheduled_at)}</span>
                <p className="font-mono text-[7px] text-slate-500">{formatDate(appt.scheduled_at)}</p>
              </div>
              {/* Patient Name — clickable to Smart EMR */}
              <div className="col-span-3">
                <button data-testid={`appt-name-${appt.id}`}
                  onClick={() => navigate(`/hcp/smart-emr/${appt.member_id}?appointment=${appt.id}`)}
                  className="text-left group">
                  <div className="flex items-center gap-2">
                    {appt.is_new_patient ? (
                      <UserPlus size={12} className="text-[#7B35D8] shrink-0" />
                    ) : (
                      <User size={12} className="text-blue-400 shrink-0" />
                    )}
                    <span className="font-body text-sm text-white group-hover:text-blue-400 transition-colors">{appt.member_name}</span>
                  </div>
                  {appt.reason && <p className="font-mono text-[7px] text-slate-500 mt-0.5 ml-5 truncate max-w-[200px]">{appt.reason}</p>}
                </button>
              </div>
              {/* Type */}
              <div className="col-span-2">
                <Badge className={`font-mono text-[7px] ${tp.color}`}>{tp.label}</Badge>
              </div>
              {/* Mode */}
              <div className="col-span-1 flex items-center gap-1">
                {appt.mode === "telehealth" ? (
                  <><Video size={11} className="text-blue-400" /><span className="font-mono text-[8px] text-blue-400">Tele</span></>
                ) : (
                  <><MapPin size={11} className="text-emerald-400" /><span className="font-mono text-[8px] text-emerald-400">In-person</span></>
                )}
              </div>
              {/* Fee */}
              <div className="col-span-1">
                {appt.fee_type === "free" ? (
                  <Badge className="font-mono text-[6px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Free</Badge>
                ) : (
                  <span className="flex items-center gap-0.5 font-mono text-[8px] text-amber-400">
                    <DollarSign size={9} />{appt.fee_amount || "Paid"}
                  </span>
                )}
              </div>
              {/* Status */}
              <div className="col-span-2">
                <Badge className={`font-mono text-[7px] ${st.color}`}>{st.label}</Badge>
              </div>
              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1.5">
              {appt.mode === "telehealth" && ["scheduled", "checked_in", "in_progress"].includes(appt.status) && (
  <button
    data-testid={`telecall-${appt.id}`}
    onClick={() => window.open(appt.google_meet_link, '_blank')}  // Opens in new tab
    className="flex items-center gap-1 font-mono text-[8px] text-blue-400  px-2 py-1 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 transition-all"
  >
    <Video size={11} /> Join
  </button>
)}
                <button data-testid={`emr-btn-${appt.id}`}
                  onClick={() => navigate(`/hcp/smart-emr/${appt.member_id}?appointment=${appt.id}`)}
                  className="flex items-center gap-1 font-mono text-[8px] text-[#7B35D8]  px-2 py-1 rounded-lg border border-[#7B35D8]/20 hover:bg-[#7B35D8]/10 transition-all">
                  <FileText size={11} /> EMR
                </button>
                {appt.status === "scheduled" && (
                  <button data-testid={`checkin-${appt.id}`}
                    onClick={() => updateStatus(appt.id, "checked_in")}
                    className="font-mono text-[8px] text-emerald-400  px-2 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10 transition-all">
                    <CheckCircle size={11} />
                  </button>
                )}
                {["scheduled", "checked_in"].includes(appt.status) && (
                  <button data-testid={`cancel-appt-${appt.id}`}
                    onClick={() => updateStatus(appt.id, "cancelled")}
                    className="font-mono text-[8px] text-red-400  px-1.5 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all">
                    <XCircle size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={40} className="text-blue-500/20 mx-auto mb-3" />
            <p className="font-body text-sm text-slate-400">No appointments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
