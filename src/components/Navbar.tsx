"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavbarProps = {
  isAdmin: boolean;
};

export function Navbar({ isAdmin }: NavbarProps) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isHomeRoute = pathname === "/";
  const isLoginRoute = pathname === "/login";
  const isStoryRoute = pathname.startsWith("/story/");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Example date formatting
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  if (!isDashboardRoute) {
    return (
      <header className="site-header-shell">
        {/* Top Utility Bar */}
        <div className="utility-bar">
          <div className="utility-bar-inner">
            <div className="utility-date">
              <span className="current-date">{today}</span>
              <div className="utility-links">
                <Link href="/" className="utility-link">Digital Edition</Link>
                <Link href="#newsletter" className="utility-link">Newsletters</Link>
              </div>
            </div>
            <div className="utility-actions">
              <div className="utility-icons">
                 <Link href="/" className="icon-btn" aria-label="RSS Feed">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M4 19h.01"/></svg>
                 </Link>
              </div>
              <Link href="#newsletter" className="btn-subscribe">Subscribe</Link>
            </div>
          </div>
        </div>

        {/* Site Header & Main Navigation */}
        <div className="main-navbar">
          <div className="main-navbar-top">
            <div className="navbar-mobile-toggle lg-hide">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="icon-btn"
                aria-label="Toggle menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
            </div>
            
            <div className="navbar-search lg-only">
               {/* Search placeholder */}
            </div>

            <Link href="/" className="brand-logo font-headline text-primary">
              Signal Press
            </Link>

            <div className="navbar-secondary-actions">
              {isAdmin ? (
                <Link href="/dashboard" className="btn-login-utility">Dashboard</Link>
              ) : (
                <Link href="/login" className="btn-login-utility">Editor Access</Link>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
            <Link href="/" className={`nav-item ${isHomeRoute ? 'active' : ''}`}>News</Link>
            <Link href="/about" className={`nav-item ${pathname === '/about' ? 'active' : ''}`}>About</Link>
            <Link href="/contact" className={`nav-item ${pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
          </nav>
        </div>
        <div className="navbar-divider"></div>
      </header>
    );
  }

  // Dashboard Navbar
  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar-inner">
        <div className="dashboard-navbar-brand">
          <Link href="/" className="brand-logo font-headline text-primary">
            Signal Press
          </Link>
          <span className="dashboard-brand-kicker">Story Desk</span>
        </div>
        <div className="dashboard-navbar-actions">
           <Link href="/" className="btn-utility">View Site</Link>
           <button className="icon-btn btn-settings" aria-label="Settings">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
           </button>
        </div>
      </div>
    </header>
  );
}
