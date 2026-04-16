import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, User, Bell, Clock, Save, Loader2 } from "lucide-react";

export default function CoachProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/coach-v2/profile").then(r => { setProfile(r.data.profile); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/coach-v2/profile", profile);
      toast.success("Profile updated");
    } catch { toast.error("Failed to update"); }
    setSaving(false);
  };

  if (loading || !profile) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="coach-profile-page">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile & <span className="text-indigo-400">Settings</span></h1>
        <p className="font-mono text-[10px] text-slate-500 tracking-wider">MANAGE YOUR PROFESSIONAL PROFILE & PREFERENCES</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
            <User size={32} className="text-indigo-400" />
          </div>
          <p className="font-display text-lg font-bold text-white">{profile.name}</p>
          <Badge className="font-mono text-[8px] bg-indigo-500/10 text-indigo-400 mt-1">{profile.role?.replace("_", " ")}</Badge>
          <p className="font-mono text-[9px] text-slate-500 mt-2">{profile.specialty}</p>
          <p className="font-mono text-[8px] text-slate-600">{profile.qualification}</p>
        </div>

        {/* Editable Fields */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-black/20 p-6 space-y-4">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-2"><Settings size={14} className="text-indigo-400" /> Professional Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[8px] text-slate-400 block mb-1">Specialty</label>
              <input value={profile.specialty || ""} onChange={e => setProfile(p => ({ ...p, specialty: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-400 block mb-1">Qualification</label>
              <input value={profile.qualification || ""} onChange={e => setProfile(p => ({ ...p, qualification: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[8px] text-slate-400 block mb-1">Bio</label>
            <textarea value={profile.bio || ""} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" placeholder="Brief professional bio..." />
          </div>
          <div>
            <label className="font-mono text-[8px] text-slate-400 block mb-1">Linked Physician</label>
            <input value={profile.linked_physician || ""} onChange={e => setProfile(p => ({ ...p, linked_physician: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="Supervising physician name" />
          </div>

          {/* Notification Preferences */}
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-2 pt-2"><Bell size={14} className="text-indigo-400" /> Notifications</h3>
          <div className="space-y-2">
            {[
              ["Crisis Alerts", "crisis_alerts"],
              ["Session Reminders", "session_reminders"],
              ["Low Compliance Alerts", "low_compliance"],
            ].map(([label, key]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={profile.notification_prefs?.[key] ?? true}
                  onChange={e => setProfile(p => ({ ...p, notification_prefs: { ...p.notification_prefs, [key]: e.target.checked } }))}
                  className="w-4 h-4 rounded bg-black/40 border-white/20 text-indigo-500 focus:ring-indigo-500" />
                <span className="font-body text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button data-testid="save-profile" onClick={saveProfile} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} className="mr-1" /> Save Changes</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
