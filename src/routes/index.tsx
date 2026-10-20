import { createFileRoute, Link } from "@tanstack/react-router";
import { Ambulance, Clock, PhoneCall, Siren, AlertTriangle } from "lucide-react";
import { avgResponseMin, fmtTime, useDB } from "@/lib/store";
import { DemoTag, PageHeader, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard | ResQ+ Emergency Response" },
    { name: "description", content: "Overview of ambulances, emergency calls, response times and critical cases." },
    { property: "og:title", content: "ResQ+ Dashboard" },
    { property: "og:description", content: "Smart emergency response overview (demo)." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const db = useDB();
  const active = db.ambulances.filter((a) => a.status !== "Out of Service" && a.status !== "Available").length;
  const critical = db.emergencies.filter((e) => e.priority === "Critical" && e.status !== "Completed").length;
  const stats = [
    { label: "Active ambulances", v: `${active}/${db.ambulances.length}`, icon: Ambulance, c: "bg-accent text-accent-foreground" },
    { label: "Total emergency calls", v: db.emergencies.length, icon: PhoneCall, c: "bg-info/12 text-info" },
    { label: "Avg. response time", v: `${avgResponseMin(db.emergencies)} min`, icon: Clock, c: "bg-high/15 text-high" },
    { label: "Active critical cases", v: critical, icon: Siren, c: "bg-critical/12 text-critical" },
  ];
  const alerts = [
    ...db.incidents.filter((i) => i.status === "Open").map((i) => ({ t: i.createdAt, txt: `${i.ambulanceId}: ${i.title}`, tag: i.severity })),
    ...db.emergencies.slice(0, 6).map((e) => ({ t: e.createdAt, txt: `${e.id} · ${e.type} at ${e.location}`, tag: e.priority })),
  ].sort((a, b) => b.t - a.t).slice(0, 7);

  return (
    <>
      <PageHeader title="Good morning, Dispatcher" sub="Live overview of the emergency network. Figures update as records change.">
        <Link to="/emergencies" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">+ New emergency</Link>
        <Link to="/ambulances" className="rounded-md border bg-card px-3 py-2 text-sm font-semibold">View ambulances</Link>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, v, icon: I, c }) => (
          <div key={label} className="card-surface p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${c}`}><I className="h-5 w-5" /></div>
            <p className="text-2xl font-extrabold text-navy">{v}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Ambulance fleet</h2><DemoTag /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {db.ambulances.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="font-mono text-sm font-medium text-navy">{a.id}</p><p className="text-xs text-muted-foreground">Driver {a.driver} · {a.location}</p></div>
                <Pill>{a.status}</Pill>
              </div>
            ))}
          </div>
        </section>
        <section className="card-surface p-5">
          <h2 className="mb-4 font-bold">Recent alerts</h2>
          <ul className="space-y-3">
            {alerts.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-high" />
                <div className="min-w-0 flex-1"><p className="truncate">{a.txt}</p><p className="text-xs text-muted-foreground">{fmtTime(a.t)}</p></div>
                <Pill>{a.tag}</Pill>
              </li>
            ))}
          </ul>
          <h2 className="mb-2 mt-6 font-bold">System status</h2>
          {["Dispatch service", "Map tiles (OpenStreetMap)", "Priority rules engine"].map((s) => (
            <p key={s} className="flex items-center gap-2 py-1 text-sm"><span className="h-2 w-2 rounded-full bg-ok" />{s}<span className="ml-auto text-xs text-ok">Online</span></p>
          ))}
        </section>
      </div>
    </>
  );
}
