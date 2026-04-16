import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Brain, Plus, CheckCircle, BookOpen, Users } from "lucide-react";

export default function PSYCBTModulesPage() {
  const [modules, setModules] = useState([]);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/coach/psy/cbt-modules").then(r => setModules(r.data.modules || [])),
      api.get("/cc/members").then(r => setMembers(r.data.members || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const assignModule = async (mod) => {
    if (members.length === 0) { toast.error("No patients assigned"); return; }
    const member = members[0]; // For MVP, assign to first member
    try {
      const res = await api.post("/coach/psy/cbt-assign", {
        module_id: mod.id, module_name: mod.name,
        member_id: member.id, member_name: member.name,
        total_sessions: mod.sessions,
      });
      toast.success(`${mod.name} assigned to ${member.name}`);
    } catch { toast.error("Failed to assign module"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="cbt-modules-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">CBT <span className="text-indigo-400">Modules</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider mt-0.5">EVIDENCE-BASED THERAPEUTIC INTERVENTIONS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(mod => (
          <div key={mod.id} className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-5" data-testid={`cbt-${mod.id}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Brain size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white">{mod.name}</p>
                <div className="flex gap-1.5 mt-0.5">
                  <Badge className="font-mono text-[7px] bg-white/5 text-slate-300">{mod.category}</Badge>
                  <Badge className="font-mono text-[7px] bg-indigo-500/10 text-indigo-400">{mod.sessions} sessions</Badge>
                  {mod.protocol_id && <Badge className="font-mono text-[7px] bg-violet-500/10 text-violet-400">{mod.protocol_id}</Badge>}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">{mod.description}</p>
            <Button data-testid={`assign-cbt-${mod.id}`} onClick={() => assignModule(mod)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs w-full">
              <Users size={12} className="mr-1" /> Assign to Patient
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
