import React, { useState } from "react";
import type { Project, Tender } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import {
  useListProjects,
  useListMilestones,
  useUploadMilestoneProof,
  useListOpenTenders,
  getListMilestonesQueryKey,
  getGetProjectQueryKey,
  getListPendingMilestonesQueryKey,
  getGetAnalyticsOverviewQueryKey,
  getListOpenTendersQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText } from "lucide-react";

type Tab = "proofs" | "tenders" | "ongoing";

export default function Contractor() {
  const { user } = useAuth();
  const { data: projects } = useListProjects();
  const myProjects = projects?.filter((p) => user?.role === "ADMIN" || p.contractorAddress.toLowerCase() === user?.walletAddress.toLowerCase()) || [];
  const ongoingProjects = myProjects.filter((p) => p.status === "ACTIVE" || p.status === "PAUSED");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("proofs");

  if (!user || (user.role !== "CONTRACTOR" && user.role !== "ADMIN")) {
    return <div className="py-20 text-center text-[13px] text-red-600">Unauthorized. Contractor role required.</div>;
  }

  return (
    <div className="space-y-14">
      <header>
        <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Contractor</div>
        <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-[1.05] text-neutral-900">
          Contractor portal
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600 leading-relaxed max-w-xl">
          Submit cryptographic proofs against milestones or claim open government broadcasts.
        </p>
      </header>

      <div className="flex items-center gap-7 border-b border-neutral-200">
        {([
          { id: "ongoing", label: "Ongoing projects" },
          { id: "proofs", label: "Proof submissions" },
          { id: "tenders", label: "Broadcast menu" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 -mb-px text-[13px] tracking-tight transition-colors ${
              tab === t.id
                ? "text-neutral-900 font-medium border-b border-neutral-900"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ongoing" && <OngoingProjects projects={ongoingProjects} />}

      {tab === "proofs" && (
        <section className="grid md:grid-cols-3 gap-12 items-start">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 mb-6">Contracts</h2>
            {myProjects.length === 0 ? (
              <div className="py-10 border-t border-neutral-200 text-[13px] text-neutral-500">
                No active contracts assigned to this wallet.
              </div>
            ) : (
              <div>
                {myProjects.map((p) => {
                  const active = selectedProjectId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`group w-full text-left py-4 border-t border-neutral-200 last:border-b transition-colors ${
                        active ? "" : "hover:bg-neutral-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className={`text-[14px] truncate ${active ? "font-semibold text-neutral-900" : "font-medium text-neutral-700"}`}>
                            {p.title}
                          </div>
                          <div className="text-[11.5px] text-neutral-500 truncate mt-0.5">{p.location}</div>
                        </div>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 mb-6">Deliverables</h2>
            {selectedProjectId ? (
              <MilestoneList projectId={selectedProjectId} walletAddress={user.walletAddress} />
            ) : (
              <div className="py-16 text-center border-t border-neutral-200">
                <div className="text-[14px] font-medium text-neutral-900 mb-1.5">Select a contract</div>
                <div className="text-[13px] text-neutral-500">Choose a contract on the left to view deliverables.</div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "tenders" && <OpenTenders walletAddress={user.walletAddress} />}
    </div>
  );
}

function OngoingProjects({ projects }: { projects: Project[] }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="py-16 text-center border-t border-neutral-200">
        <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">No ongoing projects</div>
        <div className="text-[13px] text-neutral-500">Projects awarded to this contractor will appear here once work begins.</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {projects.map((project) => (
        <div key={project.id} className="py-6 border-t border-neutral-200 last:border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">{project.category}</Badge>
                <span className="text-[11px] text-neutral-400">{project.location}</span>
              </div>
              <div className="text-[15px] font-medium text-neutral-900">{project.title}</div>
              <p className="text-[13px] text-neutral-600 mt-1 line-clamp-2">{project.description}</p>
            </div>
            <div className="text-right shrink-0">
              <StatusBadge status={project.status} />
              <div className="text-[13px] font-semibold tabular-nums text-neutral-900 mt-2">Rs. {project.totalBudget.toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OpenTenders({ walletAddress }: { walletAddress: string }) {
  const { data: tenders, isLoading } = useListOpenTenders({
    query: { queryKey: getListOpenTendersQueryKey() },
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (isLoading) return <div className="text-[13px] text-neutral-500">Loading open broadcasts...</div>;
  if (!tenders || tenders.length === 0) {
    return (
      <div className="py-16 text-center border-t border-neutral-200">
        <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">No open broadcasts</div>
        <div className="text-[13px] text-neutral-500">Government officials broadcast open projects here. Claiming is first come, first serve.</div>
      </div>
    );
  }

  const handleClaim = async (tenderId: string) => {
    setClaimingId(tenderId);
    try {
      const res = await fetch(`/api/tenders/${tenderId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorAddress: walletAddress }),
      });
      const body = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(body.message ?? "Failed to claim broadcast");
      toast({ title: "Project claimed", description: "You are now assigned as the contractor for this project." });
      queryClient.invalidateQueries({ queryKey: getListOpenTendersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    } catch (err) {
      toast({ title: "Claim failed", description: String(err), variant: "destructive" });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-1">
      {tenders.map((tender) => (
        <TenderCard
          key={tender.id}
          tender={tender}
          handleClaim={handleClaim}
          isClaiming={claimingId === tender.id}
        />
      ))}
    </div>
  );
}

function TenderCard({
  tender,
  handleClaim,
  isClaiming,
}: {
  tender: Tender;
  handleClaim: (tenderId: string) => void;
  isClaiming: boolean;
}) {
  return (
    <div className="py-6 border-t border-neutral-200 last:border-b">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{tender.projectCategory}</Badge>
            <span className="text-[11px] text-neutral-400">{tender.projectLocation}</span>
          </div>
          <div className="text-[15px] font-medium text-neutral-900">{tender.projectTitle}</div>
          <p className="text-[13px] text-neutral-600 mt-1 line-clamp-2">{tender.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[15px] font-semibold tabular-nums text-neutral-900">
            Rs. {tender.minimumBid.toLocaleString()}
          </div>
          <div className="text-[10.5px] text-neutral-500 mt-0.5">budget</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-[11.5px] text-neutral-500">
          Available until {new Date(tender.deadline).toLocaleDateString()}
        </div>
        <Button
          size="sm"
          onClick={() => handleClaim(tender.id)}
          disabled={isClaiming}
          className="h-8 px-5 text-[12.5px] font-medium"
        >
          {isClaiming ? "Claiming..." : "Claim project"}
        </Button>
      </div>
    </div>
  );
}

function MilestoneList({ projectId, walletAddress }: { projectId: string; walletAddress: string }) {
  const { data: milestones, isLoading } = useListMilestones(projectId, { query: { enabled: !!projectId, queryKey: getListMilestonesQueryKey(projectId) } });

  if (isLoading) {
    return (
      <div className="space-y-px">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-6 border-t border-neutral-200 animate-pulse">
            <div className="h-4 w-1/2 bg-neutral-100 rounded mb-2" />
            <div className="h-3 w-3/4 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="py-16 text-center border-t border-neutral-200">
        <div className="text-[14px] font-medium text-neutral-900 mb-1.5">No deliverables scheduled</div>
        <div className="text-[13px] text-neutral-500">Check back once milestones are defined.</div>
      </div>
    );
  }

  return (
    <div>
      {milestones.map((m, i) => (
        <div key={m.id} className="py-6 border-t border-neutral-200 last:border-b">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-neutral-500 mb-1">
                Milestone {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-[15px] font-medium text-neutral-900 leading-snug">{m.title}</h3>
            </div>
            <StatusBadge status={m.status} type="milestone" />
          </div>
          <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">{m.description}</p>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[15px] font-medium text-neutral-900 tabular-nums">
                Rs. {m.paymentAmount.toLocaleString()}
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-neutral-500 mt-0.5">Claim amount</div>
            </div>
            {m.status === "PENDING" || m.status === "REJECTED" ? (
              <SubmitProofDialog milestoneId={m.id} projectId={projectId} walletAddress={walletAddress} />
            ) : (
              <div className="text-[11px] font-mono text-neutral-500">
                tx: {m.txHash?.substring(0, 10)}...
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Parse GPS coordinates embedded in a JPEG's EXIF metadata.
 * Returns { latitude, longitude } or null when no GPS IFD is present.
 */
async function parseGpsFromExif(file: File): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // JPEG starts with 0xFFD8
    if (view.getUint16(0) !== 0xffd8) return null;

    let offset = 2;
    while (offset < view.byteLength - 1) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      const segLen = view.getUint16(offset + 2);

      // APP1 marker (0xFFE1) contains EXIF
      if (marker === 0xe1) {
        // Check for "Exif\0\0" header
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7),
        );
        if (exifHeader !== "Exif") {
            offset += 2 + segLen;
            continue;
        }

        const tiffOffset = offset + 10; // start of TIFF header inside APP1
        const littleEndian = view.getUint16(tiffOffset) === 0x4949;
        const readU16 = (o: number) => view.getUint16(tiffOffset + o, littleEndian);
        const readU32 = (o: number) => view.getUint32(tiffOffset + o, littleEndian);

        // IFD0 offset
        const ifd0Offset = readU32(4);
        const ifd0Count = readU16(ifd0Offset);

        let gpsIfdOffset: number | null = null;
        for (let i = 0; i < ifd0Count; i++) {
          const entryOffset = ifd0Offset + 2 + i * 12;
          const tag = readU16(entryOffset);
          if (tag === 0x8825) {
            // GPSInfo IFD pointer
            gpsIfdOffset = readU32(entryOffset + 8);
            break;
          }
        }
        if (gpsIfdOffset === null) return null;

        const gpsCount = readU16(gpsIfdOffset);
        const gpsEntries: Record<number, { type: number; count: number; valueOffset: number }> = {};
        for (let i = 0; i < gpsCount; i++) {
          const entryOffset = gpsIfdOffset + 2 + i * 12;
          const tag = readU16(entryOffset);
          const type = readU16(entryOffset + 2);
          const count = readU32(entryOffset + 4);
          const valueOffset = entryOffset + 8;
          gpsEntries[tag] = { type, count, valueOffset };
        }

        const readRational = (absoluteOffset: number) => {
          const num = view.getUint32(absoluteOffset, littleEndian);
          const den = view.getUint32(absoluteOffset + 4, littleEndian);
          return den === 0 ? 0 : num / den;
        };
        const readRationalArray = (offsetFromTiff: number, count: number) =>
          Array.from({ length: count }, (_, i) => readRational(tiffOffset + offsetFromTiff + i * 8));

        const latEntry = gpsEntries[0x0002]; // GPSLatitude
        const latRefEntry = gpsEntries[0x0001]; // GPSLatitudeRef
        const lonEntry = gpsEntries[0x0004]; // GPSLongitude
        const lonRefEntry = gpsEntries[0x0003]; // GPSLongitudeRef

        if (!latEntry || !lonEntry) return null;

        const latDataOffset = readU32(latEntry.valueOffset);
        const lonDataOffset = readU32(lonEntry.valueOffset);
        const [latDeg, latMin, latSec] = readRationalArray(latDataOffset, 3);
        const [lonDeg, lonMin, lonSec] = readRationalArray(lonDataOffset, 3);

        let latitude = latDeg + latMin / 60 + latSec / 3600;
        let longitude = lonDeg + lonMin / 60 + lonSec / 3600;

        // South and West are negative
        if (latRefEntry) {
          // valueOffset is TIFF-relative (entryOffset+8); tiffOffset converts to absolute
          const latRef = String.fromCharCode(view.getUint8(tiffOffset + latRefEntry.valueOffset));
          if (latRef === "S" || latRef === "s") latitude = -latitude;
        }
        if (lonRefEntry) {
          const lonRef = String.fromCharCode(view.getUint8(tiffOffset + lonRefEntry.valueOffset));
          if (lonRef === "W" || lonRef === "w") longitude = -longitude;
        }

        return { latitude, longitude };
      }

      offset += 2 + segLen;
    }
  } catch {
    // Parsing failure is non-fatal
  }
  return null;
}

function SubmitProofDialog({ milestoneId, projectId, walletAddress }: { milestoneId: string; projectId: string; walletAddress: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsWarning, setGpsWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadProof = useUploadMilestoneProof();

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    setGpsWarning(false);
    if (f) {
      const coords = await parseGpsFromExif(f);
      setGpsWarning(coords === null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Required", description: "Photographic proof is mandatory.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const [coords, imageBase64] = await Promise.all([
        parseGpsFromExif(file),
        fileToBase64(file),
      ]);
      await uploadProof.mutateAsync({
        id: milestoneId,
        data: {
          latitude: coords?.latitude ?? 0,
          longitude: coords?.longitude ?? 0,
          submittedBy: walletAddress,
          proofDescription: description || undefined,
          imageBase64,
        },
      });

      toast({ title: "Proof pinned to IPFS", description: "Proof submitted" });
      setOpen(false);
      setFile(null);
      setDescription("");
      setGpsWarning(false);
      queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListPendingMilestonesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAnalyticsOverviewQueryKey() });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[12.5px] font-medium text-neutral-900 hover:underline underline-offset-4 inline-flex items-center gap-1.5">
          <UploadCloud className="h-3.5 w-3.5" /> Submit proof
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-semibold tracking-tight">Submit verification proof</DialogTitle>
          <DialogDescription className="text-[13px] text-neutral-500">Upload photo evidence and location data to verify completion of this milestone.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">Photographic evidence</Label>
            <div className="border border-dashed border-neutral-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-neutral-500 transition-colors cursor-pointer relative">
              <Input id="file" type="file" accept="image/*" onChange={(e) => void handleFileChange(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" required />
              <UploadCloud className="h-6 w-6 text-neutral-400 mb-2" />
              <div className="text-[13px] font-medium text-neutral-900">{file ? file.name : "Click to upload image"}</div>
              <div className="text-[11px] text-neutral-500 mt-1">GPS coordinates are read from the photo&apos;s EXIF metadata</div>
            </div>
            {gpsWarning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
                <span className="mt-px shrink-0">⚠</span>
                <span>No GPS geotag found in this photo. Location will be recorded as 0°, 0°. For accurate proof, use a photo taken with location services enabled on your device.</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">Note</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide context for the auditor..." className="resize-none h-20 text-[13px]" />
          </div>
          <Button type="submit" className="w-full h-10 text-[13px] font-medium" disabled={isSubmitting}>
            {isSubmitting ? "Pinning to IPFS..." : "Sign & submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
