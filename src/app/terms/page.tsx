import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="font-headline text-5xl font-black mb-6">Terms of Use</h1>
      <div className="prose prose-stone max-w-none text-on-surface">
        <p>
          By using Signal Press, you agree to use the site lawfully and to avoid
          interfering with the publication, its readers, or its reporting.
        </p>
        <h2>Reader comments</h2>
        <p>
          Comments publish immediately when accepted by automatic safeguards.
          We may remove comments that are abusive, defamatory, spammy,
          impersonating, threatening, unlawful, or unrelated to the report.
        </p>
        <h2>Editorial content</h2>
        <p>
          Articles are provided for public information and analysis. We work to
          correct material errors promptly, but the site does not provide legal,
          financial, medical, or professional advice.
        </p>
        <h2>Intellectual property</h2>
        <p>
          Unless otherwise stated, articles, images, layout, and branding are
          owned by the publication or used with permission. Do not republish full
          articles without permission.
        </p>
        <h2>Changes</h2>
        <p>
          These terms may be updated as the publication grows. Continued use of
          the site means you accept the current terms.
        </p>
      </div>
    </div>
  );
}
