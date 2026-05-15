import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Standards",
  alternates: { canonical: "/editorial-standards" },
};

export default function EditorialStandardsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="font-headline text-5xl font-black mb-6">Editorial Standards</h1>
      <div className="prose prose-stone max-w-none text-on-surface">
        <p>
          Signal Press aims to publish independent journalism that is accurate,
          fair, clearly sourced, and accountable to readers.
        </p>
        <h2>Verification</h2>
        <p>
          We seek documentary evidence, direct observation, expert context, and
          fair opportunities for response when reporting consequential claims.
        </p>
        <h2>Independence</h2>
        <p>
          Editorial judgment should be separated from commercial, partner, or
          political pressure. Sponsored or partner material should be clearly
          labeled if introduced in the future.
        </p>
        <h2>Attribution</h2>
        <p>
          Sources, documents, and data should be attributed where possible while
          respecting legitimate safety and confidentiality concerns.
        </p>
        <h2>Comments</h2>
        <p>
          Reader comments are auto-published after automatic safeguards. The
          newsroom may remove abusive, spammy, defamatory, or off-topic material.
        </p>
      </div>
    </div>
  );
}
