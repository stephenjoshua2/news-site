import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchSiteSettings() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("*").single();
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
            Setting the agenda for the global conversation through rigorous reporting and fearless analysis since 1994.
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
            <Link href="/#ethics" className="footer-link">Ethics Code</Link>
            <Link href="#newsletter" className="footer-link">Newsletters</Link>
          </nav>
        </div>

        <div className="footer-nav-col">
          <h3 className="footer-nav-title">Network</h3>
          <nav className="footer-nav-links">
            <Link href="/#news-archive" className="footer-link">The Archive</Link>
            <Link href="/contact" className="footer-link">Contact Desk</Link>
            {/* Future Features */}
            <span className="footer-link-disabled">Editorial Events</span>
            <span className="footer-link-disabled">Advertise</span>
          </nav>
        </div>

        <div className="footer-nav-col">
          <h3 className="footer-nav-title">Legal</h3>
          <nav className="footer-nav-links">
            <span className="footer-link-disabled">Privacy Policy</span>
            <span className="footer-link-disabled">Terms of Service</span>
            <span className="footer-link-disabled">Cookie Policy</span>
            <Link href="/login" className="footer-link">Editor Login</Link>
          </nav>
        </div>
      </div>
      
      <div className="footer-copyright">
        <p>© {new Date().getFullYear()} Signal Press. Independent Journalism for the Digital Age.</p>
      </div>
    </footer>
  );
}
