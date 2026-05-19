import type { Story } from "@/lib/types";

export function getStoryImageUrl(story: Pick<Story, "featured_image_url">): string | null {
  const url = story.featured_image_url?.trim();
  return url ? url : null;
}

export function getStoryVideoUrl(story: Pick<Story, "video_url">): string | null {
  const url = story.video_url?.trim();
  return url ? url : null;
}
