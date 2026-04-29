import React, { useEffect, useState } from "react";
import type { Project } from "@workspace/api-client-react";
import {
  useListProjects,
  useCreateProject,
  useCreateMilestone,
  useListMilestones,
  usePublishProjectTender,
  useGetProjectTender,
  useReleaseMilestonePayment,
  useCloseProject,
  getListProjectsQueryKey,
  getListOpenTendersQueryKey,
  getGetProjectTenderQueryKey,
  getListMilestonesQueryKey,
  getGetProjectQueryKey,
  getGetAnalyticsOverviewQueryKey,
  getListPendingMilestonesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { CheckCircle, DollarSign, FileText, Lock, Check, ChevronsUpDown, Building, Calendar, MapPin, Search, Users, ShieldCheck, Clock, FileCheck, Info, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const CITIES = [
  "Mumbai, Maharashtra",
  "Delhi, National Capital Territory",
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Ahmedabad, Gujarat",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Surat, Gujarat",
  "Pune, Maharashtra",
  "Jaipur, Rajasthan",
  "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh",
  "Nagpur, Maharashtra",
  "Indore, Madhya Pradesh",
  "Thane, Maharashtra",
  "Bhopal, Madhya Pradesh",
  "Visakhapatnam, Andhra Pradesh",
  "Pimpri-Chinchwad, Maharashtra",
  "Patna, Bihar",
  "Vadodara, Gujarat",
  "Ghaziabad, Uttar Pradesh",
  "Ludhiana, Punjab",
  "Agra, Uttar Pradesh",
  "Nashik, Maharashtra",
  "Faridabad, Haryana",
  "Meerut, Uttar Pradesh",
  "Rajkot, Gujarat",
  "Kalyan-Dombivli, Maharashtra",
  "Vasai-Virar, Maharashtra",
  "Varanasi, Uttar Pradesh",
  "Srinagar, Jammu and Kashmir",
  "Aurangabad, Maharashtra",
  "Dhanbad, Jharkhand",
  "Amritsar, Punjab",
  "Navi Mumbai, Maharashtra",
  "Allahabad, Uttar Pradesh",
  "Howrah, West Bengal",
  "Ranchi, Jharkhand",
  "Gwalior, Madhya Pradesh",
  "Jabalpur, Madhya Pradesh",
  "Coimbatore, Tamil Nadu",
  "Vijayawada, Andhra Pradesh",
  "Jodhpur, Rajasthan",
  "Madurai, Tamil Nadu",
  "Raipur, Chhattisgarh",
  "Kota, Rajasthan",
  "Chandigarh",
  "Guwahati, Assam",
  "Solapur, Maharashtra",
  "Hubli-Dharwad, Karnataka",
  "Tiruchirappalli, Tamil Nadu",
  "Bareilly, Uttar Pradesh",
  "Mysore, Karnataka",
  "Tiruppur, Tamil Nadu",
  "Gurgaon, Haryana",
  "Aligarh, Uttar Pradesh",
  "Jalandhar, Punjab",
  "Bhubaneswar, Odisha",
  "Salem, Tamil Nadu",
  "Warangal, Telangana",
  "Guntur, Andhra Pradesh",
  "Bhiwandi, Maharashtra",
  "Saharanpur, Uttar Pradesh",
  "Gorakhpur, Uttar Pradesh",
  "Bikaner, Rajasthan",
  "Amravati, Maharashtra",
  "Noida, Uttar Pradesh",
  "Jamshedpur, Jharkhand",
  "Bhilai, Chhattisgarh",
  "Cuttack, Odisha",
  "Firozabad, Uttar Pradesh",
  "Kochi, Kerala",
  "Bhavnagar, Gujarat",
  "Dehradun, Uttarakhand",
  "Durgapur, West Bengal",
  "Asansol, West Bengal",
  "Nanded, Maharashtra",
  "Kolhapur, Maharashtra",
  "Ajmer, Rajasthan",
  "Gulbarga, Karnataka",
  "Jamnagar, Gujarat",
  "Ujjain, Madhya Pradesh",
  "Loni, Uttar Pradesh",
  "Siliguri, West Bengal",
  "Jhansi, Uttar Pradesh",
  "Ulhasnagar, Maharashtra",
  "Jammu, Jammu and Kashmir",
  "Sangli-Miraj & Kupwad, Maharashtra",
  "Mangalore, Karnataka",
  "Erode, Tamil Nadu",
  "Belgaum, Karnataka",
  "Kurnool, Andhra Pradesh",
  "Ambattur, Tamil Nadu",
  "Rajahmundry, Andhra Pradesh",
  "Tirunelveli, Tamil Nadu",
  "Malegaon, Maharashtra",
  "Gaya, Bihar",
  "Udaipur, Rajasthan"
];

type Tab = "project" | "milestone" | "assignment" | "payments";
type MilestonePhase = {
  id: string;
  title: string;
  description: string;
  paymentAmount: string;
};
type SubmitMode = "selected" | "single" | "all";
type OfficialMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  paymentAmount: number;
  ipfsProofCID?: string;
  proofLatitude?: number;
  proofLongitude?: number;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  status: string;
  approvalCount: number;
  txHash: string;
  officialAcknowledgedAt?: string;
  officialAcknowledgedBy?: string;
};

export default function Official() {
  const { user } = useAuth();
  const { data: projects } = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const createProject = useCreateProject();
  const createMilestone = useCreateMilestone();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const res = await fetch(`/api/milestones/${milestoneId}`, { method: "DELETE" });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error((body as { message?: string }).message ?? "Failed to delete milestone"); }
    },
    onSuccess: (_data, milestoneId) => {
      queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(milestoneForm.projectId) });
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      toast({ title: "Phase removed", description: "The milestone has been deleted." });
    },
    onError: (err) => toast({ title: "Delete failed", description: String(err), variant: "destructive" }),
  });
  const [tab, setTab] = useState<Tab>("project");

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    location: "",
    totalBudget: "",
    contractorAddress: "",
    category: "ROAD" as ProjectCategory,
    endDate: new Date(Date.now() + 31536000000).toISOString().split("T")[0],
  });

  const [milestoneForm, setMilestoneForm] = useState({
    projectId: "",
    phaseCount: "1",
  });
  const [milestonePhases, setMilestonePhases] = useState<MilestonePhase[]>([
    { id: "phase-1", title: "", description: "", paymentAmount: "" },
  ]);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>(["phase-1"]);

  const [tenderProjectId, setTenderProjectId] = useState("");
  const [openCity, setOpenCity] = useState(false);
  const [citySearchResults, setCitySearchResults] = useState<string[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  useEffect(() => {
    const query = projectForm.location.trim();
    if (query.length < 3) {
      setCitySearchResults([]);
      setIsSearchingCity(false);
      return;
    }

    setIsSearchingCity(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
          { headers: { "Accept-Language": "en" } }
        );
        const results = await res.json() as { display_name: string }[];
        const formatted = results.map(r => {
          const parts = r.display_name.split(", ");
          return parts.filter(p => isNaN(Number(p)) && p !== "India").join(", ");
        });
        setCitySearchResults([...new Set(formatted)]);
      } catch (err) {
        console.error("Geocoding search failed", err);
      } finally {
        setIsSearchingCity(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [projectForm.location]);

  const inputCls = "h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-none px-0";
  const activeProjects = projects?.filter((p) => p.status === "ACTIVE") ?? [];
  const selectedMilestoneProject = activeProjects.find((project) => project.id === milestoneForm.projectId);
  const { data: existingMilestones = [] } = useListMilestones(milestoneForm.projectId, {
    query: { enabled: !!milestoneForm.projectId, queryKey: getListMilestonesQueryKey(milestoneForm.projectId) },
  });
  const savedPhaseAllocation = existingMilestones.reduce((sum, phase) => sum + phase.paymentAmount, 0);
  const selectedDraftAllocation = milestonePhases
    .filter((phase) => selectedPhaseIds.includes(phase.id))
    .reduce((sum, phase) => sum + Number(phase.paymentAmount || 0), 0);
  const totalPhaseAllocation = savedPhaseAllocation + selectedDraftAllocation;
  const remainingAfterSave = selectedMilestoneProject ? Math.max(selectedMilestoneProject.totalBudget - totalPhaseAllocation, 0) : 0;

  const syncMilestonePhaseCount = (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(12, nextCount));
    setMilestoneForm((current) => ({ ...current, phaseCount: String(safeCount) }));
    setMilestonePhases((current) => {
      if (current.length === safeCount) return current;
      if (current.length < safeCount) {
        const addedPhases = Array.from({ length: safeCount - current.length }, (_, index) => ({
          id: `phase-${current.length + index + 1}`,
          title: "",
          description: "",
          paymentAmount: "",
        }));
        setSelectedPhaseIds((selected) => [...selected, ...addedPhases.map((phase) => phase.id)]);
        return [
          ...current,
          ...addedPhases,
        ];
      }
      const kept = current.slice(0, safeCount);
      setSelectedPhaseIds((selected) => selected.filter((id) => kept.some((phase) => phase.id === id)));
      return current.slice(0, safeCount);
    });
  };

  const updatePhase = (phaseId: string, field: keyof Omit<MilestonePhase, "id">, value: string) => {
    setMilestonePhases((current) =>
      current.map((phase) => (phase.id === phaseId ? { ...phase, [field]: value } : phase))
    );
  };

  const togglePhaseSelection = (phaseId: string) => {
    setSelectedPhaseIds((current) =>
      current.includes(phaseId) ? current.filter((id) => id !== phaseId) : [...current, phaseId]
    );
  };

  useEffect(() => {
    const parsed = Number(milestoneForm.phaseCount);
    if (!Number.isFinite(parsed)) return;
    if (parsed !== milestonePhases.length) {
      syncMilestonePhaseCount(parsed);
    }
  }, [milestoneForm.phaseCount, milestonePhases.length]);

  useEffect(() => {
    setMilestonePhases([{ id: "phase-1", title: "", description: "", paymentAmount: "" }]);
    setSelectedPhaseIds(["phase-1"]);
    setMilestoneForm((current) => ({ ...current, phaseCount: "1" }));
  }, [milestoneForm.projectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    let latitude = 0;
    let longitude = 0;
    if (projectForm.location.trim()) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(projectForm.location)}&format=json&limit=1&countrycodes=in`,
          { headers: { "Accept-Language": "en" } },
        );
        const results = await res.json() as { lat: string; lon: string }[];
        if (results.length > 0) {
          latitude = parseFloat(results[0].lat);
          longitude = parseFloat(results[0].lon);
        }
      } catch {
        // geocoding failure is non-fatal; pin lands at 0,0 and can be fixed later
      }
    }
    createProject.mutate(
      {
        data: {
          title: projectForm.title,
          description: projectForm.description,
          location: projectForm.location,
          latitude,
          longitude,
          totalBudget: Number(projectForm.totalBudget),
          contractorAddress: projectForm.contractorAddress || "0x0000000000000000000000000000000000000000",
          endDate: new Date(projectForm.endDate).toISOString(),
          category: projectForm.category,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Project submitted for approval", description: "An auditor must approve before work begins." });
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setProjectForm((current) => ({ ...current, title: "", description: "", location: "", totalBudget: "", contractorAddress: "" }));
        },
        onError: (err) => toast({ title: "Transaction failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleCreateMilestone = async (
    mode: SubmitMode = "selected",
    phaseId?: string
  ) => {
    if (!milestoneForm.projectId) {
      toast({ title: "Required", description: "Select a project first.", variant: "destructive" });
      return;
    }

    const phasesToSubmit =
      mode === "single" && phaseId
        ? milestonePhases.filter((phase) => phase.id === phaseId)
        : mode === "all"
          ? milestonePhases
          : milestonePhases.filter((phase) => selectedPhaseIds.includes(phase.id));

    if (phasesToSubmit.length === 0) {
      toast({ title: "No phase selected", description: "Select at least one phase to submit.", variant: "destructive" });
      return;
    }

    const invalidPhase = phasesToSubmit.find(
      (phase) => !phase.title.trim() || !phase.description.trim() || Number(phase.paymentAmount) <= 0
    );
    if (invalidPhase) {
      toast({ title: "Incomplete phase", description: "Each submitted phase needs a title, criteria, and positive allocation.", variant: "destructive" });
      return;
    }

    const draftAllocation = phasesToSubmit.reduce((sum, phase) => sum + Number(phase.paymentAmount || 0), 0);
    const projectedAllocation = savedPhaseAllocation + draftAllocation;

    if (selectedMilestoneProject && projectedAllocation > selectedMilestoneProject.totalBudget) {
      const remaining = selectedMilestoneProject.totalBudget - savedPhaseAllocation;
      const description = remaining <= 0
        ? `Existing phases already use the full budget of Rs. ${selectedMilestoneProject.totalBudget.toLocaleString()}. Remove a phase first.`
        : `Rs. ${remaining.toLocaleString()} remaining — reduce phase allocation to fit.`;
      toast({ title: "Allocation exceeds budget", description, variant: "destructive" });
      return;
    }

    try {
      for (const phase of phasesToSubmit) {
        await createMilestone.mutateAsync({
          data: {
            projectId: milestoneForm.projectId,
            title: phase.title.trim(),
            description: phase.description.trim(),
            paymentAmount: Number(phase.paymentAmount),
          },
        });
      }

      toast({
        title: "Phases created",
        description: `${phasesToSubmit.length} project phase${phasesToSubmit.length > 1 ? "s were" : " was"} added successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(milestoneForm.projectId) });
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      setMilestoneForm((current) => ({ ...current, phaseCount: "1" }));
      setMilestonePhases((current) => {
        const remaining = current.filter((phase) => !phasesToSubmit.some((submitted) => submitted.id === phase.id));
        return remaining.length > 0 ? remaining : [{ id: "phase-1", title: "", description: "", paymentAmount: "" }];
      });
      setSelectedPhaseIds((current) => {
        const remaining = current.filter((id) => !phasesToSubmit.some((phase) => phase.id === id));
        return remaining.length > 0 ? remaining : ["phase-1"];
      });
    } catch (err) {
      toast({ title: "Transaction failed", description: String(err), variant: "destructive" });
    }
  };

  if (!user || (user.role !== "GOVT_OFFICIAL" && user.role !== "ADMIN")) {
    return <div className="py-20 text-center text-[13px] text-red-600">Unauthorized. Official role required.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header>
        <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Official</div>
        <h1 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-[1.05] text-neutral-900">
          Manage ledger
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600 leading-relaxed">
          Create projects for auditor approval, assign contractors, define milestones, and release payments.
        </p>
      </header>

      <div className="flex items-center gap-7 border-b border-neutral-200 flex-wrap">
        {([
          { id: "project", label: "New project" },
          { id: "assignment", label: "Contractors" },
          { id: "milestone", label: "Add milestone" },
          { id: "payments", label: "Release payments" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 -mb-px text-[13px] tracking-tight transition-colors ${
              tab === t.id ? "text-neutral-900 font-medium border-b border-neutral-900" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "project" && (
        <form onSubmit={handleCreateProject} className="space-y-7">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-[12.5px] text-blue-800 leading-relaxed">
            New projects go to <strong>Pending Approval</strong>. An auditor must approve before broadcasts, direct assignment, or milestones are created.
          </div>
          <Field label="Project title">
            <Input className={inputCls} required value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="e.g. NH-44 Extension" />
          </Field>
          <Field label="Scope of work">
            <Textarea
              required
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="Detailed requirements..."
              className="resize-none h-24 text-[13px] bg-transparent border border-neutral-200 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-md"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-7">
            <Field label="Region / city">
              <div className="relative">
                <Input
                  className={cn(inputCls, "w-full pr-8")}
                  placeholder="Enter city, town, or village..."
                  value={projectForm.location}
                  onChange={(e) => {
                    setProjectForm({ ...projectForm, location: e.target.value });
                    setOpenCity(true);
                  }}
                  onFocus={() => setOpenCity(true)}
                  onBlur={() => setTimeout(() => setOpenCity(false), 200)}
                  required
                />
                <ChevronsUpDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                
                {openCity && (
                  <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    {projectForm.location.trim().length >= 3 ? (
                      isSearchingCity ? (
                        <div className="px-3 py-3 text-[13px] text-neutral-500 flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 animate-spin opacity-50" />
                          Searching locations...
                        </div>
                      ) : citySearchResults.length > 0 ? (
                        <>
                          {citySearchResults.map((city) => (
                            <div
                              key={city}
                              className="px-3 py-2.5 text-[13px] hover:bg-neutral-50 cursor-pointer text-neutral-700 flex items-center gap-2 transition-colors"
                              onClick={() => {
                                setProjectForm({ ...projectForm, location: city });
                                setOpenCity(false);
                              }}
                            >
                              <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{city}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div 
                          className="px-3 py-2.5 text-[13px] text-neutral-600 hover:bg-neutral-50 cursor-pointer flex items-center gap-2 transition-colors"
                          onClick={() => setOpenCity(false)}
                        >
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="truncate">Use <strong>{projectForm.location}</strong></span>
                        </div>
                      )
                    ) : (
                      // Show default top cities if query is less than 3 chars
                      CITIES.filter(c => c.toLowerCase().includes(projectForm.location.toLowerCase())).length > 0 ? (
                        CITIES.filter(c => c.toLowerCase().includes(projectForm.location.toLowerCase()))
                          .slice(0, 5)
                          .map((city) => (
                            <div
                              key={city}
                              className="px-3 py-2.5 text-[13px] hover:bg-neutral-50 cursor-pointer text-neutral-700 flex items-center gap-2 transition-colors"
                              onClick={() => {
                                setProjectForm({ ...projectForm, location: city });
                                setOpenCity(false);
                              }}
                            >
                              <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{city}</span>
                            </div>
                          ))
                      ) : (
                        <div 
                          className="px-3 py-2.5 text-[13px] text-neutral-600 hover:bg-neutral-50 cursor-pointer flex items-center gap-2 transition-colors"
                          onClick={() => setOpenCity(false)}
                        >
                          {projectForm.location ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              <span className="truncate">Use <strong>{projectForm.location}</strong></span>
                            </>
                          ) : (
                            "Start typing to search towns/villages..."
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Category">
              <Select value={projectForm.category} onValueChange={(v) => setProjectForm({ ...projectForm, category: v as ProjectCategory })}>
                <SelectTrigger className="h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 rounded-none px-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-[13px]">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-7">
            <Field label="Escrow budget (Rs.)">
              <Input type="number" className={`${inputCls} font-mono`} required min="1000" value={projectForm.totalBudget} onChange={(e) => setProjectForm({ ...projectForm, totalBudget: e.target.value })} placeholder="1000000" />
            </Field>
            <Field label="Est. completion">
              <Input type="date" className={inputCls} required value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Contractor wallet (optional, or assign after approval)">
            <Input className={`${inputCls} font-mono`} value={projectForm.contractorAddress} onChange={(e) => setProjectForm({ ...projectForm, contractorAddress: e.target.value })} placeholder="0x... (leave blank for broadcast/direct assignment)" />
          </Field>
          <div className="pt-4">
            <Button type="submit" className="h-10 px-6 text-[13px] font-medium" disabled={createProject.isPending}>
              {createProject.isPending ? "Submitting..." : "Submit for approval"}
            </Button>
          </div>
        </form>
      )}

      {tab === "milestone" && (
        <form onSubmit={(e) => { e.preventDefault(); void handleCreateMilestone("selected"); }} className="space-y-7">
          <Field label="Target ledger (active projects only)">
            <Select value={milestoneForm.projectId} onValueChange={(v) => setMilestoneForm({ ...milestoneForm, projectId: v })}>
              <SelectTrigger className="h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 rounded-none px-0 focus:ring-0">
                <SelectValue placeholder="Select active project..." />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-[13px]">
                    {p.title} <span className="text-neutral-500 font-mono ml-2">(avail Rs. {(p.totalBudget - p.spentAmount).toLocaleString()})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {selectedMilestoneProject && (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Selected project</div>
                  <div className="text-[15px] font-medium text-neutral-900">{selectedMilestoneProject.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Available budget</div>
                  <div className="text-[15px] font-semibold tabular-nums text-neutral-900">Rs. {Math.max(selectedMilestoneProject.totalBudget - savedPhaseAllocation, 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-neutral-600">
                <span>Saved phase allocation: <span className="font-medium text-neutral-900">Rs. {savedPhaseAllocation.toLocaleString()}</span></span>
                <span>Selected draft allocation: <span className="font-medium text-neutral-900">Rs. {selectedDraftAllocation.toLocaleString()}</span></span>
                <span>Total phase allocation: <span className="font-medium text-neutral-900">Rs. {totalPhaseAllocation.toLocaleString()}</span></span>
                <span>Remaining after save: <span className="font-medium text-neutral-900">Rs. {remainingAfterSave.toLocaleString()}</span></span>
              </div>
            </div>
          )}

          {selectedMilestoneProject && (
            <div className="rounded-md border border-neutral-200 p-4 space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Submitted phases</div>
                <div className="text-[14px] font-medium text-neutral-900">Existing phases under {selectedMilestoneProject.title}</div>
              </div>
              {existingMilestones.length === 0 ? (
                <div className="text-[13px] text-neutral-500">No phases created for this project yet.</div>
              ) : (
                <div className="space-y-3">
                  {existingMilestones.map((phase, index) => (
                    <div key={phase.id} className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Saved phase {String(index + 1).padStart(2, "0")}</div>
                          <div className="text-[14px] font-medium text-neutral-900">{phase.title}</div>
                          <div className="text-[12.5px] text-neutral-600 mt-1">{phase.description}</div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                          <StatusBadge status={phase.status} type="milestone" />
                          <div className="text-[13px] font-semibold tabular-nums text-neutral-900">Rs. {phase.paymentAmount.toLocaleString()}</div>
                          {phase.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => deleteMilestone.mutate(phase.id)}
                              disabled={deleteMilestone.isPending}
                              className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-end">
            <Field label="Number of phases">
              <Input
                type="number"
                min="1"
                max="12"
                className={`${inputCls} font-mono`}
                value={milestoneForm.phaseCount}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, phaseCount: e.target.value })}
                placeholder="1"
              />
            </Field>
            <Button type="button" variant="outline" className="h-10 px-4 text-[13px]" onClick={() => syncMilestonePhaseCount(milestonePhases.length + 1)}>
              Add phase
            </Button>
            <Button type="button" variant="outline" className="h-10 px-4 text-[13px]" onClick={() => syncMilestonePhaseCount(milestonePhases.length - 1)} disabled={milestonePhases.length === 1}>
              Remove phase
            </Button>
          </div>

          <div className="space-y-5">
            {milestonePhases.map((phase, index) => (
              <div key={phase.id} className="rounded-md border border-neutral-200 p-4 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Phase {String(index + 1).padStart(2, "0")}</div>
                    <div className="text-[14px] font-medium text-neutral-900">Project phase setup</div>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-neutral-600">
                    <input
                      type="checkbox"
                      checked={selectedPhaseIds.includes(phase.id)}
                      onChange={() => togglePhaseSelection(phase.id)}
                    />
                    Select
                  </label>
                </div>
                <Field label="Phase name">
                  <Input className={inputCls} required value={phase.title} onChange={(e) => updatePhase(phase.id, "title", e.target.value)} placeholder={`e.g. Phase ${index + 1} foundation`} />
                </Field>
                <Field label="Verification criteria">
                  <Textarea
                    required
                    value={phase.description}
                    onChange={(e) => updatePhase(phase.id, "description", e.target.value)}
                    placeholder="What the auditor must verify before releasing this phase..."
                    className="resize-none h-24 text-[13px] bg-transparent border border-neutral-200 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-md"
                  />
                </Field>
                <Field label="Allocation (Rs.)">
                  <Input type="number" min="1" className={`${inputCls} font-mono`} required value={phase.paymentAmount} onChange={(e) => updatePhase(phase.id, "paymentAmount", e.target.value)} placeholder="Amount to release for this phase" />
                </Field>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="h-9 px-4 text-[12px]" onClick={() => void handleCreateMilestone("single", phase.id)} disabled={createMilestone.isPending}>
                    Send this phase
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Button type="submit" className="h-10 px-6 text-[13px] font-medium" disabled={createMilestone.isPending || selectedPhaseIds.length === 0}>
              {createMilestone.isPending ? "Allocating..." : `Send selected (${selectedPhaseIds.length})`}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-6 text-[13px] font-medium"
              onClick={() => void handleCreateMilestone("all")}
              disabled={createMilestone.isPending || milestonePhases.length === 0}
            >
              Send all draft phases
            </Button>
          </div>
        </form>
      )}

      {tab === "assignment" && (
        <div className="space-y-10">
          <div className="text-[13px] text-neutral-600">Select an active project, then either broadcast it for first-come-first-serve claiming or directly assign an available contractor. Direct official assignment is final.</div>
          <Select value={tenderProjectId} onValueChange={setTenderProjectId}>
            <SelectTrigger className="h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 rounded-none px-0 focus:ring-0">
              <SelectValue placeholder="Select active project..." />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-[13px]">
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenderProjectId && (() => { const tp = activeProjects.find((p) => p.id === tenderProjectId); return tp ? <AssignmentPanel project={tp} officialAddress={user.walletAddress} /> : null; })()}
        </div>
      )}

      {tab === "payments" && <PaymentsPanel projects={projects ?? []} officialAddress={user.walletAddress} />}
    </div>
  );
}

type ContractorOption = {
  walletAddress: string;
  activeAssignments: number;
  available: boolean;
};

function AssignmentPanel({ project, officialAddress }: { project: Project; officialAddress: string }) {
  const projectId = project.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: tender, isLoading } = useGetProjectTender(projectId, {
    query: { queryKey: getGetProjectTenderQueryKey(projectId), retry: false },
  });
  const publishTender = usePublishProjectTender();
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [contractorAddress, setContractorAddress] = useState("");
  const [loadingContractors, setLoadingContractors] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [form, setForm] = useState({
    description: "",
  });

  useEffect(() => {
    setLoadingContractors(true);
    fetch("/api/contractors")
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load contractors")))
      .then((data: ContractorOption[]) => {
        setContractors(data);
        setContractorAddress((current) => current || data.find((contractor) => contractor.available)?.walletAddress || data[0]?.walletAddress || "");
      })
      .catch((err) => toast({ title: "Contractors unavailable", description: String(err), variant: "destructive" }))
      .finally(() => setLoadingContractors(false));
  }, [toast]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    publishTender.mutate(
      { id: projectId, data: { description: form.description, minimumBid: project.totalBudget, deadline: project.endDate, publishedBy: officialAddress } },
      {
        onSuccess: () => {
          toast({ title: "Project broadcast", description: "Contractors can now claim this project on a first-come-first-serve basis." });
          queryClient.invalidateQueries({ queryKey: getGetProjectTenderQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getListOpenTendersQueryKey() });
        },
        onError: (err) => toast({ title: "Failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleDirectAssign = async () => {
    if (!contractorAddress) {
      toast({ title: "Select contractor", description: "Choose an available contractor wallet.", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assign-contractor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorAddress, officialAddress }),
      });
      const body = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(body.message ?? "Failed to assign contractor");
      toast({ title: "Contractor assigned", description: "Official assignment is final and the project is now allocated." });
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListOpenTendersQueryKey() });
    } catch (err) {
      toast({ title: "Assignment failed", description: String(err), variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const alreadyAssigned = project.contractorAddress !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ProjectTenderBrief project={project} />

      {alreadyAssigned && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] text-emerald-800">
          Assigned contractor: <span className="font-mono">{project.contractorAddress}</span>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200/60 bg-white/50 backdrop-blur-md shadow-sm p-6 sm:p-8 space-y-7">
        <div className="flex items-center gap-3 pb-6 border-b border-neutral-100">
          <div className="p-2.5 bg-neutral-100 text-neutral-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Direct assignment</h3>
            <p className="text-[13px] text-neutral-500 mt-1">Choose an available contractor. No rejection step is created.</p>
          </div>
        </div>

        <Field label="Available contractor">
          <Select value={contractorAddress} onValueChange={setContractorAddress} disabled={loadingContractors || alreadyAssigned}>
            <SelectTrigger className="h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 rounded-none px-0 focus:ring-0">
              <SelectValue placeholder={loadingContractors ? "Loading contractors..." : "Select contractor..."} />
            </SelectTrigger>
            <SelectContent>
              {contractors.map((contractor) => (
                <SelectItem key={contractor.walletAddress} value={contractor.walletAddress} disabled={!contractor.available} className="text-[13px]">
                  <span className="font-mono">{contractor.walletAddress.slice(0, 10)}...{contractor.walletAddress.slice(-6)}</span>
                  <span className="ml-2 text-neutral-500">{contractor.available ? "Available" : `${contractor.activeAssignments} active`}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleDirectAssign()} disabled={assigning || alreadyAssigned || !contractorAddress} className="h-10 px-6 text-[13px] font-medium">
            {assigning ? "Assigning..." : "Assign directly"}
          </Button>
        </div>
      </div>

      <form onSubmit={handlePublish} className="rounded-2xl border border-neutral-200/60 bg-white/50 backdrop-blur-md shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
          <div className="p-2.5 bg-neutral-100 text-neutral-600 rounded-xl">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Broadcast project</h3>
            <p className="text-[13px] text-neutral-500 mt-1">First contractor to claim gets assigned automatically.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-[13px] text-neutral-500">Checking broadcast state...</div>
        ) : tender ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-medium text-neutral-900">Broadcast {tender.status.toLowerCase()}</div>
                <div className="text-[12px] text-neutral-500 mt-1">Available until {new Date(tender.deadline).toLocaleDateString()}</div>
              </div>
              <Badge variant={tender.status === "OPEN" ? "default" : "secondary"}>{tender.status}</Badge>
            </div>
            <p className="text-[13px] text-neutral-700 leading-relaxed border border-neutral-100 bg-white rounded-xl p-4">{tender.description}</p>
          </div>
        ) : (
          <>
        <Field label="Broadcast requirements & description">
          <Textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Specify scope of work, technical standards, material requirements, and timelines..."
            className="resize-none h-32 text-[14px] bg-white border-neutral-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-xl shadow-sm mt-2"
          />
        </Field>
        
        <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end">
          <Button type="submit" className="h-11 px-8 text-[14px] font-medium rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5" disabled={publishTender.isPending || alreadyAssigned}>
            {publishTender.isPending ? "Broadcasting..." : "Broadcast project"}
          </Button>
        </div>
          </>
        )}
      </form>
    </div>
  );
}

function ProjectTenderBrief({ project }: { project: Project }) {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden group hover:border-neutral-300 transition-colors">
      <div className="bg-neutral-50/80 px-6 py-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            Auditor-Approved Project
          </div>
          <h2 className="text-[18px] font-semibold tracking-tight text-neutral-900 group-hover:text-blue-600 transition-colors">{project.title}</h2>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-1">Escrow Budget</div>
              <div className="text-[16px] font-semibold tabular-nums text-neutral-900">Rs. {project.totalBudget.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-1">Est. Completion</div>
              <div className="text-[15px] font-medium text-neutral-900">{new Date(project.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-3">
            <Info className="w-3.5 h-3.5" /> Scope of Work
          </div>
          <p className="text-[14px] leading-relaxed text-neutral-600">{project.description}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentsPanel({ projects, officialAddress }: { projects: Project[]; officialAddress: string }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const activeProjects = projects.filter((p) => p.status === "ACTIVE" || p.status === "PAUSED");

  return (
    <div className="space-y-8">
      <div className="text-[13px] text-neutral-600">
        After 2 auditor approvals, a milestone awaits your payment release. Select a project to view its milestones.
      </div>
      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
        <SelectTrigger className="h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 rounded-none px-0 focus:ring-0">
          <SelectValue placeholder="Select project..." />
        </SelectTrigger>
        <SelectContent>
          {activeProjects.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[13px]">
              {p.title} <StatusBadge status={p.status} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedProjectId && <MilestonePayments projectId={selectedProjectId} projects={projects} officialAddress={officialAddress} />}
    </div>
  );
}

function MilestonePayments({ projectId, projects, officialAddress }: { projectId: string; projects: Project[]; officialAddress: string }) {
  const { data: milestones, isLoading } = useListMilestones(projectId, {
    query: { queryKey: getListMilestonesQueryKey(projectId) },
  });
  const paymentMilestones = (milestones ?? []) as OfficialMilestone[];
  const releasePayment = useReleaseMilestonePayment();
  const closeProject = useCloseProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAnalyticsOverviewQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPendingMilestonesQueryKey() });
  };

  const project = projects.find((p) => p.id === projectId);
  const allPaid = paymentMilestones.length > 0 && paymentMilestones.every((m) => m.status === "PAID" || m.status === "REJECTED");

  if (isLoading) return <div className="py-6 text-[13px] text-neutral-500">Loading milestones...</div>;
  if (paymentMilestones.length === 0) return <div className="py-6 text-[13px] text-neutral-500">No milestones defined for this project yet.</div>;

  const handleRelease = (milestoneId: string, title: string) => {
    releasePayment.mutate(
      { id: milestoneId },
      {
        onSuccess: () => {
          toast({ title: "Payment released", description: `${title} - funds sent to contractor.` });
          invalidate();
        },
        onError: (err) => toast({ title: "Release failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleClose = () => {
    closeProject.mutate(
      { id: projectId },
      {
        onSuccess: () => {
          toast({ title: "Project closed", description: `${project?.title} marked as COMPLETED.` });
          invalidate();
        },
        onError: (err) => toast({ title: "Close failed", description: String(err), variant: "destructive" }),
      }
    );
  };

  const handleAcknowledgeProof = async (milestoneId: string, title: string) => {
    setAcknowledgingId(milestoneId);
    try {
      const response = await fetch(`/api/milestones/${milestoneId}/acknowledge-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officialAddress }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message ?? "Failed to acknowledge proof");
      }
      toast({ title: "Proof acknowledged", description: `${title} proof recorded for official review.` });
      invalidate();
    } catch (err) {
      toast({ title: "Acknowledge failed", description: String(err), variant: "destructive" });
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {paymentMilestones.map((m, i) => {
        const proofSubmitted = !!m.ipfsProofCID && !!m.submittedAt;
        const proofAcknowledged = !!m.officialAcknowledgedAt;
        const readyForRelease = m.status === "APPROVED" && m.approvalCount >= 1 && proofAcknowledged;
        return (
          <div key={m.id} className="py-5 border-t border-neutral-200 last:border-b">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.1em] text-neutral-500 mb-1">Milestone {String(i + 1).padStart(2, "0")}</div>
                <div className="text-[14px] font-medium text-neutral-900">{m.title}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={m.status} type="milestone" />
                <div className="text-[14px] font-semibold tabular-nums text-neutral-900">Rs. {m.paymentAmount.toLocaleString()}</div>
              </div>
            </div>
            {proofSubmitted && (
              <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">Submitted proof</div>
                <div className="text-[12.5px] text-neutral-700">CID: <span className="font-mono">{m.ipfsProofCID}</span></div>
                <div className="text-[12.5px] text-neutral-700">Submitted by: <span className="font-mono">{m.submittedBy}</span></div>
                <div className="text-[12.5px] text-neutral-700">Submitted at: {new Date(m.submittedAt!).toLocaleString()}</div>
                {(typeof m.proofLatitude === "number" && typeof m.proofLongitude === "number") && (
                  <div className="text-[12.5px] text-neutral-700">Location: {m.proofLatitude.toFixed(4)}, {m.proofLongitude.toFixed(4)}</div>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${m.ipfsProofCID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12.5px] font-medium text-neutral-900 underline underline-offset-4"
                  >
                    View proof
                  </a>
                  {!proofAcknowledged ? (
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => void handleAcknowledgeProof(m.id, m.title)}
                      disabled={acknowledgingId === m.id}
                      className="h-8 px-4 text-[12px]"
                    >
                      {acknowledgingId === m.id ? "Acknowledging..." : "Acknowledge proof"}
                    </Button>
                  ) : (
                    <div className="text-[12px] text-green-700">
                      Proof acknowledged on {new Date(m.officialAcknowledgedAt!).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
            {readyForRelease && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 inline-flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Auditor approval and official proof acknowledgment met - awaiting your release
                </div>
                <Button size="sm" onClick={() => handleRelease(m.id, m.title)} disabled={releasePayment.isPending} className="h-8 px-4 text-[12px] bg-green-700 hover:bg-green-800 text-white shrink-0">
                  Release Rs. {m.paymentAmount.toLocaleString()}
                </Button>
              </div>
            )}
            {m.status === "APPROVED" && !proofAcknowledged && proofSubmitted && (
              <div className="mt-2 text-[12px] text-neutral-500">Acknowledge the contractor proof before releasing payment.</div>
            )}
            {m.status === "PAID" && (
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-green-700">
                <CheckCircle className="h-3.5 w-3.5" /> Payment released
              </div>
            )}
            {m.status === "APPROVED" && m.approvalCount < 1 && (
              <div className="mt-2 text-[12px] text-neutral-500">{m.approvalCount}/1 auditor approvals recorded - waiting for approval threshold</div>
            )}
          </div>
        );
      })}

      {allPaid && project?.status !== "COMPLETED" && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-green-900">All milestones paid</div>
              <div className="text-[12px] text-green-700">Close this project to mark it as completed on the public ledger.</div>
            </div>
            <Button onClick={handleClose} disabled={closeProject.isPending} className="h-9 px-4 text-[12.5px] bg-green-700 hover:bg-green-800 text-white shrink-0">
              <Lock className="h-3.5 w-3.5 mr-1.5" /> {closeProject.isPending ? "Closing..." : "Close project"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 font-medium">{label}</Label>
      {children}
    </div>
  );
}
