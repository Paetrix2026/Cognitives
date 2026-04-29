import React, { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetProject,
  getGetProjectQueryKey,
  useListMilestones,
  getListMilestonesQueryKey,
  useApproveMilestone,
  useRejectMilestone,
  useReportProjectConcern,
  useListProjectReports,
  getListProjectReportsQueryKey,
  getListAnomaliesQueryKey,
  getListProjectsQueryKey,
  getGetAnalyticsOverviewQueryKey,
  getListPendingMilestonesQueryKey,
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { MapPin, Calendar, ShieldCheck, ArrowUpRight, Lock, AlertTriangle, Check, X, Flag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { categoryLabel, REPORT_CATEGORIES, type ReportCategory } from "@/lib/categories";

export default function ProjectDetail({ id }: { id?: string }) {
  const params = useParams();
  const projectId = id || params.id;

  const { data: projectData, isLoading: projectLoading } = useGetProject(projectId!, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId!) },
  });
  const { data: milestones, isLoading: milestonesLoading } = useListMilestones(projectId!, {
    query: { enabled: !!projectId, queryKey: getListMilestonesQueryKey(projectId!) },
  });
  const { data: reports } = useListProjectReports(projectId!, {
    query: { enabled: !!projectId, queryKey: getListProjectReportsQueryKey(projectId!) },
  });

  const { user } = useAuth();
  const approveMilestone = useApproveMilestone();
  const rejectMilestone = useRejectMilestone();
  const reportConcern = useReportProjectConcern();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState<{ category: ReportCategory; reason: string }>({
    category: "QUALITY",
    reason: "",
  });

  if (projectLoading || milestonesLoading) {
    return <div className="py-24 text-center text-[13px] text-neutral-500">Reading ledger…</div>;
  }
  if (!projectData) {
    return <div className="py-24 text-center text-[13px] text-red-600">Contract not found on ledger.</div>;
  }

  const project = projectData.project;
  const projectAnomalies = projectData.anomalies || [];
  const progressPercentage = project.totalBudget > 0 ? (project.spentAmount / project.totalBudget) * 100 : 0;
  const isAuditor = user?.role === "AUDITOR" || user?.role === "ADMIN";
  const isCitizen = !!user; // any signed-in role can file a concern

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(projectId!) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId!) });
    queryClient.invalidateQueries({ queryKey: getListProjectReportsQueryKey(projectId!) });
    queryClient.invalidateQueries({ queryKey: getListAnomaliesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAnalyticsOverviewQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPendingMilestonesQueryKey() });
  };

  const handleApprove = (milestoneId: string) => {
    if (!user) return;
    approveMilestone.mutate(
      { id: milestoneId, data: { auditorAddress: user.walletAddress } },
      {
        onSuccess: (m) => {
          toast({
            title: m.status === "PAID" ? "Funds released" : "Signature recorded",
            description: m.status === "PAID"
              ? "Multi-sig threshold met. Payment settled."
              : `${m.approvalCount}/2 signatures collected.`,
          });
          invalidateProject();
        },
        onError: (err) => toast({ title: "Reverted", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleReject = (milestoneId: string) => {
    if (!user || !rejectReason.trim()) {
      toast({ title: "Reason required", description: "State why this proof is being rejected.", variant: "destructive" });
      return;
    }
    rejectMilestone.mutate(
      { id: milestoneId, data: { auditorAddress: user.walletAddress, reason: rejectReason.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Rejected", description: "Contractor must resubmit fresh proof." });
          setRejectingId(null);
          setRejectReason("");
          invalidateProject();
        },
        onError: (err) => toast({ title: "Reverted", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleReport = () => {
    if (!user || !reportForm.reason.trim()) {
      toast({ title: "Reason required", description: "Describe the concern in a sentence or two.", variant: "destructive" });
      return;
    }
    reportConcern.mutate(
      {
        id: project.id,
        data: {
          reporterAddress: user.walletAddress,
          reason: reportForm.reason.trim(),
          category: reportForm.category,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Concern filed", description: "Project paused pending audit review. Anomaly raised on chain." });
          setShowReport(false);
          setReportForm({ category: "QUALITY", reason: "" });
          invalidateProject();
        },
        onError: (err) => toast({ title: "Submission failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/citizen"
          className="text-[12px] text-neutral-500 hover:text-neutral-900 inline-flex items-center transition-colors"
        >
          ← Back to directory
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-3 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">{categoryLabel(project.category)}</div>
            <h1 className="text-[30px] md:text-[34px] font-semibold tracking-tight leading-[1.1] text-neutral-900">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={project.status} />
              {project.riskLevel !== "LOW" && <StatusBadge status={project.riskLevel} type="risk" />}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-neutral-500">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Due {new Date(project.endDate).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" /> {project.txHash.substring(0, 14)}…
              </span>
            </div>
          </div>
          {isCitizen && (
            <button
              onClick={() => setShowReport((v) => !v)}
              className="text-[12px] h-9 px-3.5 rounded-md border border-neutral-300 text-neutral-700 hover:border-red-400 hover:text-red-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Flag className="h-3.5 w-3.5" /> Report concern
            </button>
          )}
        </div>
      </div>

      {/* Anomaly banner */}
      {projectAnomalies.length > 0 && (
        <div className="border border-red-200 bg-red-50/50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h3 className="text-[13px] font-semibold text-red-800">Active auditor flags</h3>
          </div>
          <ul className="text-[12.5px] text-red-700 leading-relaxed space-y-0.5 pl-6 list-disc">
            {projectAnomalies.map((a) => <li key={a.id}>{a.reason}</li>)}
          </ul>
        </div>
      )}

      {/* Report concern form */}
      {showReport && (
        <div className="border border-neutral-300 rounded-md p-5 space-y-4 bg-white">
          <div>
            <h3 className="text-[14px] font-semibold text-neutral-900 mb-1">File a citizen concern</h3>
            <p className="text-[12px] text-neutral-500 leading-relaxed">
              This raises an on-chain anomaly and pauses payment release on this contract until auditors review the report.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 font-medium">Type of concern</label>
            <select
              value={reportForm.category}
              onChange={(e) => setReportForm({ ...reportForm, category: e.target.value as ReportCategory })}
              className="w-full h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 focus:border-neutral-900 outline-none px-0"
            >
              {REPORT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 font-medium">Description</label>
            <textarea
              value={reportForm.reason}
              onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
              rows={4}
              maxLength={600}
              placeholder="What did you observe? Include location, date, and any specifics auditors should verify…"
              className="w-full text-[13px] bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-900 resize-none"
            />
            <div className="text-right text-[11px] text-neutral-400 tabular-nums">{reportForm.reason.length}/600</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReport}
              disabled={reportConcern.isPending}
              className="text-[12px] h-9 px-4 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {reportConcern.isPending ? "Filing…" : "File on chain"}
            </button>
            <button
              onClick={() => setShowReport(false)}
              className="text-[12px] h-9 px-3 rounded-md text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contract scope */}
      <div className="grid md:grid-cols-3 gap-x-10 gap-y-8 border-y border-neutral-200 py-8">
        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-2">Contract scope</div>
            <p className="text-[13.5px] text-neutral-700 leading-relaxed">{project.description}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-neutral-500 uppercase tracking-[0.08em]">Release progress</span>
              <span className="text-neutral-900 tabular-nums">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 transition-all" style={{ width: `${Math.min(100, progressPercentage)}%` }} />
            </div>
            <div className="flex items-baseline justify-between text-[11.5px] font-mono text-neutral-500">
              <span>₹{project.spentAmount.toLocaleString()} settled</span>
              <span>₹{project.totalBudget.toLocaleString()} locked</span>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 mb-1.5">Official escrow</div>
            <div className="text-[11.5px] font-mono text-neutral-700 truncate">{project.officialAddress}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 mb-1.5">Contractor</div>
            <div className="text-[11.5px] font-mono text-neutral-700 truncate">{project.contractorAddress}</div>
          </div>
          <div className="text-[11.5px] text-neutral-500 inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" /> Multi-sig secured
          </div>
        </aside>
      </div>

      {/* Milestones */}
      <section>
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 mb-5">Milestones</h2>

        {!milestones || milestones.length === 0 ? (
          <div className="py-14 text-center border-t border-neutral-200 text-[13px] text-neutral-500">
            No milestones defined in this contract.
          </div>
        ) : (
          <div>
            {milestones.map((m, index) => {
              const isThisRejecting = rejectingId === m.id;
              return (
                <div key={m.id} className="py-6 border-t border-neutral-200 last:border-b">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Phase {String(index + 1).padStart(2, "0")}</div>
                      <h3 className="text-[14px] font-medium text-neutral-900">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={m.status} type="milestone" />
                      <div className="text-right">
                        <div className="text-[14px] font-medium text-neutral-900 tabular-nums">₹{m.paymentAmount.toLocaleString()}</div>
                        <div className="text-[11px] text-neutral-500 uppercase tracking-wider mt-0.5">
                          {m.approvalCount}/2 signed
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-neutral-600 leading-relaxed mb-3">{m.description}</p>

                  {(m as any).rejectionReason && (
                    <div className="text-[12px] text-red-700 bg-red-50/50 border border-red-100 rounded px-3 py-2 mb-3">
                      <span className="font-semibold">Rejected:</span> {(m as any).rejectionReason}
                    </div>
                  )}

                  {m.ipfsProofCID && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-neutral-500 mb-4">
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${m.ipfsProofCID}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono inline-flex items-center gap-1 hover:text-neutral-900 transition-colors"
                      >
                        IPFS {m.ipfsProofCID.substring(0, 12)}… <ArrowUpRight className="h-3 w-3" />
                      </a>
                      {typeof m.proofLatitude === "number" && typeof m.proofLongitude === "number" && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.proofLatitude.toFixed(4)}, {m.proofLongitude.toFixed(4)}
                        </span>
                      )}
                      {m.txHash && <span className="font-mono">tx {m.txHash.substring(0, 10)}…</span>}
                    </div>
                  )}

                  {m.status === "PROOF_SUBMITTED" && isAuditor && (
                    isThisRejecting ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          maxLength={400}
                          placeholder="State the verification failure…"
                          className="w-full text-[13px] bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-900 resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(m.id)}
                            disabled={rejectMilestone.isPending}
                            className="text-[12px] h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                          >
                            <X className="h-3.5 w-3.5" /> Confirm rejection
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="text-[12px] h-8 px-3 rounded-md text-neutral-600 hover:text-neutral-900 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(m.id)}
                          disabled={approveMilestone.isPending || project.status === "PAUSED"}
                          title={project.status === "PAUSED" ? "Resolve citizen concerns before approving" : undefined}
                          className="text-[12px] h-8 px-3 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {approveMilestone.isPending ? "Signing…" : "Authorize release"}
                        </button>
                        <button
                          onClick={() => setRejectingId(m.id)}
                          className="text-[12px] h-8 px-3 rounded-md border border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reports */}
      {reports && reports.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 mb-5">
            Citizen concerns ({reports.length})
          </h2>
          <div>
            {reports.map((r) => (
              <div key={r.id} className="py-5 border-t border-neutral-200 last:border-b">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="text-[13px] font-medium text-neutral-900">
                    {REPORT_CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}
                  </div>
                  <StatusBadge status={r.status === "PENDING_REVIEW" ? "WARNING" : r.status === "DISMISSED" ? "LOW" : "MEDIUM"} type="risk" />
                </div>
                <p className="text-[13px] text-neutral-700 leading-relaxed mb-2">{r.reason}</p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                  <span className="font-mono">{r.reporterAddress.substring(0, 14)}…</span>
                  <span>·</span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
