import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corrections Policy",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="font-headline text-5xl font-black mb-6">Corrections Policy</h1>
      <div className="prose prose-stone max-w-none text-on-surface">
        <p>
          Accuracy is central to public trust. Signal Press reviews credible
          correction requests and updates stories when material facts are wrong,
          incomplete, or missing necessary context.
        </p>
        <h2>How to request a correction</h2>
        <p>
          Send the article title or URL, the specific sentence or claim at issue,
          the correction you believe is needed, and supporting evidence through
          the Contact Desk.
        </p>
        <h2>How corrections are handled</h2>
        <p>
          Material corrections should be made transparently. Minor spelling,
          grammar, or formatting fixes may be corrected without a public note if
          they do not affect meaning.
        </p>
        <h2>Right of reply</h2>
        <p>
          People or organizations named in reporting may contact the newsroom to
          request a fair opportunity to respond where appropriate.
        </p>
      </div>
    </div>
  );
}
