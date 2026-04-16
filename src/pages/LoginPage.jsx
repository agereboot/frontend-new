import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api,{ publicApi } from "../lib/api";
import { Lock, Smartphone, ShieldAlert, Building2 } from "lucide-react";

const HCP_ROLES = new Set([
  "longevity_physician", "fitness_coach", "psychologist",
  "physical_therapist", "nutritional_coach",
  "clinician", "coach", "medical_director", "clinical_admin",
  "corporate_hr_admin", "corporate_wellness_head",
]);

const CORP_ROLES = new Set(["corporate_hr_admin", "corporate_wellness_head"]);
const CORP_DEMO_ROLES = new Set(["hr_admin_demo", "hr_executive_demo"]);

const HCP_DEMO_ACCOUNTS = [
  { email: "hr.admin.demo@agereboot.ai", password: "HRAdmin@123", label: "HR Admin", icon: Building2, color: "#7B35D8", testId: "demo-hr-admin" },
  { email: "hr.executive.demo@agereboot.ai", password: "HRExec@123", label: "HR Executive", icon: ShieldAlert, color: "#F59E0B", testId: "demo-hr-exec" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpPreview, setOtpPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const userData = await login(email, password);
    const role = (userData?.role || "").toLowerCase();

    if (role.includes("employee")) {
  toast.success(`Welcome, ${userData.username || "Employee"}.`);
      navigate("/");
    } else if (CORP_DEMO_ROLES.has(userData.role)) {
      toast.success(`Welcome, ${userData.name || "Team"}.`);
      navigate(
        userData.role === "hr_executive_demo"
          ? "/corp-demo/executive"
          : "/corp-demo/dashboard"
      );
    } else if (HCP_ROLES.has(userData.role)) {
      const welcomeMsg = CORP_ROLES.has(userData.role)
        ? `Welcome, ${userData.name || "Admin"}.`
        : "Welcome to the HCP Portal.";
      toast.success(welcomeMsg);
      navigate("/hcp");
    } else {
      toast.success("Welcome back, Athlete.");
      navigate("/");
    }
  } catch (err) {
    toast.error(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Invalid credentials"
    );
  } finally {
    setLoading(false);
  }
};

  const handleSendOTP = async () => {
    if (!otpEmail) return;
    setLoading(true);
    try {
      const res = await publicApi.post("/auth/send-otp", { email: otpEmail });
      setOtpSent(true);
      setOtpPreview(res.data.otp_preview || "");
      toast.success("OTP sent to your email.");
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await publicApi.post("/auth/verify-otp", { email: otpEmail, otp });
      localStorage.setItem("agereboot_token", res.data.token);
      localStorage.setItem("agereboot_user", JSON.stringify(res.data.user));
      toast.success("OTP verified. Welcome back.");
      window.location.href = "/";
    } catch (err) { toast.error(err.response?.data?.detail || "Invalid OTP"); }
    finally { setLoading(false); }
  };
