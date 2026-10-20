import { lazy, Suspense, useEffect, useState } from "react";
import type { Ambulance, Emergency } from "@/lib/store";

const MapView = lazy(() => import("./MapView"));

export function SimMap(props: { emergencies: Emergency[]; ambulances: Ambulance[] }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  const fallback = <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">Loading map…</div>;
  return (
    <div className="relative h-full">
      {ok ? <Suspense fallback={fallback}><MapView {...props} /></Suspense> : fallback}
      <div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-card/95 p-3 text-xs shadow-md">
        <p className="mb-1 font-bold">Legend · simulated positions</p>
        {[["bg-critical", "Critical case"], ["bg-high", "High case"], ["bg-medium", "Medium case"], ["bg-ok", "Ambulance available"], ["bg-info", "Ambulance busy"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${c}`} />{l}</div>
        ))}
      </div>
    </div>
  );
}
