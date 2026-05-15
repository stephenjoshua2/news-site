import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";

import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentAdminSession } from "@/lib/auth";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

import "./globals.css";

const editorialFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
  style: ["normal", "italic"],
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAdmin } = await getCurrentAdminSession();

  return (
    <html lang="en">
      <body className={`${editorialFont.variable} ${bodyFont.variable} site-body`}>
        <div className="site-chrome">
          <a className="skip-link" href="#site-content">
            Skip to main content
          </a>
          <Navbar isAdmin={isAdmin} />
          <main className="site-main" id="site-content" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
