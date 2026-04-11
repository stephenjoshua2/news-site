import { useId, type ReactNode } from "react";

type InlineMessageTone = "info" | "success" | "warning" | "error" | "destructive";

type InlineMessageProps = {
  children: ReactNode;
  title?: string;
  tone?: InlineMessageTone;
};

export function InlineMessage({
  children,
  title,
  tone = "info",
}: InlineMessageProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const contentId = `${baseId}-content`;
  const role =
    tone === "error" || tone === "warning" || tone === "destructive"
      ? "alert"
      : "status";
  const liveMode = role === "alert" ? "assertive" : "polite";
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <p>{children}</p>
    ) : (
      children
    );

  return (
    <div
      aria-atomic="true"
      aria-describedby={contentId}
      aria-live={liveMode}
      aria-labelledby={title ? titleId : contentId}
      className={`inline-message inline-message-${tone}`}
      role={role}
    >
      {title ? (
        <p className="inline-message-title" id={titleId}>
          {title}
        </p>
      ) : null}
      <div className="inline-message-copy" id={contentId}>
        {content}
      </div>
    </div>
  );
}
