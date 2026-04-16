import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { licenseCards, licenseUtilizationData, planMix, renewalQueue } from "@/data/corpDemoData";
import { DataTable, FiltersBar, PageHeader, SectionCard, StatCard } from "@/components/corpdemo/CorpDemoPrimitives";

const columns = [{ key: "client", label: "Client" }, { key: "plan", label: "Plan" }, { key: "seats", label: "Seats" }, { key: "renewal", label: "Renewal Date" }, { key: "health", label: "Renewal Health" }];

export default function CorpDemoLicensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Admin Workspace" title="Licenses & Plans" subtitle="Seat planning, plan distribution, and renewal queue from the uploaded HR admin flow, matched to the cosmic product theme." />
      <FiltersBar searchPlaceholder="Search plan, client, or contract" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{licenseCards.map((card) => <StatCard key={card.title} {...card} />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Monthly License Utilization" subtitle="Allocated invite, active, and available seats"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={licenseUtilizationData}><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Bar dataKey="invite" fill="#7B35D8" radius={[12, 12, 0, 0]} /><Bar dataKey="active" fill="#4F46E5" radius={[12, 12, 0, 0]} /><Bar dataKey="available" fill="#64748B" radius={[12, 12, 0, 0]} /></BarChart></ResponsiveContainer></div></SectionCard>
        <SectionCard title="Plan Mix" subtitle="Current seat allocation by plan"><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={planMix} dataKey="seats" innerRadius={58} outerRadius={92} stroke="none">{planMix.map((plan) => <Cell key={plan.name} fill={plan.fill} />)}</Pie><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{planMix.map((plan) => (<div key={plan.name} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: plan.fill }} />{plan.name}</div><span className="font-mono text-xs text-slate-400">{plan.seats} seats</span></div>))}</div></SectionCard>
      </div>
      <SectionCard title="Renewal Queue" subtitle="Upcoming renewals pulled into a review-friendly table"><DataTable columns={columns} rows={renewalQueue} getTone={(key, value) => key === "health" ? value === "High value" ? "emerald" : value === "Stable" ? "violet" : "amber" : null} /></SectionCard>
    </div>
  );
}
