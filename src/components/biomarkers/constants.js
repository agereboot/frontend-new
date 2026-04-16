import {
  Heart, Zap, Brain, Moon, Shield,
  Watch, FlaskConical, Stethoscope, ClipboardList, Database, FileText,
} from "lucide-react";

export const PILLAR_META = {
  BR: { name: "Biological Resilience", short: "Bio", icon: Heart, color: "#EF4444", desc: "Blood, metabolic & inflammatory markers" },
  PF: { name: "Physical Fitness", short: "Fitness", icon: Zap, color: "#0F9F8F", desc: "Cardiorespiratory, body composition & daily activity" },
  CA: { name: "Cognitive Health", short: "Cognitive", icon: Brain, color: "#7B35D8", desc: "Memory, stress & cognitive assessment" },
  SR: { name: "Sleep & Recovery", short: "Sleep", icon: Moon, color: "#6366F1", desc: "Sleep quality & recovery metrics" },
  BL: { name: "Behaviour & Lifestyle", short: "Lifestyle", icon: Shield, color: "#D97706", desc: "Diet, activity & behaviour" },
};

export const STATUS_COLORS = { green: "#0F9F8F", yellow: "#D97706", red: "#EF4444", missing: "#475569" };

export const SOURCE_META = {
  wearable: { label: "Wearable", icon: Watch, color: "#6366F1" },
  lab_report: { label: "Lab Report", icon: FlaskConical, color: "#0F9F8F" },
  doctor_assessment: { label: "Doctor", icon: Stethoscope, color: "#3B82F6" },
  self_assessment: { label: "Self-Report", icon: ClipboardList, color: "#D97706" },
  questionnaire: { label: "Questionnaire", icon: ClipboardList, color: "#0F9F8F" },
  emr: { label: "EMR", icon: Database, color: "#8B5CF6" },
  manual: { label: "Manual", icon: FileText, color: "#475569" },
};

export const RATING_CONFIG = {
  excellent: { label: "Excellent", color: "#0F9F8F", bg: "bg-emerald-500/10", border: "border-emerald-500/15" },
  good: { label: "Good", color: "#84CC16", bg: "bg-lime-500/10", border: "border-lime-500/15" },
  average: { label: "Average", color: "#D97706", bg: "bg-amber-500/10", border: "border-amber-500/15" },
  below_average: { label: "Below Avg", color: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/15" },
  needs_attention: { label: "Needs Work", color: "#DC2626", bg: "bg-red-600/10", border: "border-red-600/15" },
};
