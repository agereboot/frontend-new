import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { publicApi } from "../lib/api";

const inputCls =
  "w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#7B35D8] outline-none";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
     const response=  await publicApi.post("/verify-email/", {
        email,
        otp,
      });

      if(response?.success){
          navigate("/login");
        toast.success(response?.message || "Registration successful. Please login.");
      }
    
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);

    try {
     await publicApi.post("/resend-otp/", {
        email,
      });
     

      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to resend OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Verify OTP</h1>
          <p className="text-sm text-slate-400 mt-2">
            Enter the OTP sent to your email
          </p>
        </div>

        <form
          onSubmit={handleVerifyOtp}
          className="bg-[#12122A] border border-[#1E1E3A] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">OTP *</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className={inputCls}
              placeholder="Enter 6-digit OTP"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-all"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="w-full border border-[#2A2A4A] text-white py-3 rounded-lg font-semibold transition-all hover:bg-white/5"
          >
            Resend OTP
          </button>

          <p className="text-center text-sm text-slate-500">
            Back to{" "}
            <Link to="/login" className="text-[#7B35D8] hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}