import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { actions, avgResponseMin, useDB } from "@/lib/store";
import { Btn, PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [
    { title: "Analytics & Reports | ResQ+" },
    { name: "description", content: "Emergency totals, priority mix, fleet utilisation and response times." },
    { property: "og:title", content: "Analytics | ResQ+" },
    { property: "og:description", content: "Charts calculated from current records." },
  ] }),
  component: Page,
});

function Page() {
  const db = useDB();
  const E = db.emergencies;
  const pri = (["Critical", "High", "Medium"] as const).map((p, i) => ({ name: p, value: E.filter((e) => e.priority === p).length, c: `var(--chart-${[2, 3, 4][i]})` }));
  const phases = [...new Set(db.ambulances.map((a) => a.status))].map((s) => ({ name: s, count: db.ambulances.filter((a) => a.status === s).length }));
  const busy = db.ambulances.filter((a) => !["Available", "Out of Service"].includes(a.status)).length;
  const kpi = [["Total emergencies", E.length], ["Completed", E.filter((e) => e.status === "Completed").length], ["Fleet utilisation", `${Math.round((busy / Math.max(1, db.ambulances.length)) * 100)}%`], ["Avg. response", `${avgResponseMin(E)} min`]];
  return (
    <>
      <PageHeader title="Analytics & Reports" sub="Calculated from the current (fictional) records in this browser.">
        <Btn variant="ghost" onClick={() => confirm("Reset all demo data?") && actions.reset()}>Reset demo data</Btn>
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpi.map(([l, v]) => <div key={l} className="card-surface p-5"><p className="text-2xl font-extrabold text-navy">{v}</p><p className="text-sm text-muted-foreground">{l}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5"><h2 className="mb-3 font-bold">Priority distribution</h2>
          <ResponsiveContainer height={260}><PieChart><Pie data={pri} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>{pri.map((p) => <Cell key={p.name} fill={p.c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </div>
        <div className="card-surface p-5"><h2 className="mb-3 font-bold">Ambulance service phases</h2>
          <ResponsiveContainer height={260}><BarChart data={phases}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
