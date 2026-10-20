import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Ambulance, Emergency } from "@/lib/store";

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const pColor = { Critical: "--critical", High: "--high", Medium: "--medium" } as const;

export default function MapView({ emergencies, ambulances }: { emergencies: Emergency[]; ambulances: Ambulance[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([19.09, 72.9], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const g = layer.current; if (!g) return;
    g.clearLayers();
    emergencies.filter((e) => e.status !== "Completed").forEach((e) => {
      L.circleMarker([e.lat, e.lng], { radius: 10, color: css(pColor[e.priority]), fillOpacity: 0.7, weight: 3 })
        .bindPopup(`<b>${e.id}</b> · ${e.priority}<br/>${e.type}<br/>${e.location}<br/>Status: ${e.status}`).addTo(g);
    });
    ambulances.forEach((a) => {
      const c = a.status === "Available" ? css("--ok") : a.status === "Out of Service" ? css("--muted-foreground") : css("--info");
      L.marker([a.lat, a.lng], { icon: L.divIcon({ className: "", html: `<div style="background:${c};color:white;border-radius:6px;padding:2px 5px;font:600 10px sans-serif;border:2px solid white;box-shadow:0 1px 4px #0004">🚑 ${a.id.slice(4)}</div>` }) })
        .bindPopup(`<b>${a.id}</b><br/>Driver: ${a.driver}<br/>${a.status}${a.emergencyId ? `<br/>Case: ${a.emergencyId}` : ""}`).addTo(g);
    });
  }, [emergencies, ambulances]);

  return <div ref={el} className="h-full min-h-[420px] w-full" />;
}
