import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Calendar, Ruler, Weight, MapPin, Building, Heart, Shield, Coins, CreditCard,
  ArrowUp, ArrowDown, Gift, Edit, Camera, Loader2, Crown, CheckCircle, Clock
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [purchaseAmt, setPurchaseAmt] = useState(100);
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);
  const fileRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/credits");
      setCredits(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    setForm({ name: user?.name, age: user?.age, height_cm: user?.height_cm, weight_kg: user?.weight_kg, phone: user?.phone || "" });
  }, [fetchData, user]);

  const handleSaveProfile = async () => {
    try {
      await api.put("/profile", form);
      toast.success("Profile updated.");
      setEditing(false);
    } catch { toast.error("Update failed"); }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await api.post("/credits/purchase", { amount: purchaseAmt, payment_method: "card" });
      toast.success(`${purchaseAmt} credits purchased!`);
      fetchData();
    } catch { toast.error("Purchase failed"); }
    finally { setPurchasing(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/profile/upload-photo", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Profile photo updated!");
      setPhotoKey(k => k + 1);
    } catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
    finally { setUploadingPhoto(false); }
  };

  const txIcon = (type) => {
    if (type === "purchase") return <ArrowUp size={12} className="text-nebula" />;
    if (type === "reward") return <Gift size={12} className="text-aurora" />;
    if (type === "consumed") return <ArrowDown size={12} className="text-red-400" />;
    return <Coins size={12} className="text-cosmic" />;
  };

  const fields = [
    { label: "Full Name", value: user?.name, icon: User },
    { label: "Email", value: user?.email, icon: MapPin },
    { label: "Age", value: `${user?.age} years`, icon: Calendar },
    { label: "Sex", value: user?.sex === "M" ? "Male" : "Female", icon: Heart },
    { label: "Height", value: `${user?.height_cm} cm`, icon: Ruler },
    { label: "Weight", value: `${user?.weight_kg} kg`, icon: Weight },
    { label: "Ethnicity", value: user?.ethnicity?.replace(/_/g, " "), icon: MapPin },
    { label: "Franchise", value: user?.franchise, icon: Building },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up" data-testid="profile-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            <span className="text-cosmic">{user?.username}</span> Profile
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            {user?.role || "Employee"} &middot; Joined {user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <Button data-testid="edit-profile-btn" onClick={() => setEditing(!editing)} variant="outline"
          className="border-white/20 text-stellar-dim hover:text-stellar font-mono text-xs uppercase tracking-wider">
          <Edit size={14} className="mr-1.5" /> {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-lg p-8">
        <div className="flex items-center gap-6 mb-6">
          {/* Avatar with photo upload */}
          <div className="relative group" data-testid="profile-photo-container">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" data-testid="profile-photo-input" />
            {user?.profile_photo ? (
              <img
                key={photoKey}
                src={`${api.defaults.baseURL}/profile/photo/${user.id}?v=${photoKey}`}
                alt=""
                className="w-20 h-20 rounded-lg object-cover border border-cosmic/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-cosmic/10 border border-cosmic/20 flex items-center justify-center font-display text-3xl font-black text-cosmic">
                {user?.name?.charAt(0) || "A"}
              </div>
            )}
            <button
              data-testid="upload-profile-photo-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingPhoto ? <Loader2 size={18} className="text-white animate-spin" /> : <Camera size={18} className="text-white" />}
            </button>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-stellar">{user?.name}</h2>
            <p className="font-mono text-xs text-stellar-dim uppercase tracking-wider">{user?.franchise || "Independent"}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="font-mono text-[9px] border-cosmic/30 text-cosmic uppercase tracking-wider">{user?.role || "Employee"}</Badge>
              {user?.is_demo && <Badge variant="outline" className="font-mono text-[9px] border-aurora/30 text-aurora uppercase">Demo</Badge>}
            </div>
          </div>
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fields.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/[0.03] rounded-sm p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={12} className="text-cosmic" />
                  <span className="font-mono text-[9px] text-stellar-dim uppercase tracking-widest">{label}</span>
                </div>
                <p className="font-body text-sm font-medium text-stellar">{value || "—"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[["name", "Name"], ["age", "Age"], ["height_cm", "Height (cm)"], ["weight_kg", "Weight (kg)"], ["phone", "Phone"]].map(([key, label]) => (
              <div key={key}>
                <Label className="font-mono text-xs text-stellar-dim uppercase tracking-widest">{label}</Label>
                <Input value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 bg-space border-white/10 text-stellar font-mono h-10 text-sm" />
              </div>
            ))}
            <div className="flex items-end">
              <Button data-testid="save-profile-btn" onClick={handleSaveProfile}
                className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider h-10 px-6 border border-cosmic-light/30">
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Managed Conditions */}
        <div className="mt-6">
          <h3 className="font-display text-sm font-bold text-stellar mb-3 uppercase tracking-wide flex items-center gap-2">
            <Shield size={14} className="text-cosmic" /> Managed Conditions
          </h3>
          <div className="flex gap-2 flex-wrap">
            {user?.managed_conditions?.length > 0 ? user.managed_conditions.map(c => (
              <Badge key={c} variant="outline" className="font-mono text-xs border-aurora/30 text-aurora">{c}</Badge>
            )) : <p className="font-body text-sm text-stellar-dim">No managed conditions reported.</p>}
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="glass-card rounded-lg p-6" data-testid="subscription-card">
        <h3 className="font-display text-lg font-bold text-stellar mb-4 uppercase tracking-wide flex items-center gap-2">
          <Crown size={18} className="text-amber-400" /> Subscription
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-b from-cosmic/10 to-transparent border border-cosmic/20 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-cosmic" />
              <span className="font-mono text-[10px] text-cosmic uppercase tracking-widest">Current Plan</span>
            </div>
            <p className="font-display text-xl font-bold text-stellar">Premium</p>
            <p className="font-mono text-[9px] text-stellar-dim mt-1">Full HPS Engine Access</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-emerald-400" />
              <span className="font-mono text-[10px] text-stellar-dim uppercase tracking-widest">Billing Cycle</span>
            </div>
            <p className="font-display text-xl font-bold text-stellar">Monthly</p>
            <p className="font-mono text-[9px] text-stellar-dim mt-1">Next renewal: Apr 5, 2026</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-amber-400" />
              <span className="font-mono text-[10px] text-stellar-dim uppercase tracking-widest">Member Since</span>
            </div>
            <p className="font-display text-xl font-bold text-stellar">
              {user?.joined_at ? new Date(user.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A"}
            </p>
            <p className="font-mono text-[9px] text-stellar-dim mt-1">Active member</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-stellar-dim">Includes:</span>
          {["AgeReboot Roadmaps", "Biomarker Tracking", "Care Team Access", "Challenges"].map(f => (
            <Badge key={f} variant="outline" className="font-mono text-[8px] border-white/10 text-stellar-dim">{f}</Badge>
          ))}
        </div>
      </div>

      {/* Credits System */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-display text-lg font-bold text-stellar mb-4 uppercase tracking-wide flex items-center gap-2">
          <Coins size={18} className="text-aurora" /> Credits & Wallet
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-aurora/10 border border-aurora/20 rounded-lg p-5 text-center">
            <p className="font-mono text-[10px] text-aurora uppercase tracking-widest">Available</p>
            <p className="font-mono text-4xl font-bold text-aurora mt-1" data-testid="credits-available">{credits?.available || 0}</p>
          </div>
          <div className="bg-nebula/10 border border-nebula/20 rounded-lg p-5 text-center">
            <p className="font-mono text-[10px] text-nebula uppercase tracking-widest">Purchased</p>
            <p className="font-mono text-4xl font-bold text-nebula mt-1">{credits?.purchased || 0}</p>
          </div>
          <div className="bg-cosmic/10 border border-cosmic/20 rounded-lg p-5 text-center">
            <p className="font-mono text-[10px] text-cosmic uppercase tracking-widest">Consumed</p>
            <p className="font-mono text-4xl font-bold text-cosmic mt-1">{credits?.consumed || 0}</p>
          </div>
        </div>

        {/* Purchase Credits */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white/[0.03] rounded-sm border border-white/5">
          <CreditCard size={20} className="text-aurora shrink-0" />
          <div className="flex-1 flex items-center gap-3">
            <Label className="font-mono text-xs text-stellar-dim shrink-0">Buy Credits:</Label>
            <div className="flex gap-2">
              {[50, 100, 250, 500].map(amt => (
                <Button key={amt} size="sm" variant={purchaseAmt === amt ? "default" : "outline"}
                  className={purchaseAmt === amt ? "bg-aurora hover:bg-aurora text-white font-mono text-xs" : "border-white/10 text-stellar-dim font-mono text-xs"}
                  onClick={() => setPurchaseAmt(amt)}>
                  {amt}
                </Button>
              ))}
            </div>
            <Button data-testid="purchase-credits-btn" onClick={handlePurchase} disabled={purchasing}
              className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider px-4 border border-cosmic-light/30">
              {purchasing ? "Processing..." : "Purchase"}
            </Button>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-stellar-dim uppercase mb-3">Transaction History</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(credits?.transactions || []).slice().reverse().map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-sm border border-white/5">
                <div className="flex items-center gap-2">
                  {txIcon(tx.type)}
                  <div>
                    <p className="font-body text-xs text-stellar">{tx.description}</p>
                    <p className="font-mono text-[9px] text-stellar-dim">{new Date(tx.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-mono text-sm font-bold ${tx.type === "consumed" ? "text-red-400" : "text-nebula"}`}>
                  {tx.type === "consumed" ? "-" : "+"}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
