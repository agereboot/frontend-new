import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FlaskConical, Clock, CheckCircle, XCircle, Beaker, Upload,
  ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus, Plus,
  RefreshCcw, Eye,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const STATUS_MAP = {
  ordered: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock, label: "Ordered" },
  collected: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Beaker, label: "Collected" },
  processing: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: FlaskConical, label: "Processing" },
  resulted: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle, label: "Resulted" },
  cancelled: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "Cancelled" },
};

const TRANSITIONS = {
  ordered: ["collected", "cancelled"],
  collected: ["processing", "cancelled"],
  processing: ["resulted"],
  resulted: [],
  cancelled: [],
};

export default function HCPLabOrdersPage() {
  const [panels, setPanels] = useState([]);
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [labPartners, setLabPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [orderForm, setOrderForm] = useState({ member_id: "", panel_id: "", priority: "routine", notes: "", fasting_required: false, lab_partner_id: "LP-ING" });
  const [creating, setCreating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [resultForm, setResultForm] = useState([]);
  const [uploadingResults, setUploadingResults] = useState(false);
  const [showResultUpload, setShowResultUpload] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("/cc/lab-panels"),
      api.get("/cc/lab-orders"),
      api.get("/cc/members"),
      api.get("/cc/lab-partners"),
    ]).then(([pRes, oRes, mRes, lpRes]) => {
      setPanels(pRes.data.panels || []);
      setOrders(oRes.data.orders || []);
      setMembers(mRes.data.members || []);
      setLabPartners(lpRes.data.partners || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createOrder = async () => {
    if (!orderForm.member_id || !orderForm.panel_id) return;
    setCreating(true);
    try {
      const res = await api.post("/cc/lab-orders", orderForm);
      setOrders(prev => [res.data, ...prev]);
      setOrderForm({ member_id: "", panel_id: "", priority: "routine", notes: "", fasting_required: false, lab_partner_id: "LP-ING" });
      setTab("orders");
      toast.success(`Lab order ${res.data.order_number} created`);
    } catch { toast.error("Failed to create lab order"); } finally { setCreating(false); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/cc/lab-orders/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(res.data);
      toast.success(`Order updated to ${newStatus}`);
    } catch { toast.error("Update failed"); }
  };

  const selectOrder = (order) => {
    setSelectedOrder(selectedOrder?.id === order.id ? null : order);
    setShowResultUpload(false);
  };

  const initResultUpload = (order) => {
    const biomarkers = order.biomarkers || [];
    setResultForm(biomarkers.map(b => ({ test_name: b, value: "", unit: "", reference_low: "", reference_high: "" })));
    setShowResultUpload(true);
  };

  const submitResults = async () => {
    if (!selectedOrder) return;
    const filled = resultForm.filter(r => r.value !== "");
    if (filled.length === 0) { toast.error("Enter at least one result"); return; }
    setUploadingResults(true);
    try {
      const payload = {
        results: filled.map(r => ({
          test_name: r.test_name,
          value: parseFloat(r.value) || 0,
          unit: r.unit,
          reference_low: r.reference_low ? parseFloat(r.reference_low) : null,
          reference_high: r.reference_high ? parseFloat(r.reference_high) : null,
        })),
        notes: "",
      };
      const res = await api.post(`/cc/lab-orders/${selectedOrder.id}/results`, payload);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? res.data : o));
      setSelectedOrder(res.data);
      setShowResultUpload(false);
      toast.success(`${filled.length} results uploaded & auto-ingested to biomarkers. ${res.data.results?.filter(r => r.flag && r.flag !== "normal").length || 0} abnormal`);
    } catch { toast.error("Upload failed"); } finally { setUploadingResults(false); }
  };

  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  const memberName = (id) => members.find(m => m.id === id)?.name || "Unknown";

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="lab-orders-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Orders</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">
            {panels.length} Panels &middot; {orders.length} Orders &middot; {orders.filter(o => o.status === "resulted").length} Resulted
            <span className="text-emerald-500/60 ml-2">Orders created via Smart EMR</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="refresh-labs" onClick={fetchData} size="sm"
            className="bg-white/5 text-white border border-white/10 hover:bg-white/10 font-mono text-[9px]">
            <RefreshCcw size={12} className="mr-1" /> Refresh
          </Button>
          {["orders", "new_order", "panels"].map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedOrder(null); }} data-testid={`lab-tab-${t}`}
              className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                tab === t ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
              }`}>{t === "new_order" ? "New Order" : t.replace("_", " ")}</button>
          ))}
        </div>
      </div>

      {tab === "orders" && (
        <div className="space-y-4" data-testid="lab-orders-list">
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setStatusFilter("")}
              className={`font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${!statusFilter ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-slate-500 hover:text-white"}`}>All ({orders.length})</button>
            {Object.entries(STATUS_MAP).map(([k, v]) => {
              const count = orders.filter(o => o.status === k).length;
              return (
                <button key={k} onClick={() => setStatusFilter(statusFilter === k ? "" : k)}
                  className={`font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${statusFilter === k ? v.color : "border-white/5 text-slate-500 hover:text-white"}`}>{v.label} ({count})</button>
              );
            })}
          </div>

          {/* Orders Table */}
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
              <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase">Order #</span>
              <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase">Patient</span>
              <span className="col-span-3 font-mono text-[7px] text-slate-500 uppercase">Panel</span>
              <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Priority</span>
              <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Price</span>
              <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Status</span>
              <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase text-right">Actions</span>
            </div>
            {filteredOrders.map(order => {
              const sm = STATUS_MAP[order.status] || STATUS_MAP.ordered;
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div key={order.id}>
                  <div data-testid={`lab-order-${order.order_number}`}
                    onClick={() => selectOrder(order)}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all items-center ${
                      isSelected ? "bg-emerald-500/[0.04]" : "hover:bg-white/[0.02]"
                    }`}>
                    <div className="col-span-2">
                      <span className="font-mono text-[9px] text-emerald-400">{order.order_number}</span>
                      <p className="font-mono text-[7px] text-slate-500">{new Date(order.ordered_at).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-body text-xs text-white">{memberName(order.member_id)}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="font-body text-xs text-white">{order.panel_name}</span>
                      <p className="font-mono text-[7px] text-slate-500">{order.panel_category}</p>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`font-mono text-[6px] ${order.priority === "stat" ? "bg-red-500/10 text-red-400 border-red-500/20" : order.priority === "urgent" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-slate-400 border-white/10"}`}>
                        {order.priority}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <span className="font-mono text-xs text-white">${order.price}</span>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`font-mono text-[7px] ${sm.color}`}>{sm.label}</Badge>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      {TRANSITIONS[order.status]?.map(next => (
                        <button key={next} data-testid={`mark-${next}-${order.id}`}
                          onClick={e => { e.stopPropagation(); updateStatus(order.id, next); }}
                          className={`font-mono text-[7px] px-2 py-1 rounded-lg border transition-all ${
                            next === "cancelled" ? "text-red-400 border-red-500/20 hover:bg-red-500/10" : `${STATUS_MAP[next]?.color || "text-white border-white/10"} hover:opacity-80`
                          }`}>
                          {next === "cancelled" ? "Cancel" : STATUS_MAP[next]?.label}
                        </button>
                      ))}
                      {order.status === "resulted" && (
                        <button data-testid={`view-results-${order.id}`}
                          onClick={e => { e.stopPropagation(); selectOrder(order); }}
                          className="font-mono text-[7px] text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10 transition-all flex items-center gap-1">
                          <Eye size={10} /> Results
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isSelected && (
                    <div className="bg-black/20 border-b border-white/[0.03] px-4 py-4 space-y-4" data-testid="lab-order-detail">
                      <div className="grid grid-cols-4 gap-3">
                        <DetailCard label="Biomarkers" value={
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(order.biomarkers || []).map(b => (
                              <span key={b} className="font-mono text-[7px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{b}</span>
                            ))}
                          </div>
                        } />
                        <DetailCard label="LOINC" value={<span className="font-mono text-sm text-white">{order.loinc}</span>} />
                        <DetailCard label="Turnaround" value={<span className="font-mono text-sm text-white">{order.turnaround_days} days</span>} />
                        <DetailCard label="Ordered By" value={<span className="font-mono text-xs text-white">{order.ordered_by_name}</span>} />
                      </div>

                      {/* Lab Partner & Specimen Tracking */}
                      {(order.lab_partner_name || order.specimen) && (
                        <div className="grid grid-cols-2 gap-3">
                          {order.lab_partner_name && (
                            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/[0.03] p-3">
                              <span className="font-mono text-[7px] text-indigo-400 uppercase">Lab Partner</span>
                              <p className="font-body text-sm text-white mt-1">{order.lab_partner_name}</p>
                              <p className="font-mono text-[7px] text-slate-400">{order.lab_accreditation} Accredited</p>
                            </div>
                          )}
                          {order.specimen && (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-3" data-testid="specimen-tracking">
                              <span className="font-mono text-[7px] text-amber-400 uppercase">Specimen Tracking</span>
                              <div className="flex items-center gap-3 mt-1">
                                <div>
                                  <p className="font-mono text-xs text-white">{order.specimen.barcode}</p>
                                  <p className="font-mono text-[7px] text-slate-400">Type: {order.specimen.type} &middot; Temp: {order.specimen.temperature}</p>
                                </div>
                                <Badge className={`font-mono text-[6px] ml-auto ${
                                  order.specimen.transport_status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  order.specimen.transport_status === "in_transit" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                  order.specimen.transport_status === "received" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                  "bg-white/5 text-slate-500 border-white/10"
                                }`}>{order.specimen.transport_status?.replace("_", " ")}</Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3">
                        <span className="font-mono text-[7px] text-slate-500 uppercase">Order Timeline</span>
                        <div className="flex items-center gap-3 mt-2">
                          {["ordered", "collected", "processing", "resulted"].map((step, i) => {
                            const isComplete = ["ordered", "collected", "processing", "resulted"].indexOf(order.status) >= i;
                            const isCurrent = order.status === step;
                            return (
                              <div key={step} className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-mono ${
                                  isComplete ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                  "bg-white/5 text-slate-600 border border-white/10"
                                } ${isCurrent ? "ring-2 ring-emerald-500/30" : ""}`}>
                                  {isComplete ? <CheckCircle size={10} /> : i + 1}
                                </div>
                                <span className={`font-mono text-[7px] ${isComplete ? "text-emerald-400" : "text-slate-600"}`}>
                                  {STATUS_MAP[step]?.label}
                                </span>
                                {i < 3 && <div className={`w-8 h-px ${isComplete ? "bg-emerald-500/30" : "bg-white/5"}`} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Results Display */}
                      {order.status === "resulted" && order.results?.length > 0 && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-4" data-testid="lab-results-display">
                          <h4 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-400" /> Lab Results
                          </h4>
                          <div className="grid grid-cols-1 gap-1.5">
                            {order.results.map((r, i) => (
                              <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                r.flag === "high" ? "border-red-500/20 bg-red-500/[0.04]" :
                                r.flag === "low" ? "border-amber-500/20 bg-amber-500/[0.04]" :
                                "border-white/5 bg-white/[0.02]"
                              }`} data-testid={`result-${r.test_name}`}>
                                <div className="flex items-center gap-2">
                                  {r.flag === "high" && <TrendingUp size={12} className="text-red-400" />}
                                  {r.flag === "low" && <TrendingDown size={12} className="text-amber-400" />}
                                  {(!r.flag || r.flag === "normal") && <Minus size={12} className="text-slate-500" />}
                                  <span className="font-mono text-[9px] text-white">{r.test_name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`font-mono text-sm font-bold ${
                                    r.flag === "high" ? "text-red-400" : r.flag === "low" ? "text-amber-400" : "text-emerald-400"
                                  }`}>
                                    {r.value} {r.unit}
                                  </span>
                                  {r.reference_low != null && r.reference_high != null && (
                                    <span className="font-mono text-[7px] text-slate-500">ref: {r.reference_low}-{r.reference_high}</span>
                                  )}
                                  {r.flag && r.flag !== "normal" && (
                                    <Badge className={`font-mono text-[6px] ${r.flag === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                      {r.flag.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {order.result_notes && (
                            <p className="font-mono text-[8px] text-slate-400 mt-2 italic">Notes: {order.result_notes}</p>
                          )}
                        </div>
                      )}

                      {/* Result Upload Form */}
                      {(order.status === "processing" || order.status === "collected") && (
                        <div>
                          {!showResultUpload ? (
                            <Button data-testid="start-result-upload" size="sm" onClick={() => initResultUpload(order)}
                              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono text-[9px]">
                              <Upload size={12} className="mr-1" /> Upload Results
                            </Button>
                          ) : (
                            <div className="rounded-lg border border-emerald-500/20 bg-black/30 p-4 space-y-3" data-testid="result-upload-form">
                              <div className="flex items-center justify-between">
                                <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                                  <Upload size={14} className="text-emerald-400" /> Upload Results
                                </h4>
                                <button onClick={() => setShowResultUpload(false)} className="text-slate-500 hover:text-white text-xs">Cancel</button>
                              </div>
                              <div className="space-y-2">
                                {resultForm.map((r, i) => (
                                  <div key={i} className="grid grid-cols-5 gap-2 items-center">
                                    <span className="font-mono text-[8px] text-slate-300 col-span-1 truncate">{r.test_name}</span>
                                    <input placeholder="Value" value={r.value}
                                      onChange={e => { const nf = [...resultForm]; nf[i] = { ...nf[i], value: e.target.value }; setResultForm(nf); }}
                                      className="col-span-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none" />
                                    <input placeholder="Unit" value={r.unit}
                                      onChange={e => { const nf = [...resultForm]; nf[i] = { ...nf[i], unit: e.target.value }; setResultForm(nf); }}
                                      className="col-span-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none" />
                                    <input placeholder="Ref Low" value={r.reference_low}
                                      onChange={e => { const nf = [...resultForm]; nf[i] = { ...nf[i], reference_low: e.target.value }; setResultForm(nf); }}
                                      className="col-span-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none" />
                                    <input placeholder="Ref High" value={r.reference_high}
                                      onChange={e => { const nf = [...resultForm]; nf[i] = { ...nf[i], reference_high: e.target.value }; setResultForm(nf); }}
                                      className="col-span-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none" />
                                  </div>
                                ))}
                              </div>
                              <Button data-testid="submit-results" onClick={submitResults} disabled={uploadingResults}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-body text-xs font-semibold">
                                {uploadingResults ? "Uploading..." : "Submit Results"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <FlaskConical size={40} className="text-emerald-500/20 mx-auto mb-3" />
                <p className="font-body text-sm text-slate-400">No lab orders found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "new_order" && (
        <div className="rounded-xl border border-emerald-500/20 bg-black/30 p-6 space-y-4" data-testid="new-lab-order-form">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
            <Plus size={14} className="text-emerald-400" /> Create Lab Order
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[8px] text-slate-400 uppercase block mb-1">Patient</label>
              <AppSelect data-testid="lab-order-patient" value={orderForm.member_id}
                onChange={e => setOrderForm(f => ({ ...f, member_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 font-body focus:border-emerald-500 focus:outline-none">
                <AppSelectOption value="">Select patient...</AppSelectOption>
                {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-400 uppercase block mb-1">Lab Panel</label>
              <AppSelect data-testid="lab-order-panel" value={orderForm.panel_id}
                onChange={e => setOrderForm(f => ({ ...f, panel_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 font-body focus:border-emerald-500 focus:outline-none">
                <AppSelectOption value="">Select panel...</AppSelectOption>
                {panels.map(p => <AppSelectOption key={p.panel_id} value={p.panel_id}>{p.name} (${p.price})</AppSelectOption>)}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-400 uppercase block mb-1">Lab Partner</label>
              <AppSelect data-testid="lab-order-partner" value={orderForm.lab_partner_id}
                onChange={e => setOrderForm(f => ({ ...f, lab_partner_id: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 font-body focus:border-emerald-500 focus:outline-none">
                {labPartners.map(lp => (
                  <AppSelectOption key={lp.id} value={lp.id}>{lp.name} ({lp.accreditation})</AppSelectOption>
                ))}
              </AppSelect>
            </div>
            <div>
              <label className="font-mono text-[8px] text-slate-400 uppercase block mb-1">Priority</label>
              <AppSelect data-testid="lab-order-priority" value={orderForm.priority}
                onChange={e => setOrderForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 font-body focus:border-emerald-500 focus:outline-none">
                <AppSelectOption value="routine">Routine</AppSelectOption>
                <AppSelectOption value="urgent">Urgent</AppSelectOption>
                <AppSelectOption value="stat">STAT</AppSelectOption>
              </AppSelect>
            </div>
          </div>
          <div>
            <label className="font-mono text-[8px] text-slate-400 uppercase block mb-1">Clinical Notes</label>
            <textarea value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Clinical indication, special instructions..."
              className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-xs px-3 py-2 font-body h-16 resize-none focus:border-emerald-500 focus:outline-none placeholder:text-slate-600" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={orderForm.fasting_required}
                onChange={e => setOrderForm(f => ({ ...f, fasting_required: e.target.checked }))}
                className="rounded border-white/20 bg-black/30 text-emerald-500" />
              <span className="font-mono text-[9px] text-slate-300">Fasting required</span>
            </label>
          </div>
          <Button data-testid="submit-lab-order" onClick={createOrder} disabled={creating || !orderForm.member_id || !orderForm.panel_id}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-body text-xs font-semibold px-6">
            {creating ? "Creating..." : "Create Lab Order"}
          </Button>
        </div>
      )}

      {tab === "panels" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="lab-panels-catalog">
          {panels.map(p => (
            <div key={p.panel_id} className="rounded-xl border border-white/5 bg-black/20 p-4 hover:bg-white/5 transition-all" data-testid={`panel-${p.panel_id}`}>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical size={14} className="text-emerald-400" />
                <span className="font-mono text-[8px] text-emerald-400">{p.panel_id}</span>
              </div>
              <h4 className="font-body text-sm font-semibold text-white mb-1">{p.name}</h4>
              <p className="font-mono text-[8px] text-slate-500 mb-2">{p.category} &middot; LOINC: {p.loinc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.biomarkers.map(b => (
                  <span key={b} className="font-mono text-[7px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5 text-slate-400">{b}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white">${p.price}</span>
                <span className="font-mono text-[8px] text-slate-500">{p.turnaround_days} day turnaround</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
      <span className="font-mono text-[7px] text-slate-500 uppercase">{label}</span>
      <div className="mt-1">{value}</div>
    </div>
  );
}
