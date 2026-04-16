import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Server, Database, Cpu, Activity, CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminSystemHealthPage() {
  const [data, setData] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/system-health"),
      api.get("/admin/system-health/api-endpoints"),
    ]).then(([h, e]) => {
      setData(h.data);
      setEndpoints(e.data.endpoints || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>;

  const services = data?.services || {};
  const db_info = data?.database || {};
  const activity = data?.activity_24h || {};

  return (
    <div className="space-y-6" data-testid="admin-system-health-page">
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-sm text-slate-500 mt-1">Infrastructure monitoring and diagnostics</p>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(services).map(([name, svc]) => (
          <div key={name} className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid={`service-${name}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${svc.status === "running" || svc.status === "connected" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {name === "mongodb" ? <Database size={18} className="text-emerald-400" /> :
                 name === "backend" ? <Server size={18} className="text-emerald-400" /> :
                 <Cpu size={18} className="text-emerald-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white capitalize">{name}</p>
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">{svc.status}</span>
                  {svc.port && <span className="text-[10px] text-slate-500 ml-2">:{svc.port}</span>}
                  {svc.latency_ms && <span className="text-[10px] text-slate-500 ml-2">{svc.latency_ms}ms</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="db-collections">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Collections</p>
          <p className="text-2xl font-bold text-white mt-1">{db_info.total_collections || 0}</p>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="db-documents">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Documents</p>
          <p className="text-2xl font-bold text-white mt-1">{(db_info.total_documents || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="db-latency">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">DB Latency</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{db_info.latency_ms || 0}ms</p>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4" data-testid="api-endpoints-count">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">API Endpoints</p>
          <p className="text-2xl font-bold text-[#7B35D8] mt-1">{endpoints.length}</p>
        </div>
      </div>

      {/* 24h Activity */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="activity-24h">
        <h3 className="text-sm font-semibold text-white mb-3">24-Hour Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(activity).map(([k, v]) => (
            <div key={k} className="text-center p-3 bg-white/[0.02] rounded-lg">
              <p className="text-lg font-bold text-white">{v}</p>
              <p className="text-[10px] text-slate-500 capitalize">{k.replace(/_/g, " ")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Collection Details */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="collection-list">
        <h3 className="text-sm font-semibold text-white mb-3">MongoDB Collections ({db_info.total_collections})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {(db_info.collections || []).map(c => (
            <div key={c.name} className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg">
              <span className="text-xs text-slate-300 font-mono truncate">{c.name}</span>
              <span className="text-xs font-bold text-[#7B35D8] ml-2">{c.document_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl p-5" data-testid="api-endpoints-list">
        <h3 className="text-sm font-semibold text-white mb-3">API Endpoints ({endpoints.length})</h3>
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {endpoints.map((ep, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {ep.methods.map(m => (
                <span key={m} className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  m === "GET" ? "bg-blue-500/10 text-blue-400" :
                  m === "POST" ? "bg-emerald-500/10 text-emerald-400" :
                  m === "PUT" ? "bg-amber-500/10 text-amber-400" :
                  m === "DELETE" ? "bg-red-500/10 text-red-400" : "bg-slate-500/10 text-slate-400"
                }`}>{m}</span>
              ))}
              <span className="text-xs text-slate-300 font-mono">{ep.path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
