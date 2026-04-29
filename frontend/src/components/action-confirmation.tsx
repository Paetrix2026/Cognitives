import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ActionConfirmationTone = "approve" | "reject";

type ActionConfirmationProps = {
  tone: ActionConfirmationTone;
  title: string;
  description: string;
  confirmLabel: string;
  details?: React.ReactNode;
  disabled?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  children: React.ReactElement;
};

const toneConfig = {
  approve: {
    icon: CheckCircle2,
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    action: "bg-neutral-900 text-white hover:bg-neutral-800",
    label: "Approval",
  },
  reject: {
    icon: XCircle,
    accent: "border-red-200 bg-red-50 text-red-700",
    action: "bg-red-600 text-white hover:bg-red-700",
    label: "Rejection",
  },
} satisfies Record<ActionConfirmationTone, {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  action: string;
  label: string;
}>;

export function ActionConfirmation({
  tone,
  title,
  description,
  confirmLabel,
  details,
  disabled,
  pending,
  onConfirm,
  children,
}: ActionConfirmationProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled || pending}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[440px] gap-5 rounded-xl border-neutral-200 p-0 shadow-2xl">
        <div className={cn("rounded-t-xl border-b px-5 py-4", config.accent)}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] opacity-75">{config.label}</div>
              <AlertDialogTitle className="text-[16px] leading-tight tracking-tight">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
        </div>

        <AlertDialogHeader className="px-5 text-left">
          <AlertDialogDescription className="text-[13px] leading-relaxed text-neutral-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {details && (
          <div className="mx-5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[12px] leading-relaxed text-neutral-700">
            {details}
          </div>
        )}

        <div className="mx-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This action is final after it is recorded. Review the details before confirming.
        </div>

        <AlertDialogFooter className="gap-2 border-t border-neutral-100 px-5 py-4 sm:space-x-0">
          <AlertDialogCancel className="mt-0 h-9 rounded-md border-neutral-300 px-3 text-[12px] text-neutral-700 hover:text-neutral-900">
            Keep reviewing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className={cn("h-9 rounded-md px-3 text-[12px] shadow-sm disabled:opacity-50", config.action)}
          >
            {pending ? "Submitting..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
