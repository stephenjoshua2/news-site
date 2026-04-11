import Link from "next/link";

import type { Story } from "@/lib/types";

type StoryCardProps = {
  story: Story;
  variant?: "default" | "compact";
};

const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export function StoryCard({
  story,
  variant = "default",
}: StoryCardProps) {
  const publishedLabel = formatter.format(
    new Date(story.published_at ?? story.created_at),
  );
  const cardClassName =
    variant === "compact" ? "story-card story-card-compact" : "story-card";
  const headingClassName = variant === "compact" ? "card-title card-title-compact" : "card-title";

  return (
    <article className={cardClassName}>
      <div className="story-card-media">
        {story.featured_image_url ? (
          <img src={story.featured_image_url} alt={story.title} loading="lazy" />
        ) : (
          <div className="story-card-placeholder">
            <span className="eyebrow">{story.category}</span>
            <span className="meta-text">No featured image</span>
          </div>
        )}
      </div>

      <div className="story-card-body">
        <div className="meta-row story-card-meta story-card-meta-public">
          <span className="pill pill-editorial">{story.category}</span>
          {story.video_url ? <span className="pill pill-muted">Video</span> : null}
          {story.location ? (
            <span className="meta-text story-card-meta-item">{story.location}</span>
          ) : null}
          <span className="meta-text">{publishedLabel}</span>
        </div>

        <div className="story-card-copy">
          <h3 className={headingClassName}>
            <Link href={`/story/${story.id}`}>{story.title}</Link>
          </h3>

          <p>{story.excerpt}</p>
        </div>

        <div className="meta-row story-card-footer story-card-footer-public">
          <span className="story-card-read-label">Full report</span>
          <Link
            aria-label={`Read story: ${story.title}`}
            className="story-card-link"
            href={`/story/${story.id}`}
          >
            Read report
          </Link>
        </div>
      </div>
    </article>
  );
}
