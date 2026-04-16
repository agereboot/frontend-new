import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { MapPin, Navigation, Save, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LocationSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ address_line: "", landmark: "", city: "", state: "", pin_code: "", latitude: null, longitude: null, address_type: "home", contact_number: "" });
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/employee/address").then(r => {
      if (r.data.address && r.data.address.address_line) setAddress(prev => ({ ...prev, ...r.data.address }));
      if (!address.contact_number && user?.phone) setAddress(prev => ({ ...prev, contact_number: user.phone }));
    }).catch(() => {});
  }, []);

  const detectLocation = () => {
    setDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setAddress(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setDetecting(false);
      }, () => setDetecting(false), { enableHighAccuracy: true, timeout: 10000 });
    } else { setDetecting(false); }
  };

  const saveAddress = async () => {
    if (!address.address_line || !address.city || !address.pin_code) return;
    setSaving(true);
    try {
      await api.put("/employee/address/update", address);
      navigate("/");
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto" data-testid="location-setup-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Set Your Location</h1>
        <p className="text-sm text-slate-400 mt-1">We need your address for home sample collection and care team allocation.</p>
      </div>
      <div className="bg-[#12122A] border border-[#1E1E3A] rounded-xl p-6 space-y-4">
        <button onClick={detectLocation} disabled={detecting} data-testid="detect-location-btn"
          className="w-full flex items-center justify-center gap-2 bg-[#7B35D8]/20 border border-[#7B35D8]/40 text-[#7B35D8] py-3 rounded-lg hover:bg-[#7B35D8]/30 transition-all">
          <Navigation size={16} className={detecting ? "animate-spin" : ""} />
          {detecting ? "Detecting..." : "Detect My Location (GPS)"}
        </button>
        {address.latitude && (
          <div className="text-xs text-emerald-400 flex items-center gap-1"><MapPin size={12} /> Location detected: {address.latitude?.toFixed(4)}, {address.longitude?.toFixed(4)}</div>
        )}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Full Address *</label>
          <textarea value={address.address_line} onChange={e => setAddress(p => ({ ...p, address_line: e.target.value }))}
            className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none"
            rows={2} placeholder="House no, Street, Area" data-testid="address-line-input" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Landmark</label>
          <input value={address.landmark} onChange={e => setAddress(p => ({ ...p, landmark: e.target.value }))}
            className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none"
            placeholder="Near..." data-testid="landmark-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">City *</label>
            <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
              className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none"
              placeholder="Mumbai" data-testid="city-input" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">PIN Code *</label>
            <input value={address.pin_code} onChange={e => setAddress(p => ({ ...p, pin_code: e.target.value }))}
              className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none"
              placeholder="400001" data-testid="pincode-input" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Contact Number</label>
          <input value={address.contact_number} onChange={e => setAddress(p => ({ ...p, contact_number: e.target.value }))}
            className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#7B35D8] outline-none"
            placeholder="+91-9876543210" data-testid="contact-input" />
        </div>
        <div className="flex gap-2">
          {["home", "office", "other"].map(t => (
            <button key={t} onClick={() => setAddress(p => ({ ...p, address_type: t }))}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${address.address_type === t ? "bg-[#7B35D8] text-white" : "bg-[#1E1E3A] text-slate-400 hover:text-white"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={saveAddress} disabled={saving || !address.address_line || !address.city || !address.pin_code}
          data-testid="save-address-btn"
          className="w-full flex items-center justify-center gap-2 bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all mt-4">
          <Save size={16} /> {saving ? "Saving..." : "Save & Continue"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
