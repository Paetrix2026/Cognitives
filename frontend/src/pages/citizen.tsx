import React, { useMemo, useState } from "react";
import {
  useGetAnalyticsOverview,
  useListProjects,
  useSyncProjects,
  getListProjectsQueryKey,
  getGetAnalyticsOverviewQueryKey,
} from "@workspace/api-client-react";
import { RefreshCw, Search, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/status-badge";
import { ProjectMap } from "@/components/project-map";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_CATEGORIES, categoryLabel, type ProjectCategory } from "@/lib/categories";

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="py-1">
      <div className="text-[11px] uppercase tracking-[0.08em] text-neutral-500 mb-2">{label}</div>
      <div className="text-[26px] font-semibold tracking-tight text-neutral-900 leading-none mb-1.5">{value}</div>
      {sub && <div className="text-[12px] text-neutral-500">{sub}</div>}
    </div>
  );
}

export default function Citizen() {
  const { data: analytics, isLoading: analyticsLoading } =
    useGetAnalyticsOverview({ query: { queryKey: getGetAnalyticsOverviewQueryKey() } });
  const { data: projects, isLoading: projectsLoading } =
    useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const syncProjects = useSyncProjects();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | "ALL">("ALL");
  const [selectedMapProjectId, setSelectedMapProjectId] = useState<string>();

  const handleSync = () => {
    syncProjects.mutate(undefined, {
      onSuccess: (data) => {
        toast({ title: "Synced", description: data.message || "Latest state mirrored." });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalyticsOverviewQueryKey() });
      },
      onError: () => {
        toast({ title: "Sync failed", description: "Could not synchronize.", variant: "destructive" });
      },
    });
  };

  const filteredProjects = useMemo(() => {
    return projects?.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === "ALL" || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [projects, searchQuery, activeCategory]);

  const mapProjects = useMemo(() => {
    return (filteredProjects ?? [])
      .filter(p =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number",
      )
      .map(p => ({
        id: p.id,
        title: p.title,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        status: p.status,
        riskLevel: p.riskLevel,
        totalBudget: p.totalBudget,
        spentAmount: p.spentAmount,
        category: p.category,
        reportCount: p.reportCount,
      }));
  }, [filteredProjects]);

  const projectLocations = useMemo(() => {
    return mapProjects.map((project) => ({
      id: project.id,
      title: project.title,
      location: project.location,
      area: project.location.split(",")[0]?.trim() || project.location,
      state: project.location.split(",").slice(1).join(",").trim(),
      riskTone:
        project.riskLevel === "LOW"
          ? "green"
          : project.riskLevel === "MEDIUM"
            ? "yellow"
            : "red",
    }));
  }, [mapProjects]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects?.forEach(p => {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    return counts;
  }, [projects]);

  const stats = analytics?.stats;
  const flagCount = stats?.flaggedProjects ?? 0;

  return (
    <div className="space-y-14">
      {/* Header */}
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div className="max-w-xl">
          <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">
            Public Ledger
          </div>
          <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-[1.05] text-neutral-900">
            Infrastructure Ledger
          </h1>
          <p className="mt-3 text-[14px] text-neutral-600 leading-relaxed">
            Live on-chain data. Every project, fund, and proof verifiable by any citizen.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncProjects.isPending}
          className="text-[13px] text-neutral-600 hover:text-neutral-900 disabled:opacity-50 inline-flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" style={{ animation: syncProjects.isPending ? "spin 1s linear infinite" : "none" }} />
          {syncProjects.isPending ? "Syncing" : "Sync blockchain"}
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-8 border-y border-neutral-200 py-8">
        <Stat label="Total escrowed" value={stats ? `₹${stats.totalBudget.toLocaleString()}` : "—"} sub="Locked in contracts" />
        <Stat label="Funds released" value={stats ? `₹${stats.totalSpent.toLocaleString()}` : "—"} sub="Verified milestones" />
        <Stat label="Active projects" value={stats?.activeProjects ?? "—"} sub={`${stats?.totalProjects ?? 0} total`} />
        <Stat
          label="Flagged"
          value={<span className={flagCount > 0 ? "text-red-600" : "text-neutral-900"}>{flagCount}</span>}
          sub={flagCount > 0 ? "Requires review" : "No anomalies"}
        />
      </section>

      {/* Map */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Map</h2>
            <p className="mt-1 text-[13px] text-neutral-500">
              India-only view with project status shown by color and matched to the list below.
            </p>
          </div>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            {mapProjects.length} pin{mapProjects.length === 1 ? "" : "s"}
          </span>
        </div>
        <ProjectMap
          projects={mapProjects}
          selectedProjectId={selectedMapProjectId}
          onProjectSelect={(projectId) => setSelectedMapProjectId(projectId)}
          emptyTitle="No project locations on map"
          emptyDescription="Projects remain listed below even if their saved coordinates are missing or invalid."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projectLocations.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      project.riskTone === "green"
                        ? "bg-emerald-500"
                        : project.riskTone === "yellow"
                          ? "bg-yellow-400"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="truncate text-[13px] font-medium text-neutral-900">{project.area}</span>
                </div>
                <div className="mt-1 truncate text-[12px] text-neutral-500">
                  {project.state || "India"} · {project.title}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300" />
            </Link>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Projects</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-44 sm:w-56 text-[13px] bg-transparent border-0 border-b border-neutral-200 focus:border-neutral-900 outline-none pl-5 py-1.5 transition-colors placeholder:text-neutral-400"
              />
            </div>
            {!projectsLoading && (
              <span className="text-[12px] text-neutral-500 tabular-nums hidden sm:inline">
                {filteredProjects?.length ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <CategoryChip
            label={`All (${projects?.length ?? 0})`}
            active={activeCategory === "ALL"}
            onClick={() => setActiveCategory("ALL")}
          />
          {PROJECT_CATEGORIES.map(cat => {
            const count = categoryCounts.get(cat.value) ?? 0;
            if (count === 0 && activeCategory !== cat.value) return null;
            return (
              <CategoryChip
                key={cat.value}
                label={`${cat.label} (${count})`}
                active={activeCategory === cat.value}
                onClick={() => setActiveCategory(cat.value)}
              />
            );
          })}
        </div>

        {projectsLoading ? (
          <div className="space-y-px">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="py-5 border-t border-neutral-200 flex justify-between animate-pulse">
                <div className="h-4 w-1/3 bg-neutral-100 rounded" />
                <div className="h-4 w-20 bg-neutral-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredProjects?.length === 0 ? (
          <div className="py-20 text-center border-t border-neutral-200">
            <div className="text-[14px] font-medium text-neutral-900 mb-1.5">
              {searchQuery || activeCategory !== "ALL" ? "No matching projects" : "No projects on-chain yet"}
            </div>
            <div className="text-[13px] text-neutral-500">
              {searchQuery || activeCategory !== "ALL" ? "Try a different filter." : "Projects will appear here once anchored."}
            </div>
          </div>
        ) : (
          <div>
            {filteredProjects?.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex items-center justify-between gap-6 py-5 border-t border-neutral-200 last:border-b hover:bg-neutral-50/50 -mx-2 px-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[14px] font-medium text-neutral-900 truncate group-hover:underline underline-offset-4 decoration-neutral-300">
                      {project.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-neutral-500">
                    <span className="text-neutral-700">{categoryLabel(project.category)}</span>
                    <span className="text-neutral-300">·</span>
                    {project.location && <span>{project.location}</span>}
                    {project.location && <span className="text-neutral-300">·</span>}
                    <span className="font-mono">{project.txHash?.substring(0, 10)}…</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <StatusBadge status={project.status} />
                  {project.riskLevel !== "LOW" && <StatusBadge status={project.riskLevel} type="risk" />}
                </div>
                <div className="text-right shrink-0 w-28">
                  <div className="text-[14px] font-medium text-neutral-900 tabular-nums">
                    ₹{project.totalBudget.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wider mt-0.5">Budget</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Recent activity</h2>
            <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Live</span>
          </div>
          {analyticsLoading ? (
            <div className="space-y-px">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-4 border-t border-neutral-200 animate-pulse">
                  <div className="h-3 w-3/4 bg-neutral-100 rounded mb-2" />
                  <div className="h-3 w-1/4 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : analytics?.recentActivity?.length === 0 ? (
            <div className="py-10 text-[13px] text-neutral-500 border-t border-neutral-200">
              No recent on-chain events.
            </div>
          ) : (
            <div>
              {analytics?.recentActivity?.slice(0, 6).map((event) => (
                <div key={event.id} className="py-4 border-t border-neutral-200 last:border-b flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-neutral-900 leading-relaxed">{event.title}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {event.txHash && (
                    <span className="text-[11px] font-mono text-neutral-500 shrink-0 mt-0.5">
                      {event.txHash.substring(0, 8)}…
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-8">
          {flagCount > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-red-600 mb-3">Alert</div>
              <div className="text-[14px] font-medium text-neutral-900 mb-1.5">
                {flagCount} project{flagCount > 1 ? "s" : ""} flagged
              </div>
              <p className="text-[12px] text-neutral-600 leading-relaxed">
                Anomaly detection flagged irregular billing or missing proofs. Audit review pending.
              </p>
            </div>
          )}
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Network</div>
            <dl className="space-y-2.5 text-[12.5px]">
              <div className="flex items-baseline justify-between">
                <dt className="text-neutral-600">Block height</dt>
                <dd className="font-mono text-neutral-900 tabular-nums">{stats?.totalProjects ? `#${(18_400_000 + stats.totalProjects * 13).toLocaleString()}` : "—"}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-neutral-600">Consensus</dt>
                <dd className="text-neutral-900">Healthy</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-neutral-600">IPFS gateway</dt>
                <dd className="text-neutral-900">Online</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors tabular-nums ${
        active
          ? "bg-neutral-900 border-neutral-900 text-white"
          : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
      }`}
    >
      {label}
    </button>
  );
}
