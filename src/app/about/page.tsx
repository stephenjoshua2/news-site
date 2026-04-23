import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getSiteSettings() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("site_settings").select("*").single();

  if (error) {
    return null;
  }

  return data as any;
}

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="about-page">
      <main className="max-w-screen-xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 flex flex-col gap-8">
             <div className="border-l-4 border-primary pl-8 mb-8">
               <h1 className="font-headline text-5xl md:text-7xl font-black leading-tight tracking-tight mb-4 text-on-surface">
                  The Newsroom Desk
               </h1>
               <div className="text-muted text-xl uppercase tracking-widest font-bold font-sans">
                  Solo Editorial & Documentary Coverage
               </div>
             </div>

             <article className="prose prose-stone max-w-none prose-lg">
                <p className="font-headline text-2xl italic text-on-surface leading-relaxed border-b border-border pb-8">
                   Welcome to the newsroom. This platform is an independent journalism endeavor producing rigorous reporting, structural investigations, and cultural analysis.
                </p>
                <div className="mt-8 text-on-surface text-lg leading-loose whitespace-pre-wrap">
                   {settings?.author_bio || "The Lead Editorial desk operates this publication autonomously. We focus on clear investigations and verified news items that matter."}
                </div>
                
                <div className="mt-16 bg-surface-muted p-8 rounded-lg border-l-4 border-border">
                  <h3 className="font-bold uppercase tracking-widest text-sm text-primary mb-4">What This Publication Covers</h3>
                  <ul className="list-disc pl-5 space-y-2 text-on-surface-variant font-medium">
                    <li>Long-form Investigations</li>
                    <li>Political Analysis and Geopolitics</li>
                    <li>Structural Business Reporting</li>
                    <li>Technology and Future Infrastructure</li>
                    <li>Culture and Information Architecture</li>
                  </ul>
                </div>
             </article>
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-10">
             <div className="border-b-2 border-primary w-24 mb-4"></div>
             <h3 className="font-headline text-2xl font-bold uppercase tracking-tight italic">Contact & Network</h3>
             
             <div className="flex flex-col gap-6">
                {settings?.social_twitter && (
                  <a href={settings.social_twitter} className="flex items-center gap-4 group">
                     <span className="w-12 h-12 bg-surface-muted flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">XP</span>
                     <div>
                       <div className="font-bold text-sm uppercase tracking-widest group-hover:text-primary transition-colors">Follow on X</div>
                       <div className="text-xs text-muted">Real-time updates</div>
                     </div>
                  </a>
                )}
                {settings?.social_linkedin && (
                  <a href={settings.social_linkedin} className="flex items-center gap-4 group">
                     <span className="w-12 h-12 bg-surface-muted flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">In</span>
                     <div>
                       <div className="font-bold text-sm uppercase tracking-widest group-hover:text-primary transition-colors">Professional Network</div>
                       <div className="text-xs text-muted">LinkedIn</div>
                     </div>
                  </a>
                )}
                <Link href="/contact" className="flex items-center gap-4 group mt-4">
                   <span className="w-12 h-12 bg-primary text-white flex items-center justify-center font-bold">@</span>
                   <div>
                     <div className="font-bold text-sm uppercase tracking-widest text-primary">Get In Touch</div>
                     <div className="text-xs text-muted">Secure Contact Desk</div>
                   </div>
                </Link>
             </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
