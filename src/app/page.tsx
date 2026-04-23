import Link from "next/link";
import { StatePanel } from "@/components/StatePanel";
import { SubscribeForm } from "@/components/SubscribeForm";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPublishedStories(): Promise<{
  error: boolean;
  stories: Story[];
}> {
  if (!hasSupabaseEnv()) {
    return {
      error: false,
      stories: [],
    };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  return {
    error: Boolean(error),
    stories: data ?? [],
  };
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateString));
}

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export default async function HomePage() {
  const { error: storiesLoadFailed, stories } = await getPublishedStories();

  const featuredStory = stories[0];
  const spotlightStories = featuredStory ? stories.slice(1, 4) : [];
  const latestGridStories = stories.slice(4, 8);
  const remainingStories = stories.slice(8);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  });
  
  if (!hasSupabaseEnv()) {
    return (
      <div className="home-container">
        <StatePanel
          description="The publishing backend is not configured yet, so the homepage cannot load live stories right now."
          eyebrow="Newsroom Offline"
          title="Stories are temporarily unavailable"
          titleAs="h1"
          tone="warning"
        />
      </div>
    );
  }

  if (storiesLoadFailed) {
    return (
      <div className="home-container">
        <StatePanel
          description="Published stories could not be loaded from the newsroom database just now. Please refresh and try again."
          eyebrow="Load Failed"
          title="The front page is temporarily unavailable"
          titleAs="h1"
          tone="error"
        />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="home-container">
        <StatePanel
          actions={<Link className="btn-utility p-3" href="/login">Editor login</Link>}
          description="The editor can sign in, create a story, and publish it to make it appear here for readers."
          eyebrow="No Stories Yet"
          title="No published stories are live right now"
          titleAs="h1"
        />
      </div>
    );
  }

  return (
    <div className="home-page-redesigned w-full">
      {/* Breaking News Marquee */}
      {stories.length > 0 && (
        <div className="breaking-strip">
          <div className="breaking-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>Breaking</span>
          </div>
          <div className="marquee-container">
            <div className="marquee-content inline-flex gap-12 font-medium text-sm">
              {stories.slice(0, 5).map(s => (
                <span key={s.id}>{s.title}</span>
              ))}
              {/* Duplicate for infinite effect */}
              {stories.slice(0, 5).map(s => (
                <span key={`dup-${s.id}`}>{s.title}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="home-container px-6 py-12 max-w-screen-2xl mx-auto block w-full">
        {/* Lead Grid */}
        {/* Lead Grid */}
        {featuredStory && (
          <div className="lead-grid flex flex-col lg:flex-row gap-12">
            <div className="lead-main flex flex-col lg:w-2/3">
              <Link href={`/story/${featuredStory.id}`} className="block relative group cursor-pointer overflow-hidden rounded">
                <div className="aspect-video w-full bg-surface-strong overflow-hidden relative">
                   {featuredStory.featured_image_url ? (
                     <img src={featuredStory.featured_image_url} alt={featuredStory.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-muted font-headline italic">No Feature Image</div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                   <div className="absolute top-6 left-6">
                     <span className="bg-primary text-white px-3 py-1 font-bold text-xs uppercase tracking-widest">{featuredStory.category}</span>
                   </div>
                </div>
              </Link>
              
              <div className="lead-article-card">
                <Link href={`/story/${featuredStory.id}`}>
                  <h2 className="font-headline text-5xl font-bold text-on-surface leading-tight mb-4 hover:text-primary transition-colors">
                    {featuredStory.title}
                  </h2>
                </Link>
                <p className="text-muted text-lg leading-relaxed mb-6">
                  {featuredStory.excerpt}
                </p>
                <div className="meta-strip">
                  <span>Independent Reporting</span>
                  <span className="dot"></span>
                  <span>{formatDate(featuredStory.published_at || featuredStory.created_at)}</span>
                  {featuredStory.location && (
                    <>
                      <span className="dot"></span>
                      <span>{featuredStory.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar More Coverage */}
            <aside className="lead-sidebar lg:w-1/3">
              <div className="section-divider"></div>
              <h3 className="font-headline text-2xl font-bold uppercase italic tracking-tight mb-8">More Coverage</h3>
              
              <div className="sidebar-stories flex-col gap-6">
                {spotlightStories.map(story => (
                  <Link href={`/story/${story.id}`} key={story.id} className="sidebar-story-card flex gap-4 group cursor-pointer mb-6">
                    <div className="sidebar-img-wrapper w-24 h-24 flex-shrink-0 bg-surface-strong overflow-hidden rounded-sm">
                      {story.featured_image_url && (
                        <img src={story.featured_image_url} alt={story.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                       <span className="text-primary font-bold text-[9px] uppercase tracking-widest mb-1">{story.category}</span>
                       <h4 className="font-headline text-lg font-bold leading-tight group-hover:text-primary transition-colors">{story.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Newsletter Component Instance */}
              <div className="mt-8">
                <SubscribeForm />
              </div>
            </aside>
          </div>
        )}

        {/* Latest Stories 4-Col Grid */}
        {latestGridStories.length > 0 && (
          <section className="latest-section mt-24">
             <div className="section-header-row flex items-end gap-6 mb-12">
                <h3 className="font-headline text-4xl font-black italic tracking-tighter">Latest Stories</h3>
                <div className="flex-1 border-b border-border h-4 mb-2"></div>
                <Link href="#archive" className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 group">
                   View Archive <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {latestGridStories.map(story => (
                  <Link href={`/story/${story.id}`} key={story.id} className="flex flex-col group cursor-pointer">
                     <div className="aspect-[4/5] overflow-hidden rounded-sm mb-4 bg-surface-strong">
                        {story.featured_image_url && (
                          <img src={story.featured_image_url} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        )}
                     </div>
                     <span className="text-primary font-bold text-[9px] uppercase tracking-widest mb-2">{story.category}</span>
                     <h4 className="font-headline text-xl font-bold leading-tight mb-2 group-hover:underline underline-offset-4 decoration-1">{story.title}</h4>
                     <p className="text-xs text-muted line-clamp-2">{story.excerpt}</p>
                  </Link>
                ))}
             </div>
          </section>
        )}

        {/* Top News Density List */}
        {remainingStories.length > 0 && (
          <section id="archive" className="top-news-section mt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 bg-surface-muted p-12 rounded-xl">
             <div className="lg:col-span-4">
                <h3 className="font-headline text-5xl font-black text-primary leading-none mb-4">Top News</h3>
                <p className="text-muted font-medium leading-relaxed mb-8">The defining events of the last 24 hours, contextualized by our editorial desk.</p>
                <div className="live-update-box bg-white/50 backdrop-blur p-6 rounded-lg border border-border">
                   <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Live Update</h5>
                   <p className="text-sm font-semibold">{remainingStories[0]?.title}</p>
                </div>
             </div>
             
             <div className="lg:col-span-8">
                <div className="divide-y divide-border">
                   {remainingStories.map(story => (
                     <Link href={`/story/${story.id}`} key={story.id} className="py-6 flex justify-between items-start group cursor-pointer block">
                         <div className="max-w-xl">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-2 block">
                              {formatTime(story.published_at || story.created_at)} • {story.category}
                            </span>
                            <h4 className="font-headline text-2xl font-bold group-hover:text-primary transition-colors">{story.title}</h4>
                         </div>
                         <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 text-primary font-bold text-xl">→</span>
                     </Link>
                   ))}
                </div>
             </div>
          </section>
        )}
      </main>
    </div>
  );
}
