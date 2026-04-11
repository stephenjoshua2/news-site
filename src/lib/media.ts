export const STORY_IMAGE_BUCKET = "story-images";
export const STORY_VIDEO_BUCKET = "story-videos";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");
export const VIDEO_ACCEPT = ACCEPTED_VIDEO_TYPES.join(",");

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE = 80 * 1024 * 1024;

export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes >= 1024 * 1024) {
    return `${Math.round((sizeInBytes / (1024 * 1024)) * 10) / 10} MB`;
  }

  return `${Math.round(sizeInBytes / 1024)} KB`;
}

export function isAllowedImageType(fileType: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(fileType as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

export function isAllowedVideoType(fileType: string): boolean {
  return ACCEPTED_VIDEO_TYPES.includes(fileType as (typeof ACCEPTED_VIDEO_TYPES)[number]);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}
