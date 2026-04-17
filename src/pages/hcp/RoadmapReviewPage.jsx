import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  User, AlertTriangle, Edit3, Plus, Trash2, GitCompare, ArrowRight,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const API = "http://16.170.222.16";

const STATUS_BADGE = {
  pending: { className: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Clock, label: "Pending" },
  approved: { className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: CheckCircle, label: "Approved" },
  rejected: { className: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle, label: "Rejected" },
  suggested: { className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: GitCompare, label: "Suggested" },
  accepted: { className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: CheckCircle, label: "Accepted" },
};

function MilestoneEditor({ milestones, onChange }) {
  const update = (i, field, val) => {
    const m = [...milestones];
    m[i] = { ...m[i], [field]: val };
    onChange(m);
  };
  const remove = (i) => onChange(milestones.filter((_, j) => j !== i));
  const add = () => onChange([...milestones, { month: milestones.length > 0 ? milestones[milestones.length - 1].month + 1 : 1, target: "", status: "planned" }]);

  return (
    <div className="space-y-2" data-testid="milestone-editor">
      {milestones.map((m, i) => (
        <div key={i} className="flex items-start gap-2 bg-zinc-900/50 rounded-lg p-2 border border-zinc-800">
          <div className="flex-shrink-0 w-16">
            <label className="text-[10px] text-zinc-500">Month</label>
            <input type="number" min={1} max={24} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white" value={m.month} onChange={e => update(i, "month", parseInt(e.target.value) || 1)} data-testid={`milestone-month-${i}`}/>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500">Target</label>
            <input type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white" value={m.target} onChange={e => update(i, "target", e.target.value)} data-testid={`milestone-target-${i}`}/>
          </div>
          <div className="flex-shrink-0 w-24">
            <label className="text-[10px] text-zinc-500">Status</label>
            <AppSelect className="w-full bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-xs text-white" value={m.status} onChange={e => update(i, "status", e.target.value)}>
              <AppSelectOption value="planned">Planned</AppSelectOption>
              <AppSelectOption value="in_progress">In Progress</AppSelectOption>
              <AppSelectOption value="completed">Completed</AppSelectOption>
            </AppSelect>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 h-7 w-7 p-0 text-red-400 hover:bg-red-400/10" onClick={() => remove(i)}><Trash2 size={12}/></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 text-xs w-full" onClick={add} data-testid="add-milestone-btn"><Plus size={12} className="mr-1"/>Add Milestone</Button>
    </div>
  );
}

function DiffView({ diff }) {
  if (!diff || diff.length === 0) return null;
  const DIFF_COLORS = {
    unchanged: { bg: "", orig: "text-zinc-500", sugg: "text-zinc-500", label: "" },
    modified: { bg: "bg-cyan-500/5 border-l-2 border-l-cyan-500", orig: "text-red-400 line-through", sugg: "text-cyan-300", label: "Modified" },
    removed: { bg: "bg-red-500/5 border-l-2 border-l-red-500", orig: "text-red-400 line-through", sugg: "", label: "Removed" },
    added: { bg: "bg-emerald-500/5 border-l-2 border-l-emerald-500", orig: "", sugg: "text-emerald-400", label: "Added" },
  };
  return (
    <div className="space-y-1" data-testid="diff-view">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="text-[10px] font-mono text-red-400/60 uppercase tracking-wider pl-2">Original</div>
        <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider pl-2">Suggested</div>
      </div>
      {diff.map((d, i) => {
        const c = DIFF_COLORS[d.type] || DIFF_COLORS.unchanged;
        return (
          <div key={i} className={`grid grid-cols-2 gap-2 rounded-md py-1.5 px-2 ${c.bg}`}>
            <div className="flex items-start gap-1.5">
              {d.original ? (
                <>
                  <span className={`text-[10px] font-mono ${c.orig} shrink-0`}>M{d.original.month}</span>
                  <span className={`text-xs ${c.orig}`}>{d.original.target}</span>
                </>
              ) : <span className="text-xs text-zinc-600 italic">—</span>}
            </div>
            <div className="flex items-start gap-1.5">
              {d.suggested ? (
                <>
                  <span className={`text-[10px] font-mono ${c.sugg} shrink-0`}>M{d.suggested.month}</span>
                  <span className={`text-xs ${c.sugg}`}>{d.suggested.target}</span>
                  {c.label && <Badge className="text-[8px] px-1 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shrink-0">{c.label}</Badge>}
                </>
              ) : <span className="text-xs text-zinc-600 italic">— removed</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RoadmapReviewPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [formData, setFormData] = useState({ notes: "", reasons: "", clinical_notes: "", clinical_rationale: "", change_summary: "" });
  const [suggestedMilestones, setSuggestedMilestones] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = showAll ? "all-reviews" : "pending-reviews";
      const res = await fetch(`${API}/api/roadmap/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setReviews(d.reviews || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, showAll]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async (reviewId) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/roadmap/${reviewId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: formData.notes, modifications: formData.notes ? formData.notes.split("\n").filter(Boolean) : [] }),
      });
      if (res.ok) { setActionModal(null); fetchReviews(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleReject = async (reviewId) => {
    if (!formData.reasons && !formData.clinical_notes) { alert("Must provide clinical/scientific reasons for rejection"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/roadmap/${reviewId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reasons: formData.reasons.split("\n").filter(Boolean), clinical_notes: formData.clinical_notes }),
      });
      if (res.ok) { setActionModal(null); fetchReviews(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleSuggest = async (reviewId) => {
    if (suggestedMilestones.length === 0 || !formData.clinical_rationale) { alert("Provide modified milestones and clinical rationale"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/roadmap/${reviewId}/suggest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          suggested_milestones: suggestedMilestones,
          clinical_rationale: formData.clinical_rationale,
          change_summary: formData.change_summary ? formData.change_summary.split("\n").filter(Boolean) : [],
        }),
      });
      if (res.ok) { setActionModal(null); fetchReviews(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const openSuggestModal = (r) => {
    setSuggestedMilestones(JSON.parse(JSON.stringify(r.milestones || [])));
    setFormData({ notes: "", reasons: "", clinical_notes: "", clinical_rationale: "", change_summary: "" });
    setActionModal({ type: "suggest", id: r.id, name: r.employee_name, review: r });
  };

  const pendingCount = reviews.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6" data-testid="roadmap-review-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardCheck size={24} className="text-violet-400"/>Roadmap Validation</h1>
          <p className="text-zinc-400 text-sm mt-1">Review, validate, or suggest modifications to player roadmaps</p>
        </div>
        <div className="flex gap-2">
          <Button variant={showAll ? "outline" : "default"} size="sm" onClick={() => setShowAll(false)} className={showAll ? "border-zinc-700 text-zinc-300" : "bg-violet-600"} data-testid="filter-pending">
            Pending {pendingCount > 0 && <Badge className="ml-1 bg-amber-500 text-xs">{pendingCount}</Badge>}
          </Button>
          <Button variant={!showAll ? "outline" : "default"} size="sm" onClick={() => setShowAll(true)} className={!showAll ? "border-zinc-700 text-zinc-300" : "bg-violet-600"} data-testid="filter-all">All Reviews</Button>
        </div>
      </div>

      {loading && <div className="text-zinc-400 text-center py-12">Loading reviews...</div>}
      {!loading && reviews.length === 0 && (
        <Card className="bg-[#0f0f1a] border-zinc-800"><CardContent className="py-12 text-center text-zinc-500"><ClipboardCheck size={32} className="mx-auto mb-2 opacity-30"/>No {showAll ? "" : "pending "}reviews</CardContent></Card>
      )}

      <div className="space-y-3">
        {reviews.map(r => {
          const sb = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
          const Icon = sb.icon;
          const isExpanded = expandedId === r.id;
          return (
            <Card key={r.id} className="bg-[#0f0f1a] border-zinc-800 hover:border-zinc-700 transition-colors" data-testid={`review-card-${r.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center"><User size={16} className="text-violet-400"/></div>
                    <div>
                      <div className="text-white font-medium text-sm">{r.employee_name}</div>
                      <div className="text-zinc-500 text-xs">{r.roadmap_title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${sb.className} border text-xs`}><Icon size={12} className="mr-1"/>{sb.label}</Badge>
                    <span className="text-zinc-500 text-xs">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : ""}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-zinc-500"/> : <ChevronDown size={14} className="text-zinc-500"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div><div className="text-xs text-zinc-500 mb-1">Phase</div><div className="text-sm text-zinc-300 capitalize">{r.current_phase || "N/A"}</div></div>
                      <div><div className="text-xs text-zinc-500 mb-1">Priority Pillars</div><div className="flex gap-1">{(r.priority_pillars || []).map(p => <Badge key={p} variant="secondary" className="text-[10px] capitalize">{p}</Badge>)}</div></div>
                    </div>

                    {/* Show diff if suggestion exists */}
                    {(r.status === "suggested" || r.status === "accepted") && r.milestone_diff ? (
                      <div>
                        <div className="text-xs text-cyan-400 font-medium mb-2 flex items-center gap-1"><GitCompare size={14}/>Side-by-Side Comparison</div>
                        <DiffView diff={r.milestone_diff} />
                        {r.clinical_rationale && <div className="mt-2 p-2 bg-cyan-500/5 rounded-lg border border-cyan-900/30 text-xs text-cyan-300">{r.clinical_rationale}</div>}
                        {r.change_summary?.length > 0 && (
                          <div className="mt-1 space-y-0.5">{r.change_summary.map((s, i) => <div key={i} className="text-[10px] text-cyan-400/70">- {s}</div>)}</div>
                        )}
                        {r.status === "accepted" && <div className="text-[10px] text-emerald-400 mt-1">Player accepted the suggestion on {r.accepted_at ? new Date(r.accepted_at).toLocaleDateString() : "N/A"}</div>}
                      </div>
                    ) : r.milestones && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-2">Milestones</div>
                        <div className="space-y-1">{r.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <Badge variant={m.status === "completed" ? "default" : "outline"} className={`text-[10px] w-20 justify-center ${m.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : m.status === "in_progress" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "text-zinc-500"}`}>{m.status}</Badge>
                            <span className="text-zinc-400">Month {m.month}:</span><span className="text-zinc-300">{m.target}</span>
                          </div>
                        ))}</div>
                      </div>
                    )}

                    {r.status === "rejected" && (
                      <div className="bg-red-500/5 border border-red-900/30 rounded-lg p-3">
                        <div className="text-xs text-red-400 font-medium mb-1 flex items-center gap-1"><AlertTriangle size={12}/>Rejection Reasons</div>
                        {(r.rejection_reasons || []).map((reason, i) => <div key={i} className="text-xs text-red-300 ml-4">- {reason}</div>)}
                        {r.clinical_notes && <div className="text-xs text-zinc-400 mt-2 italic">{r.clinical_notes}</div>}
                        <div className="text-[10px] text-zinc-500 mt-1">Reviewed by {r.reviewed_by_name} on {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : "N/A"}</div>
                      </div>
                    )}

                    {r.status === "approved" && (
                      <div className="bg-emerald-500/5 border border-emerald-900/30 rounded-lg p-3">
                        <div className="text-xs text-emerald-400 font-medium mb-1 flex items-center gap-1"><CheckCircle size={12}/>Approved</div>
                        {r.review_notes && <div className="text-xs text-zinc-300">{r.review_notes}</div>}
                        {(r.modifications || []).length > 0 && (<div className="mt-1">{r.modifications.map((m, i) => <div key={i} className="text-xs text-emerald-300 ml-4">+ {m}</div>)}</div>)}
                        <div className="text-[10px] text-zinc-500 mt-1">Approved by {r.reviewed_by_name} on {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : "N/A"}</div>
                      </div>
                    )}

                    {/* Action buttons for pending reviews */}
                    {r.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => { setActionModal({ type: "approve", id: r.id, name: r.employee_name }); setFormData({ notes: "", reasons: "", clinical_notes: "", clinical_rationale: "", change_summary: "" }); }} data-testid={`approve-btn-${r.id}`}>
                          <CheckCircle size={12} className="mr-1"/>Approve
                        </Button>
                        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs" onClick={() => openSuggestModal(r)} data-testid={`suggest-btn-${r.id}`}>
                          <Edit3 size={12} className="mr-1"/>Suggest Changes
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs" onClick={() => { setActionModal({ type: "reject", id: r.id, name: r.employee_name }); setFormData({ notes: "", reasons: "", clinical_notes: "", clinical_rationale: "", change_summary: "" }); }} data-testid={`reject-btn-${r.id}`}>
                          <XCircle size={12} className="mr-1"/>Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
          <div className={`bg-[#0f0f1a] border border-zinc-700 rounded-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto ${actionModal.type === "suggest" ? "max-w-2xl" : "max-w-md"}`} onClick={e => e.stopPropagation()} data-testid="review-action-modal">
            <h3 className="text-lg font-bold text-white">
              {actionModal.type === "approve" ? "Approve" : actionModal.type === "suggest" ? "Suggest Modified Roadmap" : "Reject"} Roadmap
            </h3>
            <p className="text-zinc-400 text-sm">For: {actionModal.name}</p>

            {actionModal.type === "approve" && (
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Notes & Modifications (one per line)</label>
                <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white min-h-[80px] focus:border-emerald-500 focus:outline-none" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Add Vitamin D supplementation in month 2..." data-testid="approve-notes-input"/>
              </div>
            )}

            {actionModal.type === "suggest" && (
              <>
                <div>
                  <label className="text-xs text-cyan-400 block mb-2 font-medium">Edit Milestones — modify, add, or remove as clinically appropriate</label>
                  <MilestoneEditor milestones={suggestedMilestones} onChange={setSuggestedMilestones} />
                </div>
                <div>
                  <label className="text-xs text-cyan-400 block mb-1">Clinical Rationale *</label>
                  <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white min-h-[60px] focus:border-cyan-500 focus:outline-none" value={formData.clinical_rationale} onChange={e => setFormData(p => ({ ...p, clinical_rationale: e.target.value }))} placeholder="Explain why these changes are recommended..." data-testid="suggest-rationale-input"/>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Change Summary (one per line)</label>
                  <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white min-h-[40px] focus:border-zinc-500 focus:outline-none" value={formData.change_summary} onChange={e => setFormData(p => ({ ...p, change_summary: e.target.value }))} placeholder="e.g. Reduced HbA1c target from 5.0% to 5.5%..." data-testid="suggest-summary-input"/>
                </div>
              </>
            )}

            {actionModal.type === "reject" && (
              <>
                <div>
                  <label className="text-xs text-red-400 block mb-1">Clinical/Scientific Reasons (one per line) *</label>
                  <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white min-h-[60px] focus:border-red-500 focus:outline-none" value={formData.reasons} onChange={e => setFormData(p => ({ ...p, reasons: e.target.value }))} placeholder="e.g. HbA1c target too aggressive for baseline..." data-testid="reject-reasons-input"/>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Additional Clinical Notes</label>
                  <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white min-h-[40px] focus:border-zinc-500 focus:outline-none" value={formData.clinical_notes} onChange={e => setFormData(p => ({ ...p, clinical_notes: e.target.value }))} placeholder="Recommendations for revision..." data-testid="reject-clinical-notes-input"/>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setActionModal(null)} className="border-zinc-700 text-zinc-300">Cancel</Button>
              {actionModal.type === "approve" && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(actionModal.id)} disabled={submitting} data-testid="confirm-approve">{submitting ? "..." : "Confirm Approve"}</Button>
              )}
              {actionModal.type === "suggest" && (
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => handleSuggest(actionModal.id)} disabled={submitting} data-testid="confirm-suggest">
                  <GitCompare size={12} className="mr-1"/>{submitting ? "..." : "Send Suggestion to Player"}
                </Button>
              )}
              {actionModal.type === "reject" && (
                <Button size="sm" variant="destructive" onClick={() => handleReject(actionModal.id)} disabled={submitting} data-testid="confirm-reject">{submitting ? "..." : "Confirm Reject"}</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
