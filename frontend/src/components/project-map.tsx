import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDot, Clock3, MapPin, ShieldAlert, X } from "lucide-react";

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
  PENDING_APPROVAL: "#f59e0b",
  CREATED: "#6366f1",
  ACTIVE: "#3b82f6",
  COMPLETED: "#10b981",
  PAUSED: "#ef4444",
  CANCELLED: "#737373",
};

const PROOF_COLOR = "#0f172a";
const INDIA_CENTER: L.LatLngExpression = [22.9734, 78.6569];
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.5, 67.0],
  [37.5, 97.5],
];

function getStatusLabel(status: string) {
  if (status === "PENDING_APPROVAL") return "Pending";
  if (status === "CREATED") return "Created";
  if (status === "ACTIVE") return "Ongoing";
  if (status === "COMPLETED") return "Completed";
  if (status === "PAUSED") return "Paused";
  if (status === "CANCELLED") return "Cancelled";
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

function makeProofIcon() {
  const html = `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:${PROOF_COLOR};border:2px solid rgba(255,255,255,0.96);box-shadow:0 10px 20px rgba(15,23,42,0.2),0 0 0 1px rgba(15,23,42,0.12);"></div>
      <div style="position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:2px;background:rgba(255,255,255,0.98);transform:translate(-50%,-50%) rotate(45deg);"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "dt-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function isValidCoordinate(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude === 0 && longitude === 0) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
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
  spentAmount?: number;
  category?: string;
  reportCount?: number;
}

interface ProofLocation {
  id: string;
  projectId: string;
  title: string;
  latitude: number;
  longitude: number;
  status?: string;
  submittedAt?: string;
  submittedBy?: string;
}

function FitBounds({ projects, proofs }: { projects: MapProject[]; proofs: ProofLocation[] }) {
  const map = useMap();
  useEffect(() => {
    const points: L.LatLngTuple[] = [
      ...projects.map(p => [p.latitude, p.longitude] as L.LatLngTuple),
      ...proofs.map(p => [p.latitude, p.longitude] as L.LatLngTuple),
    ];

    if (!points.length) {
      map.setView(INDIA_CENTER, 5, { animate: false });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0] as L.LatLngExpression, 6, { animate: false });
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
    }
  }, [projects, proofs, map]);
  return null;
}

function FocusSelected({ project }: { project?: MapProject }) {
  const map = useMap();

  useEffect(() => {
    if (!project) return;
    map.flyTo([project.latitude, project.longitude], Math.max(map.getZoom(), 7), {
      animate: true,
      duration: 0.45,
    });
  }, [map, project]);

  return null;
}

type ProjectMapProps = {
  projects: MapProject[];
  proofLocations?: ProofLocation[];
  selectedProjectId?: string;
  onProjectSelect?: (projectId?: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProjectMap({
  projects,
  proofLocations = [],
  selectedProjectId,
  onProjectSelect,
  emptyTitle = "No projects on map",
  emptyDescription = "Projects appear here once they have a valid location set.",
}: ProjectMapProps) {
  const validProjects = useMemo(
    () => projects.filter((p) => isValidCoordinate(p.latitude, p.longitude)),
    [projects],
  );
  const validProofs = useMemo(
    () => proofLocations.filter((p) => isValidCoordinate(p.latitude, p.longitude)),
    [proofLocations],
  );
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>();
  const activeProjectId = selectedProjectId ?? localSelectedId;
  const selectedProject = useMemo(
    () => validProjects.find((project) => project.id === activeProjectId),
    [activeProjectId, validProjects],
  );
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    validProjects.forEach((project) => counts.set(project.status, (counts.get(project.status) ?? 0) + 1));
    return Array.from(counts.entries());
  }, [validProjects]);

  const selectProject = (projectId: string) => {
    setLocalSelectedId(projectId);
    onProjectSelect?.(projectId);
  };

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[24px] border border-neutral-200 bg-[#eef3f8] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-28 bg-gradient-to-b from-white/92 via-white/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] h-24 bg-gradient-to-t from-[#06111f]/22 via-[#06111f]/6 to-transparent" />

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[600] flex items-end justify-between gap-4">
        <div className="max-w-[calc(100%-18rem)] rounded-2xl border border-white/70 bg-slate-950/84 px-4 py-3 text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.7)] backdrop-blur max-sm:max-w-none">
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/60">
            Map legend
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
            {statusCounts.map(([status, count]) => (
              <LegendItem key={status} color={STATUS_COLOR[status] ?? "#525252"} label={`${getStatusLabel(status)} (${count})`} />
            ))}
            {validProofs.length > 0 && <LegendItem color={PROOF_COLOR} label={`Proof (${validProofs.length})`} />}
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="absolute right-4 top-4 z-[650] w-[min(330px,calc(100%-2rem))] border border-white/80 bg-white/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-4 py-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[selectedProject.status] ?? "#525252" }} />
                <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">{getStatusLabel(selectedProject.status)}</span>
              </div>
              <div className="truncate text-[15px] font-semibold tracking-tight text-neutral-950">{selectedProject.title}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocalSelectedId(undefined);
                onProjectSelect?.(undefined);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Close map details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-4 px-4 py-4">
            <div className="flex items-start gap-2 text-[12.5px] leading-relaxed text-neutral-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span>{selectedProject.location}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric label="Budget" value={`₹${selectedProject.totalBudget.toLocaleString()}`} />
              <MiniMetric label="Risk" value={selectedProject.riskLevel.toLowerCase()} tone={selectedProject.riskLevel === "LOW" ? "neutral" : "alert"} />
            </div>
            {typeof selectedProject.spentAmount === "number" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                  <span>Released</span>
                  <span>₹{selectedProject.spentAmount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full bg-neutral-900"
                    style={{
                      width: `${Math.min(100, Math.round((selectedProject.spentAmount / Math.max(selectedProject.totalBudget, 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Link
              href={`/projects/${selectedProject.id}`}
              className="inline-flex h-9 items-center gap-2 bg-neutral-950 px-3 text-[12px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Open ledger <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

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
        <FitBounds projects={validProjects} proofs={validProofs} />
        <FocusSelected project={selectedProject} />
        {validProjects.map(p => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={makePinIcon(STATUS_COLOR[p.status] ?? "#525252")}
            eventHandlers={{ click: () => selectProject(p.id) }}
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
        {validProofs.map((proof) => (
          <Marker
            key={`proof-${proof.id}`}
            position={[proof.latitude, proof.longitude]}
            icon={makeProofIcon()}
          >
            <Tooltip direction="top" offset={[0, -14]} className="dt-map-label">
              Proof
            </Tooltip>
            <Popup className="dt-map-popup" closeButton={false} offset={[0, -10]}>
              <div className="min-w-[210px] text-[12px] leading-snug">
                <div className="mb-1.5 flex items-center gap-2 font-semibold text-slate-950">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                  {proof.title}
                </div>
                <div className="space-y-1.5 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CircleDot className="h-3.5 w-3.5" />
                    {proof.latitude.toFixed(4)}, {proof.longitude.toFixed(4)}
                  </div>
                  {proof.submittedAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(proof.submittedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {validProjects.length === 0 && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
          <div className="max-w-sm rounded-3xl border border-white bg-white/92 px-6 py-5 text-center shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-[16px] font-semibold tracking-tight text-slate-950">{emptyTitle}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
              {emptyDescription}
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
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-white/88">{label}</span>
    </span>
  );
}

function MiniMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "alert" }) {
  return (
    <div className="border border-neutral-200 bg-white px-3 py-2">
      <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-neutral-500">{label}</div>
      <div className={`flex items-center gap-1.5 text-[13px] font-semibold capitalize ${tone === "alert" ? "text-red-600" : "text-neutral-950"}`}>
        {tone === "alert" && <ShieldAlert className="h-3.5 w-3.5" />}
        {value}
      </div>
    </div>
  );
}
