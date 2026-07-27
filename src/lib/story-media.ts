import { getSiteUrl } from "@/lib/site";
import type { PhotoDeskItem, Story, StoryMedia, StoryWithGallery } from "@/lib/types";

export function getStoryImageUrl(story: Partial<Story>): string | null {
  let rawUrl: string | null = story.featured_image_url?.trim() || null;

  if (!rawUrl && story.photo_desk_items) {
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
    const firstItem = items.sort((a, b) => a.order - b.order)[0];
    if (firstItem && firstItem.image_url) {
      rawUrl = firstItem.image_url.trim();
    }
  }

  if (!rawUrl) return null;

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function getStoryVideoUrl(story: Pick<Story, "video_url">): string | null {
  const url = story.video_url?.trim();
  return url ? url : null;
}

export function getStoryGalleryCount(
  story: Pick<StoryWithGallery, "gallery_count">,
): number {
  const count = Number(story.gallery_count ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function sortStoryMedia(media: StoryMedia[]): StoryMedia[] {
  return [...media].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order;
    }

    return first.created_at.localeCompare(second.created_at);
  });
}
