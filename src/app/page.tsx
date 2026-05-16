import Link from "next/link";
import { StatePanel } from "@/components/StatePanel";
import { SubscribeForm } from "@/components/SubscribeForm";
import { formatCategoryLabel, slugifyCategory } from "@/lib/site";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

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

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { error: storiesLoadFailed, stories } = await getPublishedStories();
  const selectedCategory = readParam(searchParams?.category);
  const categoryLabel = selectedCategory
    ? formatCategoryLabel(selectedCategory.replace(/-/g, " "))
    : null;
  const visibleStories = selectedCategory
    ? stories.filter((story) => slugifyCategory(story.category) === selectedCategory)
    : stories;

  const featuredStory = visibleStories[0];
  const spotlightStories = featuredStory ? visibleStories.slice(1, 4) : [];
  const latestGridStories = visibleStories.slice(4, 8);
  const remainingStories = visibleStories.slice(8);

  if (!hasSupabaseEnv()) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
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
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
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

  if (visibleStories.length === 0) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <StatePanel
          actions={selectedCategory ? <Link className="bg-primary text-white px-4 py-2 uppercase font-bold text-xs" href="/">Return to all stories</Link> : undefined}
          description={selectedCategory ? "There are no published stories in this section right now." : "The editor can sign in, create a story, and publish it to make it appear here for readers."}
          eyebrow={selectedCategory ? "No Section Stories" : "No Stories Yet"}
          title={selectedCategory ? `${categoryLabel} is empty right now` : "No published stories are live right now"}
          titleAs="h1"
        />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .marquee-container { overflow: hidden; white-space: nowrap; min-width: 0; }
        .marquee-content { display: inline-block; animation: marquee 30s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}} />

      {/* Breaking News Marquee */}
      {visibleStories.length > 0 && (
        <div className="bg-primary-container text-on-primary py-2 overflow-hidden flex items-center">
          <div className="px-3 sm:px-5 flex-shrink-0 flex items-center gap-2 border-r border-white/20 mr-3 sm:mr-4">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-on-primary"></span>
            <span className="font-label font-bold text-xs uppercase tracking-widest">Breaking</span>
          </div>
          <div className="marquee-container flex-1">
            <div className="marquee-content inline-flex gap-8 sm:gap-12 text-xs sm:text-sm font-medium">
              {visibleStories.slice(0, 5).map(s => (
                <span className="max-w-[72vw] sm:max-w-none overflow-hidden text-ellipsis" key={s.id}>{s.title}</span>
              ))}
              {visibleStories.slice(0, 5).map(s => (
                <span className="max-w-[72vw] sm:max-w-none overflow-hidden text-ellipsis" key={`dup-${s.id}`}>{s.title}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 md:py-12 overflow-hidden">
        {categoryLabel && (
          <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 border-b-2 border-primary/20 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Section</p>
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tight">{categoryLabel}</h1>
            </div>
            <Link href="/" className="min-h-10 inline-flex items-center font-label text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-primary">
              All Stories &rarr;
            </Link>
          </div>
        )}

        {/* Hero & Sidebar Section */}
        {featuredStory && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Lead Story */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <Link href={`/story/${featuredStory.id}`} className="group cursor-pointer flex flex-col gap-4">
                <div className="w-full bg-surface-container-highest overflow-hidden rounded-sm aspect-[16/9]">
                  {featuredStory.featured_image_url ? (
                    <img
                      src={featuredStory.featured_image_url}
                      alt={featuredStory.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-headline italic">No Feature Image</div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-primary font-label text-[10px] font-bold uppercase tracking-widest">
                      {featuredStory.category}
                    </span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                    <span className="text-zinc-500 font-label text-[10px] font-bold uppercase tracking-widest">
                      {formatDate(featuredStory.published_at || featuredStory.created_at)}
                    </span>
                  </div>
                  <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface leading-[1.08] tracking-tight group-hover:text-primary transition-colors">
                    {featuredStory.title}
                  </h2>
                  <p className="font-body text-on-surface-variant text-base sm:text-lg leading-relaxed max-w-3xl">
                    {featuredStory.excerpt}
                  </p>
                </div>
              </Link>
            </div>

            {/* "More Coverage" Sidebar */}
            <aside className="lg:col-span-4 flex flex-col gap-7 md:gap-8 border-t-2 lg:border-t-0 lg:border-l-2 border-outline-variant/30 pt-8 lg:pt-0 lg:pl-8">
              <h3 className="font-headline text-xl font-black uppercase tracking-tight italic text-primary">More Coverage</h3>

              <div className="flex flex-col gap-6 divide-y divide-outline-variant/20">
                {spotlightStories.map((story, idx) => (
                  <Link href={`/story/${story.id}`} key={story.id} className={`group cursor-pointer flex flex-col gap-3 ${idx > 0 ? 'pt-6' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-primary font-label text-[9px] font-bold uppercase tracking-widest">{story.category}</span>
                      <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                      <span className="text-zinc-500 font-label text-[9px] font-bold uppercase tracking-widest">
                        {formatTime(story.published_at || story.created_at)}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <h4 className="font-headline text-lg sm:text-xl font-bold leading-tight group-hover:text-primary transition-colors flex-1">{story.title}</h4>
                      {story.featured_image_url && (
                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-surface-container-low rounded-sm">
                          <img
                            src={story.featured_image_url}
                            alt={story.title}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 md:mt-8 p-5 sm:p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-sm">
                <h5 className="font-headline text-xl font-bold mb-2 italic">The Curator's Digest</h5>
                <p className="text-sm text-on-surface-variant mb-4">Every Sunday morning, the stories that actually matter, curated for your inbox.</p>
                <SubscribeForm />
              </div>
            </aside>
          </div>
        )}

        {/* Latest Stories Grid */}
        {latestGridStories.length > 0 && (
          <section className="mt-16 md:mt-20 pt-10 md:pt-12 border-t-2 border-outline-variant/30">
            <div className="flex items-end justify-between gap-4 sm:gap-6 mb-8 md:mb-10">
              <h3 className="font-headline text-3xl font-black italic tracking-tight">Latest Stories</h3>
              <Link href="#archive" className="min-h-10 font-label text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 group text-zinc-500 hover:text-primary">
                View Archive
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 md:gap-8">
              {latestGridStories.map(story => (
                <Link href={`/story/${story.id}`} key={story.id} className="flex flex-col group cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden rounded-sm mb-4 bg-surface-container-highest">
                    {story.featured_image_url && (
                      <img
                        src={story.featured_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <span className="text-primary font-label text-[9px] font-bold uppercase tracking-widest mb-2">{story.category}</span>
                  <h4 className="font-headline text-lg font-bold leading-snug mb-2 group-hover:text-primary transition-colors">{story.title}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{story.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top News Density List */}
        {remainingStories.length > 0 && (
          <section id="archive" className="mt-16 md:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-10 md:pt-12 border-t border-outline-variant/30">
            <div className="lg:col-span-4">
              <h3 className="font-headline text-3xl sm:text-4xl font-black text-primary leading-none mb-4 italic tracking-tight">The Archive</h3>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-8">The defining events of the last 24 hours, contextualized by our editorial desk.</p>

              {remainingStories[0] && (
                <div className="bg-surface-container-lowest p-6 rounded-sm border border-outline-variant/30">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Featured from Archive</h5>
                  <div className="flex flex-col gap-2">
                    <h6 className="font-headline text-xl font-bold leading-tight">{remainingStories[0].title}</h6>
                    <p className="text-xs text-on-surface-variant line-clamp-3">{remainingStories[0].excerpt}</p>
                    <Link href={`/story/${remainingStories[0].id}`} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline mt-2 inline-block">
                      Read Story &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8">
              <div className="divide-y divide-outline-variant/20 border-y border-outline-variant/20">
                {remainingStories.map(story => (
                  <Link href={`/story/${story.id}`} key={story.id} className="py-5 flex justify-between items-start gap-4 group cursor-pointer block hover:bg-surface-container-lowest transition-colors px-2 -mx-2">
                    <div className="max-w-2xl">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">
                        {formatDate(story.published_at || story.created_at)} &bull; {story.category}
                      </span>
                      <h4 className="font-headline text-lg sm:text-xl font-bold group-hover:text-primary transition-colors leading-snug">{story.title}</h4>
                    </div>
                    <span aria-hidden="true" className="hidden sm:inline text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
