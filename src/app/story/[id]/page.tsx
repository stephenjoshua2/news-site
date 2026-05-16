import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/CommentSection";
import { StatePanel } from "@/components/StatePanel";
import { SubscribeForm } from "@/components/SubscribeForm";
import { ViewTracker } from "@/components/ViewTracker";
import { getCurrentAdminSession } from "@/lib/auth";
import { getCanonicalUrl, SITE_NAME, toJsonLd } from "@/lib/site";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Comment, Story } from "@/lib/types";

export const dynamic = "force-dynamic";

type StoryPageProps = {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

type StoryPageData = {
  comments: Comment[];
  commentsError: boolean;
  relatedStories: Story[];
  story: Story | null;
  storyError: boolean;
  isAdmin: boolean;
};

const storyMessages: Record<string, string> = {
  "comment-posted": "Your comment has been posted.",
  "comment-save-failed": "The comment could not be saved right now.",
  "comment-story": "This story is no longer accepting comments.",
  "comment-validation": "Please enter both your name and a message.",
  "missing-config": "The newsroom is temporarily unavailable.",
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

async function getPublishedStory(id: string): Promise<Story | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  return data;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const story = await getPublishedStory(params.id);

  if (!story) {
    return {
      title: "Story not found",
    };
  }

  const canonical = `/story/${story.id}`;

  return {
    title: story.title,
    description: story.excerpt,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title: story.title,
      description: story.excerpt,
      url: canonical,
      publishedTime: story.published_at ?? story.created_at,
      modifiedTime: story.updated_at,
      section: story.category,
      images: story.featured_image_url ? [{ url: story.featured_image_url }] : undefined,
    },
  };
}

