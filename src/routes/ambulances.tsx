import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { actions, useDB, type Ambulance, type AmbStatus } from "@/lib/store";
import { Btn, DemoTag, PageHeader, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/ambulances")({
  head: () => ({ meta: [
    { title: "Ambulance Management | ResQ+" },
    { name: "description", content: "Add, edit and assign ambulances and track their service phase." },
    { property: "og:title", content: "Ambulance Management | ResQ+" },
    { property: "og:description", content: "Fleet records and assignment." },
  ] }),
  component: Page,
});

const statuses: AmbStatus[] = ["Available", "Assigned", "En Route", "On Scene", "Transporting Patient", "Returning", "Out of Service"];
const blank: Ambulance = { id: "", driver: "", registration: "", location: "", status: "Available", lat: 19.08, lng: 72.88 };

function Page() {
  const db = useDB();
  const [edit, setEdit] = useState<Ambulance | null>(null);
  const [isNew, setIsNew] = useState(false);
  const pending = db.emergencies.filter((e) => e.status === "Pending");
  const save = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    if (!edit.id.trim() || !edit.driver.trim()) return toast.error("Ambulance ID and driver are required");
    if (isNew && db.ambulances.some((a) => a.id === edit.id)) return toast.error("That ambulance ID already exists");
    actions.upsertAmbulance({ ...edit, lat: edit.lat + (isNew ? (Math.random() - 0.5) * 0.05 : 0) });
    toast.success(`${edit.id} saved`); setEdit(null);
  };
  return (
    <>
      <PageHeader title="Ambulance Management" sub="One ambulance can only hold one active case at a time."><DemoTag /><Btn onClick={() => { setEdit(blank); setIsNew(true); }}>+ Add ambulance</Btn></PageHeader>
      {edit && (
        <form onSubmit={save} className="card-surface mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {(["id", "driver", "registration", "location"] as const).map((k) => (
            <label key={k} className="text-sm font-medium capitalize">{k === "id" ? "Ambulance ID" : k}
              <input className="field mt-1" disabled={k === "id" && !isNew} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>
          ))}
          <div className="flex items-end gap-2"><Btn type="submit">Save</Btn><Btn type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn></div>
        </form>
      )}
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>{["Ambulance", "Driver", "Registration", "Location", "Case", "Service phase", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {db.ambulances.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 font-mono font-medium text-navy">{a.id}</td>
                <td className="px-4 py-3">{a.driver}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.registration}</td>
                <td className="px-4 py-3">{a.location}</td>
                <td className="px-4 py-3 font-mono">{a.emergencyId ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2"><Pill>{a.status}</Pill>
                    <select className="field w-auto py-1 text-xs" value={a.status} onChange={(e) => actions.setAmbStatus(a.id, e.target.value as AmbStatus)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Btn variant="ghost" onClick={() => { setEdit(a); setIsNew(false); }}>Edit</Btn>
                    {a.status === "Available" && pending.length > 0 && (
                      <select className="field w-auto py-1 text-xs" value="" onChange={(e) => { const err = actions.assign(e.target.value, a.id); err ? toast.error(err) : toast.success(`${a.id} → ${e.target.value}`); }}>
                        <option value="">Assign to…</option>{pending.map((p) => <option key={p.id} value={p.id}>{p.id} ({p.priority})</option>)}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
