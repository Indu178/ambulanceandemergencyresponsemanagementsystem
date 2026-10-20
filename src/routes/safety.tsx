import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { actions, fmtTime, useDB, type Incident } from "@/lib/store";
import { Btn, PageHeader, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/safety")({
  head: () => ({ meta: [
    { title: "Safety Monitor | ResQ+" },
    { name: "description", content: "Log equipment issues and operational incidents for the fleet." },
    { property: "og:title", content: "Safety Monitor | ResQ+" },
    { property: "og:description", content: "Equipment and incident tracking." },
  ] }),
  component: Page,
});

function Page() {
  const db = useDB();
  const [f, setF] = useState({ title: "", ambulanceId: "", severity: "Medium" as Incident["severity"] });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.ambulanceId) return toast.error("Describe the issue and choose an ambulance");
    actions.addIncident(f); toast.success("Incident logged"); setF({ ...f, title: "" });
  };
  return (
    <>
      <PageHeader title="Safety Monitor" sub="Open incidents also appear in dashboard alerts." />
      <form onSubmit={submit} className="card-surface mb-6 grid gap-3 p-5 sm:grid-cols-4">
        <input className="field sm:col-span-2" placeholder="e.g. Stretcher lock faulty" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select className="field" value={f.ambulanceId} onChange={(e) => setF({ ...f, ambulanceId: e.target.value })}><option value="">Ambulance…</option>{db.ambulances.map((a) => <option key={a.id}>{a.id}</option>)}</select>
        <div className="flex gap-2"><select className="field" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as Incident["severity"] })}><option>Low</option><option>Medium</option><option>High</option></select><Btn type="submit">Log</Btn></div>
      </form>
      <div className="space-y-3">
        {db.incidents.map((i) => (
          <div key={i.id} className="card-surface flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1"><p className="font-semibold">{i.title}</p><p className="text-xs text-muted-foreground">{i.ambulanceId} · {fmtTime(i.createdAt)}</p></div>
            <Pill>{i.severity === "High" ? "Critical" : i.severity}</Pill><Pill>{i.status}</Pill>
            {i.status === "Open" && <Btn variant="ghost" onClick={() => actions.resolveIncident(i.id)}>Resolve</Btn>}
          </div>
        ))}
      </div>
    </>
  );
}
