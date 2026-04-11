"use client";

import Link from "next/link";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-stack">
      <section className="state-panel state-panel-error">
        <div className="state-panel-copy">
          <span className="eyebrow">Unexpected Error</span>
          <h1 className="section-title">The newsroom ran into a problem</h1>
          <p>
            Please try again. If the issue continues, check the Supabase
            connection and return to the homepage.
          </p>
        </div>
        <div className="state-panel-actions">
          <button className="button" onClick={() => reset()} type="button">
            Try again
          </button>
          <Link className="button secondary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </div>
  );
}
