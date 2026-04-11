import { StatePanel } from "@/components/StatePanel";
import type { Comment } from "@/lib/types";

type CommentListProps = {
  comments: Comment[];
};

const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "R";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <StatePanel
        description="Start the public conversation around this report and be the first to respond."
        eyebrow="No Discussion Yet"
        title="No reader comments yet"
        titleAs="h3"
        titleClassName="form-title"
      />
    );
  }

  return (
    <div aria-label="Reader comments" className="comment-list">
      {comments.map((comment) => (
        <article className="comment-item" key={comment.id}>
          <div className="comment-item-shell">
            <div aria-hidden="true" className="comment-avatar">
              {getInitials(comment.author_name)}
            </div>

            <div className="comment-content">
              <div className="comment-item-header">
                <div className="comment-author-block">
                  <span className="comment-author">{comment.author_name}</span>
                  <span className="comment-role">Reader response</span>
                </div>

                <time className="comment-timestamp" dateTime={comment.created_at}>
                  {formatter.format(new Date(comment.created_at))}
                </time>
              </div>

              <div className="comment-body">{comment.body}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
