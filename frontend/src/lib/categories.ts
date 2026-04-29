export type ProjectCategory =
  | "ROAD"
  | "DRAINAGE"
  | "WATER_SUPPLY"
  | "STREET_LIGHTING"
  | "PARK"
  | "BUILDING"
  | "OTHER";

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: "ROAD", label: "Roads" },
  { value: "DRAINAGE", label: "Drainage" },
  { value: "WATER_SUPPLY", label: "Water" },
  { value: "STREET_LIGHTING", label: "Lighting" },
  { value: "PARK", label: "Parks" },
  { value: "BUILDING", label: "Buildings" },
  { value: "OTHER", label: "Other" },
];

export function categoryLabel(value?: string | null): string {
  if (!value) return "Other";
  const match = PROJECT_CATEGORIES.find(c => c.value === value);
  return match?.label ?? "Other";
}

export type ReportCategory = "QUALITY" | "MISSING_WORK" | "SAFETY" | "BUDGET" | "OTHER";

export const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "QUALITY", label: "Poor quality of work" },
  { value: "MISSING_WORK", label: "Work not started / abandoned" },
  { value: "SAFETY", label: "Safety hazard" },
  { value: "BUDGET", label: "Suspected misuse of funds" },
  { value: "OTHER", label: "Other concern" },
];
