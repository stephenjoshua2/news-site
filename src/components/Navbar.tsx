"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavbarProps = {
  isAdmin: boolean;
};

export function Navbar({ isAdmin }: NavbarProps) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isHomeRoute = pathname === "/";
  const isLoginRoute = pathname === "/login";
  const isStoryRoute = pathname.startsWith("/story/");

  if (!isDashboardRoute) {
    return (
      <header className="navbar navbar-public">
        <div className="navbar-public-strip">
          <div className="navbar-public-strip-inner">
            <span className="nav-edition-label">Latest Edition</span>
            <p className="nav-edition-copy">
              Independent reporting and documentary coverage from a single-editor
              newsroom.
            </p>
            <div className="nav-edition-actions">
              {isAdmin ? (
                <span className="nav-status">Editor session active</span>
              ) : null}
              <Link className="nav-edition-link" href={isHomeRoute ? "#news-archive" : "/"}>
                {isHomeRoute ? "Browse latest reports" : "Return to front page"}
              </Link>
            </div>
          </div>
        </div>

        <div className="navbar-inner navbar-public-inner">
          <Link aria-label="The Newsroom homepage" className="brand-lockup brand-lockup-public" href="/">
            <span className="brand-kicker">The Editorial Authority</span>
            <span className="brand-title">The Newsroom</span>
            <span className="brand-subtitle">
              Clear reporting, careful verification, and public-facing story pages.
            </span>
          </Link>

          <div className="nav-utility nav-utility-public">
            <nav aria-label="Primary navigation" className="nav-links nav-links-public">
              <Link
                aria-current={isHomeRoute ? "page" : undefined}
                className={`nav-link nav-link-public${isHomeRoute ? " nav-link-active" : ""}`}
                href="/"
              >
                Front page
              </Link>
              <Link
                aria-current={isStoryRoute ? "page" : undefined}
                className={`nav-link nav-link-public${isStoryRoute ? " nav-link-active" : ""}`}
                href="/#news-archive"
              >
                Latest coverage
              </Link>
              <Link
                aria-current={isLoginRoute ? "page" : undefined}
                className={`nav-link nav-link-strong nav-link-public-strong${isLoginRoute ? " nav-link-active" : ""}`}
                href="/login"
              >
                Editor access
              </Link>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar navbar-dashboard navbar-dashboard-editorial">
      <div className="navbar-inner navbar-dashboard-inner">
        <Link aria-label="The Newsroom homepage" className="brand-lockup brand-lockup-admin" href="/">
          <span className="brand-kicker">Journalist Workspace</span>
          <span className="brand-title">The Newsroom</span>
          <span className="brand-subtitle">
            Protected editorial tools for one journalist and publishing admin.
          </span>
        </Link>

        <div className="nav-utility nav-utility-admin">
          {isAdmin ? (
            <span className="nav-status nav-status-admin">
              {isDashboardRoute ? "Protected dashboard" : "Editor session active"}
            </span>
          ) : null}

          <nav
            aria-label={isAdmin ? "Admin navigation" : "Primary navigation"}
            className="nav-links nav-links-admin"
          >
            <Link
              aria-current={isHomeRoute ? "page" : undefined}
              className={`nav-link nav-link-admin${isHomeRoute ? " nav-link-active" : ""}`}
              href="/"
            >
              {isAdmin ? "View site" : "Latest stories"}
            </Link>
            {isAdmin ? (
              <Link
                aria-current={isDashboardRoute ? "page" : undefined}
                className={`nav-link nav-link-strong nav-link-admin-strong${isDashboardRoute ? " nav-link-active" : ""}`}
                href="/dashboard"
              >
                Story desk
              </Link>
            ) : (
              <Link
                aria-current={isLoginRoute ? "page" : undefined}
                className={`nav-link nav-link-strong${isLoginRoute ? " nav-link-active" : ""}`}
                href="/login"
              >
                Admin login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
