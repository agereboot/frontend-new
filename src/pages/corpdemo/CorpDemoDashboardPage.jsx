import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { actionItems, adminStats, coachingUtilization, engagementTrend, healthGoalData, licenseUtilizationData } from "@/data/corpDemoData";
import { FiltersBar, PageHeader, ProgressBar, SectionCard, StatCard, TinyPill } from "@/components/corpdemo/CorpDemoPrimitives";

export default function CorpDemoDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Admin Workspace" title="Corporate Dashboard" subtitle="The uploaded HR admin UI has been adapted into the existing AgeReboot visual system so you can review the screens with the same fonts, colors, and shell." />
      <FiltersBar searchPlaceholder="Search employees, programs, or reports" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{adminStats.map((stat) => <StatCard key={stat.title} {...stat} />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Engagement Rates" subtitle="Interactions vs impressions by hour">
          <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={engagementTrend}><defs><linearGradient id="gradInteraction" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#7B35D8" stopOpacity={0.45} /><stop offset="95%" stopColor="#7B35D8" stopOpacity={0} /></linearGradient><linearGradient id="gradImpression" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} /><stop offset="95%" stopColor="#A78BFA" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Area type="monotone" dataKey="interaction" stroke="#7B35D8" fill="url(#gradInteraction)" strokeWidth={3} /><Area type="monotone" dataKey="impression" stroke="#A78BFA" fill="url(#gradImpression)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
        </SectionCard>
        <SectionCard title="User Health Goals" subtitle="Demo segmentation pulled from the uploaded UI">
          <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={healthGoalData} dataKey="value" innerRadius={66} outerRadius={96} paddingAngle={3} stroke="none">{healthGoalData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /></PieChart></ResponsiveContainer></div>
          <div className="grid gap-2 sm:grid-cols-2">{healthGoalData.map((goal) => (<div key={goal.name} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: goal.color }} />{goal.name}</div><span className="font-mono text-xs text-slate-400">{goal.value}%</span></div>))}</div>
        </SectionCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard title="License Utilization" subtitle="Invite vs active vs available seats">
          <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={licenseUtilizationData}><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Bar dataKey="invite" fill="#7B35D8" radius={[12, 12, 0, 0]} /><Bar dataKey="active" fill="#A78BFA" radius={[12, 12, 0, 0]} /><Bar dataKey="available" fill="#334155" radius={[12, 12, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </SectionCard>
        <div className="space-y-4">
          <SectionCard title="Biomarker Camp Status" subtitle="Static demo card from the uploaded workflow"><div className="space-y-4 rounded-2xl border border-violet-400/15 bg-violet-500/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-400">Current Phase</p><p className="text-lg font-semibold text-white">Sample Collection</p></div><TinyPill tone="violet">120 / 200</TinyPill></div><div><div className="mb-2 h-2.5 overflow-hidden rounded-full bg-violet-200/10"><div className="h-full rounded-full bg-violet-400" style={{ width: "60%" }} /></div><p className="text-xs text-violet-200">60% complete · next milestone: Lab test</p></div><div className="rounded-2xl border border-white/6 bg-black/20 p-3 text-sm text-slate-300">Final milestone: <span className="font-semibold text-white">Report Generation</span> · Due Dec 23</div></div></SectionCard>
          <SectionCard title="Action List" subtitle="Priority queue"><div className="space-y-3">{actionItems.map((item) => (<div key={item.title} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] p-3"><div className={`h-11 w-11 rounded-2xl ${item.tone === "rose" ? "bg-rose-500/20" : item.tone === "amber" ? "bg-amber-500/20" : "bg-violet-500/20"}`} /><div><p className="text-sm font-semibold text-white">{item.title}</p><p className="text-xs text-slate-500">{item.time}</p></div></div>))}</div></SectionCard>
        </div>
      </div>
      <SectionCard title="Coaching / Clinical Utilization" subtitle="Adopted from the HR admin widgets in the uploaded zip"><div className="grid gap-4 lg:grid-cols-2">{coachingUtilization.map((item) => (<ProgressBar key={item.title} value={item.percent} color={item.color} label={item.title} detail={`${item.valueLeft} / ${item.valueRight} seats engaged`} />))}</div></SectionCard>
    </div>
  );
}
