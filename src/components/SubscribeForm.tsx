export function SubscribeForm() {
  const embedUrl = process.env.NEXT_PUBLIC_SUBSTACK_EMBED_URL?.trim();

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="subscribe-form-container">
      <h5 className="font-headline text-xl font-bold mb-2 italic">The Curator's Digest</h5>
      <p className="text-sm text-on-surface-variant mb-4 opacity-80">
        Every Sunday morning, the stories that actually matter, curated for your inbox.
      </p>

      <div className="w-full bg-surface border border-outline-variant overflow-hidden min-h-[150px] relative">
        <iframe 
          src={embedUrl}
          title="Newsletter signup"
          width="100%" 
          height="150" 
          style={{ background: "transparent" }} 
          frameBorder="0" 
          scrolling="no"
        ></iframe>
      </div>
    </div>
  );
}
