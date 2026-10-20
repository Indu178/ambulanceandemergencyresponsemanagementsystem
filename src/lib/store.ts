import { useEffect, useState } from "react";

export type Priority = "Critical" | "High" | "Medium";
export type EmStatus = "Pending" | "Assigned" | "Ongoing" | "Completed";
export type AmbStatus =
  | "Available" | "Assigned" | "En Route" | "On Scene"
  | "Transporting Patient" | "Returning" | "Out of Service";

export interface Emergency {
  id: string; patient: string; contact: string; type: string; location: string;
  description: string; priority: Priority; status: EmStatus; ambulanceId?: string;
  createdAt: number; assignedAt?: number; completedAt?: number; lat: number; lng: number;
}
export interface Ambulance {
  id: string; driver: string; registration: string; location: string; status: AmbStatus;
  emergencyId?: string; lat: number; lng: number;
}
export interface Hospital {
  id: string; name: string; address: string; contact: string; services: string[]; beds: number;
}
export interface Incident {
  id: string; title: string; ambulanceId: string; severity: "Low" | "Medium" | "High";
  status: "Open" | "Resolved"; createdAt: number;
}
export interface DB { emergencies: Emergency[]; ambulances: Ambulance[]; hospitals: Hospital[]; incidents: Incident[]; }

// Fictional city centre (simulated coordinates)
const C = { lat: 19.076, lng: 72.8777 };
const jitter = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1 * 0.06;
const H = 3600_000;
const now = Date.UTC(2026, 9, 20, 4, 0);

function seed(): DB {
  const ambulances: Ambulance[] = [
    ["AMB-101", "DRV-01", "Available", "Sector 4 Depot"],
    ["AMB-102", "DRV-02", "En Route", "Harbor Road"],
    ["AMB-103", "DRV-03", "Available", "Central Station"],
    ["AMB-104", "DRV-04", "Transporting Patient", "Lake View"],
    ["AMB-105", "DRV-05", "Returning", "Old Market"],
    ["AMB-106", "DRV-06", "Out of Service", "Workshop B"],
  ].map(([id, driver, status, location], i) => ({
    id, driver, status: status as AmbStatus, location, registration: `XX-00-AB-${1000 + i}`,
    lat: C.lat + jitter(i + 1), lng: C.lng + jitter(i + 7),
  }));
  const em = (i: number, type: string, location: string, priority: Priority, status: EmStatus, amb?: string): Emergency => ({
    id: `EM-${2410 + i}`, patient: `Patient Ref ${100 + i}`, contact: "+91 90000 0000" + i, type, location,
    description: `${type} reported (demo record)`, priority, status, ambulanceId: amb,
    createdAt: now - (8 - i) * H, assignedAt: amb ? now - (8 - i) * H + (6 + i) * 60_000 : undefined,
    completedAt: status === "Completed" ? now - (7 - i) * H : undefined,
    lat: C.lat + jitter(i + 20), lng: C.lng + jitter(i + 31),
  });
  const emergencies = [
    em(0, "Road Accident", "Harbor Road Junction", "Critical", "Ongoing", "AMB-102"),
    em(1, "Cardiac", "Lake View Apartments", "Critical", "Ongoing", "AMB-104"),
    em(2, "Fall Injury", "Old Market Lane", "Medium", "Completed", "AMB-105"),
    em(3, "Breathing Difficulty", "Green Park", "High", "Pending"),
    em(4, "Burn", "Industrial Area 2", "High", "Pending"),
    em(5, "Fever", "Sunrise Colony", "Medium", "Completed", "AMB-101"),
  ];
  const hospitals: Hospital[] = [
    ["City General (Demo)", "12 Central Ave", "Emergency, Trauma, ICU", 14],
    ["Lakeside Medical (Demo)", "4 Lake View Rd", "Cardiology, ICU", 6],
    ["Harbor Care Clinic (Demo)", "88 Harbor Rd", "Emergency, Orthopedics", 9],
    ["Northside Children's (Demo)", "3 North St", "Pediatrics, Emergency", 3],
  ].map(([name, address, s, beds], i) => ({
    id: `H-${i + 1}`, name: name as string, address: address as string, contact: `+91 22 4000 00${i}0`,
    services: (s as string).split(", "), beds: beds as number,
  }));
  const incidents: Incident[] = [
    { id: "SI-1", title: "Oxygen cylinder low pressure", ambulanceId: "AMB-106", severity: "High", status: "Open", createdAt: now - 3 * H },
    { id: "SI-2", title: "Defibrillator battery check due", ambulanceId: "AMB-103", severity: "Medium", status: "Open", createdAt: now - 5 * H },
    { id: "SI-3", title: "Siren intermittent", ambulanceId: "AMB-105", severity: "Low", status: "Resolved", createdAt: now - 20 * H },
  ];
  return { emergencies, ambulances, hospitals, incidents };
}

const KEY = "resq-db-v1";
let db: DB = seed();
let loaded = false;
const subs = new Set<() => void>();
function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(db));
  subs.forEach((f) => f());
}
function set(fn: (d: DB) => DB) { db = fn(db); emit(); }

