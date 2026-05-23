"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function AutoScroller() {
  const searchParams = useSearchParams();
  const notice = searchParams?.get("notice");
  const error = searchParams?.get("error");

  useEffect(() => {
    if (notice || error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [notice, error]);

  return null;
}
