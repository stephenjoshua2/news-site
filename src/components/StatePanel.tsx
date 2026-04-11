import { useId, type ReactNode } from "react";

type StatePanelTone = "default" | "info" | "success" | "warning" | "error";

type StatePanelProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  titleClassName?: string;
  tone?: StatePanelTone;
};

export function StatePanel({
  title,
  description,
  eyebrow,
  actions,
  children,
  titleAs = "h2",
  titleClassName = "section-title",
  tone = "default",
}: StatePanelProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const TitleTag = titleAs;
  const descriptionContent =
    typeof description === "string" || typeof description === "number" ? (
      <p>{description}</p>
    ) : (
      description
    );
  const panelClassName =
    tone === "default" ? "state-panel" : `state-panel state-panel-${tone}`;
  const role =
    tone === "error" || tone === "warning"
      ? "alert"
      : tone === "info" || tone === "success"
        ? "status"
        : "region";
  const liveMode =
    role === "alert" ? "assertive" : role === "status" ? "polite" : undefined;

  return (
    <section
      aria-describedby={descriptionContent ? descriptionId : undefined}
      aria-live={liveMode}
      aria-labelledby={titleId}
      className={panelClassName}
      role={role}
    >
      <div className="state-panel-copy">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <TitleTag className={titleClassName} id={titleId}>
          {title}
        </TitleTag>
        {descriptionContent ? <div id={descriptionId}>{descriptionContent}</div> : null}
      </div>
      {children}
      {actions ? <div className="state-panel-actions">{actions}</div> : null}
    </section>
  );
}
