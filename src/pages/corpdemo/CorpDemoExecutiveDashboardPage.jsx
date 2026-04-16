import { Area, AreaChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { engagementTrend, executiveStats, riskDistribution, threatItems } from "@/data/corpDemoData";
import { FiltersBar, PageHeader, SectionCard, StatCard, TinyPill } from "@/components/corpdemo/CorpDemoPrimitives";

export default function CorpDemoExecutiveDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Executive Workspace" title="Longevity Index" subtitle="The executive dashboard from the uploaded zip has been translated into the AgeReboot command-centre style." />
      <FiltersBar searchPlaceholder="Search cohort, alert, or trend" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{executiveStats.map((stat) => <StatCard key={stat.title} {...stat} />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Total Engagement Rate" subtitle="High-level engagement curve used in the executive view"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={engagementTrend}><defs><linearGradient id="execEngagement" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Area type="monotone" dataKey="interaction" stroke="#F59E0B" fill="url(#execEngagement)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div></SectionCard>
        <SectionCard title="Threats" subtitle="Executive watchlist"><div className="space-y-3">{threatItems.map((item) => (<div key={item} className="rounded-2xl border border-rose-400/12 bg-rose-500/[0.06] p-4"><TinyPill tone="rose">Alert</TinyPill><p className="mt-3 text-sm font-medium text-white">{item}</p><p className="mt-1 text-xs text-slate-500">Escalated from workforce analytics</p></div>))}</div></SectionCard>
      </div>
      <SectionCard title="Risk Overview" subtitle="Distribution of low, medium, and high risk employees"><div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-center"><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskDistribution} dataKey="value" innerRadius={66} outerRadius={94} stroke="none">{riskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /></PieChart></ResponsiveContainer></div><div className="grid gap-3 sm:grid-cols-3">{riskDistribution.map((item) => (<div key={item.name} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.name} Risk</p><p className="mt-3 font-display text-3xl font-black text-white">{item.value}%</p><p className="mt-2 text-xs" style={{ color: item.color }}>Population share</p></div>))}</div></div></SectionCard>
    </div>
  );
}
