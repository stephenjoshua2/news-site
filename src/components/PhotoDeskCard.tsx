import Link from "next/link";
import type { PhotoDeskItem, Story } from "@/lib/types";

type PhotoDeskCardProps = {
  story: Story;
};

export function PhotoDeskCard({ story }: PhotoDeskCardProps) {
  let items: PhotoDeskItem[] = [];

  if (Array.isArray(story.photo_desk_items)) {
    items = story.photo_desk_items;
  } else if (typeof story.photo_desk_items === "string") {
    try {
      items = JSON.parse(story.photo_desk_items);
    } catch {
      items = [];
    }
  }

  if (!items || items.length === 0) {
    return null;
  }

  const sortedItems = [...items].sort((a, b) => a.order - b.order);
  const firstItem = sortedItems[0];

  if (!firstItem || !firstItem.image_url) {
    return null;
  }

  const captionPreview = firstItem.caption
    ? firstItem.caption.length > 70
      ? firstItem.caption.slice(0, 67) + "..."
      : firstItem.caption
    : null;

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
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1 block">
          {story.category}
        </span>
        <h4 className="font-headline text-lg font-bold text-white leading-snug mb-1 line-clamp-2">
          {story.title}
        </h4>
        {captionPreview && (
          <p className="photo-desk-card-caption line-clamp-2 text-xs text-white/80">{captionPreview}</p>
        )}
      </div>
    </Link>
  );
}
