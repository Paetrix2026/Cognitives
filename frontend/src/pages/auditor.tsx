import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useListAnomalies,
  useListPendingMilestones,
  useApproveMilestone,
  useRejectMilestone,
  useListProjects,
  useApproveProject,
  useRejectProject,
  useGetAllReports,
  useResolveProjectReport,
  getListAnomaliesQueryKey,
  getListPendingMilestonesQueryKey,
  getListProjectsQueryKey,
  getGetAnalyticsOverviewQueryKey,
  getGetAllReportsQueryKey,
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { ArrowUpRight, MapPin, FileSearch, Check, X, ClipboardList, AlertTriangle, Flag, LayoutList } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ActionConfirmation } from "@/components/action-confirmation";

type Tab = "milestones" | "projects" | "registry" | "reports";

export default function Auditor() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("milestones");

  if (!user || (user.role !== "AUDITOR" && user.role !== "ADMIN")) {
    return <div className="py-20 text-center text-[13px] text-red-600">Unauthorized. Auditor role required.</div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "milestones", label: "Milestone proofs",   icon: <FileSearch className="h-3.5 w-3.5" /> },
    { id: "projects",  label: "Project approvals",   icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "registry",  label: "Project registry",    icon: <LayoutList className="h-3.5 w-3.5" /> },
    { id: "reports",   label: "Citizen reports",     icon: <Flag className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-14">
      <header>
        <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Auditor</div>
        <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-[1.05] text-neutral-900">
          Verification & oversight
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600 leading-relaxed max-w-xl">
          Approve new projects, verify milestone proofs, and resolve citizen concerns.
        </p>
      </header>

      <div className="flex items-center gap-7 border-b border-neutral-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 -mb-px text-[13px] tracking-tight transition-colors inline-flex items-center gap-1.5 ${
              tab === t.id ? "text-neutral-900 font-medium border-b border-neutral-900" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "milestones" && (
        <section className="grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-3">
            <PendingQueue auditorAddress={user.walletAddress} />
          </div>
          <aside className="lg:col-span-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 mb-6">Engine flags</h2>
            <AnomalyList />
          </aside>
        </section>
      )}

      {tab === "projects"  && <ProjectApprovals auditorAddress={user.walletAddress} />}
      {tab === "registry"  && <ProjectRegistry />}
      {tab === "reports"   && <CitizenReports auditorAddress={user.walletAddress} />}
    </div>
  );
}

