import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchSiteSettings() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("site_settings").select("*").single();

  if (error) {
    return null;
  }

  return data as any;
}

export async function SiteFooter() {
  const settings = await fetchSiteSettings();

  return (
    <footer className="site-footer-redesigned">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <h2 className="font-headline text-2xl font-bold footer-brand-title">Signal Press</h2>
          <p className="footer-mission-text opacity-80">
            Independent Nigerian digital journalism focused on public affairs, accountability, business, technology, and culture.
          </p>
          <div className="footer-socials">
            {settings?.social_twitter && (
              <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="social-icon">XP</a>
            )}
            {settings?.social_linkedin && (
              <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="social-icon">In</a>
            )}
            {settings?.social_instagram && (
              <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="social-icon">Ig</a>
            )}
          </div>
        </div>

        <div className="footer-nav-col">
          <h3 className="footer-nav-title">The Newsroom</h3>
          <nav className="footer-nav-links">
            <Link href="/about" className="footer-link">About Us</Link>
            <Link href="/editorial-standards" className="footer-link">Editorial Standards</Link>
            <Link href="/corrections" className="footer-link">Corrections</Link>
            <Link href="#newsletter" className="footer-link">Newsletters</Link>
          </nav>
        </div>

        <div className="footer-nav-col">
          <h3 className="footer-nav-title">Network</h3>
          <nav className="footer-nav-links">
            <Link href="/#news-archive" className="footer-link">The Archive</Link>
            <Link href="/contact" className="footer-link">Contact Desk</Link>
          </nav>
        </div>

        <div className="footer-nav-col">
          <h3 className="footer-nav-title">Legal</h3>
          <nav className="footer-nav-links">
            <Link href="/privacy" className="footer-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-link">Terms of Use</Link>
            <span className="footer-link-disabled">Cookie Policy</span>
          </nav>
        </div>
      </div>
      
      <div className="footer-copyright">
        <p>© {new Date().getFullYear()} Signal Press. Independent Journalism for the Digital Age.</p>
      </div>
    </footer>
  );
}
