import type { StoryStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: StoryStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status === "published" ? "Published" : "Draft";

  return <span className={`status-badge status-badge-${status}`}>{label}</span>;
}
