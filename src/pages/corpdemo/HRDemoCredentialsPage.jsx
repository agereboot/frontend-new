import { DEMO_USERS } from "@/lib/demoUsers";
import { PageHeader, SectionCard, TinyPill } from "@/components/corpdemo/CorpDemoPrimitives";

export default function HRDemoCredentialsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Corporate Demo Access" title="Static Credentials" subtitle="Use these accounts to review the merged HR admin and HR executive UI inside the existing AgeReboot frontend." />
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_USERS.map((account) => (
          <SectionCard key={account.email} title={account.user.role === "hr_admin_demo" ? "HR Admin" : "HR Executive"} subtitle={account.home}>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"><span>Email</span><code className="font-mono text-violet-200">{account.email}</code></div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"><span>Password</span><code className="font-mono text-emerald-200">{account.password}</code></div>
              <TinyPill tone={account.user.role === "hr_admin_demo" ? "violet" : "amber"}>{account.user.name}</TinyPill>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
