import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { MapPin, Shield, Navigation, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LocationPermissionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [detecting, setDetecting] = useState(false);

  const enableLocation = () => {
    setDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.put("/employee/address/update", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address_type: "home",
          }).then(() => navigate("/location-setup")).catch(() => navigate("/location-setup"));
        },
        () => { setDetecting(false); navigate("/location-setup"); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else { navigate("/location-setup"); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center p-6" data-testid="location-permission-page">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-24 h-24 rounded-full bg-[#7B35D8]/20 flex items-center justify-center mx-auto">
          <MapPin size={40} className="text-[#7B35D8]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Enable Your Location</h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            We use your location to allocate the nearest care team, schedule home sample collection, and personalise your health experience.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            { icon: Navigation, text: "Find nearest phlebotomist for home sample collection" },
            { icon: Shield, text: "Allocate care team based on your zone" },
            { icon: MapPin, text: "Pre-fill address for faster lab booking" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#12122A] border border-[#1E1E3A] rounded-lg p-3">
              <item.icon size={18} className="text-[#7B35D8] flex-shrink-0" />
              <span className="text-sm text-slate-300">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button onClick={enableLocation} disabled={detecting} data-testid="enable-location-btn"
            className="w-full bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            <Navigation size={16} className={detecting ? "animate-spin" : ""} />
            {detecting ? "Detecting Location..." : "Enable Location"}
          </button>
          <button onClick={() => navigate("/location-setup")} data-testid="enter-manually-btn"
            className="w-full bg-transparent border border-[#2A2A4A] text-slate-400 hover:text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
            Enter Address Manually <ChevronRight size={16} />
          </button>
        </div>

        <p className="text-[10px] text-slate-600">Your location is encrypted and only used for service delivery. We never share it with third parties.</p>
      </div>
    </div>
  );
}
