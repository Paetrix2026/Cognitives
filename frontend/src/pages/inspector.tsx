import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  getGetProjectQueryKey,
  getListProjectsQueryKey,
  useGetProject,
  useListProjects,
  useReportProjectConcern,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, ClipboardCheck, FileWarning, MapPin, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { REPORT_CATEGORIES, categoryLabel, type ReportCategory } from "@/lib/categories";

type ProjectProgress = {
  totalBudget: number;
  spentAmount: number;
};

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-neutral-500 mb-2">{label}</div>
      <div className="text-[24px] font-semibold tracking-tight text-neutral-900 leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-[12px] text-neutral-500">{sub}</div>}
    </div>
  );
}

function progressFor(project: ProjectProgress) {
  if (project.totalBudget <= 0) return 0;
  return Math.min(100, Math.round((project.spentAmount / project.totalBudget) * 100));
}

export default function Inspector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListProjects({ query: { queryKey: getListProjectsQueryKey(), refetchInterval: 15000 } });
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [reportCategory, setReportCategory] = useState<ReportCategory>("QUALITY");
  const [reportText, setReportText] = useState("");
  const reportConcern = useReportProjectConcern();

  const filteredProjects = useMemo(() => {
    return (projects ?? []).filter((project) => {
      const haystack = `${project.title} ${project.location} ${project.contractorAddress} ${project.category}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [projects, search]);

  const selectedProject = useMemo(() => {
    return filteredProjects[0] && !selectedProjectId
      ? filteredProjects[0]
      : projects?.find((project) => project.id === selectedProjectId);
  }, [filteredProjects, projects, selectedProjectId]);

  const { data: detail } = useGetProject(selectedProject?.id ?? "", {
    query: {
      enabled: !!selectedProject?.id,
      queryKey: selectedProject?.id ? getGetProjectQueryKey(selectedProject.id) : ["project", "inspector-empty"],
    },
  });

  if (!user || (user.role !== "INSPECTOR" && user.role !== "ADMIN")) {
    return (
      <div className="py-20 text-center">
        <ClipboardCheck className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
        <div className="text-[15px] font-medium text-neutral-900 mb-2">Inspector access required</div>
        <div className="text-[13px] text-neutral-500">Ground-level supervision is available to Inspector role wallets.</div>
      </div>
    );
  }

  const projectList = projects ?? [];
  const flaggedCount = projectList.filter((project) => project.riskLevel !== "LOW" || project.reportCount > 0).length;
  const averageProgress = projectList.length
    ? Math.round(projectList.reduce((sum, project) => sum + progressFor(project), 0) / projectList.length)
    : 0;
  const milestones = detail?.milestones ?? [];
  const paidMilestones = milestones.filter((milestone) => milestone.status === "PAID").length;
  const pendingProofs = milestones.filter((milestone) => milestone.status === "PROOF_SUBMITTED").length;

  const handleReport = () => {
    if (!selectedProject || !reportText.trim()) {
      toast({ title: "Observation required", description: "Select a project and write the field observation.", variant: "destructive" });
      return;
    }

    reportConcern.mutate(
      {
        id: selectedProject.id,
        data: {
          reporterAddress: user.walletAddress,
          category: reportCategory,
          reason: `[Inspector field report] ${reportText.trim()}`,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Report sent", description: "Officials and auditors can review it in the project report queue." });
          setReportText("");
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(selectedProject.id) });
        },
        onError: (err) => toast({ title: "Report failed", description: String(err), variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Ground Supervision</div>
          <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-[1.05] text-neutral-900">
            Field Inspector
          </h1>
          <p className="mt-3 text-[14px] text-neutral-600 leading-relaxed">
            Read project records, verify contractor and budget progress, then escalate field observations directly into the official audit queue.
          </p>
        </div>
        <div className="text-[12px] font-mono text-neutral-500">
          {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-8 border-y border-neutral-200 py-8">
        <Stat label="Assigned view" value={projectList.length} sub="Readable projects" />
        <Stat label="Avg progress" value={`${averageProgress}%`} sub="Budget released" />
        <Stat label="Flagged" value={<span className={flaggedCount > 0 ? "text-red-600" : "text-neutral-900"}>{flaggedCount}</span>} sub="Reports or risk" />
        <Stat label="Total budget" value={`₹${projectList.reduce((sum, project) => sum + project.totalBudget, 0).toLocaleString()}`} sub="Across projects" />
      </section>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
        <div>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Project register</h2>
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="w-48 text-[13px] bg-transparent border-0 border-b border-neutral-200 focus:border-neutral-900 outline-none pl-5 py-1.5 transition-colors placeholder:text-neutral-400"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-[13px] text-neutral-500">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center border-t border-neutral-200 text-[13px] text-neutral-500">No projects match this filter.</div>
          ) : (
            <div>
              {filteredProjects.map((project) => {
                const active = selectedProject?.id === project.id;
                const progress = progressFor(project);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left group py-5 border-t border-neutral-200 last:border-b transition-colors -mx-2 px-2 ${
                      active ? "bg-neutral-50" : "hover:bg-neutral-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[14px] font-medium text-neutral-900 truncate">{project.title}</span>
                          {project.reportCount > 0 && <FileWarning className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-500">
                          <span>{categoryLabel(project.category)}</span>
                          <span className="text-neutral-300">·</span>
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>
                          <span className="text-neutral-300">·</span>
                          <span className="font-mono">{project.contractorAddress.slice(0, 10)}...</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                          <div className="h-full bg-neutral-900" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusBadge status={project.status} />
                        <div className="mt-2 text-[12px] font-medium text-neutral-900">₹{project.totalBudget.toLocaleString()}</div>
                        <div className="text-[11px] text-neutral-500">{progress}% released</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-8">
          {selectedProject ? (
            <>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Selected project</div>
                <h2 className="text-[20px] font-semibold tracking-tight text-neutral-900 leading-tight">{selectedProject.title}</h2>
                <p className="mt-2 text-[13px] text-neutral-600 leading-relaxed">{selectedProject.description}</p>
                <Link href={`/projects/${selectedProject.id}`} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-900 hover:underline underline-offset-4">
                  Open full ledger <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <dl className="space-y-3 text-[12.5px]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-neutral-500">Contractor</dt>
                  <dd className="font-mono text-neutral-900 truncate max-w-[190px]">{selectedProject.contractorAddress}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-neutral-500">Budget</dt>
                  <dd className="text-neutral-900">₹{selectedProject.totalBudget.toLocaleString()}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-neutral-500">Released</dt>
                  <dd className="text-neutral-900">₹{selectedProject.spentAmount.toLocaleString()}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-neutral-500">Milestones</dt>
                  <dd className="text-neutral-900">{paidMilestones}/{milestones.length} paid</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-neutral-500">Pending proofs</dt>
                  <dd className={pendingProofs > 0 ? "text-red-600" : "text-neutral-900"}>{pendingProofs}</dd>
                </div>
              </dl>

              {selectedProject.riskLevel !== "LOW" && (
                <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-3 text-[12px] text-red-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This project is marked {selectedProject.riskLevel.toLowerCase()} risk. Add field context if the site condition confirms it.
                </div>
              )}

              <div className="space-y-4 border-t border-neutral-200 pt-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-2">Field report</div>
                  <p className="text-[12px] text-neutral-500 leading-relaxed">
                    Reports are sent to the same review queue used by officials and auditors.
                  </p>
                </div>
                <select
                  value={reportCategory}
                  onChange={(event) => setReportCategory(event.target.value as ReportCategory)}
                  className="w-full h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 focus:border-neutral-900 outline-none px-0"
                >
                  {REPORT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
                <textarea
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                  rows={5}
                  maxLength={600}
                  placeholder="Site condition, contractor presence, material quality, visible progress, safety issues..."
                  className="w-full text-[13px] bg-white border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 resize-none"
                />
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={reportConcern.isPending}
                  className="h-10 px-4 bg-neutral-900 text-white text-[13px] font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
                >
                  {reportConcern.isPending ? "Sending..." : "Send report"}
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center border border-neutral-200 text-[13px] text-neutral-500">Select a project to inspect.</div>
          )}
        </aside>
      </section>
    </div>
  );
}
