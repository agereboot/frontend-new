import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Activity, Moon, Flame, Clock } from "lucide-react";

export default function PFCWearableFeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/coach/pfc/wearable-feed").then(r => setFeed(r.data.feed || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="wearable-feed-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Wearable <span className="text-red-400">Feed</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">REAL-TIME MEMBER WEARABLE DATA MONITORING</p>
      </div>

      <div className="space-y-4">
        {feed.map(m => (
          <div key={m.member_id} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4" data-testid={`feed-${m.member_id}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-red-400">{(m.member_name || "?")[0]}</span>
              </div>
              <p className="font-display text-sm font-bold text-white">{m.member_name}</p>
            </div>
            {m.data_points?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {m.data_points.slice(0, 1).map((dp, i) => (
                  <div key={i} className="contents">
                    {dp.resting_hr && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                        <HeartPulse size={14} className="text-red-400 mx-auto mb-1" />
                        <p className="font-display text-lg font-bold text-white">{dp.resting_hr}</p>
                        <p className="font-mono text-[7px] text-slate-500">Resting HR</p>
                      </div>
                    )}
                    {dp.hrv && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                        <Activity size={14} className="text-emerald-400 mx-auto mb-1" />
                        <p className="font-display text-lg font-bold text-white">{dp.hrv}</p>
                        <p className="font-mono text-[7px] text-slate-500">HRV (ms)</p>
                      </div>
                    )}
                    {dp.sleep_score && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                        <Moon size={14} className="text-indigo-400 mx-auto mb-1" />
                        <p className="font-display text-lg font-bold text-white">{dp.sleep_score}</p>
                        <p className="font-mono text-[7px] text-slate-500">Sleep Score</p>
                      </div>
                    )}
                    {dp.steps && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                        <Flame size={14} className="text-amber-400 mx-auto mb-1" />
                        <p className="font-display text-lg font-bold text-white">{dp.steps?.toLocaleString()}</p>
                        <p className="font-mono text-[7px] text-slate-500">Steps</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 font-mono text-[10px]">No wearable data available</p>}
          </div>
        ))}
        {feed.length === 0 && (
          <div className="text-center py-16">
            <HeartPulse size={40} className="text-red-500/20 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No wearable data available</p>
            <p className="text-slate-600 font-mono text-[10px] mt-1">Members need to connect wearable devices first</p>
          </div>
        )}
      </div>
    </div>
  );
}
