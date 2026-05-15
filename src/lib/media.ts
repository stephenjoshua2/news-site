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

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((byte, index) => bytes[index] === byte);
}

function readAscii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}

async function readHeader(file: File): Promise<Uint8Array> {
  const buffer = await file.slice(0, 32).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function hasAllowedImageSignature(file: File): Promise<boolean> {
  const bytes = await readHeader(file);
  const header = readAscii(bytes, 0, bytes.length);

  if (file.type === "image/jpeg") {
    return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  }

  if (file.type === "image/png") {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (file.type === "image/gif") {
    return header.startsWith("GIF87a") || header.startsWith("GIF89a");
  }

  if (file.type === "image/webp") {
    return header.startsWith("RIFF") && readAscii(bytes, 8, 12) === "WEBP";
  }

  if (file.type === "image/avif") {
    return readAscii(bytes, 4, 8) === "ftyp" && /(avif|avis)/.test(header);
  }

  return false;
}

export async function hasAllowedVideoSignature(file: File): Promise<boolean> {
  const bytes = await readHeader(file);
  const header = readAscii(bytes, 0, bytes.length);

  if (file.type === "video/webm") {
    return hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  }

  if (file.type === "video/mp4" || file.type === "video/quicktime") {
    const majorBrand = readAscii(bytes, 8, 12);
    return (
      readAscii(bytes, 4, 8) === "ftyp" &&
      /mp4|isom|iso2|avc1|m4v|qt  /.test(`${majorBrand} ${header}`)
    );
  }

  return false;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}
