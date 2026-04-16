import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function CorporateDemoHome() {
  const { user } = useAuth();
  if (user?.role === "hr_executive_demo") return <Navigate to="/corp-demo/executive" replace />;
  return <Navigate to="/corp-demo/dashboard" replace />;
}
