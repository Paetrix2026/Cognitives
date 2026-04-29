import React from "react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, type = "project" }: { status: string, type?: "project" | "milestone" | "risk" }) {
  if (type === "project") {
    switch (status) {
      case "PENDING_APPROVAL": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 font-medium shadow-sm">Pending Approval</Badge>;
      case "CREATED": return <Badge variant="outline" className="bg-muted text-muted-foreground font-medium border-border shadow-sm">Created</Badge>;
      case "ACTIVE": return <Badge variant="outline" className="bg-black text-white hover:bg-black/90 font-medium border-black shadow-sm">Active</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="bg-white text-black border-border shadow-sm font-medium">Completed</Badge>;
      case "PAUSED": return <Badge variant="outline" className="bg-orange-50 text-accent border-accent/20 font-medium">Paused</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-destructive border-destructive/20 font-medium">Cancelled</Badge>;
      default: return <Badge variant="outline" className="shadow-sm font-medium">{status}</Badge>;
    }
  }

  if (type === "milestone") {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-muted/50 text-muted-foreground font-medium shadow-sm">Pending</Badge>;
      case "PROOF_SUBMITTED": return <Badge variant="outline" className="bg-orange-50 text-accent border-accent/20 font-medium shadow-sm">Under Review</Badge>;
      case "APPROVED": return <Badge variant="outline" className="bg-black text-white hover:bg-black/90 font-medium shadow-sm">Approved</Badge>;
      case "REJECTED": return <Badge variant="outline" className="bg-red-50 text-destructive border-destructive/20 font-medium shadow-sm">Rejected</Badge>;
      case "PAID": return <Badge variant="outline" className="bg-white text-black border-border shadow-sm font-medium">Paid</Badge>;
      default: return <Badge variant="outline" className="shadow-sm font-medium">{status}</Badge>;
    }
  }
  
  if (type === "risk") {
    switch (status) {
      case "LOW": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium shadow-sm">Low Risk</Badge>;
      case "MEDIUM": return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium shadow-sm">Med Risk</Badge>;
      case "HIGH": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium shadow-sm">High Risk</Badge>;
      case "CRITICAL": return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 font-bold shadow-sm">Critical</Badge>;
      default: return <Badge variant="outline" className="shadow-sm font-medium">{status}</Badge>;
    }
  }

  return <Badge variant="outline" className="shadow-sm font-medium">{status}</Badge>;
}
