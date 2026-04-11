import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/CommentForm";
import { CommentList } from "@/components/CommentList";
import { StatePanel } from "@/components/StatePanel";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Comment, Story } from "@/lib/types";

import { addCommentAction } from "./actions";

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
  dateStyle: "long",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function getStoryPageData(id: string): Promise<StoryPageData> {
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
    };
  }

  if (!story) {
    return {
      comments: [],
      commentsError: false,
      relatedStories: [],
      story: null,
      storyError: false,
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
  };
}

export default async function StoryPage({
  params,
  searchParams,
}: StoryPageProps) {
  const bannerCode = readParam(searchParams?.notice) ?? readParam(searchParams?.error);
  const bannerText = bannerCode ? storyMessages[bannerCode] : undefined;
  const isError = Boolean(readParam(searchParams?.error));

  if (!hasSupabaseEnv()) {
    return (
      <div className="page-stack">
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
  } = await getStoryPageData(params.id);

  if (storyError) {
    return (
      <div className="page-stack story-page">
        <StatePanel
          actions={
            <Link className="button" href="/">
              Return to front page
            </Link>
          }
          description="The article could not be loaded from the newsroom database right now. Please refresh and try again."
          eyebrow="Load Failed"
          title="This report is temporarily unavailable"
          titleAs="h1"
          tone="error"
        />
      </div>
    );
  }

  if (!story) {
    notFound();
  }

  const primaryDate = new Date(story.published_at ?? story.created_at);
  const updatedDate = new Date(story.updated_at);
  const showUpdated = updatedDate.getTime() - primaryDate.getTime() > 60_000;
  const commentCountLabel =
    comments.length === 1 ? "1 comment" : `${comments.length} comments`;
  const latestCommentDate = comments[0]
    ? dateTimeFormatter.format(new Date(comments[0].created_at))
    : null;
  const articleParagraphs = story.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const videoSection = story.video_url ? (
    <section
      aria-labelledby="story-video-heading"
      className="story-video-section story-video-panel story-video-feature"
    >
      <div className="story-reading-column">
        <div className="hero-copy">
          <span className="eyebrow">Story Video</span>
          <h2 className="section-title" id="story-video-heading">
            Watch the report
          </h2>
          <p>
            This video accompanies the written report and uses standard browser
            controls.
          </p>
        </div>

        <div className="story-media-frame">
          <video controls preload="metadata" src={story.video_url} />
        </div>

        {story.video_caption ? (
          <p className="story-video-caption">{story.video_caption}</p>
        ) : null}
      </div>
    </section>
  ) : null;

  return (
    <div className="page-stack story-page">
      <article aria-labelledby="story-heading" className="story-shell story-article">
        <div className="story-utility-bar">
          <Link className="back-link" href="/">
            Back to front page
          </Link>
          <a className="back-link" href="#story-discussion">
            Jump to discussion
          </a>
        </div>

        <div className="story-article-grid">
          <div className="story-article-main">
            <header className="story-header story-article-header">
              <div className="story-kicker-row">
                <span className="eyebrow">Published Story</span>
                <span className="pill pill-editorial">{story.category}</span>
              </div>

              <h1 className="story-title" id="story-heading">
                {story.title}
              </h1>

              <div className="story-meta-inline" aria-label="Story metadata">
                <span className="story-meta-inline-item">
                  <span className="story-meta-inline-label">Published</span>
                  <span>{dateFormatter.format(primaryDate)}</span>
                </span>
                {showUpdated ? (
                  <span className="story-meta-inline-item">
                    <span className="story-meta-inline-label">Updated</span>
                    <span>{dateTimeFormatter.format(updatedDate)}</span>
                  </span>
                ) : null}
                {story.location ? (
                  <span className="story-meta-inline-item">
                    <span className="story-meta-inline-label">Location</span>
                    <span>{story.location}</span>
                  </span>
                ) : null}
                <span className="story-meta-inline-item">
                  <span className="story-meta-inline-label">Discussion</span>
                  <span>{commentsError ? "Temporarily unavailable" : commentCountLabel}</span>
                </span>
              </div>

              <div className="story-standfirst-panel">
                <p className="lead story-standfirst">{story.excerpt}</p>
              </div>
            </header>

            {story.featured_image_url ? (
              <figure className="story-lead-media">
                <div className="story-media-frame story-media-frame-tall">
                  <img src={story.featured_image_url} alt={story.title} />
                </div>
              </figure>
            ) : story.video_url ? (
              videoSection
            ) : (
              <div className="story-media-empty">
                <span className="eyebrow">Story File</span>
                <p>
                  This report was published without lead media. The full article
                  text continues below.
                </p>
              </div>
            )}

            <section aria-labelledby="story-copy-heading" className="story-body">
              <div className="story-reading-column">
                <h2 className="sr-only" id="story-copy-heading">
                  Full story
                </h2>
                <div className="story-copy">
                  {(articleParagraphs.length > 0 ? articleParagraphs : [story.content]).map(
                    (paragraph, index) => (
                      <p className="story-paragraph" key={`${story.id}-${index}`}>
                        {paragraph}
                      </p>
                    ),
                  )}
                </div>
              </div>
            </section>

            {story.video_url && story.featured_image_url ? videoSection : null}

            <footer className="story-article-footer">
              <div className="story-reading-column story-footer-shell">
                <div className="hero-copy">
                  <span className="eyebrow">Continue Reading</span>
                  <h2 className="form-title">Stay with the story</h2>
                  <p>
                    Return to the latest coverage or move directly into the public
                    discussion below.
                  </p>
                </div>

                <div className="hero-actions">
                  <Link className="button secondary" href="/">
                    Latest stories
                  </Link>
                  <a className="button" href="#comment-form">
                    Join the discussion
                  </a>
                </div>
              </div>
            </footer>
          </div>

          <aside className="story-context-rail" aria-label="Story context">
            <div className="story-context-card">
              <span className="story-context-label">Story file</span>
              <strong className="story-context-title">{story.category}</strong>
              <div className="story-context-list">
                <div className="story-context-row">
                  <span>Published</span>
                  <span>{dateFormatter.format(primaryDate)}</span>
                </div>
                {showUpdated ? (
                  <div className="story-context-row">
                    <span>Updated</span>
                    <span>{dateTimeFormatter.format(updatedDate)}</span>
                  </div>
                ) : null}
                {story.location ? (
                  <div className="story-context-row">
                    <span>Location</span>
                    <span>{story.location}</span>
                  </div>
                ) : null}
                <div className="story-context-row">
                  <span>Discussion</span>
                  <span>{commentsError ? "Unavailable" : commentCountLabel}</span>
                </div>
                <div className="story-context-row">
                  <span>Media</span>
                  <span>
                    {story.featured_image_url || story.video_url
                      ? `${story.featured_image_url ? "Image" : ""}${story.featured_image_url && story.video_url ? " + " : ""}${story.video_url ? "Video" : ""}`
                      : "Text only"}
                  </span>
                </div>
              </div>
            </div>

            {relatedStories.length > 0 ? (
              <div className="story-context-card">
                <span className="story-context-label">Latest Coverage</span>
                <strong className="story-context-title">Continue with recent reports</strong>
                <div className="story-context-links">
                  {relatedStories.map((relatedStory) => (
                    <Link
                      className="story-context-link"
                      href={`/story/${relatedStory.id}`}
                      key={relatedStory.id}
                    >
                      <span className="story-context-link-title">{relatedStory.title}</span>
                      <span className="story-context-link-meta">
                        {relatedStory.category}
                        {relatedStory.location ? ` | ${relatedStory.location}` : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="story-context-card">
              <span className="story-context-label">Reader note</span>
              <strong className="story-context-title">Public discussion stays open</strong>
              <p className="story-context-copy">
                Readers can respond below with their name and a public comment tied
                to this report.
              </p>
            </div>
          </aside>
        </div>
      </article>

      <section
        aria-labelledby="story-discussion-heading"
        className="story-discussion"
        id="story-discussion"
      >
        <div className="story-discussion-header">
          <div className="hero-copy">
            <span className="eyebrow">Reader Discussion</span>
            <h2 className="section-title" id="story-discussion-heading">
              Responses to this report
            </h2>
            <p>
              Readers can respond publicly below. Newer responses appear first so the
              latest discussion stays easy to follow.
            </p>
          </div>

          <div className="story-discussion-summary">
            <span className="pill pill-muted">
              {commentsError ? "Discussion unavailable" : commentCountLabel}
            </span>
            <span className="meta-text">Public conversation</span>
          </div>
        </div>

        <div className="story-discussion-rail" aria-label="Discussion overview">
          <div className="story-discussion-card">
            <span className="story-discussion-card-label">Responses</span>
            <strong className="story-discussion-card-value">
              {commentsError ? "Unavailable" : commentCountLabel}
            </strong>
            <p className="story-discussion-card-note">
              {commentsError
                ? "The comment feed could not be loaded right now."
                : comments.length > 0
                  ? "Reader discussion is already active on this report."
                  : "No public responses yet. You can start the discussion below."}
            </p>
          </div>

          <div className="story-discussion-card">
            <span className="story-discussion-card-label">Reading order</span>
            <strong className="story-discussion-card-value">Newest first</strong>
            <p className="story-discussion-card-note">
              The latest public response always appears at the top of the thread.
            </p>
          </div>

          <div className="story-discussion-card">
            <span className="story-discussion-card-label">Latest response</span>
            <strong className="story-discussion-card-value">
              {commentsError ? "Temporarily unavailable" : latestCommentDate ?? "Awaiting first reply"}
            </strong>
            <p className="story-discussion-card-note">
              {commentsError
                ? "Please refresh later to see the latest public discussion."
                : latestCommentDate
                  ? "Recent activity helps returning readers catch up quickly."
                  : "Once readers reply, recent activity will be shown here."}
            </p>
          </div>
        </div>

        <div className="story-discussion-grid">
          <CommentForm
            action={addCommentAction}
            message={bannerText}
            messageTone={isError ? "error" : "success"}
            storyId={story.id}
          />

          <div
            aria-labelledby="comment-stream-heading"
            className="dashboard-panel comment-stream-panel"
          >
            <div className="hero-copy comment-stream-header">
              <span className="eyebrow">Latest Responses</span>
              <h3 className="form-title" id="comment-stream-heading">
                Reader comments
              </h3>
              <p>
                Every published comment appears directly below in reverse chronological
                order.
              </p>
            </div>
            {commentsError ? (
              <StatePanel
                description="Comments could not be loaded from the newsroom database right now. Please refresh to try again."
                eyebrow="Discussion Unavailable"
                title="Reader comments are temporarily unavailable"
                titleAs="h3"
                titleClassName="form-title"
                tone="warning"
              />
            ) : (
              <CommentList comments={comments} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