const handleForgotPassword = async () => {
  if (!email) {
    toast.error("Please enter your email first");
    return;
  }

  setLoading(true);
  try {
    const res = await publicApi.post("/forgot-password/", {
      email,
    });

    toast.success(
      res.data?.message || "Password reset instructions sent to your email"
    );
  } catch (err) {
    toast.error(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Failed to process forgot password request"
    );
  } finally {
    setLoading(false);
  }
};
  const handleDemoLogin = async (acct) => {
    setLoading(true);
    try {
      const userData = await login(acct.email, acct.password);
      toast.success(`Welcome, ${userData.name || acct.label}.`);
      if (CORP_DEMO_ROLES.has(userData.role)) {
        navigate(userData.role === "hr_executive_demo" ? "/corp-demo/executive" : "/corp-demo/dashboard");
      } else {
        navigate(HCP_ROLES.has(userData.role) ? "/hcp" : "/");
      }
    } catch { toast.error("Account not available."); }
    finally { setLoading(false); }
  };

  const inputCls = "mt-1.5 bg-space border-white/10 focus:border-cosmic text-stellar placeholder:text-slate-600 font-mono h-11";

  return (
    <div className="min-h-screen flex items-center justify-center bg-space relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(123,53,216,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-black tracking-tight">
            <span className="text-cosmic">AGE</span><span className="text-stellar">REBOOT</span>
          </h1>
          <p className="mt-2 font-mono text-xs tracking-[0.2em] text-stellar-dim uppercase">
            Health Performance Score Engine v3.2
          </p>
        </div>

        <div className="glass-card rounded-lg p-8 cosmic-glow">
          <h2 className="font-display text-xl font-bold text-stellar mb-1 uppercase tracking-wide">Authenticate</h2>
          <p className="text-stellar-dim text-sm mb-5 font-body">Enter the arena. Your biology is the scoreboard.</p>
         

          <Tabs defaultValue="password" className="w-full">
            <TabsList className="w-full bg-space-light/50 border border-white/5 mb-5">
              <TabsTrigger value="password" className="flex-1 font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
                <Lock size={13} className="mr-1.5" /> Password
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex-1 font-mono text-xs uppercase tracking-wider data-[state=active]:bg-cosmic/20 data-[state=active]:text-cosmic">
                <Smartphone size={13} className="mr-1.5" /> Email OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">Email</Label>
                  <Input data-testid="login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agereboot.ai"  className={inputCls} />
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">Password</Label>
                  <Input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" required className={inputCls} />
                </div>
                <Button data-testid="login-submit-btn" type="submit" disabled={loading}
                  className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider h-12 rounded-sm border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)] transition-all duration-200">
                  {loading ? "Authenticating..." : "Enter the Arena"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">Email Address</Label>
                    <Input data-testid="otp-email-input" type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="you@agereboot.ai" required className={inputCls} />
                  </div>
                  <Button data-testid="send-otp-btn" onClick={handleSendOTP} disabled={loading || !otpEmail}
                    className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider h-12 rounded-sm border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <p className="font-mono text-xs text-nebula">OTP sent to {otpEmail}</p>
                  {otpPreview && (
                    <div className="bg-nebula/10 border border-nebula/20 rounded-sm p-3">
                      <p className="font-mono text-xs text-stellar-dim">Simulated OTP (dev mode):</p>
                      <p className="font-mono text-2xl font-bold text-nebula tracking-[0.3em]" data-testid="otp-preview">{otpPreview}</p>
                    </div>
                  )}
                  <div>
                    <Label className="font-mono text-xs tracking-widest text-stellar-dim uppercase">Enter 6-Digit OTP</Label>
                    <Input data-testid="otp-code-input" value={otp} onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000" maxLength={6} className={inputCls + " text-center tracking-[0.5em] text-xl"} />
                  </div>
                  <Button data-testid="verify-otp-btn" type="submit" disabled={loading || otp.length !== 6}
                    className="w-full bg-cosmic hover:bg-cosmic-light text-white font-display font-bold uppercase tracking-wider h-12 rounded-sm border border-cosmic-light/30 shadow-[0_0_15px_rgba(123,53,216,0.3)]">
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-stellar-dim font-mono text-xs">
                    Use a different email
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Access */}
          <div className="mt-5 space-y-3">
         <div className="flex gap-3">
  <Link to="/register" className="flex-1">
    <Button
      data-testid="register-link-btn"
      variant="outline"
      className="w-full border-white/20 hover:border-white/40 text-stellar-dim hover:text-stellar font-mono text-xs uppercase tracking-wider h-10"
    >
      Register
    </Button>
  </Link>

  <Button
    type="button"
    variant="outline"
    onClick={handleForgotPassword}
    disabled={loading || !email}
    className="flex-1 border-white/20 hover:border-white/40 text-stellar-dim hover:text-stellar font-mono text-xs uppercase tracking-wider h-10"
  >
    Forgot Password
  </Button>
</div>

            {/* <p className="font-mono text-[8px] text-slate-600 uppercase tracking-wider text-center">HR Admin / Executive Quick Access</p> */}
            {/* <div className="grid grid-cols-2 gap-2" data-testid="hcp-demo-grid">
              {HCP_DEMO_ACCOUNTS.map((acct) => {
                const Icon = acct.icon;
                return (
                  <button key={acct.testId} data-testid={acct.testId} onClick={() => handleDemoLogin(acct)} disabled={loading}
                    className="group flex flex-col items-center gap-1 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/15 transition-all duration-200">
                    <Icon size={16} style={{ color: acct.color }} className="group-hover:scale-110 transition-transform" />
                    <span className="font-mono text-[8px] uppercase tracking-wider text-center" style={{ color: acct.color + "CC" }}>{acct.label}</span>
                  </button>
                );
              })}
            </div> */}
          </div>
        </div>

      
      </div>
    </div>
  );
}
