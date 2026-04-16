import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Truck, Plus, Clock, CheckCircle, XCircle, Package,
  Pill, Leaf, ShoppingCart, RefreshCcw, Minus, Eye,
} from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TYPE_ICONS = { prescription: Pill, nutraceutical: Leaf };
const STATUS_MAP = {
  pending: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Pending" },
  approved: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Approved" },
  dispensing: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Dispensing" },
  dispensed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Dispensed" },
  shipped: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "Shipped" },
  delivered: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Delivered" },
  cancelled: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Cancelled" },
};

const TRANSITIONS = {
  pending: ["approved", "cancelled"],
  approved: ["dispensing", "cancelled"],
  dispensing: ["dispensed", "cancelled"],
  dispensed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function HCPPharmacyPage() {
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cart, setCart] = useState([]);
  const [orderMemberId, setOrderMemberId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("/cc/pharmacy/catalog"),
      api.get("/cc/pharmacy/orders"),
      api.get("/cc/members"),
    ]).then(([cRes, oRes, mRes]) => {
      setCatalog(cRes.data.items || []);
      setOrders(oRes.data.orders || []);
      setMembers(mRes.data.members || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1, dosing_instructions: "" }]);
    }
    toast.success(`Added ${item.name}`);
  };

  const removeFromCart = (itemId) => setCart(cart.filter(c => c.item_id !== itemId));
  const updateCartQty = (itemId, qty) => {
    if (qty <= 0) return removeFromCart(itemId);
    setCart(cart.map(c => c.item_id === itemId ? { ...c, quantity: qty } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (!orderMemberId || cart.length === 0) return;
    setCreating(true);
    const hasRx = cart.some(c => c.requires_rx);
    try {
      const res = await api.post("/cc/pharmacy/orders", {
        member_id: orderMemberId,
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity, dosing_instructions: c.dosing_instructions })),
        order_type: hasRx ? "prescription" : "nutraceutical",
        notes: orderNotes,
      });
      setOrders(prev => [res.data, ...prev]);
      setCart([]);
      setOrderMemberId("");
      setOrderNotes("");
      setTab("orders");
      toast.success(`Order ${res.data.order_number} placed`);
    } catch (e) { toast.error(e.response?.data?.detail || "Order failed"); } finally { setCreating(false); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/cc/pharmacy/orders/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(res.data);
      toast.success(`Order updated to ${newStatus}`);
    } catch { toast.error("Update failed"); }
  };

  const filteredCatalog = typeFilter ? catalog.filter(i => i.type === typeFilter) : catalog;
  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  const memberName = (id) => members.find(m => m.id === id)?.name || "Unknown";

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="pharmacy-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Pharmacy & <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Nutraceuticals</span>
          </h1>
          <p className="font-mono text-[10px] text-slate-500 tracking-[0.25em] mt-1 uppercase">
            {catalog.length} Items &middot; {orders.length} Orders
            <span className="text-teal-500/60 ml-2">Orders created via Smart EMR</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="refresh-pharmacy" onClick={fetchData} size="sm"
            className="bg-white/5 text-white border border-white/10 hover:bg-white/10 font-mono text-[9px]">
            <RefreshCcw size={12} className="mr-1" /> Refresh
          </Button>
          {["orders"].map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedOrder(null); }} data-testid={`pharm-tab-${t}`}
              className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                tab === t ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {tab === "orders" && (
        <div className="space-y-4" data-testid="pharmacy-orders">
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setStatusFilter("")}
              className={`font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${!statusFilter ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "border-white/5 text-slate-500 hover:text-white"}`}>All ({orders.length})</button>
            {Object.entries(STATUS_MAP).map(([k, v]) => {
              const count = orders.filter(o => o.status === k).length;
              if (count === 0) return null;
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
              <span className="col-span-3 font-mono text-[7px] text-slate-500 uppercase">Items</span>
              <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Type</span>
              <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Total</span>
              <span className="col-span-1 font-mono text-[7px] text-slate-500 uppercase">Status</span>
              <span className="col-span-2 font-mono text-[7px] text-slate-500 uppercase text-right">Actions</span>
            </div>
            {filteredOrders.map(order => {
              const sm = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div key={order.id}>
                  <div data-testid={`pharm-order-${order.order_number}`}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all items-center ${
                      isSelected ? "bg-teal-500/[0.04]" : "hover:bg-white/[0.02]"
                    }`}>
                    <div className="col-span-2">
                      <span className="font-mono text-[9px] text-teal-400">{order.order_number}</span>
                      <p className="font-mono text-[7px] text-slate-500">{new Date(order.ordered_at).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-body text-xs text-white">{memberName(order.member_id)}</span>
                    </div>
                    <div className="col-span-3">
                      <div className="flex flex-wrap gap-1">
                        {(order.items || []).slice(0, 3).map((item, i) => {
                          const TIcon = TYPE_ICONS[item.type] || Package;
                          return (
                            <span key={i} className="flex items-center gap-0.5 font-mono text-[7px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5 text-slate-300">
                              <TIcon size={8} /> {item.name?.split(" ")[0]} x{item.quantity}
                            </span>
                          );
                        })}
                        {(order.items || []).length > 3 && <span className="font-mono text-[7px] text-slate-500">+{order.items.length - 3}</span>}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`font-mono text-[6px] ${order.order_type === "prescription" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                        {order.order_type === "prescription" ? "Rx" : "Nutra"}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <span className="font-mono text-xs font-bold text-white">${order.total_price}</span>
                    </div>
                    <div className="col-span-1">
                      <Badge className={`font-mono text-[7px] ${sm.color}`}>{sm.label}</Badge>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {(TRANSITIONS[order.status] || []).map(next => (
                        <button key={next} data-testid={`pharm-${next}-${order.id}`}
                          onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, next); }}
                          className={`font-mono text-[7px] px-2 py-1 rounded-lg border transition-all ${
                            next === "cancelled" ? "text-red-400 border-red-500/20 hover:bg-red-500/10" : `${STATUS_MAP[next]?.color || "text-white border-white/10"} hover:opacity-80`
                          }`}>
                          {next === "cancelled" ? "Cancel" : STATUS_MAP[next]?.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isSelected && (
                    <div className="bg-black/20 border-b border-white/[0.03] px-4 py-4 space-y-3" data-testid="pharm-order-detail">
                      {/* Items Detail */}
                      <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3">
                        <span className="font-mono text-[7px] text-slate-500 uppercase mb-2 block">Order Items</span>
                        <div className="space-y-2">
                          {(order.items || []).map((item, i) => {
                            const TIcon = TYPE_ICONS[item.type] || Package;
                            return (
                              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                  <TIcon size={14} className={item.type === "prescription" ? "text-red-400" : "text-emerald-400"} />
                                  <div>
                                    <span className="font-body text-xs text-white">{item.name}</span>
                                    {item.dosing_instructions && (
                                      <p className="font-mono text-[7px] text-slate-400">Dosing: {item.dosing_instructions}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-xs text-white">x{item.quantity}</span>
                                  <p className="font-mono text-[7px] text-slate-500">${item.line_total || (item.price * item.quantity).toFixed(2)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fulfillment Timeline */}
                      <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3">
                        <span className="font-mono text-[7px] text-slate-500 uppercase">Fulfillment Timeline</span>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {["pending", "approved", "dispensing", "dispensed", "shipped", "delivered"].map((step, i) => {
                            const steps = ["pending", "approved", "dispensing", "dispensed", "shipped", "delivered"];
                            const currentIdx = steps.indexOf(order.status);
                            const isComplete = currentIdx >= i;
                            const isCurrent = order.status === step;
                            return (
                              <div key={step} className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-mono ${
                                  isComplete ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" :
                                  "bg-white/5 text-slate-600 border border-white/10"
                                } ${isCurrent ? "ring-2 ring-teal-500/30" : ""}`}>
                                  {isComplete ? <CheckCircle size={9} /> : i + 1}
                                </div>
                                <span className={`font-mono text-[7px] ${isComplete ? "text-teal-400" : "text-slate-600"}`}>
                                  {STATUS_MAP[step]?.label}
                                </span>
                                {i < 5 && <div className={`w-5 h-px ${isComplete ? "bg-teal-500/30" : "bg-white/5"}`} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
                          <span className="font-mono text-[7px] text-slate-500 uppercase">Ordered By</span>
                          <p className="font-mono text-xs text-white mt-0.5">{order.ordered_by_name}</p>
                        </div>
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
                          <span className="font-mono text-[7px] text-slate-500 uppercase">Order Date</span>
                          <p className="font-mono text-xs text-white mt-0.5">{new Date(order.ordered_at).toLocaleString()}</p>
                        </div>
                        {order.dispensed_at && (
                          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
                            <span className="font-mono text-[7px] text-slate-500 uppercase">Dispensed</span>
                            <p className="font-mono text-xs text-white mt-0.5">{new Date(order.dispensed_at).toLocaleString()}</p>
                          </div>
                        )}
                        {order.notes && (
                          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2 col-span-3">
                            <span className="font-mono text-[7px] text-slate-500 uppercase">Notes</span>
                            <p className="font-mono text-[8px] text-slate-300 mt-0.5">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Truck size={40} className="text-teal-500/20 mx-auto mb-3" />
                <p className="font-body text-sm text-slate-400">No pharmacy orders found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catalog */}
      {tab === "catalog" && (
        <div className="space-y-4" data-testid="pharmacy-catalog">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTypeFilter("")}
              className={`font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${!typeFilter ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "border-white/5 text-slate-500 hover:text-white"}`}>All ({catalog.length})</button>
            <button onClick={() => setTypeFilter("prescription")}
              className={`flex items-center gap-1 font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${typeFilter === "prescription" ? "bg-red-500/10 border-red-500/30 text-red-400" : "border-white/5 text-slate-500 hover:text-white"}`}>
              <Pill size={10} /> Prescriptions
            </button>
            <button onClick={() => setTypeFilter("nutraceutical")}
              className={`flex items-center gap-1 font-mono text-[8px] px-2.5 py-1 rounded-full border transition-all ${typeFilter === "nutraceutical" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-slate-500 hover:text-white"}`}>
              <Leaf size={10} /> Nutraceuticals
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCatalog.map(item => {
              const TIcon = TYPE_ICONS[item.type] || Package;
              const inCart = cart.some(c => c.item_id === item.item_id);
              return (
                <div key={item.item_id} className={`rounded-xl border p-4 transition-all ${
                  inCart ? "border-teal-500/30 bg-teal-500/5" : "border-white/5 bg-black/20 hover:bg-white/5"
                }`} data-testid={`catalog-${item.item_id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TIcon size={14} className={item.type === "prescription" ? "text-red-400" : "text-emerald-400"} />
                    <span className="font-mono text-[8px] text-slate-500">{item.item_id}</span>
                    {item.requires_rx && <Badge className="font-mono text-[6px] bg-red-500/10 text-red-400 border-red-500/20">Rx</Badge>}
                    {inCart && <CheckCircle size={12} className="text-teal-400 ml-auto" />}
                  </div>
                  <h4 className="font-body text-sm font-semibold text-white mb-1">{item.name}</h4>
                  <p className="font-mono text-[8px] text-slate-500 mb-3">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-white">${item.price}</span>
                    <Button size="sm" onClick={() => addToCart(item)} data-testid={`add-${item.item_id}`}
                      className="bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 font-mono text-[8px]">
                      <Plus size={12} className="mr-1" /> {inCart ? "Add More" : "Add"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart */}
      {tab === "cart" && (
        <div className="max-w-xl space-y-4" data-testid="pharmacy-cart">
          {cart.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-500/20 bg-black/30 p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-white">Order Cart</h3>
                <div>
                  <label className="font-mono text-[8px] text-slate-500 uppercase mb-1 block">Member</label>
                  <AppSelect data-testid="cart-member" value={orderMemberId}
                    onChange={e => setOrderMemberId(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-500 focus:outline-none font-body">
                    <AppSelectOption value="">Select member...</AppSelectOption>
                    {members.map(m => <AppSelectOption key={m.id} value={m.id}>{m.name}</AppSelectOption>)}
                  </AppSelect>
                </div>
                {cart.map(item => (
                  <div key={item.item_id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2" data-testid={`cart-item-${item.item_id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-white">{item.name}</p>
                        <p className="font-mono text-[8px] text-slate-500">${item.price} each &middot; {item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQty(item.item_id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded border border-white/10 text-white hover:bg-white/5"><Minus size={10} /></button>
                        <span className="font-mono text-sm text-white w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.item_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded border border-white/10 text-white hover:bg-white/5"><Plus size={10} /></button>
                      </div>
                      <span className="font-mono text-sm font-bold text-white w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.item_id)} className="text-red-400 hover:text-red-300 ml-2"><XCircle size={14} /></button>
                    </div>
                    <input placeholder="Dosing instructions (e.g., 1 tablet daily with food)..."
                      value={item.dosing_instructions}
                      onChange={e => setCart(cart.map(c => c.item_id === item.item_id ? { ...c, dosing_instructions: e.target.value } : c))}
                      className="w-full bg-black/30 border border-white/10 rounded px-2.5 py-1.5 text-white text-[9px] font-mono focus:border-teal-500 focus:outline-none placeholder:text-slate-600" />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="font-body text-sm text-slate-400">Total</span>
                  <span className="font-mono text-lg font-bold text-white">${cartTotal.toFixed(2)}</span>
                </div>
                <textarea data-testid="cart-notes" value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Order notes..." rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none font-body resize-none placeholder:text-slate-600" />
                <Button data-testid="place-order" onClick={placeOrder}
                  disabled={!orderMemberId || cart.length === 0 || creating}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-body font-semibold">
                  <ShoppingCart size={16} className="mr-2" /> {creating ? "Placing..." : "Place Order"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart size={40} className="text-teal-500/20 mx-auto mb-3" />
              <p className="font-body text-sm text-slate-400">Cart is empty. Browse the catalog to add items.</p>
              <Button onClick={() => setTab("catalog")} className="mt-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 font-mono text-xs">
                Browse Catalog
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
