import Link from "next/link";
import type { Story } from "@/lib/types";

type PhotoDeskCardProps = {
  story: Story;
};

export function PhotoDeskCard({ story }: PhotoDeskCardProps) {
  const items = story.photo_desk_items;

  if (!items || items.length === 0) {
    return null;
  }

  const firstItem = items.sort((a, b) => a.order - b.order)[0];
  const captionPreview =
    firstItem.caption.length > 60
      ? firstItem.caption.slice(0, 57) + "..."
      : firstItem.caption;

  return (
    <Link href={`/story/${story.id}`} className="photo-desk-card group">
      <div className="photo-desk-card-image-wrap">
        <img
          src={firstItem.image_url}
          alt={firstItem.caption || story.title}
          className="photo-desk-card-image"
          loading="lazy"
        />
        <div className="photo-desk-card-count">
          {items.length} {items.length === 1 ? "photo" : "photos"}
        </div>
      </div>
      <div className="photo-desk-card-overlay">
        {captionPreview && (
          <p className="photo-desk-card-caption">{captionPreview}</p>
        )}
      </div>
    </Link>
  );
}
