import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicApi } from "@/lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { token: urlToken } = useParams();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputCls =
    "mt-1.5 bg-space border-white/10 focus:border-cosmic text-stellar placeholder:text-slate-600 font-mono h-11";

  useEffect(() => {
    if (urlToken) {
      sessionStorage.setItem("forgot_password_token", urlToken);

      navigate("/forgot-password", {
        replace: true,
        state: { token: urlToken },
      });
    }
  }, [urlToken, navigate]);

  const token =
    location.state?.token ||
    sessionStorage.getItem("forgot_password_token") ||
    "";

  const isTokenFlow = Boolean(token);

  const handleSendReset = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await publicApi.post("/forgot-password/", { email });
      setOtpSent(true);
      toast.success(res.data?.message || "OTP sent to your email.");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to send reset OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please enter the new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      let res;

      if (isTokenFlow) {
        res = await publicApi.post("/reset-password/", {
          token,
          password: newPassword,
          confirm_password: confirmPassword,
        });

        sessionStorage.removeItem("forgot_password_token");
      } else {
        if (!otp) {
          toast.error("Please enter OTP.");
          setLoading(false);
          return;
        }

        res = await publicApi.post("/reset-password/", {
          email,
          otp,
          password: newPassword,
          confirm_password: confirmPassword,
        });
      }

      toast.success(res.data?.message || "Password reset successful.");
      navigate("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-space relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(123,53,216,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-black tracking-tight">
            <span className="text-cosmic">AGE</span>
            <span className="text-stellar">REBOOT</span>
          </h1>
          <p className="mt-2 font-mono text-xs tracking-[0.2em] text-stellar-dim uppercase">
            Password Recovery
          </p>
        </div>

        <div className="glass-card rounded-lg p-8 cosmic-glow">
          <h2 className="font-display text-xl font-bold text-stellar mb-1 uppercase tracking-wide">
            Forgot Password
          </h2>
          <p className="text-stellar-dim text-sm mb-5 font-body">
            Recover access to your account.
          </p>

          {!isTokenFlow && !otpSent ? (
            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agereboot.ai"
                    required
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider h-12 rounded-sm border border-cosmic-light/30"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {!isTokenFlow && (
                <>
                  <p className="font-mono text-xs text-nebula">
                    OTP sent to {email}
                  </p>

                  <div>
                    <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">
                      Enter OTP
                    </Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className={inputCls + " text-center tracking-[0.5em] text-xl"}
                    />
                  </div>
                </>
              )}

              <div>
                <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={inputCls + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={inputCls + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider h-12 rounded-sm border border-cosmic-light/30"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-4">
            Back to{" "}
            <Link to="/login" className="text-cosmic hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}