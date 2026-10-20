import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, Ambulance, BarChart3, Brain, Building2, LayoutDashboard, Map, Menu, ShieldAlert, Siren } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/emergencies", label: "Emergency Requests", icon: Siren },
  { to: "/ambulances", label: "Ambulance Management", icon: Ambulance },
  { to: "/tracking", label: "Live Tracking", icon: Map },
  { to: "/hospitals", label: "Hospital Directory", icon: Building2 },
  { to: "/priority", label: "AI Priority Assessment", icon: Brain },
  { to: "/safety", label: "Safety Monitor", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics & Reports", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [mobile, setMobile] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const side = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ to, label, icon: I }) => (
        <Link key={to} to={to} onClick={() => setMobile(false)}
          className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-foreground/75 transition hover:bg-navy-foreground/10 hover:text-navy-foreground",
            path === to && "bg-primary text-primary-foreground hover:bg-primary")}>
          <I className="h-4 w-4 shrink-0" />{(open || mobile) && <span className="truncate">{label}</span>}
        </Link>
      ))}
    </nav>
  );
  const brand = (
    <div className="flex h-16 items-center gap-2 px-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-critical text-primary-foreground"><Activity className="h-5 w-5" /></div>
      {(open || mobile) && <div className="leading-tight"><p className="font-extrabold text-navy-foreground">ResQ+</p><p className="text-[10px] text-navy-foreground/60">Smart Emergency Response</p></div>}
    </div>
  );
  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 bg-navy transition-all md:block", open ? "w-64" : "w-[72px]")}>{brand}{side}</aside>
      {mobile && (
        <div className="fixed inset-0 z-[1000] md:hidden" onClick={() => setMobile(false)}>
          <aside className="h-full w-64 bg-navy" onClick={(e) => e.stopPropagation()}>{brand}{side}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[500] flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
          <button aria-label="Toggle sidebar" className="rounded-md p-2 hover:bg-muted" onClick={() => (window.innerWidth < 768 ? setMobile(true) : setOpen(!open))}><Menu className="h-5 w-5" /></button>
          <p className="text-sm font-semibold text-navy">{nav.find((n) => n.to === path)?.label ?? "ResQ+"}</p>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ok" /> Systems operational · Demo mode
            <div className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">AD</div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
        <footer className="border-t px-8 py-4 text-xs text-muted-foreground">College demonstration project. Not for real medical or dispatch use. All records are fictional and saved in this browser.</footer>
      </div>
    </div>
  );
}
