import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, MapPin } from "lucide-react";
import { actions, useDB, type Hospital } from "@/lib/store";
import { Btn, DemoTag, PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/hospitals")({
  head: () => ({ meta: [
    { title: "Hospital Directory | ResQ+" },
    { name: "description", content: "Fictional hospital directory with services and sample bed availability." },
    { property: "og:title", content: "Hospital Directory | ResQ+" },
    { property: "og:description", content: "Search and manage partner hospitals (demo)." },
  ] }),
  component: Page,
});

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [svc, setSvc] = useState("");
  const [edit, setEdit] = useState<(Hospital & { svcText: string }) | null>(null);
  const all = [...new Set(db.hospitals.flatMap((h) => h.services))];
  const list = db.hospitals.filter((h) => `${h.name} ${h.address}`.toLowerCase().includes(q.toLowerCase()) && (!svc || h.services.includes(svc)));
  const save = (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    if (!edit.name.trim() || !edit.address.trim()) return toast.error("Name and address are required");
    const { svcText, ...h } = edit;
    actions.upsertHospital({ ...h, services: svcText.split(",").map((s) => s.trim()).filter(Boolean) });
    toast.success("Hospital saved"); setEdit(null);
  };
  return (
    <>
      <PageHeader title="Hospital Directory" sub="Fictional records. Availability is sample data, not a live integration.">
        <DemoTag /><Btn onClick={() => setEdit({ id: `H-${Date.now()}`, name: "", address: "", contact: "", services: [], beds: 0, svcText: "" })}>+ Add hospital</Btn>
      </PageHeader>
      {edit && (
        <form onSubmit={save} className="card-surface mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">Name<input className="field mt-1" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <label className="text-sm font-medium">Address<input className="field mt-1" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></label>
          <label className="text-sm font-medium">Contact<input className="field mt-1" value={edit.contact} onChange={(e) => setEdit({ ...edit, contact: e.target.value })} /></label>
          <label className="text-sm font-medium">Services (comma separated)<input className="field mt-1" value={edit.svcText} onChange={(e) => setEdit({ ...edit, svcText: e.target.value })} /></label>
          <label className="text-sm font-medium">Sample beds free<input type="number" min={0} className="field mt-1" value={edit.beds} onChange={(e) => setEdit({ ...edit, beds: +e.target.value })} /></label>
          <div className="flex items-end gap-2"><Btn type="submit">Save</Btn><Btn type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn></div>
        </form>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="field max-w-xs" placeholder="Search hospitals…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field w-auto" value={svc} onChange={(e) => setSvc(e.target.value)}><option value="">All services</option>{all.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No hospitals found.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((h) => (
          <div key={h.id} className="card-surface p-5">
            <h3 className="font-bold">{h.name}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{h.address}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{h.contact}</p>
            <div className="mt-3 flex flex-wrap gap-1">{h.services.map((s) => <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{s}</span>)}</div>
            <p className="mt-3 text-sm">Sample beds free: <b className={h.beds < 5 ? "text-critical" : "text-ok"}>{h.beds}</b></p>
            <div className="mt-4 flex gap-2">
              <Btn variant="ghost" onClick={() => setEdit({ ...h, svcText: h.services.join(", ") })}>Edit</Btn>
              <Btn variant="danger" onClick={() => { if (confirm(`Delete ${h.name}?`)) { actions.deleteHospital(h.id); toast.success("Deleted"); } }}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
