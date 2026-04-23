"use client";

import { useEffect } from "react";

export function ViewTracker({ storyId }: { storyId: string }) {
  useEffect(() => {
    // Fire-and-forget — no need to block rendering
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId }),
    }).catch(() => {
      // Silently ignore — analytics should never break the reader experience
    });
  }, [storyId]);

  return null;
}
