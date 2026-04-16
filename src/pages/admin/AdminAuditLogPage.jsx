import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { ScrollText, Filter } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const ACTION_COLORS = {
  user_created: "text-emerald-400",
  user_updated: "text-blue-400",
  user_deactivated: "text-red-400",
  user_reactivated: "text-teal-400",
  ticket_created: "text-amber-400",
  ticket_status_changed: "text-purple-400",
  ticket_escalated: "text-rose-400",
  corporate_created: "text-cyan-400",
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actionTypes, setActionTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (actionFilter) params.set("action_type", actionFilter);
      const res = await api.get(`/admin/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => {
    api.get("/admin/audit-logs/action-types").then(r => setActionTypes(r.data.action_types || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-5" data-testid="admin-audit-log-page">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Immutable record of all admin actions ({total} entries)</p>
      </div>

      <div className="flex gap-3 items-center">
        <AppSelect value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          data-testid="audit-action-filter"
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Actions</AppSelectOption>
          {actionTypes.map(t => <AppSelectOption key={t} value={t}>{t.replace(/_/g, " ")}</AppSelectOption>)}
        </AppSelect>
      </div>

      <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full" data-testid="audit-log-table">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Timestamp</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Admin</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Action</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Target</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                <ScrollText size={24} className="mx-auto mb-2 opacity-30" />
                No audit log entries yet
              </td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">{log.performed_at?.replace("T", " ").slice(0, 19)}</td>
                <td className="px-4 py-3 text-sm text-white">{log.admin_name || log.admin_email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono ${ACTION_COLORS[log.action_type] || "text-slate-400"}`}>
                    {log.action_type?.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                  {log.target_type}: {log.target_id?.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                  {log.new_value ? JSON.stringify(log.new_value).slice(0, 60) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 30 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 bg-[#11111a] border border-white/10 rounded-md text-xs text-slate-400 hover:text-white disabled:opacity-30">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 30}
              className="px-3 py-1.5 bg-[#11111a] border border-white/10 rounded-md text-xs text-slate-400 hover:text-white disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
