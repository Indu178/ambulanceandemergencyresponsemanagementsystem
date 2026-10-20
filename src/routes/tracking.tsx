import { createFileRoute } from "@tanstack/react-router";
import { useDB } from "@/lib/store";
import { PageHeader, Pill } from "@/components/ui-bits";
import { SimMap } from "@/components/Map";

export const Route = createFileRoute("/tracking")({
  head: () => ({ meta: [
    { title: "Live Tracking (Simulated) | ResQ+" },
    { name: "description", content: "Simulated map of ambulances and open emergencies." },
    { property: "og:title", content: "Tracking | ResQ+" },
    { property: "og:description", content: "Simulated ambulance positions on OpenStreetMap." },
  ] }),
  component: Page,
});

function Page() {
  const db = useDB();
  return (
    <>
      <PageHeader title="Live Tracking" sub="Simulated positions only. This prototype does not use real GPS or traffic data." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card-surface h-[620px] overflow-hidden"><SimMap emergencies={db.emergencies} ambulances={db.ambulances} /></div>
        <div className="card-surface space-y-2 p-4">
          <h2 className="font-bold">Units</h2>
          {db.ambulances.map((a) => (
            <div key={a.id} className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between"><span className="font-mono font-medium">{a.id}</span><Pill>{a.status}</Pill></div>
              <p className="text-xs text-muted-foreground">{a.location}{a.emergencyId && ` · ${a.emergencyId}`}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
