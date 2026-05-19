"use client";

import { useEffect, useState } from "react";

type ShareStoryButtonProps = {
  title: string;
  text?: string;
  url?: string;
  label?: string;
  copiedLabel?: string;
  preferNativeShare?: boolean;
  className?: string;
};

type ShareStatus = "idle" | "success" | "error";

function getBrowserUrl(fallback?: string) {
  if (fallback) {
    return fallback;
  }

  if (typeof window !== "undefined") {
    return window.location.href;
  }

  return "";
}

async function copyToClipboard(value: string) {
  const browserNavigator = typeof window !== "undefined" ? window.navigator : undefined;

  if (browserNavigator?.clipboard?.writeText) {
    await browserNavigator.clipboard.writeText(value);
    return;
  }

  if (typeof document.execCommand !== "function") {
    throw new Error("Clipboard is unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

export function ShareStoryButton({
  title,
  text,
  url,
  label = "Share story",
  copiedLabel = "Link copied",
  preferNativeShare = true,
  className = "min-h-12 inline-flex items-center justify-center border border-primary/40 px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-colors",
}: ShareStoryButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setStatus("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function handleShare() {
    const shareUrl = getBrowserUrl(url);

    if (!shareUrl) {
      setStatus("error");
      return;
    }

    const browserNavigator = typeof window !== "undefined" ? window.navigator : undefined;

    if (preferNativeShare && browserNavigator?.share) {
      try {
        await browserNavigator.share({
          title,
          text,
          url: shareUrl,
        });
        setStatus("success");
        return;
      } catch (error) {
        if (
          typeof DOMException !== "undefined" &&
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          setStatus("idle");
          return;
        }
      }
    }

    try {
      await copyToClipboard(shareUrl);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button className={className} type="button" onClick={handleShare}>
        {status === "success" ? copiedLabel : label}
      </button>
      <span className="min-h-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant" role="status" aria-live="polite">
        {status === "error" ? "Unable to copy link" : ""}
      </span>
    </div>
  );
}
