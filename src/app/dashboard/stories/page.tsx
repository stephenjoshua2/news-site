import Link from "next/link";
import { InlineMessage } from "@/components/InlineMessage";
import { StatePanel } from "@/components/StatePanel";
import { StatusBadge } from "@/components/StatusBadge";
import { StoryForm } from "@/components/StoryForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { deleteStoryAction, saveStoryAction } from "../actions";

export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

async function getStoriesData(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("*")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false });

  if (storiesError || !stories || stories.length === 0) {
    return { stories: [], commentCountsByStory: {}, commentsLoadFailed: false, storiesLoadFailed: !!storiesError };
  }

  const storyIds = stories.map((story) => story.id);
  const { data: commentRows, error: commentsError } = await supabase
    .from("comments")
    .select("story_id")
    .in("story_id", storyIds);

  const commentCountsByStory = (commentRows || []).reduce<Record<string, number>>((counts, row) => {
    counts[row.story_id] = (counts[row.story_id] ?? 0) + 1;
    return counts;
  }, {});

  return { stories, commentCountsByStory, commentsLoadFailed: !!commentsError, storiesLoadFailed: false };
}

type StoriesPageProps = {
  searchParams?: { notice?: string; error?: string };
};

const noticeMessages: Record<string, string> = {
  "draft-saved": "Draft saved successfully",
  "story-published": "Story published successfully",
  "story-deleted": "Story deleted",
};

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const user = await requireAdminUser();
  const { stories, storiesLoadFailed, commentsLoadFailed, commentCountsByStory } = await getStoriesData(user.id);
  
  const noticeText = searchParams?.notice ? noticeMessages[searchParams.notice] : undefined;

  return (
    <>
      {noticeText && (
        <div className="mb-6">
          <InlineMessage tone="success" title="Success">{noticeText}</InlineMessage>
        </div>
      )}
      <div className="bg-surface p-8 rounded border border-border">
         <h2 className="font-headline text-2xl font-bold mb-6 italic border-b border-border pb-4">Story Library</h2>
         
         {storiesLoadFailed ? (
            <StatePanel title="Unavailable" description="Stories failed to load" eyebrow="Error" tone="error" />
         ) : stories.length === 0 ? (
            <StatePanel title="No stories yet" description="Start a draft below." eyebrow="Empty" tone="default" />
         ) : (
            <div className="flex flex-col gap-4">
               {stories.map(story => (
                  <details key={story.id} className="group bg-surface-muted border border-border rounded">
                     <summary className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-surface-strong transition-colors list-none">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                           <div className="flex items-center gap-3 min-w-0">
                              <StatusBadge status={story.status} />
                              <span className="font-bold text-lg font-headline truncate block min-w-0">{story.title}</span>
                           </div>
                           <span className="text-xs text-muted font-medium flex-shrink-0">Updated {dateTimeFormatter.format(new Date(story.updated_at))}</span>
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest text-primary mt-4 md:mt-0 group-open:hidden flex-shrink-0 md:ml-4">
                          Edit Options ↓
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest text-primary mt-4 md:mt-0 hidden group-open:block flex-shrink-0 md:ml-4">
                          Close ↑
                        </div>
                     </summary>
                     <div className="p-6 border-t border-border bg-white flex flex-col gap-6">
                        <div className="flex justify-between items-center bg-surface-muted p-4 rounded">
                           <div className="text-xs text-muted flex gap-4">
                              <span><strong>Comments:</strong> {commentsLoadFailed ? "-" : commentCountsByStory[story.id] ?? 0}</span>
                              <span><strong>Media:</strong> {story.featured_image_url ? "Image" : "None"}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             {story.status === "published" && (
                                <Link href={`/story/${story.id}`} className="px-4 py-2 border border-border text-xs font-bold uppercase hover:bg-surface-strong">View Live</Link>
                             )}
                             <form action={deleteStoryAction}>
                                <input type="hidden" name="story_id" value={story.id} />
                                <SubmitButton className="px-4 py-2 bg-danger-soft text-danger text-xs font-bold uppercase hover:opacity-80" pendingLabel="Deleting...">Delete</SubmitButton>
                             </form>
                           </div>
                        </div>
                        
                        <StoryForm action={saveStoryAction} story={story} title="Edit Story" description="" />
                     </div>
                  </details>
               ))}
            </div>
         )}
      </div>

      <div id="new-story" className="w-full">
         <div className="bg-surface p-8 pb-4 rounded-t border border-b-0 border-border border-l-4 border-l-primary">
            <h2 className="font-headline text-3xl font-black mb-2">Create a New Story</h2>
            <p className="text-sm text-muted font-medium">Drafting automatically saves securely to the editorial workspace.</p>
         </div>
         <div className="bg-surface p-8 pt-0 rounded-b border border-t-0 border-border border-l-4 border-l-primary">
           <StoryForm action={saveStoryAction} title="" description="" />
         </div>
      </div>
    </>
  );
}