// ── Milestone proofs queue ─────────────────────────────────────────────────────
function PendingQueue({ auditorAddress }: { auditorAddress: string }) {
  const { data: pending, isLoading } = useListPendingMilestones({
    query: { queryKey: getListPendingMilestonesQueryKey(), refetchInterval: 15000 },
  });
  const approveMilestone = useApproveMilestone();
  const rejectMilestone = useRejectMilestone();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListPendingMilestonesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAnomaliesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAnalyticsOverviewQueryKey() });
  };

  const handleApprove = (milestoneId: string) => {
    approveMilestone.mutate(
      { id: milestoneId, data: { auditorAddress } },
      {
        onSuccess: (m) => {
          const thresholdMet = m.approvalCount >= 2;
          toast({
            title: thresholdMet ? "Threshold met" : "Signature recorded",
            description: thresholdMet
              ? "2/2 approvals collected — official can now release payment."
              : `Approval ${m.approvalCount}/2 recorded. Awaiting one more auditor.`,
          });
          invalidateAll();
        },
        onError: (err) => toast({ title: "Reverted", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleReject = (milestoneId: string) => {
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "State why this proof is being rejected.", variant: "destructive" });
      return;
    }
    rejectMilestone.mutate(
      { id: milestoneId, data: { auditorAddress, reason: rejectReason.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Rejected", description: "Contractor must resubmit fresh proof. Prior signatures cleared." });
          setRejectingId(null);
          setRejectReason("");
          invalidateAll();
        },
        onError: (err) => toast({ title: "Reverted", description: String(err), variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-neutral-100 rounded" />)}</div>;

  if (!pending || pending.length === 0) {
    return (
      <div className="py-16 text-center border-t border-neutral-200">
        <FileSearch className="h-5 w-5 text-neutral-300 mx-auto mb-3" />
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">Queue is clear</div>
        <div className="text-[13px] text-neutral-500">No milestone proofs awaiting auditor signature.</div>
      </div>
    );
  }

  return (
    <div>
      {pending.map((m) => {
        const isThisRejecting = rejectingId === m.id;
        const thresholdMet = m.approvalCount >= 1; // show progress
        return (
          <div key={m.id} className="py-6 border-t border-neutral-200 last:border-b">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">{m.projectTitle}</div>
                <h3 className="text-[14px] font-medium text-neutral-900">{m.title}</h3>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-medium text-neutral-900 tabular-nums">₹{m.paymentAmount.toLocaleString()}</div>
                <div className={`text-[11px] uppercase tracking-wider mt-0.5 ${thresholdMet ? "text-amber-600" : "text-neutral-500"}`}>
                  {m.approvalCount}/2 signed
                </div>
              </div>
            </div>
            <p className="text-[13px] text-neutral-600 leading-relaxed mb-3">{m.description}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-neutral-500 mb-4">
              {typeof m.proofLatitude === "number" && typeof m.proofLongitude === "number" && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.proofLatitude.toFixed(4)}, {m.proofLongitude.toFixed(4)}</span>
              )}
              {m.ipfsProofCID && (
                <a href={`/api/milestones/${m.id}/proof-image`} target="_blank" rel="noreferrer"
                  className="font-mono inline-flex items-center gap-1 hover:text-neutral-900">
                  IPFS {m.ipfsProofCID.substring(0, 12)}… <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
              {m.submittedAt && <span>Submitted {new Date(m.submittedAt).toLocaleDateString()}</span>}
            </div>
            {isThisRejecting ? (
              <div className="space-y-2">
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={400}
                  placeholder="State the verification failure…"
                  className="w-full text-[13px] bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-900 resize-none" />
                <div className="flex items-center gap-2">
                  <ActionConfirmation
                    tone="reject"
                    title="Reject this milestone proof?"
                    description="The contractor will need to submit fresh proof, and any existing auditor signatures for this milestone will be cleared."
                    confirmLabel="Reject proof"
                    pending={rejectMilestone.isPending}
                    disabled={!rejectReason.trim()}
                    onConfirm={() => handleReject(m.id)}
                    details={<span><span className="font-medium">Reason:</span> {rejectReason.trim()}</span>}
                  >
                    <button disabled={rejectMilestone.isPending || !rejectReason.trim()}
                      className="text-[12px] h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5" /> Confirm rejection
                    </button>
                  </ActionConfirmation>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                    className="text-[12px] h-8 px-3 rounded-md text-neutral-600 hover:text-neutral-900">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ActionConfirmation
                  tone="approve"
                  title="Approve this milestone proof?"
                  description="Your signature will count toward the release threshold for this milestone payment."
                  confirmLabel="Approve proof"
                  pending={approveMilestone.isPending}
                  onConfirm={() => handleApprove(m.id)}
                  details={<span><span className="font-medium">{m.title}</span> · ₹{m.paymentAmount.toLocaleString()}</span>}
                >
                  <button disabled={approveMilestone.isPending}
                    className="text-[12px] h-8 px-3 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> {approveMilestone.isPending ? "Signing…" : "Approve"}
                  </button>
                </ActionConfirmation>
                <button onClick={() => setRejectingId(m.id)}
                  className="text-[12px] h-8 px-3 rounded-md border border-neutral-300 text-neutral-700 hover:border-neutral-900 inline-flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                <Link href={`/projects/${m.projectId}`}
                  className="ml-auto text-[12px] text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1">
                  View ledger <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Project approvals ──────────────────────────────────────────────────────────
function ProjectApprovals({ auditorAddress }: { auditorAddress: string }) {
  const { data: allProjects, isLoading } = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const approveProject = useApproveProject();
  const rejectProject = useRejectProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pending = Array.from(
    new Map(
      (allProjects?.filter(p => p.status === "PENDING_APPROVAL") ?? []).map(p => [p.id, p])
    ).values()
  );

  const handleApprove = (projectId: string, title: string) => {
    approveProject.mutate(
      { id: projectId, data: { auditorAddress } },
      {
        onSuccess: () => {
          toast({ title: "Project approved", description: `${title} is now ACTIVE — official can assign a contractor.` });
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
        onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleReject = (projectId: string) => {
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    rejectProject.mutate(
      { id: projectId, data: { auditorAddress, reason: rejectReason.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Project rejected", description: "Official must revise and resubmit." });
          setRejectingId(null);
          setRejectReason("");
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
        onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <div className="py-8 text-[13px] text-neutral-500">Loading…</div>;

  if (pending.length === 0) {
    return (
      <div className="py-16 text-center border-t border-neutral-200">
        <ClipboardList className="h-5 w-5 text-neutral-300 mx-auto mb-3" />
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">No projects pending approval</div>
        <div className="text-[13px] text-neutral-500">New projects created by officials will appear here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-6">
        {pending.length} project{pending.length !== 1 ? "s" : ""} awaiting approval
      </div>
      {pending.map(p => {
        const isThisRejecting = rejectingId === p.id;
        return (
          <div key={p.id} className="py-6 border-t border-neutral-200 last:border-b">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">{p.category.replace("_", " ")} · {p.location}</div>
                <h3 className="text-[15px] font-medium text-neutral-900">{p.title}</h3>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-semibold tabular-nums text-neutral-900">₹{p.totalBudget.toLocaleString()}</div>
                <div className="text-[10.5px] text-neutral-500 mt-0.5 font-mono truncate max-w-[120px]">off: {p.officialAddress.slice(0, 10)}…</div>
              </div>
            </div>
            <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">{p.description.slice(0, 160)}{p.description.length > 160 ? "…" : ""}</p>
            <div className="flex items-center gap-2 text-[11.5px] text-neutral-500 mb-4">
              <span>Deadline: {new Date(p.endDate).toLocaleDateString()}</span>
              <span>·</span>
              <span>Contractor: {p.contractorAddress === "0x0000000000000000000000000000000000000000" ? "Pending assignment" : p.contractorAddress.slice(0, 10) + "…"}</span>
            </div>
            {isThisRejecting ? (
              <div className="space-y-2">
                <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" className="h-9 text-[13px]" />
                <div className="flex items-center gap-2">
                  <ActionConfirmation
                    tone="reject"
                    title="Reject this project submission?"
                    description="The project will leave the approval queue. The official must revise it and submit it again before work can begin."
                    confirmLabel="Reject project"
                    pending={rejectProject.isPending}
                    disabled={!rejectReason.trim()}
                    onConfirm={() => handleReject(p.id)}
                    details={<span><span className="font-medium">Reason:</span> {rejectReason.trim()}</span>}
                  >
                    <button disabled={rejectProject.isPending || !rejectReason.trim()}
                      className="text-[12px] h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5" /> Confirm rejection
                    </button>
                  </ActionConfirmation>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                    className="text-[12px] h-8 px-3 rounded-md text-neutral-600">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ActionConfirmation
                  tone="approve"
                  title="Approve this project?"
                  description="The project will become active, allowing the official to assign a contractor and continue execution."
                  confirmLabel="Approve project"
                  pending={approveProject.isPending}
                  onConfirm={() => handleApprove(p.id, p.title)}
                  details={<span><span className="font-medium">{p.title}</span> · ₹{p.totalBudget.toLocaleString()}</span>}
                >
                  <button disabled={approveProject.isPending}
                    className="text-[12px] h-8 px-3 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Approve project
                  </button>
                </ActionConfirmation>
                <button onClick={() => setRejectingId(p.id)}
                  className="text-[12px] h-8 px-3 rounded-md border border-neutral-300 text-neutral-700 hover:border-neutral-900 inline-flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Project registry (filterable table) ───────────────────────────────────────
type StatusFilter = "ALL" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

const FILTER_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: "ALL",              label: "All",           color: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" },
  { value: "PENDING_APPROVAL", label: "Pending Review",color: "bg-yellow-50  text-yellow-800 hover:bg-yellow-100" },
  { value: "ACTIVE",           label: "Ongoing",       color: "bg-blue-50    text-blue-800   hover:bg-blue-100" },
  { value: "PAUSED",           label: "Paused",        color: "bg-orange-50  text-orange-800 hover:bg-orange-100" },
  { value: "COMPLETED",        label: "Completed",     color: "bg-green-50   text-green-800  hover:bg-green-100" },
  { value: "CANCELLED",        label: "Rejected",      color: "bg-red-50     text-red-800    hover:bg-red-100" },
];

function ProjectRegistry() {
  const { data: allProjects, isLoading } = useListProjects({ query: { queryKey: getListProjectsQueryKey(), refetchInterval: 15000 } });
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const filtered = (allProjects ?? []).filter(p => {
    const matchesStatus = filter === "ALL" || p.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts: Record<StatusFilter, number> = {
    ALL:              allProjects?.length ?? 0,
    PENDING_APPROVAL: allProjects?.filter(p => p.status === "PENDING_APPROVAL").length ?? 0,
    ACTIVE:           allProjects?.filter(p => p.status === "ACTIVE").length ?? 0,
    PAUSED:           allProjects?.filter(p => p.status === "PAUSED").length ?? 0,
    COMPLETED:        allProjects?.filter(p => p.status === "COMPLETED").length ?? 0,
    CANCELLED:        allProjects?.filter(p => p.status === "CANCELLED").length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              filter === f.value
                ? "ring-2 ring-offset-1 ring-neutral-900 " + f.color
                : f.color
            }`}
          >
            {f.label}
            <span className="bg-white/60 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by title, location or category…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-9 text-[13px] max-w-sm"
      />

      {/* Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-neutral-100 rounded" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-t border-neutral-200">
          <LayoutList className="h-5 w-5 text-neutral-300 mx-auto mb-3" />
          <div className="text-[14px] font-medium text-neutral-900 mb-1">No projects found</div>
          <div className="text-[13px] text-neutral-500">Try a different filter or search term.</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium">Project</th>
                <th className="text-left px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium hidden lg:table-cell">Location</th>
                <th className="text-right px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium hidden sm:table-cell">Budget</th>
                <th className="text-left px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium hidden sm:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 font-medium">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3.5 text-neutral-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-neutral-900 leading-snug">{p.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                      {p.officialAddress.slice(0, 10)}…
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-neutral-600">
                    {p.category.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-neutral-600 max-w-[160px] truncate">
                    {p.location}
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell text-right font-mono font-medium text-neutral-900 tabular-nums">
                    ₹{p.totalBudget.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell text-neutral-600">
                    {new Date(p.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-neutral-400 hover:text-neutral-900 inline-flex items-center transition-colors"
                      title="View project"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-neutral-100 bg-neutral-50 text-[11.5px] text-neutral-500">
            Showing {filtered.length} of {allProjects?.length ?? 0} projects
          </div>
        </div>
      )}
    </div>
  );
}

// ── Citizen reports ────────────────────────────────────────────────────────────
function CitizenReports({ auditorAddress }: { auditorAddress: string }) {
  const { data: reports, isLoading } = useGetAllReports("PENDING_REVIEW", {
    query: { queryKey: getGetAllReportsQueryKey("PENDING_REVIEW"), refetchInterval: 20000 },
  });
  const resolveReport = useResolveProjectReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleResolve = (projectId: string, reportId: string, action: "DISMISS" | "ACKNOWLEDGE", projectTitle: string) => {
    resolveReport.mutate(
      { id: projectId, reportId, data: { action, auditorAddress } },
      {
        onSuccess: (res) => {
          const dismissed = action === "DISMISS";
          toast({
            title: dismissed ? "Report dismissed" : "Report acknowledged",
            description: dismissed
              ? res.project.status === "ACTIVE" ? `${projectTitle} resumed — no pending concerns remain.` : "Report marked dismissed."
              : "Concern confirmed. Project remains paused pending resolution.",
          });
          queryClient.invalidateQueries({ queryKey: getGetAllReportsQueryKey("PENDING_REVIEW") });
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
        onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <div className="py-8 text-[13px] text-neutral-500">Loading…</div>;

  if (!reports || reports.length === 0) {
    return (
      <div className="py-16 text-center border-t border-neutral-200">
        <Flag className="h-5 w-5 text-neutral-300 mx-auto mb-3" />
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">No open reports</div>
        <div className="text-[13px] text-neutral-500">Citizen concerns filed against projects will appear here.</div>
      </div>
    );
  }

  const CATEGORY_LABELS: Record<string, string> = {
    QUALITY: "Quality issue", MISSING_WORK: "Missing work", SAFETY: "Safety hazard", BUDGET: "Budget concern", OTHER: "Other",
  };

  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-6">
        {reports.length} open concern{reports.length !== 1 ? "s" : ""}
      </div>
      {reports.map(r => (
        <div key={r.id} className="py-6 border-t border-neutral-200 last:border-b">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">
                {CATEGORY_LABELS[r.category] ?? r.category} · {r.projectTitle}
              </div>
              <p className="text-[13.5px] text-neutral-900 leading-relaxed">{r.reason}</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-500 mb-4">
            <span className="font-mono">{r.reporterAddress.slice(0, 14)}…</span>
            <span>·</span>
            <span>{new Date(r.createdAt).toLocaleString()}</span>
            <Link href={`/projects/${r.projectId}`}
              className="ml-auto text-[12px] text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1">
              View project <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleResolve(r.projectId, r.id, "DISMISS", r.projectTitle ?? "")}
              disabled={resolveReport.isPending}
              className="text-[12px] h-8 px-3 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Dismiss (unfounded)
            </button>
            <button onClick={() => handleResolve(r.projectId, r.id, "ACKNOWLEDGE", r.projectTitle ?? "")}
              disabled={resolveReport.isPending}
              className="text-[12px] h-8 px-3 rounded-md border border-amber-400 text-amber-700 hover:bg-amber-50 disabled:opacity-50 inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Acknowledge (keep paused)
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Anomaly flags ──────────────────────────────────────────────────────────────
function AnomalyList() {
  const { data: anomalies, isLoading } = useListAnomalies({
    query: { queryKey: getListAnomaliesQueryKey(), refetchInterval: 20000 },
  });

  if (isLoading) return <div className="animate-pulse space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded" />)}</div>;

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="py-12 text-center border-t border-neutral-200">
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">No anomalies detected</div>
        <div className="text-[13px] text-neutral-500">Current block clean.</div>
      </div>
    );
  }

  return (
    <div>
      {anomalies.map((anomaly) => (
        <div key={anomaly.id} className="py-5 border-t border-neutral-200 last:border-b">
          <div className="flex items-start justify-between gap-4 mb-1.5">
            <h3 className="text-[13.5px] font-medium text-neutral-900 leading-snug">{anomaly.projectTitle}</h3>
            <StatusBadge status={anomaly.severity} type="risk" />
          </div>
          <p className="text-[12.5px] text-neutral-600 leading-relaxed mb-3">{anomaly.reason}</p>
          <Link href={`/projects/${anomaly.projectId}`}
            className="text-[12px] font-medium text-neutral-900 inline-flex items-center gap-1.5 hover:gap-2 transition-all">
            Audit contract <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}
