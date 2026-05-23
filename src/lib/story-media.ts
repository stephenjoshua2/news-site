import type { Story, StoryMedia, StoryWithGallery } from "@/lib/types";

export function getStoryImageUrl(story: Pick<Story, "featured_image_url">): string | null {
  const url = story.featured_image_url?.trim();
  return url ? url : null;
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
