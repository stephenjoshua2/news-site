import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";

import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentAdminSession } from "@/lib/auth";
import {
  formatCategoryLabel,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  slugifyCategory,
  type NavCategory,
} from "@/lib/site";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import "./globals.css";

const editorialFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
  style: ["normal", "italic"],
  adjustFontFallback: false,
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

const preferredCategoryOrder = [
  "politics",
  "business",
  "technology",
  "tech",
  "opinion",
  "culture",
  "investigation",
  "accountability",
];

async function getPublishedCategories(): Promise<NavCategory[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stories")
    .select("category")
    .eq("status", "published");

  if (error || !data) {
    return [];
  }

  const categoriesBySlug = new Map<string, NavCategory>();

  for (const row of data) {
    const rawCategory = typeof row.category === "string" ? row.category : "";
    const slug = slugifyCategory(rawCategory);

    if (!slug || categoriesBySlug.has(slug)) {
      continue;
    }

    categoriesBySlug.set(slug, {
      label: formatCategoryLabel(rawCategory),
      slug,
    });
  }

  return Array.from(categoriesBySlug.values()).sort((a, b) => {
    const aIndex = preferredCategoryOrder.indexOf(a.slug);
    const bIndex = preferredCategoryOrder.indexOf(b.slug);

    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }

    return a.label.localeCompare(b.label);
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAdmin } = await getCurrentAdminSession();
  const publishedCategories = await getPublishedCategories();

  return (
    <html lang="en" className="light scroll-smooth">
      <body className={`${editorialFont.variable} ${bodyFont.variable} bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white`}>
        <a className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold" href="#site-content">
          Skip to main content
        </a>
        <Navbar isAdmin={isAdmin} publishedCategories={publishedCategories} />
        <div id="site-content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
