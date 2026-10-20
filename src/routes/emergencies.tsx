import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { actions, assessPriority, fmtTime, useDB, type Emergency, type Priority } from "@/lib/store";
import { Btn, PageHeader, Pill } from "@/components/ui-bits";
import { SimMap } from "@/components/Map";

export const Route = createFileRoute("/emergencies")({
  head: () => ({ meta: [
    { title: "Emergency Requests | ResQ+" },
    { name: "description", content: "Create, dispatch and track emergency requests on a simulated map." },
    { property: "og:title", content: "Emergency Requests | ResQ+" },
    { property: "og:description", content: "Dispatch panel with emergency cards and map." },
  ] }),
  component: Page,
});

const tabs = ["All", "Pending", "Ongoing", "Completed"] as const;
const types = ["Road Accident", "Cardiac", "Breathing Difficulty", "Fall Injury", "Burn", "Pregnancy", "Fever", "Other"];

function Page() {
  const db = useDB();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [q, setQ] = useState("");
  const [pf, setPf] = useState<"" | Priority>("");
  const [showForm, setShowForm] = useState(false);
  const list = useMemo(() => db.emergencies.filter((e) =>
    (tab === "All" || (tab === "Ongoing" ? e.status === "Ongoing" || e.status === "Assigned" : e.status === tab)) &&
    (!pf || e.priority === pf) &&
    `${e.id} ${e.location} ${e.type} ${e.patient}`.toLowerCase().includes(q.toLowerCase())), [db, tab, q, pf]);

  return (
    <>
      <PageHeader title="Emergency Dispatch" sub="Locations are fictional and simulated. No live GPS or traffic data.">
        <Btn onClick={() => setShowForm(!showForm)}>{showForm ? "Close form" : "+ New request"}</Btn>
      </PageHeader>
      {showForm && <NewForm onDone={() => setShowForm(false)} />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="card-surface flex flex-col p-4 lg:h-[680px]">
          <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${tab === t ? "bg-card text-navy shadow-sm" : "text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input className="field pl-8" placeholder="Search ID, location…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select className="field w-28" value={pf} onChange={(e) => setPf(e.target.value as Priority | "")}><option value="">Priority</option><option>Critical</option><option>High</option><option>Medium</option></select>
          </div>
          <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
            {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No emergencies match.</p>}
            {list.map((e) => <Card key={e.id} e={e} />)}
          </div>
        </section>
        <section className="card-surface overflow-hidden lg:h-[680px]"><SimMap emergencies={db.emergencies} ambulances={db.ambulances} /></section>
      </div>
    </>
  );
}

function Card({ e }: { e: Emergency }) {
  const db = useDB();
  const [amb, setAmb] = useState("");
  const free = db.ambulances.filter((a) => a.status === "Available");
  const border = { Critical: "border-l-critical", High: "border-l-high", Medium: "border-l-medium" }[e.priority];
  return (
    <div className={`rounded-lg border border-l-4 ${border} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-mono text-sm font-medium text-navy">{e.id}</p><p className="text-xs text-muted-foreground">{fmtTime(e.createdAt)}</p></div>
        <div className="flex gap-1"><Pill>{e.priority}</Pill><Pill>{e.status}</Pill></div>
      </div>
      <p className="mt-2 text-sm font-semibold">{e.type}</p>
      <p className="text-sm text-muted-foreground">{e.location}</p>
      <p className="mt-1 text-xs">Ambulance: <span className="font-mono">{e.ambulanceId ?? "Unassigned"}</span></p>
      <div className="mt-3 flex flex-wrap gap-2">
        {e.status === "Pending" && (
          <>
            <select className="field h-9 w-auto flex-1 py-1" value={amb} onChange={(x) => setAmb(x.target.value)}>
              <option value="">{free.length ? "Choose ambulance" : "None available"}</option>
              {free.map((a) => <option key={a.id}>{a.id}</option>)}
            </select>
            <Btn disabled={!amb} onClick={() => { const err = actions.assign(e.id, amb); err ? toast.error(err) : toast.success(`${amb} assigned to ${e.id}`); }}>Assign</Btn>
          </>
        )}
        {e.status === "Assigned" && <Btn variant="ghost" onClick={() => actions.setEmStatus(e.id, "Ongoing")}>Mark ongoing</Btn>}
        {(e.status === "Assigned" || e.status === "Ongoing") && <Btn onClick={() => { actions.setEmStatus(e.id, "Completed"); toast.success(`${e.id} completed`); }}>Mark completed</Btn>}
      </div>
    </div>
  );
}

function NewForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ patient: "", contact: "", type: "", location: "", description: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const s = assessPriority(`${f.type} ${f.description}`);
  const [override, setOverride] = useState<"" | Priority>("");
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!f.patient.trim()) e.patient = "Required";
    if (!/^[+\d\s-]{7,15}$/.test(f.contact)) e.contact = "Enter a valid phone number";
    if (!f.type) e.type = "Required";
    if (!f.location.trim()) e.location = "Required";
    setErr(e);
    if (Object.keys(e).length) return toast.error("Please fix the highlighted fields");
    const id = actions.addEmergency({ ...f, priority: override || s.priority });
    toast.success(`Emergency ${id} created`);
    onDone();
  };
  const F = (k: keyof typeof f, label: string, el?: React.ReactNode) => (
    <label className="text-sm font-medium">{label}{el ?? <input className="field mt-1" value={f[k]} onChange={(x) => setF({ ...f, [k]: x.target.value })} />}{err[k] && <span className="text-xs text-critical">{err[k]}</span>}</label>
  );
  return (
    <form onSubmit={submit} className="card-surface mb-6 grid gap-4 p-5 md:grid-cols-2">
      {F("patient", "Patient name or reference")}
      {F("contact", "Contact number")}
      {F("type", "Emergency type", <select className="field mt-1" value={f.type} onChange={(x) => setF({ ...f, type: x.target.value })}><option value="">Select…</option>{types.map((t) => <option key={t}>{t}</option>)}</select>)}
      {F("location", "Location")}
      <label className="text-sm font-medium md:col-span-2">Short description<textarea className="field mt-1" rows={2} value={f.description} onChange={(x) => setF({ ...f, description: x.target.value })} /></label>
      <div className="rounded-lg bg-muted p-3 text-sm md:col-span-2">
        <p>Suggested priority (rule-based): <Pill>{s.priority}</Pill> <span className="text-muted-foreground">— {s.reason}</span></p>
        <label className="mt-2 flex items-center gap-2">Admin review:
          <select className="field w-auto py-1" value={override} onChange={(x) => setOverride(x.target.value as Priority | "")}><option value="">Accept suggestion</option><option>Critical</option><option>High</option><option>Medium</option></select>
        </label>
      </div>
      <div className="md:col-span-2"><Btn type="submit">Create emergency</Btn></div>
    </form>
  );
}
