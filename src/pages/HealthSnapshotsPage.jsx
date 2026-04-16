import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Camera, Upload, Utensils, Dumbbell, Moon, TrendingUp, FlaskConical, Pill,
  Package, Filter, Trash2, X, Loader2, Calendar, Grid3X3, List, ChevronDown
} from "lucide-react";

const CATEGORIES = [
  { id: "meal", label: "Meal", icon: Utensils, color: "#D97706", gradient: "from-amber-500/20 to-amber-600/5" },
  { id: "workout", label: "Workout", icon: Dumbbell, color: "#10B981", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { id: "sleep", label: "Sleep", icon: Moon, color: "#6366F1", gradient: "from-indigo-500/20 to-indigo-600/5" },
  { id: "progress", label: "Progress", icon: TrendingUp, color: "#7B35D8", gradient: "from-violet-500/20 to-violet-600/5" },
  { id: "lab_result", label: "Lab Result", icon: FlaskConical, color: "#EF4444", gradient: "from-red-500/20 to-red-600/5" },
  { id: "supplements", label: "Supplements", icon: Pill, color: "#0EA5E9", gradient: "from-sky-500/20 to-sky-600/5" },
  { id: "other", label: "Other", icon: Package, color: "#64748B", gradient: "from-slate-500/20 to-slate-600/5" },
];

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function getCat(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[6]; }

export default function HealthSnapshotsPage() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState("meal");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileRef = useRef(null);

  const fetchSnapshots = useCallback(async () => {
    try {
      const params = filterCat !== "all" ? `?category=${filterCat}` : "";
      const res = await api.get(`/health-snapshots${params}`);
      setSnapshots(res.data?.snapshots || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  // const handleUpload = async () => {
  //   if (!uploadFile) return;
  //   setUploading(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", uploadFile);
  //     await api.post(`/health-snapshots/upload?category=${uploadCat}&notes=${encodeURIComponent(uploadNotes)}`, formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });
  //     toast.success("Snapshot saved!");
  //     setShowUpload(false);
  //     setUploadFile(null);
  //     setUploadPreview(null);
  //     setUploadNotes("");
  //     fetchSnapshots();
  //   } catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
  //   finally { setUploading(false); }
  // };
const handleUpload = async () => {
  if (!uploadFile) return;
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", uploadFile);

    const token = localStorage.getItem("agereboot_token");

    const res = await fetch(
      `https://isochroous-unlidded-elvina.ngrok-free.dev/api/health-snapshots/upload?category=${uploadCat}&notes=${encodeURIComponent(uploadNotes)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
          // ✅ NO Content-Type — browser sets multipart/form-data + boundary
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Upload failed");
    }

    toast.success("Snapshot saved!");
    setShowUpload(false);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadNotes("");
    if (fileRef.current) fileRef.current.value = "";
    fetchSnapshots();
  } catch (err) {
    toast.error(err.message || "Upload failed");
  } finally {
    setUploading(false);
  }
};
  const handleDelete = async (id) => {
    try {
      await api.delete(`/health-snapshots/${id}`);
      toast.success("Snapshot deleted");
      setSnapshots(s => s.filter(x => x.id !== id));
    } catch { toast.error("Delete failed"); }
  };

  const catCounts = {};
  snapshots.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-slide-up" data-testid="health-snapshots-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-stellar tracking-tight">
            Health <span className="text-cosmic">Snapshots</span>
          </h1>
          <p className="font-mono text-xs text-stellar-dim tracking-wider mt-1 uppercase">
            Track · Document · Progress
          </p>
        </div>
        <Button data-testid="new-snapshot-btn" onClick={() => setShowUpload(true)}
          className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider px-5 rounded-full border border-cosmic-light/30 shadow-[0_0_20px_rgba(123,53,216,0.25)]">
          <Camera size={16} className="mr-1.5" /> New Snapshot
        </Button>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter size={12} className="text-stellar-dim" />
        <button
          data-testid="filter-all"
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
            filterCat === "all" ? "bg-cosmic/15 border-cosmic/30 text-cosmic" : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-white/10"
          }`}
        >All ({snapshots.length})</button>
        {CATEGORIES.map(c => {
          const count = catCounts[c.id] || 0;
          const CIcon = c.icon;
          return (
            <button
              key={c.id}
              data-testid={`filter-${c.id}`}
              onClick={() => setFilterCat(c.id === filterCat ? "all" : c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
                filterCat === c.id ? `bg-[${c.color}]/10 border-[${c.color}]/30` : "bg-white/[0.02] border-white/5 hover:border-white/10"
              }`}
              style={filterCat === c.id ? { backgroundColor: `${c.color}15`, borderColor: `${c.color}40`, color: c.color } : { color: undefined }}
            >
              <CIcon size={11} style={filterCat === c.id ? { color: c.color } : {}} className={filterCat !== c.id ? "text-stellar-dim" : ""} />
              <span className={filterCat === c.id ? "" : "text-stellar-dim"}>{c.label}</span>
              {count > 0 && <span className="text-[9px] opacity-60">({count})</span>}
            </button>
          );
        })}
        <div className="ml-auto flex gap-1">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white/[0.05] text-stellar" : "text-stellar-dim"}`}>
            <Grid3X3 size={14} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-white/[0.05] text-stellar" : "text-stellar-dim"}`}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Timeline / Grid View */}
      {snapshots.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-white/5 bg-white/[0.02]">
          <Camera size={36} className="text-stellar-dim/20 mx-auto mb-3" />
          <p className="font-body text-sm text-stellar-dim mb-1">No snapshots yet</p>
          <p className="font-mono text-[10px] text-stellar-dim/50">Capture your meals, workouts, sleep scores, and progress photos</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {snapshots.map(snap => {
            const cat = getCat(snap.category);
            const CatIcon = cat.icon;
            return (
              <div key={snap.id} data-testid={`snapshot-${snap.id}`}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden group hover:border-white/10 transition-all">
                <div className="relative aspect-square">
                  <img
                    src={`${api.defaults.baseURL}/health-snapshots/${snap.id}`}
                    alt={snap.category}
                    className="w-full h-full object-cover select-none"
                    draggable="false"
                    onContextMenu={e => e.preventDefault()}
                  />
                  <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
                  {/* Category pill */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md"
                    style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}30` }}>
                    <CatIcon size={10} style={{ color: cat.color }} />
                    <span className="text-[8px] font-mono uppercase" style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                  {/* Delete on hover */}
                  <button onClick={() => handleDelete(snap.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="p-2.5">
                  {snap.notes && <p className="text-[11px] font-body text-stellar/80 truncate mb-1">{snap.notes}</p>}
                  <div className="flex items-center gap-1">
                    <Calendar size={9} className="text-stellar-dim/50" />
                    <span className="text-[9px] font-mono text-stellar-dim">{timeAgo(snap.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map(snap => {
            const cat = getCat(snap.category);
            const CatIcon = cat.icon;
            return (
              <div key={snap.id} data-testid={`snapshot-${snap.id}`}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center gap-4 hover:border-white/10 transition-all group">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src={`${api.defaults.baseURL}/health-snapshots/photo/${snap.id}`} alt="" className="w-full h-full object-cover select-none" draggable="false" onContextMenu={e => e.preventDefault()} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}25` }}>
                      <CatIcon size={9} /> {cat.label}
                    </span>
                    <span className="text-[9px] font-mono text-stellar-dim">{timeAgo(snap.created_at)}</span>
                  </div>
                  {snap.notes && <p className="text-[12px] font-body text-stellar/80 truncate">{snap.notes}</p>}
                </div>
                <button onClick={() => handleDelete(snap.id)}
                  className="p-1.5 rounded-full text-stellar-dim/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowUpload(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#0D0821]/95 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <button onClick={() => setShowUpload(false)} className="text-stellar-dim hover:text-stellar"><X size={20} /></button>
              <span className="font-display text-sm font-bold text-stellar tracking-wider uppercase">New Snapshot</span>
              <Button data-testid="upload-snapshot-btn" onClick={handleUpload} disabled={uploading || !uploadFile} size="sm"
                className="bg-cosmic hover:bg-cosmic-light text-white font-display text-xs uppercase tracking-wider px-5 rounded-full border border-cosmic-light/30 disabled:opacity-40">
                {uploading ? <><Loader2 size={12} className="animate-spin mr-1" /> Saving...</> : "Save"}
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Photo upload */}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {uploadPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={uploadPreview} alt="Preview" className="w-full max-h-[250px] object-cover" />
                  <button onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center">
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} data-testid="snapshot-pick-photo"
                  className="w-full py-10 rounded-xl border-2 border-dashed border-white/10 hover:border-cosmic/30 flex flex-col items-center gap-2 transition-colors">
                  <Upload size={24} className="text-stellar-dim" />
                  <span className="text-xs font-body text-stellar-dim">Tap to select photo</span>
                </button>
              )}

              {/* Category */}
              <div>
                <span className="font-mono text-[10px] text-stellar-dim uppercase tracking-wider mb-2 block">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => {
                    const CIcon = c.icon;
                    return (
                      <button key={c.id} onClick={() => setUploadCat(c.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all border ${
                          uploadCat === c.id ? "" : "bg-white/[0.02] border-white/5 text-stellar-dim hover:border-white/10"
                        }`}
                        style={uploadCat === c.id ? { backgroundColor: `${c.color}15`, borderColor: `${c.color}40`, color: c.color } : {}}>
                        <CIcon size={11} /> {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="font-mono text-[10px] text-stellar-dim uppercase tracking-wider mb-1 block">Notes (optional)</span>
                <input
                  data-testid="snapshot-notes"
                  value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)}
                  placeholder="e.g. Post-workout protein shake"
                  className="w-full bg-transparent text-stellar text-[13px] font-body placeholder:text-stellar-dim/30 outline-none border-b border-white/5 pb-2 focus:border-cosmic/30 transition-colors"
                  maxLength={200}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
