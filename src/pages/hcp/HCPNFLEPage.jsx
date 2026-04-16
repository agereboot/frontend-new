import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Workflow, AlertTriangle, CheckCircle, Clock, ArrowRight,
  BookOpen, User, Zap,
} from "lucide-react";

const STATUS_COLORS = { open: "#D97706", in_progress: "#6366F1", completed: "#10B981" };
const PRIORITY_COLORS = { high: "#EF4444", medium: "#D97706", low: "#6366F1" };

export default function HCPNFLEPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");

  const fetchTasks = () => {
    setLoading(true);
    api.get(`/cc/nfle/tasks?status=${filter === "all" ? "" : filter}`).then(r => { setTasks(r.data.tasks); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [filter]);

  const updateTask = async (taskId, status) => {
    try {
      await api.put(`/cc/nfle/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      toast.success(`Task ${status}`);
    } catch { toast.error("Update failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-nfle-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            NFLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B35D8] to-[#6366F1]">Task Engine</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">Next-Flow Logic Engine &mdash; Auto-Generated Clinical Tasks</p>
        </div>
      </div>

      <div className="flex gap-2" data-testid="nfle-filters">
        {["open", "in_progress", "completed", "all"].map(s => (
          <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${filter === s ? "bg-[#7B35D8]/15 text-[#7B35D8] border border-[#7B35D8]/30" : "bg-black/20 text-slate-400 border border-white/5 hover:bg-white/5"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3" data-testid="nfle-tasks-list">
        {tasks.length > 0 ? tasks.map(task => (
          <div key={task.id} className="rounded-xl border border-white/5 bg-black/20 p-5 hover:bg-white/[0.02] transition-all" data-testid={`nfle-task-${task.id}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Workflow size={18} className="text-[#7B35D8]" />
                <div>
                  <p className="font-body text-sm font-medium text-white">{task.task_description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="font-mono text-[7px]" style={{ backgroundColor: (PRIORITY_COLORS[task.priority] || "#6366F1") + "15", color: PRIORITY_COLORS[task.priority] || "#6366F1" }}>{task.priority}</Badge>
                    <span className="font-mono text-[8px] text-slate-500">{task.member_name}</span>
                    <span className="font-mono text-[8px] text-slate-500">&middot;</span>
                    <span className="font-mono text-[8px] text-slate-500">{task.rule_biomarker}: {task.biomarker_value} (threshold: {task.condition}{task.threshold})</span>
                  </div>
                </div>
              </div>
              <Badge className="font-mono text-[8px]" style={{ backgroundColor: (STATUS_COLORS[task.status] || "#475569") + "15", color: STATUS_COLORS[task.status] || "#475569" }}>{task.status.replace("_", " ")}</Badge>
            </div>
            {task.protocol_suggestion && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#7B35D8]/5 border border-[#7B35D8]/10 mb-3">
                <BookOpen size={12} className="text-[#7B35D8] shrink-0" />
                <span className="font-body text-xs text-slate-300">Suggested Protocol: <strong className="text-white">{task.protocol_suggestion}</strong></span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] text-slate-500">Assigned to: {(task.assigned_roles || []).join(", ")}</span>
                <span className="font-mono text-[8px] text-slate-600">&middot; {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                {task.status === "open" && (
                  <Button size="sm" onClick={() => updateTask(task.id, "in_progress")} className="h-7 bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#6366F1]/20 font-mono text-[9px]">
                    <ArrowRight size={10} className="mr-1" /> Start
                  </Button>
                )}
                {task.status === "in_progress" && (
                  <Button size="sm" onClick={() => updateTask(task.id, "completed")} className="h-7 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono text-[9px]">
                    <CheckCircle size={10} className="mr-1" /> Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )) : <p className="text-slate-500 text-sm text-center py-12">No NFLE tasks found for the current filter.</p>}
      </div>
    </div>
  );
}
