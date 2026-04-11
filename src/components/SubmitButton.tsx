"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingBehavior?: "always" | "clicked";
  pendingLabel: ReactNode;
};

export function SubmitButton({
  children,
  disabled,
  onClick,
  pendingBehavior = "always",
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const [wasClicked, setWasClicked] = useState(false);

  useEffect(() => {
    if (!pending) {
      setWasClicked(false);
    }
  }, [pending]);

  const showPending = pending && (pendingBehavior === "always" || wasClicked);
  const isDisabled = Boolean(disabled) || pending;

  return (
    <button
      {...props}
      aria-busy={showPending ? "true" : undefined}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={(event) => {
        setWasClicked(true);
        onClick?.(event);
      }}
    >
      {showPending ? pendingLabel : children}
    </button>
  );
}
