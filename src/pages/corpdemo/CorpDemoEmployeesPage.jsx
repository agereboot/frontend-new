import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { departmentMix, employeeCards, employeeRows } from "@/data/corpDemoData";
import { DataTable, FiltersBar, PageHeader, SectionCard, StatCard, TinyPill } from "@/components/corpdemo/CorpDemoPrimitives";

const columns = [{ key: "name", label: "Employee" }, { key: "department", label: "Department" }, { key: "location", label: "Location" }, { key: "status", label: "Status" }, { key: "risk", label: "Risk" }, { key: "license", label: "License" }, { key: "lastActivity", label: "Last Activity" }];

export default function CorpDemoEmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="HR Admin Workspace" title="Employee Management" subtitle="A themed version of the uploaded employee screen with the same AgeReboot shell and typography." />
      <FiltersBar searchPlaceholder="Search employee name, location, or cohort" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{employeeCards.map((card) => <StatCard key={card.title} {...card} tag={card.change} />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <SectionCard title="Employee Directory" subtitle="Static credentials and view-only UI for review"><DataTable columns={columns} rows={employeeRows} getTone={(key, value) => { if (key === "status") return value === "Active" ? "emerald" : value === "Pending" ? "amber" : "rose"; if (key === "risk") return value === "Low" ? "emerald" : value === "Moderate" ? "amber" : "rose"; return null; }} /></SectionCard>
        <div className="space-y-4">
          <SectionCard title="Department Mix" subtitle="Employees vs onboarded by department"><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={departmentMix} layout="vertical" margin={{ left: 25 }}><CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} /><XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" tick={{ fill: "#CBD5E1", fontSize: 11 }} axisLine={false} tickLine={false} width={90} /><Tooltip contentStyle={{ background: "#090714", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} /><Bar dataKey="employees" fill="#7B35D8" radius={[0, 10, 10, 0]} /><Bar dataKey="onboarding" fill="#0F9F8F" radius={[0, 10, 10, 0]} /></BarChart></ResponsiveContainer></div></SectionCard>
          <SectionCard title="Onboarding Funnel" subtitle="Quick review of registration status"><div className="space-y-3">{[["Invited", 500, "violet"], ["Accepted", 472, "emerald"], ["KYC Complete", 458, "amber"], ["Activated", 456, "rose"]].map(([label, value, tone]) => (<div key={label} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"><span className="text-sm text-slate-300">{label}</span><TinyPill tone={tone}>{value}</TinyPill></div>))}</div></SectionCard>
        </div>
      </div>
    </div>
  );
}
