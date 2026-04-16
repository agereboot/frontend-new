import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { deptRiskData, riskDistribution, riskDrivers } from "@/data/corpDemoData";
import { FiltersBar, PageHeader, ProgressBar, SectionCard, TinyPill } from "@/components/corpdemo/CorpDemoPrimitives";

export default function CorpDemoRiskPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Executive Workspace" title="Health Risk Distribution" subtitle="The uploaded risk-distribution view restyled with the AgeReboot cosmic palette and layout." />
      <FiltersBar searchPlaceholder="Search risk factor, location, or department" />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard title="Workforce Risk Split" subtitle="Low vs medium vs high risk"><div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-center"><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskDistribution} dataKey="value" innerRadius={70} outerRadius={102} stroke="none">{riskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /></PieChart></ResponsiveContainer></div><div className="space-y-4">{riskDistribution.map((item) => (<div key={item.name} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} /> <span className="text-sm text-slate-200">{item.name} Risk</span></div><TinyPill tone={item.name === "Low" ? "emerald" : item.name === "Medium" ? "amber" : "rose"}>{item.value}%</TinyPill></div></div>))}</div></div></SectionCard>
        <SectionCard title="Key Drops" subtitle="Trend declines highlighted in the uploaded executive view"><div className="space-y-4">{riskDrivers.map((item) => <ProgressBar key={item.name} value={item.coverage} color={item.name.includes("Stress") ? "#EF4444" : item.name.includes("Sleep") ? "#EAB308" : "#7B35D8"} label={item.name} detail={`${item.delta} vs baseline`} />)}</div></SectionCard>
      </div>
      <SectionCard title="Department Risk Ranking" subtitle="Average risk score by department"><div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={deptRiskData} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} /><XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="dept" tick={{ fill: "#CBD5E1", fontSize: 11 }} axisLine={false} tickLine={false} width={90} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Bar dataKey="score" radius={[0, 12, 12, 0]}>{deptRiskData.map((item) => <Cell key={item.dept} fill={item.score >= 60 ? "#EF4444" : item.score >= 45 ? "#EAB308" : "#10B981"} />)}</Bar></BarChart></ResponsiveContainer></div></SectionCard>
    </div>
  );
}
