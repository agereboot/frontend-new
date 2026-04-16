import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (!loading) {
        if (user) navigate("/");
        else navigate("/login");
      }
    }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  if (!show) return null;

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center" data-testid="splash-screen">
      <div className="animate-pulse">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#7B35D8] to-[#0F9F8F] flex items-center justify-center mb-6 mx-auto">
          <span className="text-white text-3xl font-black">AR</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-white tracking-wider">AGEREBOOT</h1>
      <p className="text-sm text-slate-400 mt-2 tracking-widest">LONGEVITY PLATFORM</p>
      <div className="mt-8 w-48 h-1 bg-[#1E1E3A] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#7B35D8] to-[#0F9F8F] rounded-full animate-[loading_2.5s_ease-in-out]" />
      </div>
      <style>{`
        @keyframes loading { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
}
