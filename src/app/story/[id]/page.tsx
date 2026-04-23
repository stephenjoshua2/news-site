import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/CommentSection";
import { StatePanel } from "@/components/StatePanel";
import { SubscribeForm } from "@/components/SubscribeForm";
import { ViewTracker } from "@/components/ViewTracker";
import { getCurrentAdminSession } from "@/lib/auth";
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
      <div className="max-w-4xl mx-auto py-20 px-6">
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
      <div className="max-w-4xl mx-auto py-20 px-6">
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
  const articleParagraphs = story.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="article-page bg-surface">
      <ViewTracker storyId={story.id} />
      {/* Article Hero */}
      <div className="article-hero bg-surface-strong">
         <div className="w-full relative min-h-[50vh] flex items-center justify-center overflow-hidden">
            {story.featured_image_url ? (
               <img src={story.featured_image_url} alt={story.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : story.video_url ? (
               <video controls src={story.video_url} className="absolute inset-0 w-full h-full object-cover"></video>
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-muted font-headline italic">No media available</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80"></div>
            
            <div className="relative z-10 max-w-screen-xl mx-auto px-6 w-full pt-32 pb-16 flex flex-col justify-end text-white h-full">
               <span className="font-bold text-xs uppercase tracking-[0.2em] mb-4 text-primary bg-white/10 backdrop-blur w-fit px-3 py-1 border border-white/20">
                 {story.category}
               </span>
               <h1 className="font-headline text-5xl md:text-7xl font-black leading-tight tracking-tight max-w-4xl drop-shadow-lg">
                 {story.title}
               </h1>
            </div>
         </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-16">
         {/* Sidebar Left: Author/Meta */}
         <aside className="lg:w-1/5 flex-shrink-0">
            <div className="sticky top-32 flex flex-col gap-8">
               <div className="meta-block">
                 <h4 className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 border-b border-border pb-2">By</h4>
                 <p className="font-headline font-bold text-lg text-on-surface">Newsroom Desk</p>
               </div>
               <div className="meta-block">
                 <h4 className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 border-b border-border pb-2">Published</h4>
                 <p className="font-bold text-sm text-on-surface">{dateFormatter.format(primaryDate)}</p>
               </div>
               {story.location && (
                 <div className="meta-block">
                   <h4 className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 border-b border-border pb-2">Location</h4>
                   <p className="font-bold text-sm text-on-surface">{story.location}</p>
                 </div>
               )}
            </div>
         </aside>

         {/* Core Article Area */}
         <article className="lg:w-3/5 prose prose-stone lg:prose-lg max-w-none prose-p:font-body prose-headings:font-headline font-medium text-on-surface">
            {/* Standfirst / Excerpt */}
            <p className="font-headline text-2xl md:text-3xl italic leading-relaxed text-primary mb-12 border-l-4 border-primary pl-6">
               {story.excerpt}
            </p>

            {/* Dropped Cap on first paragraph logic */}
            <div className="article-body-content mt-8 text-lg font-medium leading-[2]">
              {articleParagraphs.map((par, idx) => {
                if (idx === 0) {
                  return (
                    <p key={idx} className="first-letter:float-left first-letter:text-7xl first-letter:font-black first-letter:font-headline first-letter:text-primary first-letter:mr-3 first-letter:mt-1 mb-8">
                      {par}
                    </p>
                  );
                }
                return <p key={idx} className="mb-8">{par}</p>;
              })}
            </div>
            
            {/* Story Discussion */}
            <div className="mt-16 pt-8 border-t border-border">
          <CommentSection storyId={story.id} initialComments={comments} isAdmin={isAdmin} />
        </div>
         </article>

         {/* Sidebar Right: Recommended */}
         <aside className="lg:w-1/5 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border pt-12 lg:pt-0 lg:pl-10">
            <div className="sticky top-32">
               <h4 className="font-headline font-black italic text-2xl mb-8 flex items-center gap-2">
                  <span className="w-4 h-4 bg-primary block"></span>
                  Recommended
               </h4>
               
               <div className="flex flex-col gap-8">
                  {relatedStories.map((relStory) => (
                    <Link href={`/story/${relStory.id}`} key={relStory.id} className="group block">
                       <span className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2 block">{relStory.category}</span>
                       <h5 className="font-headline font-bold text-lg leading-tight group-hover:text-primary transition-colors">{relStory.title}</h5>
                    </Link>
                  ))}
               </div>

               <div className="mt-16 bg-surface-muted p-6 rounded border-l-2 border-border">
                 <h4 className="font-bold text-xs uppercase tracking-widest mb-4">Stay Briefed</h4>
                 <SubscribeForm />
               </div>
            </div>
         </aside>
      </main>
    </div>
  );
}
