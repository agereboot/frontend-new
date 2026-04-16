import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { broadcastItems, campaignTimeline, challengeItems, engagementCards } from "@/data/corpDemoData";
import { FiltersBar, PageHeader, ProgressBar, SectionCard, StatCard, TinyPill } from "@/components/corpdemo/CorpDemoPrimitives";

export default function CorpDemoEngagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Admin Workspace" title="Engagement" subtitle="Broadcasts and challenge views merged into the previous AgeReboot theme with a unified sidebar and header." />
      <FiltersBar searchPlaceholder="Search broadcast name, challenge, or cohort" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{engagementCards.map((card) => <StatCard key={card.title} {...card} tag={card.change} />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Campaign Timeline" subtitle="Broadcasts, challenges, and coaching touchpoints"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={campaignTimeline}><defs><linearGradient id="broadcastGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#7B35D8" stopOpacity={0.4} /><stop offset="95%" stopColor="#7B35D8" stopOpacity={0} /></linearGradient><linearGradient id="challengeGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /><XAxis dataKey="week" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Area type="monotone" dataKey="broadcasts" stroke="#7B35D8" fill="url(#broadcastGrad)" strokeWidth={3} /><Area type="monotone" dataKey="challenges" stroke="#10B981" fill="url(#challengeGrad)" strokeWidth={3} /><Area type="monotone" dataKey="coaching" stroke="#EAB308" fill="none" strokeWidth={3} /></AreaChart></ResponsiveContainer></div></SectionCard>
        <SectionCard title="Active Challenges" subtitle="Current challenge completion rates"><div className="space-y-4">{challengeItems.map((challenge) => (<ProgressBar key={challenge.title} value={challenge.completion} color="#10B981" label={challenge.title} detail={`${challenge.participants} participants`} />))}</div></SectionCard>
      </div>
      <SectionCard title="Broadcast Panel" subtitle="Same content lane as the uploaded engagement screen, restyled to match the cosmic shell."><div className="grid gap-4 lg:grid-cols-3">{broadcastItems.map((item) => (<div key={item.title} className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4"><div className="flex items-center justify-between gap-3"><TinyPill tone={item.status === "Live" ? "emerald" : item.status === "Scheduled" ? "amber" : "violet"}>{item.status}</TinyPill><span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">CTR {item.ctr}</span></div><h4 className="mt-4 text-base font-semibold text-white">{item.title}</h4><p className="mt-2 text-sm text-slate-400">Audience: {item.audience}</p></div>))}</div></SectionCard>
    </div>
  );
}
