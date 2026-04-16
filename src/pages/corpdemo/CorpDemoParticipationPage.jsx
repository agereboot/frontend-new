import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cohortTable, participationFunnel, participationTrend } from "@/data/corpDemoData";
import { DataTable, FiltersBar, PageHeader, ProgressBar, SectionCard } from "@/components/corpdemo/CorpDemoPrimitives";

const columns = [{ key: "cohort", label: "Cohort" }, { key: "participation", label: "Participation" }, { key: "challenge", label: "Challenge Join" }, { key: "coaching", label: "Coaching" }];

export default function CorpDemoParticipationPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Executive Workspace" title="Participation & Trends" subtitle="Participation funnel and timeline adapted from the uploaded executive screens into the unified theme." />
      <FiltersBar searchPlaceholder="Search challenge, cohort, or KPI" />
      <SectionCard title="Participation Funnel" subtitle="Conversion through the wellness journey"><div className="grid gap-4 lg:grid-cols-2">{participationFunnel.map((item) => <ProgressBar key={item.title} value={item.percent} color="#7B35D8" label={item.title} detail={item.stats} />)}</div></SectionCard>
      <SectionCard title="Trend Timeline" subtitle="Daily active users, weekly active users, and challenge rate"><div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={participationTrend}><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Legend wrapperStyle={{ color: "#CBD5E1", fontSize: 12 }} /><Line type="monotone" dataKey="dau" name="DAU" stroke="#7B35D8" strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="wau" name="WAU" stroke="#0F172A" strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="challengeRate" name="Challenge Rate" stroke="#94A3B8" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></SectionCard>
      <SectionCard title="Cohort Comparison" subtitle="Quick review table for leadership and department participation"><DataTable columns={columns} rows={cohortTable} /></SectionCard>
    </div>
  );
}
