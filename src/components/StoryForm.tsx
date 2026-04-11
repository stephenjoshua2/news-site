import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  VIDEO_ACCEPT,
  formatFileSize,
} from "@/lib/media";
import type { Story } from "@/lib/types";

type StoryFormProps = {
  action: (formData: FormData) => Promise<void>;
  story?: Story;
  title: string;
  description: string;
};

export function StoryForm({ action, story, title, description }: StoryFormProps) {
  const hasImage = Boolean(story?.featured_image_url);
  const hasVideo = Boolean(story?.video_url);
  const hasUploadedImage = Boolean(story?.featured_image_path);
  const hasFallbackImage = hasImage && !hasUploadedImage;
  const isPublishedStory = story?.status === "published";
  const imageUrlDefaultValue = story?.featured_image_path
    ? ""
    : story?.featured_image_url ?? "";
  const baseId = story?.id ?? "new";
  const updatedAtLabel = story ? new Date(story.updated_at).toLocaleString() : null;
  const publishedAtLabel =
    story?.published_at ? new Date(story.published_at).toLocaleString() : null;

  return (
    <form
      action={action}
      className="form-shell story-form-shell story-form-shell-admin"
      encType="multipart/form-data"
    >
      <input name="story_id" type="hidden" value={story?.id ?? ""} />

      <div className="hero-copy story-form-intro story-form-intro-admin">
        <span className="eyebrow">Story Editor</span>
        <div className="story-form-title-block">
          <h2 className="form-title">{title}</h2>
          <p>{description}</p>
        </div>
        <div className="story-form-status-row">
          {story ? (
            <>
              <StatusBadge status={story.status} />
              <span className="meta-text">Last updated {updatedAtLabel}</span>
              {publishedAtLabel ? (
                <span className="meta-text">Live since {publishedAtLabel}</span>
              ) : null}
              {hasImage ? <span className="pill pill-muted">Image attached</span> : null}
              {hasVideo ? <span className="pill pill-muted">Video attached</span> : null}
            </>
          ) : (
            <>
              <span className="pill draft">New draft</span>
              <span className="meta-text">
                Start with the headline and story details, then add media and choose how
                to save it.
              </span>
            </>
          )}
        </div>

        <div className="story-form-editor-note">
          <span className="story-form-editor-note-label">Editorial workflow</span>
          <p>
            Build the headline and metadata first, write the full report next, add
            media when it strengthens the story, then choose whether the result
            stays private or goes live.
          </p>
        </div>
      </div>

      <section className="story-form-section story-form-section-title">
        <div className="story-form-section-head">
          <span className="eyebrow">Story Details</span>
          <h3 className="summary-title">Headline, metadata, and standfirst</h3>
          <p>These fields control how the story is identified and introduced on the site.</p>
        </div>

        <div className="story-form-section-body">
          <div className="field-grid columns-2">
            <div className="field">
              <label htmlFor={`title-${baseId}`}>Title</label>
              <input
                id={`title-${baseId}`}
                name="title"
                type="text"
                defaultValue={story?.title ?? ""}
                required
                maxLength={180}
                placeholder="Headline"
              />
            </div>

            <div className="field">
              <label htmlFor={`category-${baseId}`}>Category</label>
              <input
                id={`category-${baseId}`}
                name="category"
                type="text"
                defaultValue={story?.category ?? ""}
                required
                maxLength={80}
                placeholder="Politics, Culture, Investigations"
              />
            </div>
          </div>

          <div className="field-grid columns-2">
            <div className="field">
              <label htmlFor={`location-${baseId}`}>Location</label>
              <input
                id={`location-${baseId}`}
                name="location"
                type="text"
                defaultValue={story?.location ?? ""}
                maxLength={120}
                placeholder="Lagos, Nigeria"
              />
              <span className="field-hint">
                Optional. Use a location only when it adds useful reporting context.
              </span>
            </div>

            <div className="field">
              <label htmlFor={`excerpt-${baseId}`}>Short excerpt</label>
              <textarea
                id={`excerpt-${baseId}`}
                name="excerpt"
                defaultValue={story?.excerpt ?? ""}
                required
                maxLength={280}
                placeholder="A concise summary that appears on story cards"
              />
              <span className="field-hint">
                This appears as the standfirst on the article page and in listing cards.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="story-form-section story-form-section-body story-form-section-writing">
        <div className="story-form-section-head">
          <span className="eyebrow">Article Body</span>
          <h3 className="summary-title">Write the full report</h3>
          <p>
            Use paragraphs and line breaks naturally. The story page will present this
            as long-form editorial copy.
          </p>
        </div>

        <div className="story-form-section-body">
          <div className="field story-form-writing-field">
            <label htmlFor={`content-${baseId}`}>Full article body</label>
            <textarea
              className="body-input"
              id={`content-${baseId}`}
              name="content"
              defaultValue={story?.content ?? ""}
              required
              placeholder="Write the full article here"
            />
            <span className="field-hint">
              Draft privately, then publish when the reporting and media are ready.
            </span>
          </div>
        </div>
      </section>

      <section className="story-form-section story-form-section-media">
        <div className="story-form-section-head">
          <span className="eyebrow">Media</span>
          <h3 className="summary-title">Featured image and optional video</h3>
          <p>
            Media is saved with the story when you submit this form. Use an uploaded
            image whenever possible, and keep video attached only when it adds useful
            reporting context.
          </p>
        </div>

        <div className="story-form-media-summary">
          <div className="story-form-media-summary-card">
            <span className="story-form-media-summary-label">Featured image</span>
            <strong className="story-form-media-summary-value">
              {hasImage
                ? hasUploadedImage
                  ? "Uploaded image attached"
                  : "External image fallback active"
                : "No image attached"}
            </strong>
            <p>
              {hasImage
                ? hasUploadedImage
                  ? "The current lead image comes from newsroom storage."
                  : "The current lead image is using an external URL."
                : "Upload from your device or add a fallback URL when needed."}
            </p>
          </div>

          <div className="story-form-media-summary-card">
            <span className="story-form-media-summary-label">Story video</span>
            <strong className="story-form-media-summary-value">
              {hasVideo ? "Video attached" : "Video not attached"}
            </strong>
            <p>
              {hasVideo
                ? "A saved video is ready for the story page and can be replaced or removed."
                : "Leave video empty when the written story and featured image are enough."}
            </p>
          </div>
        </div>

        <div className="story-form-media-grid">
          <article className="story-form-media-card">
            <div className="hero-copy">
              <div className="story-form-media-card-topline">
                <span className="eyebrow">Featured Image</span>
                {hasImage ? (
                  <span className="pill">
                    {hasUploadedImage ? "Using upload" : "Using URL fallback"}
                  </span>
                ) : (
                  <span className="pill draft">No image yet</span>
                )}
              </div>
              <h4 className="form-title">Lead visual</h4>
              <p>
                Add the main image readers should see first. If you choose a new file
                and save, it replaces the current featured image.
              </p>
            </div>

            <div className="story-form-media-choice-grid">
              <div className="story-form-media-choice">
                <div className="hero-copy">
                  <span className="story-form-media-choice-label">Upload from device</span>
                  <p>
                    Best for newsroom-managed assets. A newly selected file takes
                    priority over the fallback URL when you save.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor={`featured-image-file-${baseId}`}>Image upload</label>
                  <input
                    id={`featured-image-file-${baseId}`}
                    name="featured_image_file"
                    type="file"
                    accept={IMAGE_ACCEPT}
                  />
                  <span className="field-hint">
                    Accepted: JPG, PNG, WebP, GIF, or AVIF up to{" "}
                    {formatFileSize(MAX_IMAGE_FILE_SIZE)}.
                  </span>
                </div>
              </div>

              <div className="story-form-media-choice">
                <div className="hero-copy">
                  <span className="story-form-media-choice-label">Use external image URL</span>
                  <p>
                    Use this only when you intentionally want the story to display an
                    external image instead of a newsroom upload.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor={`featured-image-url-${baseId}`}>
                    Featured image URL fallback
                  </label>
                  <input
                    id={`featured-image-url-${baseId}`}
                    name="featured_image_url"
                    type="url"
                    defaultValue={imageUrlDefaultValue}
                    placeholder="https://example.com/cover.jpg"
                  />
                  <span className="field-hint">
                    Leave this blank to keep an uploaded image active. Enter a valid
                    HTTP or HTTPS address when you need an external fallback.
                  </span>
                </div>
              </div>
            </div>

            <div className="story-form-media-note">
              <span className="story-form-media-note-label">How image source works</span>
              <p>
                If you upload a new image and also fill in the URL fallback, the uploaded
                image is used when the story is saved.
              </p>
            </div>

            {hasImage ? (
              <div className="field media-preview-panel story-form-current-media">
                <div className="story-form-current-media-head">
                  <span className="muted">Current featured image</span>
                  <div className="story-form-current-media-meta">
                    <span className="pill">
                      {hasUploadedImage ? "Source: upload" : "Source: URL fallback"}
                    </span>
                    {hasFallbackImage ? <span className="pill draft">External asset</span> : null}
                  </div>
                </div>
                <div className="story-media-frame">
                  <img
                    src={story?.featured_image_url ?? ""}
                    alt={story?.title ?? "Story image"}
                  />
                </div>
                <p className="field-hint">
                  {hasUploadedImage
                    ? "Select a new file above to replace this image, or mark it for removal before saving."
                    : "Replace this external image with a new upload or another URL, or mark it for removal before saving."}
                </p>
                <label className="checkbox-row">
                  <input name="remove_featured_image" type="checkbox" />
                  Remove featured image on save
                </label>
              </div>
            ) : (
              <div className="story-form-empty-media">
                <span className="eyebrow">No Image Attached</span>
                <p>
                  Upload a featured image first when possible. Use an external URL only
                  when you need a reliable fallback image that already lives elsewhere.
                </p>
              </div>
            )}
          </article>

          <article className="story-form-media-card">
            <div className="hero-copy">
              <div className="story-form-media-card-topline">
                <span className="eyebrow">Story Video</span>
                {hasVideo ? <span className="pill">Video attached</span> : <span className="pill draft">Optional</span>}
              </div>
              <h4 className="form-title">Optional report footage</h4>
              <p>
                Add a video when the story benefits from motion, live clips, or visual
                reporting context.
              </p>
            </div>

            <div className="story-form-media-choice">
              <div className="hero-copy">
                <span className="story-form-media-choice-label">Upload from device</span>
                <p>
                  Add report footage only when it strengthens the story. A newly selected
                  video replaces the current saved video when you save.
                </p>
              </div>

              <div className="field">
                <label htmlFor={`video-file-${baseId}`}>Video upload</label>
                <input
                  id={`video-file-${baseId}`}
                  name="video_file"
                  type="file"
                  accept={VIDEO_ACCEPT}
                />
                <span className="field-hint">
                  Accepted: MP4, WebM, or MOV up to {formatFileSize(MAX_VIDEO_FILE_SIZE)}.
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor={`video-caption-${baseId}`}>Video caption</label>
              <input
                id={`video-caption-${baseId}`}
                name="video_caption"
                type="text"
                defaultValue={story?.video_caption ?? ""}
                maxLength={200}
                placeholder="Optional caption shown under the video"
              />
              <span className="field-hint">
                Optional. This appears beneath the player on the story page and should
                explain what readers are seeing or hearing.
              </span>
            </div>

            <div className="story-form-media-note">
              <span className="story-form-media-note-label">When to leave video empty</span>
              <p>
                Skip video when the reporting is complete with text and a featured image.
                Video is optional and the story will still publish normally without it.
              </p>
            </div>

            {hasVideo ? (
              <div className="field media-preview-panel story-form-current-media">
                <div className="story-form-current-media-head">
                  <span className="muted">Current story video</span>
                  <div className="story-form-current-media-meta">
                    <span className="pill">Source: upload</span>
                    {story?.video_caption ? <span className="pill published">Caption attached</span> : null}
                  </div>
                </div>
                <div className="story-media-frame">
                  <video controls src={story?.video_url ?? undefined} />
                </div>
                {story?.video_caption ? (
                  <p className="field-hint">
                    Current caption: {story.video_caption}
                  </p>
                ) : (
                  <p className="field-hint">
                    No caption is currently saved for this video.
                  </p>
                )}
                <label className="checkbox-row">
                  <input name="remove_video" type="checkbox" />
                  Remove video on save
                </label>
              </div>
            ) : (
              <div className="story-form-empty-media">
                <span className="eyebrow">No Video Attached</span>
                <p>
                  Video is optional. Leave this empty if the written article and lead
                  image already tell the story clearly.
                </p>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="story-form-section story-form-section-emphasis story-form-section-publishing">
        <div className="story-form-section-head">
          <span className="eyebrow">Publishing</span>
          <h3 className="summary-title">Choose what happens next</h3>
          <p>
            Drafts stay private inside the dashboard. Published stories go live on the
            public site.
          </p>
        </div>

        <div className="story-form-action-grid">
          <div className="story-form-action-card">
            <div className="hero-copy">
              <span className="pill draft">Draft</span>
              <h4 className="form-title">
                {isPublishedStory ? "Move this story back to draft" : "Save this story as a draft"}
              </h4>
              <p>
                {isPublishedStory
                  ? "Use this when the story should no longer be live while you continue editing."
                  : "Use this when the story is still being written, edited, or reviewed."}
              </p>
            </div>

            <SubmitButton
              className="button secondary"
              name="intent"
              pendingBehavior="clicked"
              pendingLabel={isPublishedStory ? "Moving to draft..." : "Saving draft..."}
              type="submit"
              value="draft"
            >
              {isPublishedStory ? "Unpublish to draft" : "Save draft"}
            </SubmitButton>
          </div>

          <div className="story-form-action-card story-form-action-card-primary">
            <div className="hero-copy">
              <span className="pill published">Publish</span>
              <h4 className="form-title">
                {isPublishedStory ? "Update the live version" : "Publish this story"}
              </h4>
              <p>
                {isPublishedStory
                  ? "Use this to push your latest edits to the public story page and homepage."
                  : "Use this when the article and media are ready to appear publicly."}
              </p>
            </div>

            <SubmitButton
              className="button"
              name="intent"
              pendingBehavior="clicked"
              pendingLabel={
                isPublishedStory ? "Updating published story..." : "Publishing story..."
              }
              type="submit"
              value="publish"
            >
              {isPublishedStory ? "Update published story" : "Publish story"}
            </SubmitButton>
          </div>
        </div>
      </section>
    </form>
  );
}
