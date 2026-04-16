import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { comparativePerformance, roiStats, roiStreams } from "@/data/corpDemoData";
import { FiltersBar, PageHeader, ProgressBar, SectionCard, StatCard } from "@/components/corpdemo/CorpDemoPrimitives";

export default function CorpDemoROIPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Executive Workspace" title="ROI & Benchmarking" subtitle="The ROI section from the uploaded executive UI translated into the AgeReboot visual language." />
      <FiltersBar searchPlaceholder="Search benchmark, savings stream, or cohort" />
      <div className="grid gap-4 md:grid-cols-3">{roiStats.map((item) => <StatCard key={item.title} {...item} />)}</div>
      <SectionCard title="Comparative Performance" subtitle="Company score vs market benchmark across ranked cohorts"><div className="h-[340px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparativePerformance}><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="rank" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Bar dataKey="company" fill="#7B35D8" radius={[12, 12, 0, 0]} /><Bar dataKey="others" fill="#C4B5FD" radius={[12, 12, 0, 0]} /></BarChart></ResponsiveContainer></div></SectionCard>
      <SectionCard title="Benefit Streams" subtitle="Estimated savings and uplift buckets"><div className="grid gap-4 lg:grid-cols-2">{roiStreams.map((item) => <ProgressBar key={item.label} value={Math.round(item.value * 5)} color={item.color} label={item.label} detail={`₹${item.value.toFixed(1)}L contribution`} />)}</div></SectionCard>
    </div>
  );
}
