import { CalendarDays, ChevronDown, Download, Search } from "lucide-react";
import { FILTER_OPTIONS } from "@/data/corpDemoData";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const TONE_MAP = {
  violet: "from-violet-500/20 to-indigo-500/10 border-violet-400/20 text-violet-200",
  emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-400/20 text-emerald-200",
  amber: "from-amber-500/20 to-orange-500/10 border-amber-400/20 text-amber-200",
  rose: "from-rose-500/20 to-red-500/10 border-rose-400/20 text-rose-200",
  slate: "from-slate-500/20 to-slate-400/10 border-white/10 text-slate-200",
};

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate-500">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function FiltersBar({ searchPlaceholder = "Search employees, reports, or cohorts" }) {
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/[0.03] p-3 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/8 bg-[#0B0A18] px-3 py-2 text-slate-400">
        <Search size={15} className="text-violet-300" />
        <input
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label={FILTER_OPTIONS.locations[0]} options={FILTER_OPTIONS.locations} />
        <FilterSelect label={FILTER_OPTIONS.departments[0]} options={FILTER_OPTIONS.departments} />
        <FilterSelect label={FILTER_OPTIONS.ranges[0]} options={FILTER_OPTIONS.ranges} />
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-200 transition hover:bg-violet-500/15">
          <CalendarDays size={14} /> Mar 13 — Mar 28
        </button>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-200 transition hover:bg-emerald-500/15">
          <Download size={14} /> Export
        </button>
      </div>
    </div>
  );
}

function FilterSelect({ label, options }) {
  return (
    <div className="relative">
      <AppSelect
        defaultValue={label}
        className="h-10 appearance-none rounded-xl border border-white/8 bg-[#0B0A18] pl-3 pr-8 text-sm text-slate-200 outline-none transition hover:border-white/15"
      >
        {options.map((option) => (
          <AppSelectOption key={option} value={option}>{option}</AppSelectOption>
        ))}
      </AppSelect>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-[22px] border border-white/6 bg-black/25 p-5 shadow-[0_10px_40px_rgba(4,2,20,0.35)] backdrop-blur ${className}`.trim()}>
      {(title || subtitle || action) ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="font-display text-lg font-bold text-white">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({ title, value, sub, tag, tone = "violet" }) {
  return (
    <div className={`rounded-[20px] border bg-gradient-to-br p-4 ${TONE_MAP[tone] || TONE_MAP.violet}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{title}</p>
          <div className="mt-3 flex items-end gap-2">
            <p className="font-display text-3xl font-black text-white">{value}</p>
            {sub ? <p className="pb-1 text-xs text-slate-400">{sub}</p> : null}
          </div>
        </div>
        {tag ? <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/80">{tag}</span> : null}
      </div>
    </div>
  );
}

export function TinyPill({ children, tone = "violet" }) {
  const colorMap = {
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/20 bg-rose-500/10 text-rose-200",
    slate: "border-white/10 bg-white/5 text-slate-200",
  };
  return <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${colorMap[tone] || colorMap.violet}`}>{children}</span>;
}

export function ProgressBar({ value, color = "#7B35D8", label, detail }) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/6 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {detail ? <p className="text-xs text-slate-500">{detail}</p> : null}
        </div>
        <span className="font-mono text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function DataTable({ columns, rows, getTone }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/6 text-left">
          <thead className="bg-white/[0.03]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-black/10">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-white/[0.03]">
                {columns.map((column) => {
                  const value = row[column.key];
                  const tone = getTone ? getTone(column.key, value, row) : null;
                  return (
                    <td key={column.key} className="px-4 py-3 text-sm text-slate-200">
                      {tone ? <TinyPill tone={tone}>{value}</TinyPill> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