export function useDB(): DB {
  const [s, setS] = useState(db);
  useEffect(() => {
    if (!loaded) {
      loaded = true;
      try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch { /* ignore */ }
    }
    setS(db);
    const f = () => setS(db);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return s;
}

/** Explainable, rule-based priority suggestion (NOT machine learning, demo only). */
export const PRIORITY_RULES: { priority: Priority; keywords: string[]; step: string }[] = [
  { priority: "Critical", keywords: ["cardiac", "heart", "unconscious", "not breathing", "stroke", "severe bleeding", "accident", "chest pain"], step: "Dispatch nearest available ambulance immediately and pre-alert an ICU-capable hospital." },
  { priority: "High", keywords: ["breathing", "burn", "fracture", "seizure", "pregnan", "bleeding", "poison"], step: "Dispatch next available ambulance and confirm hospital capacity." },
];
export function assessPriority(text: string): { priority: Priority; reason: string; step: string } {
  const t = text.toLowerCase();
  for (const r of PRIORITY_RULES) {
    const hit = r.keywords.filter((k) => t.includes(k));
    if (hit.length) return { priority: r.priority, reason: `Matched rule keywords: ${hit.join(", ")}`, step: r.step };
  }
  return { priority: "Medium", reason: "No high-risk keywords matched (default rule).", step: "Queue request and assign when an ambulance becomes available." };
}

export const actions = {
  addEmergency(e: Omit<Emergency, "id" | "createdAt" | "status" | "lat" | "lng">) {
    const id = `EM-${Date.now().toString().slice(-6)}`;
    set((d) => ({ ...d, emergencies: [{ ...e, id, status: "Pending", createdAt: Date.now(),
      lat: C.lat + (Math.random() - 0.5) * 0.08, lng: C.lng + (Math.random() - 0.5) * 0.08 }, ...d.emergencies] }));
    return id;
  },
  assign(emId: string, ambId: string): string | null {
    const amb = db.ambulances.find((a) => a.id === ambId);
    const em = db.emergencies.find((e) => e.id === emId);
    if (!amb || !em) return "Record not found.";
    if (amb.status !== "Available" || amb.emergencyId) return `${ambId} is already on an active case.`;
    if (em.status === "Completed") return "Case already completed.";
    set((d) => ({
      ...d,
      emergencies: d.emergencies.map((e) => e.id === emId ? { ...e, status: "Assigned", ambulanceId: ambId, assignedAt: Date.now() } : e),
      ambulances: d.ambulances.map((a) => a.id === ambId ? { ...a, status: "Assigned", emergencyId: emId } : a),
    }));
    return null;
  },
  setEmStatus(emId: string, status: EmStatus) {
    set((d) => {
      const em = d.emergencies.find((e) => e.id === emId);
      return {
        ...d,
        emergencies: d.emergencies.map((e) => e.id === emId ? { ...e, status, completedAt: status === "Completed" ? Date.now() : e.completedAt } : e),
        ambulances: d.ambulances.map((a) => em && a.id === em.ambulanceId
          ? status === "Completed" ? { ...a, status: "Returning", emergencyId: undefined }
          : status === "Ongoing" ? { ...a, status: "En Route" } : a
          : a),
      };
    });
  },
  upsertAmbulance(a: Ambulance) {
    set((d) => d.ambulances.some((x) => x.id === a.id)
      ? { ...d, ambulances: d.ambulances.map((x) => (x.id === a.id ? a : x)) }
      : { ...d, ambulances: [...d.ambulances, a] });
  },
  setAmbStatus(id: string, status: AmbStatus) {
    set((d) => ({ ...d, ambulances: d.ambulances.map((a) => a.id === id
      ? { ...a, status, emergencyId: status === "Available" || status === "Out of Service" ? undefined : a.emergencyId } : a) }));
  },
  upsertHospital(h: Hospital) {
    set((d) => d.hospitals.some((x) => x.id === h.id)
      ? { ...d, hospitals: d.hospitals.map((x) => (x.id === h.id ? h : x)) }
      : { ...d, hospitals: [...d.hospitals, h] });
  },
  deleteHospital(id: string) { set((d) => ({ ...d, hospitals: d.hospitals.filter((h) => h.id !== id) })); },
  addIncident(i: Omit<Incident, "id" | "createdAt" | "status">) {
    set((d) => ({ ...d, incidents: [{ ...i, id: `SI-${Date.now().toString().slice(-5)}`, status: "Open", createdAt: Date.now() }, ...d.incidents] }));
  },
  resolveIncident(id: string) { set((d) => ({ ...d, incidents: d.incidents.map((i) => i.id === id ? { ...i, status: "Resolved" } : i) })); },
  reset() { db = seed(); emit(); },
};

export function avgResponseMin(list: Emergency[]) {
  const r = list.filter((e) => e.assignedAt).map((e) => (e.assignedAt! - e.createdAt) / 60000);
  return r.length ? Math.round(r.reduce((a, b) => a + b, 0) / r.length) : 0;
}
export const fmtTime = (t: number) => new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
