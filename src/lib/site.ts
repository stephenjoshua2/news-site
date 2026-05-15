export const SITE_NAME = "Signal Press";
export const SITE_DESCRIPTION =
  "Independent Nigerian digital journalism covering public affairs, accountability, business, technology, and culture.";

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export function getCanonicalUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
