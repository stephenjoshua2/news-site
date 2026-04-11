import type { ReactNode } from "react";

type StatCardTone = "default" | "accent" | "success" | "warning";

type StatCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  tone?: StatCardTone;
};

export function StatCard({
  label,
  value,
  description,
  tone = "default",
}: StatCardProps) {
  const className = tone === "default" ? "stat-card" : `stat-card stat-card-${tone}`;

  return (
    <article className={className}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {description ? <span className="stat-caption">{description}</span> : null}
    </article>
  );
}
