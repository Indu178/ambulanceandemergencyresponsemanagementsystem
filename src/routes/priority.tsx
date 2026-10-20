import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { actions, assessPriority, PRIORITY_RULES, useDB, type Priority } from "@/lib/store";
import { Btn, PageHeader, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/priority")({
  head: () => ({ meta: [
    { title: "AI Priority Assessment | ResQ+" },
    { name: "description", content: "Explainable rule-based priority suggestions for emergency requests." },
    { property: "og:title", content: "Priority Assessment | ResQ+" },
    { property: "og:description", content: "Transparent rule-based triage suggestions (demo)." },
  ] }),
  component: Page,
});

function Page() {
  const db = useDB();
  const [text, setText] = useState("Elderly man with chest pain and sweating");
  const r = assessPriority(text);
  return (
    <>
      <PageHeader title="AI-Assisted Priority Assessment" sub="This prototype uses transparent keyword rules, not machine learning. For demonstration only, not medical diagnosis." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="mb-2 font-bold">Try a description</h2>
          <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
            <p>Suggested priority: <Pill>{r.priority}</Pill></p>
            <p className="mt-2"><b>Reason:</b> {r.reason}</p>
            <p className="mt-1"><b>Next step:</b> {r.step}</p>
          </div>
          <h2 className="mb-2 mt-6 font-bold">Rules in use</h2>
          {PRIORITY_RULES.map((x) => <p key={x.priority} className="mb-2 text-sm"><Pill>{x.priority}</Pill> {x.keywords.join(", ")}</p>)}
          <p className="text-sm"><Pill>Medium</Pill> default when nothing matches</p>
        </section>
        <section className="card-surface p-5">
          <h2 className="mb-3 font-bold">Review open cases</h2>
          <div className="space-y-3">
            {db.emergencies.filter((e) => e.status !== "Completed").map((e) => {
              const s = assessPriority(`${e.type} ${e.description}`);
              return (
                <div key={e.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex justify-between"><span className="font-mono font-medium">{e.id} · {e.type}</span><span>Current <Pill>{e.priority}</Pill></span></div>
                  <p className="mt-1 text-muted-foreground">Suggested {s.priority}: {s.reason}</p>
                  <div className="mt-2 flex gap-2">
                    {(["Critical", "High", "Medium"] as Priority[]).map((p) => (
                      <Btn key={p} variant={p === s.priority ? "primary" : "ghost"} disabled={p === e.priority}
                        onClick={() => { actions.upsertEmergencyPriority(e.id, p); toast.success(`${e.id} set to ${p}`); }}>{p}</Btn>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
