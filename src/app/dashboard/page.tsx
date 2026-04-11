import Link from "next/link";

import { InlineMessage } from "@/components/InlineMessage";
import { StatePanel } from "@/components/StatePanel";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { StoryForm } from "@/components/StoryForm";
import { SubmitButton } from "@/components/SubmitButton";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";

import { deleteStoryAction, saveStoryAction, signOutAction } from "./actions";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type DashboardData = {
  stories: Story[];
  storiesLoadFailed: boolean;
  commentsLoadFailed: boolean;
  totalComments: number;
  commentCountsByStory: Record<string, number>;
  engagedStoriesCount: number;
};

const dashboardMessages: Record<string, string> = {
  "admin-setup":
    "Add the admin email to public.admin_users in Supabase before using dashboard write actions.",
  "image-size": "Featured image files must be 5 MB or smaller.",
  "image-type": "Featured image uploads must use an image file.",
  "image-url": "Featured image fallback URLs must start with http:// or https://.",
  "missing-config": "Supabase environment values are missing.",
  "storage-delete-failed":
    "A media file could not be removed from storage. The story was left unchanged.",
  "storage-upload-failed":
    "A media upload failed. Check your bucket policies and try again.",
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

function formatCountLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createSupabaseServerClient();
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("*")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false });

  if (storiesError || !stories) {
    return {
      stories: [],
      storiesLoadFailed: true,
      commentsLoadFailed: false,
      totalComments: 0,
      commentCountsByStory: {},
      engagedStoriesCount: 0,
    };
  }

  if (stories.length === 0) {
    return {
      stories,
      storiesLoadFailed: false,
      commentsLoadFailed: false,
      totalComments: 0,
      commentCountsByStory: {},
      engagedStoriesCount: 0,
    };
  }

  const storyIds = stories.map((story) => story.id);
  const { data: commentRows, error: commentsError } = await supabase
    .from("comments")
    .select("story_id")
    .in("story_id", storyIds);

  if (commentsError || !commentRows) {
    return {
      stories,
      storiesLoadFailed: false,
      commentsLoadFailed: true,
      totalComments: 0,
      commentCountsByStory: {},
      engagedStoriesCount: 0,
    };
  }

  const commentCountsByStory = commentRows.reduce<Record<string, number>>((counts, row) => {
    counts[row.story_id] = (counts[row.story_id] ?? 0) + 1;
    return counts;
  }, {});

  return {
    stories,
    storiesLoadFailed: false,
    commentsLoadFailed: false,
    totalComments: commentRows.length,
    commentCountsByStory,
    engagedStoriesCount: Object.keys(commentCountsByStory).length,
  };
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await requireAdminUser();
  const {
    stories,
    storiesLoadFailed,
    commentsLoadFailed,
    totalComments,
    commentCountsByStory,
    engagedStoriesCount,
  } = await getDashboardData(user.id);
  const publishedStories = stories.filter((story) => story.status === "published");
  const draftStories = stories.filter((story) => story.status === "draft");
  const mediaStories = stories.filter(
    (story) => Boolean(story.featured_image_url) || Boolean(story.video_url),
  );
  const publishedCount = publishedStories.length;
  const draftCount = draftStories.length;
  const storiesWithMediaCount = mediaStories.length;
  const latestActivity = stories[0] ?? null;
  const latestDraft = draftStories[0] ?? null;
  const latestPublished = publishedStories[0] ?? null;
  const noticeCode = readParam(searchParams?.notice);
  const errorCode = readParam(searchParams?.error);
  const bannerText = dashboardMessages[noticeCode ?? errorCode ?? ""];
  const isError = Boolean(errorCode);

  const mostEngagedEntry = commentsLoadFailed
    ? null
    : stories.reduce<{ story: Story | null; count: number }>(
        (best, story) => {
          const commentCount = commentCountsByStory[story.id] ?? 0;
          if (commentCount > best.count) {
            return {
              story,
              count: commentCount,
            };
          }

          return best;
        },
        { story: null, count: 0 },
      );
  const mostEngagedStory = mostEngagedEntry?.story ?? null;
  const mostEngagedCount = mostEngagedEntry?.count ?? 0;

  const nextStep = storiesLoadFailed
    ? {
        title: "Story library unavailable",
        description:
          "Existing stories could not be loaded, but you can still create a fresh story below.",
      }
    : latestDraft
      ? {
          title: "Finish your newest draft",
          description: `"${latestDraft.title}" is still private and ready for the next editorial pass.`,
        }
      : stories.length === 0
        ? {
            title: "Create your first story",
            description:
              "Open the editor below, save a draft, and publish when the reporting is ready.",
          }
        : {
            title: "Review your live coverage",
            description:
              "All current stories are published. Start a new draft or revisit your newest live story.",
          };

  return (
    <div className="page-stack dashboard-page dashboard-page-admin">
      <section
        aria-labelledby="dashboard-workspace-heading"
        className="surface dashboard-command-deck"
      >
        <div className="dashboard-command-copy">
          <span className="eyebrow">Executive Overview</span>
          <h1 className="hero-title" id="dashboard-workspace-heading">
            Calm editorial control for the newsroom desk
          </h1>
          <p className="lead">
            Review published coverage, track draft progress, manage media, and
            move directly from planning into story editing without leaving the
            workspace.
          </p>

          <div className="dashboard-command-badges">
            <span className="pill pill-editorial">Journalist workspace</span>
            <span className="pill published">{publishedCount} live</span>
            <span className="pill draft">{draftCount} drafts</span>
            <span className="pill pill-muted">{storiesWithMediaCount} with media</span>
          </div>
        </div>

        <div className="dashboard-command-aside">
          <div className="dashboard-session-card">
            <span className="dashboard-session-label">Signed in</span>
            <strong className="dashboard-session-value">{user.email}</strong>
            <p>
              Protected editorial tools stay available here while the public site
              remains readable without login.
            </p>
          </div>

          <div aria-label="Dashboard quick actions" className="dashboard-quickbar dashboard-quickbar-admin">
            <Link className="button secondary" href="/">
              View live site
            </Link>
            <a className="button secondary" href="#story-library">
              Review stories
            </a>
            <a className="button" href="#new-story">
              New story
            </a>
            <form action={signOutAction}>
              <SubmitButton className="button secondary" pendingLabel="Signing out..." type="submit">
                Sign out
              </SubmitButton>
            </form>
          </div>
        </div>
      </section>

      {bannerText ? (
        <InlineMessage
          title={isError ? "Dashboard action failed" : "Dashboard updated"}
          tone={isError ? "error" : "success"}
        >
          {bannerText}
        </InlineMessage>
      ) : null}

      {storiesLoadFailed ? (
        <InlineMessage title="Story library unavailable" tone="error">
          Existing stories could not be loaded right now. You can still use the
          create-story editor below.
        </InlineMessage>
      ) : null}

      {commentsLoadFailed ? (
        <InlineMessage title="Comment totals unavailable" tone="warning">
          Story records loaded successfully, but comment-based engagement signals
          could not be calculated right now.
        </InlineMessage>
      ) : null}

      <section aria-label="Dashboard overview" className="dashboard-overview-grid dashboard-overview-grid-admin">
        <section
          aria-labelledby="dashboard-analytics-heading"
          className="dashboard-panel dashboard-analytics-panel dashboard-analytics-panel-admin"
        >
          <div className="hero-copy">
            <span className="eyebrow">Editorial Metrics</span>
            <h2 className="form-title" id="dashboard-analytics-heading">
              Truthful story, draft, and response signals
            </h2>
            <p>
              These cards use live story and comment data only. Advanced traffic
              analytics like page views are not wired yet, so they are not shown
              here.
            </p>
          </div>

          <div className="stat-grid dashboard-stat-grid dashboard-stat-grid-expanded">
            <StatCard
              description="All saved stories in this newsroom workspace."
              label="Total stories"
              tone="accent"
              value={stories.length}
            />
            <StatCard
              description={
                publishedCount === 0
                  ? "No stories are live on the public site yet."
                  : "Stories currently visible to readers."
              }
              label="Published"
              tone="success"
              value={publishedCount}
            />
            <StatCard
              description={
                draftCount === 0
                  ? "No private drafts are waiting right now."
                  : "Private stories still being edited."
              }
              label="Drafts"
              tone="warning"
              value={draftCount}
            />
            <StatCard
              description={
                commentsLoadFailed
                  ? "Comment totals are temporarily unavailable."
                  : totalComments === 0
                    ? "Reader comments have not started yet."
                    : "Public comments across your story archive."
              }
              label="Comments"
              value={commentsLoadFailed ? "Unavailable" : totalComments}
            />
            <StatCard
              description={
                storiesWithMediaCount === 0
                  ? "No stories currently include image or video media."
                  : "Stories with an image, a video, or both."
              }
              label="With media"
              value={storiesWithMediaCount}
            />
            <StatCard
              description={
                latestActivity
                  ? `Updated ${dateTimeFormatter.format(new Date(latestActivity.updated_at))}`
                  : "No stories have been updated yet."
              }
              label="Most recent update"
              value={latestActivity ? latestActivity.title : "No stories yet"}
            />
          </div>

          <div className="dashboard-signal-strip dashboard-signal-strip-admin">
            <article className="dashboard-signal-card">
              <span className="eyebrow">Draft queue</span>
              <h3 className="summary-title">
                {draftCount === 0 ? "No drafts right now" : formatCountLabel(draftCount, "draft")}
              </h3>
              <p>
                {draftCount === 0
                  ? "Everything is either published or still waiting to be created."
                  : "Drafts stay private until you deliberately publish them to the site."}
              </p>
            </article>

            <article className="dashboard-signal-card">
              <span className="eyebrow">Audience response</span>
              <h3 className="summary-title">
                {commentsLoadFailed
                  ? "Unavailable"
                  : totalComments === 0
                    ? "No comments yet"
                    : formatCountLabel(engagedStoriesCount, "engaged story", "engaged stories")}
              </h3>
              <p>
                {commentsLoadFailed
                  ? "Comment-based signals could not be loaded from the database."
                  : totalComments === 0
                    ? "Reader feedback has not started yet on published coverage."
                    : `${formatCountLabel(totalComments, "comment")} across current story pages.`}
              </p>
            </article>

            <article className="dashboard-signal-card">
              <span className="eyebrow">Most engaged</span>
              <h3 className="summary-title">
                {commentsLoadFailed
                  ? "Comment signals unavailable"
                  : mostEngagedStory
                    ? mostEngagedStory.title
                    : "No engaged story yet"}
              </h3>
              <p>
                {commentsLoadFailed
                  ? "Refresh later to rank stories by public discussion."
                  : mostEngagedStory
                    ? `${formatCountLabel(mostEngagedCount, "comment")} on the strongest discussion thread right now.`
                    : "Once readers begin commenting, the most engaged story will appear here."}
              </p>
            </article>
          </div>

          <div className="dashboard-analytics-note">
            <span className="eyebrow">Analytics Status</span>
            <p>
              Views, read time, and referral analytics are not supported yet. The
              dashboard currently emphasizes trustworthy editorial signals:
              status, recency, media attachment, and comments.
            </p>
          </div>
        </section>

        <aside
          aria-labelledby="dashboard-activity-heading"
          className="dashboard-panel dashboard-activity-panel dashboard-activity-panel-admin"
        >
          <div className="hero-copy">
            <span className="eyebrow">Recent Signals</span>
            <h2 className="form-title" id="dashboard-activity-heading">
              What deserves attention next
            </h2>
            <p>
              The latest update, newest live story, and next editorial task stay
              visible here for quick orientation.
            </p>
          </div>

          {storiesLoadFailed ? (
            <StatePanel
              description="The overview is available, but the recent activity feed could not be loaded."
              eyebrow="Activity Unavailable"
              title="Recent story activity is temporarily unavailable"
              titleAs="h3"
              titleClassName="form-title"
              tone="error"
            />
          ) : (
            <div className="dashboard-activity-stack">
              <article className="dashboard-activity-card">
                <div className="dashboard-activity-header">
                  <span className="eyebrow">Most recently updated</span>
                  {latestActivity ? <StatusBadge status={latestActivity.status} /> : null}
                </div>

                {latestActivity ? (
                  <div className="dashboard-activity-copy">
                    <h3 className="summary-title">{latestActivity.title}</h3>
                    <p>
                      Updated {dateTimeFormatter.format(new Date(latestActivity.updated_at))}
                    </p>
                    <div className="dashboard-activity-meta">
                      <span className="meta-text">{latestActivity.category}</span>
                      {latestActivity.location ? (
                        <span className="meta-text">{latestActivity.location}</span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-activity-copy">
                    <h3 className="summary-title">No story activity yet</h3>
                    <p>Create your first draft below to start the newsroom workflow.</p>
                  </div>
                )}
              </article>

              <article className="dashboard-activity-card">
                <div className="dashboard-activity-header">
                  <span className="eyebrow">Latest live story</span>
                  {latestPublished ? <span className="pill published">Published</span> : null}
                </div>

                {latestPublished ? (
                  <div className="dashboard-activity-copy">
                    <h3 className="summary-title">{latestPublished.title}</h3>
                    <p>
                      Live since{" "}
                      {dateFormatter.format(
                        new Date(latestPublished.published_at ?? latestPublished.created_at),
                      )}
                    </p>
                    <div className="dashboard-activity-meta">
                      <Link className="story-card-link" href={`/story/${latestPublished.id}`}>
                        View published story
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-activity-copy">
                    <h3 className="summary-title">Nothing live yet</h3>
                    <p>Publish a finished report to send it to the public homepage.</p>
                  </div>
                )}
              </article>

              <article className="dashboard-activity-card">
                <div className="dashboard-activity-header">
                  <span className="eyebrow">Next step</span>
                </div>
                <div className="dashboard-activity-copy">
                  <h3 className="summary-title">{nextStep.title}</h3>
                  <p>{nextStep.description}</p>
                </div>
                <div className="hero-actions">
                  <a className="button secondary button-compact" href="#story-library">
                    Review stories
                  </a>
                  <a className="button secondary button-compact" href="#new-story">
                    Open editor
                  </a>
                </div>
              </article>
            </div>
          )}
        </aside>
      </section>

      <section
        aria-labelledby="dashboard-library-heading"
        className="dashboard-panel dashboard-library-panel dashboard-library-panel-admin"
        id="story-library"
      >
        <div className="dashboard-library-header">
          <div className="hero-copy">
            <span className="eyebrow">Editorial Management</span>
            <h2 className="form-title" id="dashboard-library-heading">
              Post management and recent story activity
            </h2>
            <p>
              Stories are listed from most recently updated to oldest so the
              freshest work stays visible first.
            </p>
          </div>

          <div className="dashboard-library-meta">
            <span className="pill pill-muted">{stories.length} total</span>
            <span className="pill published">{publishedCount} live</span>
            <span className="pill draft">{draftCount} drafts</span>
          </div>
        </div>

        <div className="dashboard-management-strip" aria-label="Management overview">
          <article className="dashboard-management-card">
            <span className="dashboard-management-label">Live coverage</span>
            <strong className="dashboard-management-value">
              {publishedCount === 0 ? "No published stories" : formatCountLabel(publishedCount, "story")}
            </strong>
            <p>
              {publishedCount === 0
                ? "Nothing is visible on the public homepage right now."
                : "These stories are currently visible on the public site."}
            </p>
          </article>

          <article className="dashboard-management-card">
            <span className="dashboard-management-label">Draft backlog</span>
            <strong className="dashboard-management-value">
              {draftCount === 0 ? "No draft backlog" : formatCountLabel(draftCount, "draft")}
            </strong>
            <p>
              {draftCount === 0
                ? "There are no unpublished drafts waiting for review."
                : "Private drafts are ready for continued writing or a publishing decision."}
            </p>
          </article>

          <article className="dashboard-management-card">
            <span className="dashboard-management-label">Comment activity</span>
            <strong className="dashboard-management-value">
              {commentsLoadFailed
                ? "Unavailable"
                : totalComments === 0
                  ? "No responses yet"
                  : formatCountLabel(totalComments, "comment")}
            </strong>
            <p>
              {commentsLoadFailed
                ? "Discussion totals could not be loaded right now."
                : totalComments === 0
                  ? "Published stories have not received reader comments yet."
                  : "Comment counts help you spot which stories are generating discussion."}
            </p>
          </article>
        </div>

        {storiesLoadFailed ? (
          <StatePanel
            description="The create-story editor is still available below, but the story library could not be loaded from the database."
            eyebrow="Library Unavailable"
            title="Existing stories are temporarily unavailable"
            titleAs="h3"
            titleClassName="form-title"
            tone="error"
          />
        ) : stories.length === 0 ? (
          <StatePanel
            description="Create your first draft in the editor below to begin publishing from this newsroom workspace."
            eyebrow="No Stories Yet"
            title="This newsroom has no saved stories"
            titleAs="h3"
            titleClassName="form-title"
          />
        ) : (
          <div className="dashboard-library-list">
            <div className="dashboard-library-columns" aria-hidden="true">
              <span>Story</span>
              <span>Status and signals</span>
              <span>Actions</span>
            </div>

            {stories.map((story) => {
              const storyCommentCount = commentsLoadFailed
                ? null
                : commentCountsByStory[story.id] ?? 0;
              const storyHasMedia =
                Boolean(story.featured_image_url) || Boolean(story.video_url);

              return (
                <details className="details-panel details-panel-story" key={story.id}>
                  <summary>
                    <div className="dashboard-story-summary dashboard-story-summary-admin">
                      <div className="dashboard-story-summary-main">
                        <div className="dashboard-story-summary-header">
                          <span className="summary-title">{story.title}</span>
                          <div className="dashboard-story-summary-badges">
                            <StatusBadge status={story.status} />
                            {story.featured_image_url ? <span className="pill pill-muted">Image</span> : null}
                            {story.video_url ? <span className="pill pill-muted">Video</span> : null}
                          </div>
                        </div>

                        <div className="dashboard-story-dot-list">
                          <span className="summary-meta">{story.category}</span>
                          {story.location ? <span className="summary-meta">{story.location}</span> : null}
                          <span className="summary-meta">
                            {story.status === "published"
                              ? `Published ${dateFormatter.format(
                                  new Date(story.published_at ?? story.created_at),
                                )}`
                              : "Private draft"}
                          </span>
                        </div>

                        <span className="dashboard-story-summary-snippet">
                          {story.excerpt}
                        </span>
                      </div>

                      <div className="dashboard-story-summary-side">
                        <div className="dashboard-story-metric">
                          <span className="dashboard-story-metric-label">Updated</span>
                          <span className="dashboard-story-metric-value">
                            {dateTimeFormatter.format(new Date(story.updated_at))}
                          </span>
                        </div>
                        <div className="dashboard-story-metric">
                          <span className="dashboard-story-metric-label">Comments</span>
                          <span className="dashboard-story-metric-value">
                            {commentsLoadFailed
                              ? "Unavailable"
                              : formatCountLabel(storyCommentCount ?? 0, "comment")}
                          </span>
                        </div>
                        <div className="dashboard-story-metric">
                          <span className="dashboard-story-metric-label">Media</span>
                          <span className="dashboard-story-metric-value">
                            {storyHasMedia ? "Attached" : "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="dashboard-panel dashboard-panel-subtle">
                    <div className="dashboard-story-toolbar">
                      <div className="dashboard-story-toolbar-copy">
                        <span className="eyebrow">Story actions</span>
                        <div className="dashboard-story-toolbar-meta">
                          <span className="meta-text">
                            {story.status === "published"
                              ? `Live since ${dateFormatter.format(
                                  new Date(story.published_at ?? story.created_at),
                                )}`
                              : "This story is still saved as a private draft."}
                          </span>
                          <span className="meta-text">
                            {commentsLoadFailed
                              ? "Comment totals unavailable"
                              : formatCountLabel(storyCommentCount ?? 0, "comment")}
                          </span>
                          <span className="meta-text">
                            {storyHasMedia ? "Media attached" : "No media attached"}
                          </span>
                        </div>
                      </div>

                      <div className="compact-actions">
                        {story.status === "published" ? (
                          <Link
                            className="button secondary button-compact"
                            href={`/story/${story.id}`}
                          >
                            View story
                          </Link>
                        ) : null}
                        <form action={deleteStoryAction}>
                          <input name="story_id" type="hidden" value={story.id} />
                          <SubmitButton
                            className="button danger"
                            pendingLabel="Deleting story..."
                            type="submit"
                          >
                            Delete story
                          </SubmitButton>
                        </form>
                      </div>
                    </div>

                    <StoryForm
                      action={saveStoryAction}
                      description="Adjust the article, replace media, and decide whether the story stays live or returns to draft."
                      story={story}
                      title="Edit story"
                    />
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      <section
        aria-labelledby="dashboard-editor-heading"
        className="dashboard-panel dashboard-editor-panel dashboard-editor-panel-admin"
        id="new-story"
      >
        <div className="dashboard-editor-header">
          <div className="hero-copy">
            <span className="eyebrow">Story Desk</span>
            <h2 className="form-title" id="dashboard-editor-heading">
              Create a new story
            </h2>
            <p>
              Draft privately, attach media when needed, then publish once the
              article and supporting materials are ready for the public site.
            </p>
          </div>
          <span className="pill draft">New story workflow</span>
        </div>

        <StoryForm
          action={saveStoryAction}
          description="Start a new draft, add image or video support, and publish when the report is ready for readers."
          title="Create a story"
        />
      </section>
    </div>
  );
}
