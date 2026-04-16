import { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { MapPin, Clock, User, Phone, CheckCircle, Truck, FlaskConical, Package, Navigation, ChevronRight, BarChart3, Scan } from "lucide-react";

const STATUS_ACTIONS = {
  accepted: { label: "Start Route", next: "en_route", icon: Navigation, color: "bg-blue-600" },
  en_route: { label: "Arrived at Location", next: "arrived", icon: MapPin, color: "bg-amber-600" },
  arrived: { label: "Verify Patient Identity", next: "verify", icon: User, color: "bg-purple-600" },
  identity_verified: { label: "Collect Sample", next: "collect", icon: FlaskConical, color: "bg-teal-600" },
  sample_collected: { label: "Dispatch to Lab", next: "dispatch", icon: Package, color: "bg-indigo-600" },
  dispatched: { label: "Delivered to Lab", next: "delivered", icon: CheckCircle, color: "bg-emerald-600" },
};

function JobCard({ job, onAction, expanded, onExpand }) {
  const action = STATUS_ACTIONS[job.status];
  return (
    <div className={`bg-[#12122A] border rounded-xl overflow-hidden transition-all ${expanded ? "border-[#7B35D8]" : "border-[#1E1E3A]"}`} data-testid={`job-${job.id}`}>
      <div className="p-4 cursor-pointer" onClick={onExpand}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">{job.patient_name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#7B35D8]/20 text-[#7B35D8]">{job.status.replace(/_/g, " ")}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock size={11} /> {job.preferred_slot}</span>
          <span className="flex items-center gap-1"><MapPin size={11} /> {job.address?.city || "N/A"}</span>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#1E1E3A] pt-3">
          <div className="text-xs text-slate-400 space-y-1">
            <div><span className="text-slate-500">Address:</span> {job.address?.address_line || "—"}, {job.address?.city}</div>
            <div><span className="text-slate-500">Phone:</span> {job.patient_phone || "—"}</div>
            {job.fasting_required && <div className="text-amber-400">Fasting required</div>}
            {job.special_instructions && <div><span className="text-slate-500">Notes:</span> {job.special_instructions}</div>}
            {job.barcode && <div className="flex items-center gap-1"><Scan size={11} /> <span className="text-[#7B35D8] font-mono">{job.barcode}</span></div>}
          </div>
          {action && (
            <button onClick={() => onAction(job.id, action.next)} data-testid={`action-${job.id}`}
              className={`w-full ${action.color} hover:opacity-90 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all`}>
              <action.icon size={14} /> {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PendingJobCard({ job, onAccept, onDecline }) {
  return (
    <div className="bg-[#12122A] border border-amber-500/30 rounded-xl p-4" data-testid={`pending-${job.id}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">{job.patient_name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">New Job</span>
      </div>
      <div className="text-xs text-slate-400 space-y-1 mb-3">
        <div className="flex items-center gap-1"><Clock size={11} /> {job.preferred_date} {job.preferred_slot}</div>
        <div className="flex items-center gap-1"><MapPin size={11} /> {job.address?.address_line}, {job.address?.city}</div>
        {job.fasting_required && <div className="text-amber-400">Fasting required</div>}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAccept(job.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium">Accept</button>
        <button onClick={() => onDecline(job.id)} className="flex-1 bg-[#1E1E3A] hover:bg-[#2A2A4A] text-slate-300 py-2 rounded-lg text-sm font-medium">Decline</button>
      </div>
    </div>
  );
}

export default function PhlebotomistDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("today");
  const [pendingJobs, setPendingJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [expandedJob, setExpandedJob] = useState(null);
  const [verifyData, setVerifyData] = useState({ patient_name: "", patient_dob: "" });
  const [showVerify, setShowVerify] = useState(null);

  const loadData = () => {
    api.get("/api/phlebotomist/jobs/pending").then(r => setPendingJobs(r.data.jobs || [])).catch(() => {});
    api.get("/api/phlebotomist/jobs/active").then(r => setActiveJobs(r.data.jobs || [])).catch(() => {});
    api.get("/api/phlebotomist/stats").then(r => setStats(r.data)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleAccept = async (jobId) => {
    try {
      await api.post(`/api/phlebotomist/job/${jobId}/accept`);
      loadData();
    } catch {}
  };

  const handleDecline = async (jobId) => {
    try {
      await api.post(`/api/phlebotomist/job/${jobId}/decline`, { reason: "Not available" });
      loadData();
    } catch {}
  };

  const handleAction = async (jobId, action) => {
    if (action === "verify") { setShowVerify(jobId); return; }
    const endpoints = {
      en_route: `/api/phlebotomist/job/${jobId}/en-route`,
      arrived: `/api/phlebotomist/job/${jobId}/arrived`,
      collect: `/api/phlebotomist/job/${jobId}/collect-sample`,
      dispatch: `/api/phlebotomist/job/${jobId}/dispatch`,
      delivered: `/api/phlebotomist/job/${jobId}/delivered`,
    };
    try {
      await api.post(endpoints[action], {});
      loadData();
    } catch {}
  };

  const handleVerify = async () => {
    try {
      await api.post(`/api/phlebotomist/job/${showVerify}/verify-identity`, verifyData);
      setShowVerify(null);
      setVerifyData({ patient_name: "", patient_dob: "" });
      loadData();
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="phlebotomist-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Collection Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Welcome, {user?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.today_completed || 0}</div>
          <div className="text-xs text-slate-500">Completed Today</div>
        </div>
        <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.today_pending || 0}</div>
          <div className="text-xs text-slate-500">Pending Today</div>
        </div>
        <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-[#7B35D8]">{stats.total_collections || 0}</div>
          <div className="text-xs text-slate-500">Total All-Time</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1E1E3A]">
        {[
          { key: "today", label: `Active (${activeJobs.length})` },
          { key: "pending", label: `New Jobs (${pendingJobs.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === t.key ? "border-[#7B35D8] text-[#7B35D8]" : "border-transparent text-slate-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Verify Modal */}
      {showVerify && (
        <div className="bg-[#12122A] border border-[#7B35D8] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Verify Patient Identity</h3>
          <input placeholder="Patient Full Name" value={verifyData.patient_name}
            onChange={e => setVerifyData(p => ({ ...p, patient_name: e.target.value }))}
            className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm" />
          <input placeholder="Date of Birth (YYYY-MM-DD)" type="date" value={verifyData.patient_dob}
            onChange={e => setVerifyData(p => ({ ...p, patient_dob: e.target.value }))}
            className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm" />
          <div className="flex gap-2">
            <button onClick={() => setShowVerify(null)} className="flex-1 bg-[#1E1E3A] text-slate-300 py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={handleVerify} className="flex-1 bg-[#7B35D8] text-white py-2 rounded-lg text-sm font-medium">Verify</button>
          </div>
        </div>
      )}

      {/* Job Lists */}
      {tab === "today" && (
        <div className="space-y-3">
          {activeJobs.length === 0 && <div className="text-center text-slate-500 py-8">No active jobs right now.</div>}
          {activeJobs.map(j => (
            <JobCard key={j.id} job={j} onAction={handleAction}
              expanded={expandedJob === j.id} onExpand={() => setExpandedJob(expandedJob === j.id ? null : j.id)} />
          ))}
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-3">
          {pendingJobs.length === 0 && <div className="text-center text-slate-500 py-8">No new jobs available.</div>}
          {pendingJobs.map(j => (
            <PendingJobCard key={j.id} job={j} onAccept={handleAccept} onDecline={handleDecline} />
          ))}
        </div>
      )}
    </div>
  );
}
