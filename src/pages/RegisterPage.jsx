import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import api,{ publicApi } from "../lib/api";

const inputCls =
  "w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:border-[#7B35D8] outline-none";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await publicApi.post("/register/", form);

    if (res?.data?.success) {
      toast.success(res?.data?.message || "Registration successful. Please verify OTP.");
      navigate("/verify-otp", {
        state: { email: form.email },
      });
    } else {
      toast.error(res?.data?.message || "Registration failed");
    }
  } catch (err) {
    toast.error(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Registration failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="min-h-screen bg-[#0A0A12] flex items-center justify-center p-4"
      data-testid="register-page"
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Join AgeReboot</h1>
          <p className="text-sm text-slate-400 mt-2">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#12122A] border border-[#1E1E3A] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Username *
            </label>
            <input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              required
              className={inputCls.replace("pr-10", "")}
              placeholder="Enter username"
              data-testid="register-username"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                First Name
              </label>
              <input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className={inputCls.replace("pr-10", "")}
                placeholder="First name"
                data-testid="register-first-name"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Last Name
              </label>
              <input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className={inputCls.replace("pr-10", "")}
                placeholder="Last name"
                data-testid="register-last-name"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              className={inputCls.replace("pr-10", "")}
              placeholder="john@example.com"
              data-testid="register-email"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Phone Number *
            </label>
            <input
              value={form.phone_number}
              onChange={(e) => set("phone_number", e.target.value)}
              required
              className={inputCls.replace("pr-10", "")}
              placeholder="+91-9876543210"
              data-testid="register-phone-number"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                className={inputCls}
                placeholder="Enter password"
                data-testid="register-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirm_password}
                onChange={(e) => set("confirm_password", e.target.value)}
                required
                className={inputCls}
                placeholder="Re-enter password"
                data-testid="register-confirm-password"
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

          <button
            type="submit"
            disabled={loading}
            data-testid="register-submit-btn"
            className="w-full bg-[#7B35D8] hover:bg-[#6B2BC8] disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-all"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#7B35D8] hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}