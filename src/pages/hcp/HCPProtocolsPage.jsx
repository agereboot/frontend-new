import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BookOpen, Search, Heart, Zap, Brain, Moon, Shield, Dna, FlaskConical,
  ArrowRight, CheckCircle, Timer, ChevronDown, ChevronRight,
  Microscope, Activity, Pill, Utensils, Users, Thermometer,
  FileText, X, Beaker,
} from "lucide-react";

const DIM_ICONS = { BR: Heart, PF: Zap, CA: Brain, SR: Moon, BL: Shield };
const DIM_COLORS = { BR: "#EF4444", PF: "#0F9F8F", CA: "#7B35D8", SR: "#6366F1", BL: "#D97706" };
const DIM_LABELS = { BR: "Bio Resilience", PF: "Fitness", CA: "Cognitive", SR: "Sleep/Recovery", BL: "Lifestyle" };
const GRADE_COLORS = { A: "#0F9F8F", B: "#84CC16", C: "#D97706" };

const CATEGORY_ICONS = {
  "Assessment": Microscope,
  "Exercise & Fitness": Activity,
  "Nutrition & Metabolism": Utensils,
  "Behavioral & Psychology": Brain,
  "Supplementation": Pill,
  "Cognitive Health": Brain,
  "Gut Health": Beaker,
  "Hormonal Health": Thermometer,
  "Recovery & Stress": Moon,
  "Social & Lifestyle": Users,
};

const HALLMARK_SHORT = {
  "Genomic Instability": "Genomic",
  "Telomere Attrition": "Telomere",
  "Epigenetic Alterations": "Epigenetic",
  "Loss of Proteostasis": "Proteostasis",
  "Disabled Macroautophagy": "Autophagy",
  "Deregulated Nutrient Sensing": "Nutrient Sens.",
  "Mitochondrial Dysfunction": "Mitochondrial",
  "Cellular Senescence": "Senescence",
  "Stem Cell Exhaustion": "Stem Cell",
  "Altered Intercellular Communication": "Intercellular",
  "Chronic Inflammation": "Inflammation",
  "Dysbiosis": "Dysbiosis",
};

const ROLE_CATEGORIES = {
  psychologist: ["Behavioral & Psychology", "Cognitive Health", "Assessment", "Recovery & Stress"],
  physical_therapist: ["Exercise & Fitness", "Assessment", "Recovery & Stress"],
  nutritional_coach: ["Nutrition & Metabolism", "Gut Health", "Supplementation", "Assessment"],
  fitness_coach: ["Exercise & Fitness", "Assessment", "Recovery & Stress", "Social & Lifestyle"],
  coach: ["Exercise & Fitness", "Assessment", "Recovery & Stress", "Social & Lifestyle"],
  nurse_navigator: null, // all categories
};

