import { AuthForm } from "@/components/AuthForm";

import { signInAction } from "./actions";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const loginMessages: Record<string, string> = {
  "admin-email-mismatch":
    "This app only allows the configured newsroom admin email to sign in.",
  "admin-required": "Sign in with the newsroom admin account to reach the dashboard.",
  "invalid-credentials": "Your Supabase email or password was not accepted.",
  "missing-config":
    "Set the Supabase URL, anon key, and newsroom admin email before signing in.",
  "missing-credentials": "Enter both your email and password to continue.",
  "signed-out": "You have been signed out.",
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorCode = readParam(searchParams?.error);
  const noticeCode = readParam(searchParams?.notice);
  const messageCode = errorCode ?? noticeCode;
  const message = messageCode ? loginMessages[messageCode] : undefined;

  return (
    <div className="page-stack login-page login-page-admin">
      <section aria-label="Admin login" className="login-shell login-shell-admin">
        <div aria-hidden="true" className="login-visual-panel">
          <div className="login-visual-layer" />
          <div className="login-visual-copy">
            <span className="eyebrow">Internal Sentinel Access</span>
            <p className="login-visual-quote">
              &quot;The truth is not a consensus, but a record.&quot;
            </p>
            <div className="login-visual-rule" />
            <p className="login-visual-note">
              Single-editor publishing, media handling, and live story control.
            </p>
          </div>
        </div>

        <div aria-labelledby="login-heading" className="surface login-admin-panel">
          <header className="login-admin-header">
            <div className="hero-copy">
              <span className="brand-kicker">The Editorial Authority</span>
              <h1 className="hero-title" id="login-heading">
                Secure sign-in for the newsroom editor
              </h1>
              <p className="lead">
                This portal is reserved for the single journalist who drafts,
                publishes, updates media, and manages the live story archive.
                Readers do not create accounts here.
              </p>
            </div>

            <div className="login-admin-chip-row" aria-label="Access summary">
              <span className="pill pill-editorial">Protected dashboard</span>
              <span className="pill pill-muted">Single admin account</span>
              <span className="pill pill-muted">Supabase session auth</span>
            </div>
          </header>

          <div className="login-fact-grid login-fact-grid-admin" aria-label="Login page overview">
            <article className="login-fact-card">
              <span className="login-fact-label">Authentication</span>
              <strong className="login-fact-value">Supabase email and password</strong>
              <p>Sessions are created through the live Supabase sign-in flow.</p>
            </article>

            <article className="login-fact-card">
              <span className="login-fact-label">Access control</span>
              <strong className="login-fact-value">Restricted to one admin email</strong>
              <p>The configured newsroom admin account is the only permitted sign-in.</p>
            </article>

            <article className="login-fact-card">
              <span className="login-fact-label">Public site</span>
              <strong className="login-fact-value">Readers stay outside the auth wall</strong>
              <p>Stories, video, and comments remain public without any reader login.</p>
            </article>
          </div>

          <div className="login-side-note login-side-note-admin">
            <span className="eyebrow">Before You Sign In</span>
            <p>
              Use the newsroom admin email and password only. If access is blocked
              or a sign-in attempt fails, the form below will explain the reason.
            </p>
          </div>

          <div aria-label="Admin sign-in form" className="login-form-column">
            <AuthForm
              action={signInAction}
              message={message}
              messageTone={errorCode ? "error" : "success"}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
