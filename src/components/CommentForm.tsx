import { InlineMessage } from "@/components/InlineMessage";
import { SubmitButton } from "@/components/SubmitButton";

type CommentFormProps = {
  action: (formData: FormData) => Promise<void>;
  storyId: string;
  message?: string;
  messageTone?: "error" | "success";
};

export function CommentForm({
  action,
  storyId,
  message,
  messageTone = "success",
}: CommentFormProps) {
  return (
    <div className="dashboard-panel comment-form-card" id="comment-form">
      <div className="hero-copy comment-form-intro">
        <span className="eyebrow">Reader Discussion</span>
        <h3 className="form-title">Add a public response to this report</h3>
        <p>
          Comments appear directly on this story page after submission. Use the
          name you want readers to see, and keep your response tied closely to the
          reporting above.
        </p>
      </div>

      <div className="comment-form-guidance" aria-label="Comment guidance">
        <div className="comment-form-guidance-item">
          <span className="comment-form-guidance-label">Public by default</span>
          <p>Your name and message are displayed openly on this article page.</p>
        </div>

        <div className="comment-form-guidance-item">
          <span className="comment-form-guidance-label">Keep it relevant</span>
          <p>Thoughtful, on-topic replies make the discussion more useful for returning readers.</p>
        </div>
      </div>

      {message ? (
        <InlineMessage
          title={messageTone === "error" ? "Comment not posted" : "Comment published"}
          tone={messageTone === "error" ? "error" : "success"}
        >
          {message}
        </InlineMessage>
      ) : null}

      <form action={action} className="form-shell">
        <input name="story_id" type="hidden" value={storyId} />

        <div className="field">
          <label htmlFor="author_name">Your name</label>
          <input
            id="author_name"
            name="author_name"
            type="text"
            aria-describedby="author_name_help"
            maxLength={80}
            required
            placeholder="How your name should appear"
          />
          <span className="field-hint" id="author_name_help">
            This name is shown publicly with your comment.
          </span>
        </div>

        <div className="field">
          <label htmlFor="body">Message</label>
          <textarea
            id="body"
            name="body"
            aria-describedby="comment_body_help"
            maxLength={1000}
            required
            placeholder="Share a clear, relevant response to this reporting"
          />
          <span className="field-hint" id="comment_body_help">
            Keep it clear, respectful, and closely related to the reporting above.
          </span>
        </div>

        <div className="form-actions comment-form-actions">
          <SubmitButton className="button" pendingLabel="Posting comment..." type="submit">
            Add public comment
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