export default function HCPProtocolsPage() {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hallmarks, setHallmarks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [hallmarkFilter, setHallmarkFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [prescribing, setPrescribing] = useState(false);
  const [rxForm, setRxForm] = useState({ member_id: "", duration_weeks: 12, custom_notes: "" });

  useEffect(() => {
    Promise.all([
      api.get("/cc/protocols"),
      api.get("/cc/members"),
    ]).then(([pRes, mRes]) => {
      setProtocols(pRes.data.protocols);
      setCategories(pRes.data.categories || []);
      setHallmarks(pRes.data.hallmarks || []);
      setMembers(mRes.data.members || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const roleCategories = ROLE_CATEGORIES[user?.role];
  const filtered = protocols.filter(p => {
    if (roleCategories && !roleCategories.includes(p.category)) return false;
    if (catFilter && p.category !== catFilter) return false;
    if (hallmarkFilter && !(p.hallmarks_of_ageing || []).includes(hallmarkFilter)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.description.toLowerCase().includes(s) && !(p.lgp_id || "").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // Group by category
  const grouped = {};
  filtered.forEach(p => {
    const cat = p.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  const prescribe = async () => {
    if (!rxForm.member_id || !selected) return;
    setPrescribing(true);
    try {
      await api.post(`/cc/protocols/${selected.id}/prescribe`, rxForm);
      toast.success(`Prescribed "${selected.name}" successfully`);
      setRxForm({ member_id: "", duration_weeks: 12, custom_notes: "" });
    } catch { toast.error("Prescription failed"); } finally { setPrescribing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin" /></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="cc-protocols-page">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Longevity <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#7B35D8]">Protocol Library</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">
            {protocols.length} Evidence-Graded Protocols &middot; LGP-001 to LGP-020 &middot; Education Library
          </p>
        </div>
        <Badge data-testid="protocol-count-badge" className="font-mono text-xs bg-white/5 text-slate-300 border border-white/10">
          {filtered.length} / {protocols.length}
        </Badge>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3" data-testid="protocol-filters">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input data-testid="protocol-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search protocols by name, ID, or description..."
              className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-[#7B35D8] focus:outline-none placeholder:text-slate-600 font-body" />
          </div>
          {(catFilter || hallmarkFilter) && (
            <button data-testid="clear-filters" onClick={() => { setCatFilter(""); setHallmarkFilter(""); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 font-mono transition-all">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Hallmark Filter Chips */}
        <div className="flex gap-2 flex-wrap" data-testid="hallmark-filters">
          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider self-center mr-1">Hallmarks</span>
          {hallmarks.map(h => (
            <button key={h} data-testid={`hallmark-${h.replace(/\s/g, "-").toLowerCase()}`}
              onClick={() => setHallmarkFilter(hallmarkFilter === h ? "" : h)}
              className={`font-mono text-[9px] px-2.5 py-1 rounded-full border transition-all ${
                hallmarkFilter === h
                  ? "bg-[#7B35D8]/15 border-[#7B35D8]/40 text-white"
                  : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
              }`}>
              {HALLMARK_SHORT[h] || h}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap" data-testid="category-filters">
          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider self-center mr-1">Category</span>
          <button data-testid="cat-all" onClick={() => setCatFilter("")}
            className={`font-mono text-[9px] px-2.5 py-1 rounded-full border transition-all ${
              !catFilter ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
            }`}>All</button>
          {categories.map(c => {
            const CIcon = CATEGORY_ICONS[c] || FlaskConical;
            return (
              <button key={c} data-testid={`cat-${c.replace(/\s/g, "-").toLowerCase()}`}
                onClick={() => setCatFilter(catFilter === c ? "" : c)}
                className={`flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded-full border transition-all ${
                  catFilter === c
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
                }`}>
                <CIcon size={10} /> {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Protocol List grouped by category */}
        <div className="lg:col-span-7 space-y-5" data-testid="protocol-list">
          {Object.entries(grouped).map(([cat, protos]) => {
            const CIcon = CATEGORY_ICONS[cat] || FlaskConical;
            return (
              <div key={cat} data-testid={`protocol-group-${cat.replace(/\s/g, "-").toLowerCase()}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CIcon size={14} className="text-[#7B35D8]" />
                  <h3 className="font-display text-sm font-bold text-white">{cat}</h3>
                  <span className="font-mono text-[8px] text-slate-500">{protos.length}</span>
                </div>
                <div className="space-y-2">
                  {protos.map(p => {
                    const isActive = selected?.id === p.id;
                    return (
                      <button key={p.id} data-testid={`protocol-${p.lgp_id || p.id}`}
                        onClick={() => { setSelected(p); setDetailTab("overview"); }}
                        className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
                          isActive
                            ? "border-[#7B35D8]/40 bg-[#7B35D8]/5 shadow-[0_0_30px_rgba(123,53,216,0.15)]"
                            : "border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10"
                        }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[9px] text-[#7B35D8]/70">{p.lgp_id}</span>
                              <span className="font-body text-sm font-semibold text-white">{p.name}</span>
                              <Badge className="font-mono text-[7px] shrink-0" style={{ backgroundColor: GRADE_COLORS[p.evidence_grade] + "15", color: GRADE_COLORS[p.evidence_grade], border: `1px solid ${GRADE_COLORS[p.evidence_grade]}30` }}>
                                Grade {p.evidence_grade}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(p.hallmarks_of_ageing || []).slice(0, 3).map(h => (
                                <span key={h} className="font-mono text-[7px] px-1.5 py-0.5 rounded-full bg-white/[0.03] border border-white/5 text-slate-400">
                                  {HALLMARK_SHORT[h] || h}
                                </span>
                              ))}
                              {(p.hallmarks_of_ageing || []).length > 3 && (
                                <span className="font-mono text-[7px] text-slate-500">+{p.hallmarks_of_ageing.length - 3}</span>
                              )}
                            </div>
                            <p className="font-body text-xs text-slate-400 line-clamp-2">{p.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex gap-1">
                              {(p.hps_dimensions || []).map(d => {
                                const DIcon = DIM_ICONS[d] || FlaskConical;
                                return <DIcon key={d} size={12} style={{ color: DIM_COLORS[d] || "#7B35D8" }} />;
                              })}
                            </div>
                            <span className="font-mono text-[8px] text-slate-500">{p.duration_default_weeks}wk</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12">
              <Dna size={40} className="text-[#7B35D8]/20 mx-auto mb-3" />
              <p className="font-body text-sm text-slate-400">No protocols match your filters.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-5">
          {selected ? (
            <div className="sticky top-6 rounded-xl border border-[#7B35D8]/30 bg-black/30 backdrop-blur-xl shadow-[0_0_30px_rgba(123,53,216,0.1)] overflow-hidden" data-testid="protocol-detail">
              {/* Header */}
              <div className="px-5 pt-5 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-[#7B35D8]">{selected.lgp_id}</span>
                  <Badge className="font-mono text-[7px]" style={{ backgroundColor: GRADE_COLORS[selected.evidence_grade] + "15", color: GRADE_COLORS[selected.evidence_grade] }}>
                    Grade {selected.evidence_grade}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold text-white leading-tight">{selected.name}</h3>
                <p className="font-mono text-[9px] text-slate-500 mt-1">{selected.category} &middot; {selected.duration_default_weeks} weeks</p>
              </div>

              {/* Detail Tabs */}
              <div className="flex border-b border-white/5">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "interventions", label: "Interventions" },
                  { key: "goals", label: "SMART Goals" },
                  { key: "codes", label: "Codes" },
                ].map(t => (
                  <button key={t.key} data-testid={`detail-tab-${t.key}`}
                    onClick={() => setDetailTab(t.key)}
                    className={`flex-1 px-3 py-2 font-mono text-[9px] uppercase tracking-wider transition-all border-b-2 ${
                      detailTab === t.key ? "border-[#7B35D8] text-white" : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}>{t.label}</button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {detailTab === "overview" && (
                  <div className="space-y-4">
                    <p className="font-body text-sm text-slate-300">{selected.description}</p>
                    <div>
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">Hallmarks of Ageing</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(selected.hallmarks_of_ageing || []).map(h => (
                          <span key={h} className="font-mono text-[8px] px-2 py-0.5 rounded-full bg-[#7B35D8]/10 border border-[#7B35D8]/20 text-[#7B35D8]">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selected.impact_scores && (
                      <div>
                        <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">Expected HPS Impact</span>
                        <div className="flex gap-2 mt-1.5">
                          {Object.entries(selected.impact_scores).map(([dim, score]) => {
                            const DIcon = DIM_ICONS[dim] || FlaskConical;
                            return (
                              <div key={dim} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                                <DIcon size={11} style={{ color: DIM_COLORS[dim] }} />
                                <span className="font-mono text-[9px] text-white font-bold">+{score}</span>
                                <span className="font-mono text-[7px] text-slate-500">{DIM_LABELS[dim]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === "interventions" && (
                  <div className="space-y-3">
                    {(selected.interventions || []).map((iv, i) => (
                      <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3" data-testid={`intervention-${i}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="font-mono text-[7px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{iv.type}</Badge>
                          <span className="font-body text-sm font-medium text-white">{iv.name}</span>
                        </div>
                        <p className="font-body text-xs text-slate-400 leading-relaxed">{iv.details}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "goals" && selected.smart_goals_template && (
                  <div className="space-y-3">
                    {Object.entries(selected.smart_goals_template).map(([key, val]) => (
                      <div key={key} className="rounded-lg border border-white/5 bg-white/[0.02] p-3" data-testid={`goal-${key}`}>
                        <span className="font-mono text-[8px] uppercase tracking-wider font-bold"
                          style={{ color: { specific: "#0F9F8F", measurable: "#6366F1", achievable: "#D97706", relevant: "#7B35D8", time_bound: "#EF4444" }[key] || "#7B35D8" }}>
                          {key.replace("_", "-")}
                        </span>
                        <p className="font-body text-xs text-slate-300 mt-1">{val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "codes" && selected.codes && (
                  <div className="space-y-4">
                    {(selected.codes.icd10 || []).length > 0 && (
                      <div>
                        <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">ICD-10 Codes</span>
                        <div className="mt-1.5 space-y-1">
                          {selected.codes.icd10.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 py-1" data-testid={`icd10-${c.code}`}>
                              <code className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{c.code}</code>
                              <span className="font-mono text-[9px] text-slate-400">{c.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(selected.codes.loinc || []).length > 0 && (
                      <div>
                        <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">LOINC Codes</span>
                        <div className="mt-1.5 space-y-1">
                          {selected.codes.loinc.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 py-1" data-testid={`loinc-${c.code}`}>
                              <code className="font-mono text-[10px] text-[#6366F1] bg-[#6366F1]/10 px-1.5 py-0.5 rounded">{c.code}</code>
                              <span className="font-mono text-[9px] text-slate-400">{c.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Education Note */}
              <div className="px-5 pb-5 pt-3 border-t border-white/5">
                <div className="rounded-lg bg-[#7B35D8]/5 border border-[#7B35D8]/20 p-3 text-center">
                  <p className="font-mono text-[10px] text-[#7B35D8] uppercase tracking-[0.15em] mb-1">Education Library</p>
                  <p className="text-xs text-slate-400">Protocols are assigned to members via the Smart EMR during clinical encounters</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-6 rounded-xl border border-white/5 bg-black/20 p-12 text-center">
              <Dna size={40} className="text-[#7B35D8]/30 mx-auto mb-3" />
              <p className="font-body text-sm text-slate-400">Select a protocol to view details,</p>
              <p className="font-body text-sm text-slate-400">interventions, SMART goals & codes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
