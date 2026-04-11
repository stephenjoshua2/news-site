import Link from "next/link";

import { StatePanel } from "@/components/StatePanel";
import { StoryCard } from "@/components/StoryCard";
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

export default async function HomePage() {
  const { error: storiesLoadFailed, stories } = await getPublishedStories();
  const featuredStory = stories[0];
  const spotlightStories = featuredStory ? stories.slice(1, 3) : [];
  const archiveStories = featuredStory ? stories.slice(3) : [];
  const newslineStories = stories.slice(0, 5);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  });
  const latestPublishedLabel = featuredStory
    ? dateFormatter.format(new Date(featuredStory.published_at ?? featuredStory.created_at))
    : null;

  return (
    <div className="page-stack home-page">
      {!hasSupabaseEnv() ? (
        <StatePanel
          description="The publishing backend is not configured yet, so the homepage cannot load live stories right now."
          eyebrow="Newsroom Offline"
          title="Stories are temporarily unavailable"
          titleAs="h1"
          tone="warning"
        />
      ) : storiesLoadFailed ? (
        <StatePanel
          description="Published stories could not be loaded from the newsroom database just now. Please refresh and try again."
          eyebrow="Load Failed"
          title="The front page is temporarily unavailable"
          titleAs="h1"
          tone="error"
        />
      ) : featuredStory ? (
        <>
          <section aria-label="Front page edition" className="home-newsline">
            <span className="home-newsline-label">Front Page</span>
            <div className="home-newsline-track">
              {newslineStories.map((story) => (
                <Link
                  className="home-newsline-link"
                  href={`/story/${story.id}`}
                  key={story.id}
                >
                  <span className="home-newsline-story">{story.title}</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="home-latest-heading" className="surface home-masthead">
            <div className="home-masthead-copy">
              <span className="eyebrow">Latest Edition</span>
              <h1 className="section-title" id="home-latest-heading">
                Independent reporting from the newsroom desk
              </h1>
              <p className="lead">
                The newest published report leads the front page, followed by the
                latest verified coverage and the wider archive for readers who want
                the full picture.
              </p>
            </div>

            <div className="home-intro-stats" aria-label="Homepage summary">
              <div className="home-stat">
                <span className="home-stat-label">Published stories</span>
                <strong className="home-stat-value">{stories.length}</strong>
              </div>
              <div className="home-stat">
                <span className="home-stat-label">Latest update</span>
                <strong className="home-stat-value">{latestPublishedLabel}</strong>
              </div>
            </div>
          </section>

          <section aria-label="Lead coverage and recent stories" className="home-lead-grid home-editorial-grid">
            <article
              aria-labelledby={`lead-story-${featuredStory.id}`}
              className="lead-story-card lead-story-card-editorial lead-story-card-public"
            >
              <div className="lead-story-media">
                {featuredStory.featured_image_url ? (
                  <img src={featuredStory.featured_image_url} alt={featuredStory.title} />
                ) : (
                  <div className="story-card-placeholder">
                    <span className="eyebrow">Lead Report</span>
                    <span className="meta-text">No lead image was attached to this story.</span>
                  </div>
                )}
              </div>

              <div className="lead-story-content">
                <div className="home-story-meta">
                  <span className="pill pill-editorial">{featuredStory.category}</span>
                  {featuredStory.location ? (
                    <span className="meta-text">{featuredStory.location}</span>
                  ) : null}
                  <span className="meta-text">{latestPublishedLabel}</span>
                </div>

                <div className="hero-copy">
                  <span className="eyebrow">Lead Story</span>
                  <h2 className="hero-title" id={`lead-story-${featuredStory.id}`}>
                    {featuredStory.title}
                  </h2>
                  <p className="lead">{featuredStory.excerpt}</p>
                </div>

                <div className="hero-actions">
                  <Link className="button" href={`/story/${featuredStory.id}`}>
                    Read full report
                  </Link>
                  {featuredStory.video_url ? (
                    <span className="pill pill-muted">Video included</span>
                  ) : null}
                </div>
              </div>
            </article>

            {spotlightStories.length > 0 ? (
              <aside aria-labelledby="home-spotlight-heading" className="surface home-spotlight home-coverage-column">
                <div className="hero-copy home-spotlight-header">
                  <span className="eyebrow">More Coverage</span>
                  <h2 className="form-title" id="home-spotlight-heading">
                    Reports shaping the rest of the edition
                  </h2>
                  <p>
                    Follow-up reporting stays grouped here so readers can move from
                    the lead report into the next most recent stories without losing
                    the editorial thread.
                  </p>
                </div>

                <div className="home-spotlight-list">
                  {spotlightStories.map((story) => (
                    <StoryCard key={story.id} story={story} variant="compact" />
                  ))}
                </div>

                <div className="home-coverage-note">
                  <span className="home-coverage-note-label">Edition note</span>
                  <p>
                    Stories publish in reverse chronological order, with optional
                    images and video preserved on each report page.
                  </p>
                </div>
              </aside>
            ) : null}
          </section>

          {archiveStories.length > 0 ? (
            <section aria-labelledby="home-archive-heading" className="page-stack" id="news-archive">
              <section className="section-header section-header-public">
                <div className="hero-copy">
                  <span className="eyebrow">News Archive</span>
                  <h2 className="section-title" id="home-archive-heading">
                    More from the public archive
                  </h2>
                  <p>
                    Browse every published story in reverse chronological order,
                    including image-led and video-supported reporting.
                  </p>
                </div>
                <span className="pill pill-muted">{archiveStories.length} more stories</span>
              </section>

              <div className="story-grid story-grid-archive">
                {archiveStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <StatePanel
          actions={
            <Link className="button" href="/login">
              Editor login
            </Link>
          }
          description="The editor can sign in, create a story, and publish it to make it appear here for readers."
          eyebrow="No Stories Yet"
          title="No published stories are live right now"
          titleAs="h1"
        />
      )}
    </div>
  );
}
