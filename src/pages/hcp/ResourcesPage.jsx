import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FolderOpen, Share2, BookOpen, FileText, Loader2 } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareId, setShareId] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/coach-v2/resources").then(r => setResources(r.data.resources || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const shareResource = async (resourceId, title) => {
    if (!shareId) { toast.error("Select a member"); return; }
    const member = members.find(m => m.id === shareId);
    try {
      await api.post("/coach-v2/resources/share", { resource_id: resourceId, resource_title: title, member_id: shareId, member_name: member?.name });
      toast.success("Resource shared with " + member?.name);
      setShareTarget(null);
      setShareId("");
    } catch { toast.error("Failed"); }
  };

  const TYPE_ICONS = { guide: BookOpen, worksheet: FileText, exercise: FileText, reference: FolderOpen, programme: FolderOpen };
  const CAT_COLORS = { sleep: "#7B35D8", stress: "#EF4444", nutrition: "#0F9F8F", therapy: "#6366F1", exercise: "#10B981", mindfulness: "#D97706", gut_health: "#0F9F8F", recovery: "#F59E0B", supplements: "#D97706" };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="resources-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Resource <span className="text-indigo-400">Library</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">EVIDENCE-BASED GUIDES, WORKSHEETS & PROTOCOLS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map(r => {
          const Icon = TYPE_ICONS[r.type] || FolderOpen;
          const color = CAT_COLORS[r.category] || "#6366F1";
          return (
            <div key={r.id} className="rounded-xl border border-white/5 bg-black/20 p-4 hover:bg-white/[0.02] transition-all" data-testid={`resource-${r.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + "12" }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-white">{r.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge className="font-mono text-[6px]" style={{ backgroundColor: color + "15", color }}>{r.category}</Badge>
                    <Badge className="font-mono text-[6px] bg-white/5 text-slate-400">{r.type}</Badge>
                  </div>
                  <p className="font-body text-[10px] text-slate-400 mt-1.5 line-clamp-2">{r.description}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {shareTarget === r.id ? (
                  <div className="flex items-center gap-2">
                    <AppSelect value={shareId} onChange={e => setShareId(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] focus:border-indigo-500 focus:outline-none">
                      <AppSelectOption value="">Select member</AppSelectOption>
                      {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
                    </AppSelect>
                    <Button size="sm" onClick={() => shareResource(r.id, r.title)} className="bg-indigo-500/10 text-indigo-400 text-[9px] h-6 px-2">Send</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShareTarget(null)} className="text-slate-500 text-[9px] h-6 px-2">x</Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setShareTarget(r.id)} className="bg-white/5 text-slate-300 text-[9px] h-6 px-2 hover:text-white">
                    <Share2 size={10} className="mr-1" /> Share
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {resources.length === 0 && <p className="text-slate-500 text-sm text-center py-12">No resources available for your role.</p>}
    </div>
  );
}
