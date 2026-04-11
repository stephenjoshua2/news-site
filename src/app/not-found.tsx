import Link from "next/link";

import { StatePanel } from "@/components/StatePanel";

export default function NotFoundPage() {
  return (
    <div className="page-stack">
      <StatePanel
        actions={
          <Link className="button" href="/">
            Return to homepage
          </Link>
        }
        description="The story may have been removed, unpublished, or the link may be incomplete."
        eyebrow="Not Found"
        title="The requested page could not be found"
        titleAs="h1"
        tone="warning"
      />
    </div>
  );
}
