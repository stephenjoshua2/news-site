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
  const updatedAtLabel = story ? new Date(story.updated_at).toLocaleString() : null;
  const publishedAtLabel =
    story?.published_at ? new Date(story.published_at).toLocaleString() : null;

  return (
    <form action={action} encType="multipart/form-data" className="story-editor-wrapper">
      <input name="story_id" type="hidden" value={story?.id ?? ""} />

      <div className="story-editor-grid">
        {/* Content Column */}
        <div className="story-editor-main">
          
          {/* Title Area */}
          <div className="editor-panel editor-panel-primary">
            <textarea
              name="title"
              defaultValue={story?.title ?? ""}
              required
              maxLength={180}
              className="editor-input-huge"
              placeholder="Enter headline..."
              rows={2}
            />
            
            <div className="editor-metadata-row">
              <div className="editor-metadata-field">
                <label className="editor-label">Category</label>
                <input
                  name="category"
                  defaultValue={story?.category ?? ""}
                  required
                  maxLength={80}
                  className="editor-input"
                  placeholder="e.g. Investigation, Politics"
                />
              </div>
              <div className="editor-metadata-field">
                <label className="editor-label">Location Context (Optional)</label>
                <input
                  name="location"
                  defaultValue={story?.location ?? ""}
                  maxLength={120}
                  className="editor-input"
                  placeholder="e.g. Washington, D.C."
                />
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="editor-media-grid">
            <div className="editor-media-box">
              <div className="editor-media-header">
                <h3 className="editor-media-title" style={{color: 'var(--accent)'}}>Featured Image</h3>
                {hasImage && <span style={{fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '4px'}}>Attached</span>}
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                 <div>
                    <label className="editor-label">Upload File (Priority)</label>
                    <input
                      name="featured_image_file"
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="editor-file-input"
                    />
                 </div>
                 <div>
                    <label className="editor-label">Or URL Fallback</label>
                    <input
                      name="featured_image_url"
                      type="url"
                      defaultValue={imageUrlDefaultValue}
                      className="editor-input"
                      placeholder="https://example.com/image.jpg"
                    />
                 </div>
                 {hasImage && (
                    <div style={{marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)'}}>
                       <img src={story?.featured_image_url ?? ""} alt="Current Cover" style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', opacity: 0.8, marginBottom: '0.5rem'}} />
                       <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)', cursor: 'pointer'}}>
                          <input name="remove_featured_image" type="checkbox" style={{accentColor: 'var(--danger)'}} />
                          Remove image on save
                       </label>
                    </div>
                 )}
              </div>
            </div>

            <div className="editor-media-box">
              <div className="editor-media-header">
                <h3 className="editor-media-title">Story Video</h3>
                {hasVideo && <span style={{fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '4px'}}>Attached</span>}
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                 <div>
                    <label className="editor-label">Upload Footage</label>
                    <input
                      name="video_file"
                      type="file"
                      accept={VIDEO_ACCEPT}
                      className="editor-file-input"
                    />
                 </div>
                 <div>
                    <label className="editor-label">Video Caption</label>
                    <input
                      name="video_caption"
                      type="text"
                      defaultValue={story?.video_caption ?? ""}
                      maxLength={200}
                      className="editor-input"
                      placeholder="Optional caption..."
                    />
                 </div>
                 {hasVideo && (
                    <div style={{marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)'}}>
                       <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)', cursor: 'pointer'}}>
                          <input name="remove_video" type="checkbox" style={{accentColor: 'var(--danger)'}} />
                          Remove video on save
                       </label>
                    </div>
                 )}
              </div>
            </div>
          </div>

          {/* Rich Text Area */}
          <div className="editor-panel">
            <label className="editor-label" style={{marginBottom: '1rem'}}>Excerpt (Abstract)</label>
            <textarea
              name="excerpt"
              defaultValue={story?.excerpt ?? ""}
              required
              maxLength={280}
              className="editor-textarea-excerpt"
              placeholder="Write a compelling lead..."
              rows={3}
            />
            
            <label className="editor-label" style={{marginBottom: '1rem'}}>Story Body</label>
            <textarea
              name="content"
              defaultValue={story?.content ?? ""}
              required
              className="editor-textarea-focus"
              placeholder="Start your investigation here..."
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="story-editor-sidebar">
          <div className="editor-sidebar-panel">
             <h3 className="editor-label" style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}>Publishing Status</h3>
             
             <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div className="editor-status-row">
                  <span className="editor-label" style={{marginBottom: 0}}>State</span>
                  {story ? <StatusBadge status={story.status} /> : <span style={{fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--warning-soft)', color: 'var(--warning)', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>New Draft</span>}
                </div>

                {story && (
                  <div style={{fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-muted)', padding: '0.75rem', borderRadius: 'var(--radius-sm)'}}>
                     <span>Updated: {updatedAtLabel}</span>
                     {publishedAtLabel && <span>Live: {publishedAtLabel}</span>}
                  </div>
                )}
                
                <div style={{paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem'}}>
                   <SubmitButton
                     name="intent"
                     value="draft"
                     pendingBehavior="clicked"
                     pendingLabel={isPublishedStory ? "Moving to draft..." : "Saving draft..."}
                     className="editor-action-btn editor-action-btn-draft"
                   >
                     {isPublishedStory ? "Revert to Draft" : "Save as Draft"}
                   </SubmitButton>
                   
                   <SubmitButton
                     name="intent"
                     value="publish"
                     pendingBehavior="clicked"
                     pendingLabel={isPublishedStory ? "Updating live story..." : "Publishing story..."}
                     className="editor-action-btn editor-action-btn-publish"
                   >
                     {isPublishedStory ? "Update Live Story" : "Publish to World"}
                   </SubmitButton>
                </div>
             </div>
          </div>
        </div>

      </div>
    </form>
  );
}
