import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  Critical: "bg-critical/12 text-critical", High: "bg-high/15 text-high", Medium: "bg-medium/25 text-foreground",
  Low: "bg-muted text-muted-foreground",
  Pending: "bg-high/15 text-high", Assigned: "bg-info/12 text-info", Ongoing: "bg-critical/10 text-critical",
  Completed: "bg-ok/12 text-ok", Available: "bg-ok/12 text-ok", Open: "bg-critical/10 text-critical", Resolved: "bg-ok/12 text-ok",
  "Out of Service": "bg-muted text-muted-foreground",
};
export function Pill({ children }: { children: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tone[children] ?? "bg-info/12 text-info")}>{children}</span>;
}
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
export function Btn({ variant = "primary", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const v = { primary: "bg-primary text-primary-foreground hover:opacity-90", ghost: "border border-border bg-card hover:bg-muted", danger: "bg-destructive text-destructive-foreground hover:opacity-90" }[variant];
  return <button {...p} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-40", v, className)} />;
}
export function DemoTag() {
  return <span className="rounded bg-medium/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">Demo data</span>;
}
