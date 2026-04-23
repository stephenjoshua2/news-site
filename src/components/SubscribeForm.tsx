export function SubscribeForm() {
  return (
    <div className="subscribe-form-container">
      <h5 className="font-headline text-xl font-bold mb-2 italic">The Curator's Digest</h5>
      <p className="text-sm text-on-surface-variant mb-4 opacity-80">
        Every Sunday morning, the stories that actually matter, curated for your inbox.
      </p>

      {/* Substack Embed Integration */}
      <div className="w-full bg-surface border border-outline-variant overflow-hidden min-h-[150px] relative">
        <iframe 
          src="https://yourpublication.substack.com/embed" 
          width="100%" 
          height="150" 
          style={{ background: "transparent" }} 
          frameBorder="0" 
          scrolling="no"
        ></iframe>
      </div>
      <p className="text-[10px] text-muted mt-2 text-center max-w-[90%] mx-auto relative z-10">
         * When you create your Substack account, replace "yourpublication.substack.com" inside <code className="bg-surface-strong px-1 rounded">src/components/SubscribeForm.tsx</code> with your actual Substack URL!
      </p>
    </div>
  );
}