async function getStoryPageData(id: string): Promise<StoryPageData> {
  const { isAdmin } = await getCurrentAdminSession();
  const supabase = createSupabaseServerClient();
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (storyError && storyError.code !== "PGRST116") {
    return {
      comments: [],
      commentsError: false,
      relatedStories: [],
      story: null,
      storyError: true,
      isAdmin,
    };
  }

  if (!story) {
    return {
      comments: [],
      commentsError: false,
      relatedStories: [],
      story: null,
      storyError: false,
      isAdmin,
    };
  }

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("*")
    .eq("story_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: relatedStories } = await supabase
    .from("stories")
    .select("*")
    .neq("id", id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  return {
    comments: comments ?? [],
    commentsError: Boolean(commentsError),
    relatedStories: relatedStories ?? [],
    story,
    storyError: false,
    isAdmin,
  };
}

export default async function StoryPage({
  params,
  searchParams,
}: StoryPageProps) {
  if (!hasSupabaseEnv()) {
    return (
      <div className="max-w-4xl mx-auto py-14 sm:py-20 px-4 sm:px-6">
        <StatePanel
          description="The publishing backend is not configured correctly yet."
          eyebrow="Newsroom Offline"
          title="This story is temporarily unavailable"
          titleAs="h1"
          tone="warning"
        />
      </div>
    );
  }

  const {
    story,
    comments,
    commentsError,
    relatedStories,
    storyError,
    isAdmin,
  } = await getStoryPageData(params.id);

  if (storyError || !story) {
    return (
      <div className="max-w-4xl mx-auto py-14 sm:py-20 px-4 sm:px-6">
        {storyError ? (
          <StatePanel
            actions={<Link className="bg-primary text-white px-4 py-2 uppercase font-bold text-xs" href="/">Return to front page</Link>}
            description="The article could not be loaded from the newsroom database right now. Please refresh and try again."
            eyebrow="Load Failed"
            title="This report is temporarily unavailable"
            titleAs="h1"
            tone="error"
          />
        ) : (
          notFound()
        )}
      </div>
    );
  }

  const primaryDate = new Date(story.published_at ?? story.created_at);
  const storyUrl = getCanonicalUrl(`/story/${story.id}`);
  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.excerpt,
    datePublished: story.published_at ?? story.created_at,
    dateModified: story.updated_at,
    mainEntityOfPage: storyUrl,
    url: storyUrl,
    articleSection: story.category,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    image: story.featured_image_url ? [story.featured_image_url] : undefined,
  };
  const articleParagraphs = story.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="bg-surface text-on-surface scroll-smooth min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(newsArticleJsonLd) }}
      />
      <ViewTracker storyId={story.id} />

      <main className="pt-10 sm:pt-14 lg:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Article Header Section */}
        <header className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
            <span className="bg-primary text-on-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {story.category}
            </span>
            {story.location && (
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                {story.location}
              </span>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black font-headline leading-[1.05] tracking-tight mb-6 sm:mb-8">
            {story.title}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 sm:gap-8 items-end border-t border-outline-variant/20 pt-6 sm:pt-8">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary font-headline flex-shrink-0">
                {SITE_NAME.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm font-bold">Newsroom Desk</p>
                <p className="font-sans text-xs text-on-surface-variant uppercase tracking-widest">Editorial Team</p>
              </div>
            </div>
            <div className="text-left sm:text-right flex flex-col gap-1">
              <p className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest">Published {dateFormatter.format(primaryDate)}</p>
              {story.updated_at && story.updated_at !== story.created_at && (
                <p className="font-sans text-[10px] text-primary font-bold uppercase tracking-widest">Updated</p>
              )}
            </div>
          </div>
        </header>

        {/* Lead Visual */}
        <section className="max-w-4xl mx-auto mb-10 sm:mb-12 relative">
          <div className="aspect-[4/3] sm:aspect-video w-full overflow-hidden bg-surface-container-highest">
            {story.featured_image_url ? (
              <img src={story.featured_image_url} alt={story.title} className="w-full h-full object-cover" />
            ) : story.video_url ? (
              <video controls src={story.video_url} className="w-full h-full object-cover"></video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted font-headline italic text-sm sm:text-base">No media available</div>
            )}
          </div>
        </section>

        {/* Article Content */}
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-14">
          <article className="flex-1 min-w-0 max-w-3xl">
            <div className="font-headline text-xl sm:text-2xl font-medium leading-relaxed mb-8 sm:mb-10 text-on-surface/90 border-l-4 border-primary pl-5 sm:pl-8 italic">
              {story.excerpt}
            </div>
            <div className="text-on-surface text-base sm:text-lg font-body leading-relaxed sm:leading-loose space-y-6 sm:space-y-7">
              {articleParagraphs.map((par, idx) => (
                <p key={idx}>{par}</p>
              ))}
            </div>

            {/* Comments Section */}
            <section className="mt-14 sm:mt-20 pt-8 sm:pt-10 border-t border-outline-variant/20">
              <CommentSection storyId={story.id} initialComments={comments} isAdmin={isAdmin} />
            </section>
          </article>

          {/* Sidebar: Related Stories */}
          <aside className="w-full lg:w-80 flex flex-col gap-10 lg:flex-shrink-0">
            <div>
              <h4 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 border-b-2 border-primary pb-2 inline-block">Recommended</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-8">
                {relatedStories.map((relStory) => (
                  <article className="group" key={relStory.id}>
                    <Link href={`/story/${relStory.id}`}>
                      <div className="aspect-[4/3] w-full overflow-hidden bg-surface-container-highest mb-3">
                        {relStory.featured_image_url ? (
                          <img src={relStory.featured_image_url} alt={relStory.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Image</div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{relStory.category}</span>
                      <h5 className="font-headline text-lg sm:text-xl font-bold leading-tight group-hover:underline mt-1">{relStory.title}</h5>
                    </Link>
                  </article>
                ))}
              </div>
            </div>

            {/* Newsletter Card */}
            <div className="bg-primary p-6 sm:p-8 text-on-primary">
              <h4 className="font-serif font-headline text-2xl font-bold mb-4">The Morning Brief</h4>
              <p className="text-sm opacity-80 mb-6">Get the most important stories delivered to your inbox every weekday morning.</p>
              <SubscribeForm />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
