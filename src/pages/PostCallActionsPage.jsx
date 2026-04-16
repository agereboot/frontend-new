import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { FlaskConical, Pill, Calendar, Stethoscope, Target, MessageSquare, FileBarChart, CheckCircle, ChevronRight, FileText, UserPlus, ClipboardList } from "lucide-react";

const ICON_MAP = {
  flask: FlaskConical, pill: Pill, calendar: Calendar, stethoscope: Stethoscope,
  target: Target, message: MessageSquare, "file-bar-chart": FileBarChart,
  "file-text": FileText, "user-plus": UserPlus, "clipboard-list": ClipboardList,
};
const PRIORITY_STYLE = {
  high: "border-l-red-400 bg-red-500/5",
  medium: "border-l-amber-400 bg-amber-500/5",
  low: "border-l-slate-500 bg-slate-500/5",
};

const DEFAULT_ACTIONS = [
  { type: "diagnostic_requisition", label: "Book Lab Test", description: "Order diagnostic tests with home sample collection.", route: "/book-lab-test", priority: "high", icon: "flask" },
  { type: "e_prescription", label: "View Prescriptions", description: "Review your active medications and prescriptions.", route: "/biomarkers", priority: "medium", icon: "pill" },
  { type: "follow_up", label: "Schedule Follow-Up", description: "Book your next consultation to track progress.", route: "/video-consultation", priority: "medium", icon: "calendar" },
  { type: "cross_consultation", label: "Cross-Consultation Referral", description: "Get referred to a specialist for further evaluation.", route: "/video-consultation", priority: "medium", icon: "stethoscope" },
  { type: "longevity_protocol", label: "View Longevity Plan", description: "Your personalised 3/6/9 month health plan.", route: "/longevity-protocol", priority: "low", icon: "target" },
  { type: "chat_doctor", label: "Message Your Doctor", description: "Have follow-up questions? Chat with your doctor.", route: "/chat", priority: "low", icon: "message" },
  { type: "view_reports", label: "View Lab Reports", description: "Review your latest lab results and biomarker analysis.", route: "/lab-reports", priority: "low", icon: "file-bar-chart" },
];

export default function PostCallActionsPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (consultationId) {
      api.post(`/api/longevity-protocol/post-call-actions/${consultationId}`)
        .then(r => setActions(r.data.actions?.length ? r.data.actions : DEFAULT_ACTIONS))
        .catch(() => setActions(DEFAULT_ACTIONS))
        .finally(() => setLoading(false));
    } else {
      setActions(DEFAULT_ACTIONS);
      setLoading(false);
    }
  }, [consultationId]);

  if (loading) return <div className="text-center py-12 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto space-y-6" data-testid="post-call-actions-page">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {consultationId ? "Consultation Complete" : "Post-Consultation Actions"}
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          {consultationId ? "Here's what your doctor recommends next:" : "Quick actions for your care journey:"}
        </p>
      </div>

      <div className="space-y-3">
        {actions.map((action, idx) => {
          const Icon = ICON_MAP[action.icon] || Target;
          return (
            <button key={idx} onClick={() => navigate(action.route)} data-testid={`post-call-action-${action.type}`}
              className={`w-full text-left border-l-4 ${PRIORITY_STYLE[action.priority] || PRIORITY_STYLE.low} rounded-r-xl p-4 hover:bg-[#1E1E3A]/80 transition-all flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-lg bg-[#7B35D8]/20 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#7B35D8]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{action.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{action.description}</div>
              </div>
              <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      <button onClick={() => navigate("/")} data-testid="return-dashboard-btn"
        className="w-full bg-[#1E1E3A] text-slate-300 py-3 rounded-xl font-medium hover:bg-[#2A2A4A] transition-all mt-4">
        Return to Dashboard
      </button>
    </div>
  );
}
