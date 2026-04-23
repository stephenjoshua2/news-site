import { requireAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const dashboardMessages: Record<string, string> = {
  "admin-setup": "Add the admin email to public.admin_users in Supabase before using dashboard write actions.",
  "image-size": "Featured image files must be 5 MB or smaller.",
  "image-type": "Featured image uploads must use an image file.",
  "image-url": "Featured image fallback URLs must start with http:// or https://.",
  "missing-config": "Supabase environment values are missing.",
  "storage-delete-failed": "A media file could not be removed from storage. The story was left unchanged.",
  "storage-upload-failed": "A media upload failed. Check your bucket policies and try again.",
  "story-deleted": "Story deleted successfully.",
  "story-delete-failed": "The story could not be deleted.",
  "story-not-found": "That story was not found for this admin account.",
  "story-save-failed": "The story could not be saved.",
  "story-saved": "Story changes saved successfully.",
  "story-validation": "Title, category, excerpt, and content are all required.",
  "video-caption": "Video captions must be 200 characters or fewer.",
  "video-size": "Video files must be 80 MB or smaller.",
  "video-type": "Video uploads must use a video file.",
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function getDashboardData(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("*")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false });

  if (storiesError || !stories) {
    return { stories: [], commentsLoadFailed: false, totalComments: 0 };
  }
  if (stories.length === 0) {
    return { stories, commentsLoadFailed: false, totalComments: 0 };
  }

  const storyIds = stories.map((story) => story.id);
  const { data: commentRows, error: commentsError } = await supabase
    .from("comments")
    .select("story_id")
    .in("story_id", storyIds);

  if (commentsError || !commentRows) {
    return { stories, commentsLoadFailed: true, totalComments: 0 };
  }

  return {
    stories,
    commentsLoadFailed: false,
    totalComments: commentRows.length,
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAdminUser();
  const { stories, commentsLoadFailed, totalComments } = await getDashboardData(user.id);
  
  const publishedStories = stories.filter((story) => story.status === "published");
  const draftStories = stories.filter((story) => story.status === "draft");

  const noticeCode = readParam(searchParams?.notice);
  const errorCode = readParam(searchParams?.error);
  const bannerText = dashboardMessages[noticeCode ?? errorCode ?? ""];
  const isError = Boolean(errorCode);

  return (
    <>
      {bannerText && (
         <div className={`p-4 border-l-4 font-bold text-sm mb-8 ${isError ? 'bg-danger-soft text-danger border-danger' : 'bg-success-soft text-success border-success'}`}>
           {bannerText}
         </div>
      )}

      <div className="bg-surface p-8 rounded border border-border mb-8">
         <h2 className="font-headline text-3xl font-bold mb-2">Editorial Dashboard</h2>
         <p className="text-sm text-muted">Welcome back. Here is your platform overview.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
         <div className="flex-1 bg-surface p-8 rounded border border-border flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted mb-2">Total Stories</h4>
            <div className="font-headline text-6xl font-black text-on-surface">{stories.length}</div>
         </div>
         <div className="flex-1 bg-surface p-8 rounded border border-border flex flex-col justify-center border-b-4 border-success">
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted mb-2">Published Live</h4>
            <div className="font-headline text-5xl font-black text-on-surface">{publishedStories.length}</div>
         </div>
         <div className="flex-1 bg-surface p-8 rounded border border-border flex flex-col justify-center border-b-4 border-warning">
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted mb-2">Drafts Waiting</h4>
            <div className="font-headline text-5xl font-black text-on-surface">{draftStories.length}</div>
         </div>
         <div className="flex-1 bg-surface p-8 rounded border border-border flex flex-col justify-center">
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted mb-2">Engagement</h4>
            <div className="font-headline text-5xl font-black text-primary">
               {commentsLoadFailed ? "-" : totalComments}
            </div>
         </div>
      </div>
    </>
  );
}
