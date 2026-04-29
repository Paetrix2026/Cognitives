import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";
import { AlertTriangle, MapPin } from "lucide-react";

// Fix Leaflet's default-icon resolution under bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#3b82f6",
  COMPLETED: "#10b981",
};

const INDIA_CENTER: L.LatLngExpression = [22.9734, 78.6569];
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.5, 67.0],
  [37.5, 97.5],
];

function getStatusLabel(status: string) {
  if (status === "ACTIVE") return "Ongoing";
  if (status === "COMPLETED") return "Completed";
  return status;
}

function getMapAreaLabel(location: string) {
  return location.split(",")[0]?.trim() || location;
}

function makePinIcon(color: string) {
  const html = `
    <div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:${color};border:2px solid rgba(255,255,255,0.96);box-shadow:0 10px 20px rgba(15,23,42,0.18),0 0 0 1px rgba(15,23,42,0.08);"></div>
      <div style="position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:9999px;background:rgba(255,255,255,0.98);transform:translate(-50%,-50%);"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "dt-marker",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

interface MapProject {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  riskLevel: string;
  totalBudget: number;
}

function FitBounds({ projects }: { projects: MapProject[] }) {
  const map = useMap();
  useEffect(() => {
    if (!projects.length) {
      map.setView(INDIA_CENTER, 5, { animate: false });
      return;
    }

    const points: L.LatLngExpression[] = projects.map(p => [p.latitude, p.longitude]);
    if (points.length === 1) {
      map.setView(points[0] as L.LatLngExpression, 6, { animate: false });
    } else {
      const bounds = L.latLngBounds(points as L.LatLngTuple[]);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
    }
  }, [projects, map]);
  return null;
}

export function ProjectMap({ projects }: { projects: MapProject[] }) {
  const statusCounts = useMemo(() => ({
    ongoing: projects.filter((p) => p.status === "ACTIVE").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
  }), [projects]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[24px] border border-neutral-200 bg-[#eef3f8] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-28 bg-gradient-to-b from-white/92 via-white/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] h-24 bg-gradient-to-t from-[#06111f]/22 via-[#06111f]/6 to-transparent" />

      <div className="pointer-events-none absolute bottom-4 left-4 z-[600]">
        <div className="rounded-2xl border border-white/70 bg-slate-950/84 px-4 py-3 text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.7)] backdrop-blur">
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/60">
            Project status
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
            <LegendItem color="bg-blue-500" label={`Ongoing${statusCounts.ongoing ? ` (${statusCounts.ongoing})` : ""}`} />
            <LegendItem color="bg-emerald-500" label={`Completed${statusCounts.completed ? ` (${statusCounts.completed})` : ""}`} />
          </div>
        </div>
      </div>

      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={4}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <FitBounds projects={projects} />
        {projects.map(p => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={makePinIcon(STATUS_COLOR[p.status] ?? "#525252")}
          >
            <Tooltip permanent direction="top" offset={[0, -14]} className="dt-map-label">
              {getMapAreaLabel(p.location)}
            </Tooltip>
            <Popup className="dt-map-popup" closeButton={false} offset={[0, -10]}>
              <div className="min-w-[220px] text-[12px] leading-snug">
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-950">{p.title}</div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${p.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{p.location}</span>
                </div>
                <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">Escrowed budget</div>
                <div className="mb-3 text-[18px] font-semibold tracking-tight text-slate-900 tabular-nums">
                  ₹{p.totalBudget.toLocaleString()}
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1 font-medium text-sky-700 transition-colors hover:text-sky-900"
                >
                  Open ledger
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {projects.length === 0 && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
          <div className="max-w-sm rounded-3xl border border-white bg-white/92 px-6 py-5 text-center shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-[16px] font-semibold tracking-tight text-slate-950">No ongoing or completed projects on map</div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
              Projects appear here once they are active or completed and have a location set.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-white/88">{label}</span>
    </span>
  );
}
