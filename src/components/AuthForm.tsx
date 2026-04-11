import { InlineMessage } from "@/components/InlineMessage";
import { SubmitButton } from "@/components/SubmitButton";

type AuthFormProps = {
  action: (formData: FormData) => Promise<void>;
  message?: string;
  messageTone?: "error" | "success";
};

export function AuthForm({
  action,
  message,
  messageTone = "error",
}: AuthFormProps) {
  return (
    <div className="auth-card auth-card-editorial">
      <div className="hero-copy auth-form-header">
        <span className="eyebrow">Admin Sign-In</span>
        <h2 className="form-title">Enter the protected newsroom dashboard</h2>
        <p>
          Sign in with the configured admin email to manage stories, uploads,
          drafts, and publishing.
        </p>
      </div>

      <div className="auth-access-callout" aria-label="Private access note">
        <span className="auth-access-callout-title">Private access</span>
        <p>
          This portal is restricted to the newsroom admin account. Reader-facing
          accounts and public sign-up are intentionally disabled.
        </p>
      </div>

      {message ? (
        <InlineMessage
          title={messageTone === "error" ? "Sign-in issue" : "Account status"}
          tone={messageTone === "error" ? "error" : "success"}
        >
          {message}
        </InlineMessage>
      ) : null}

      <form action={action} className="form-shell">
        <div className="field">
          <label htmlFor="email">Journalist email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@newsroom.com"
          />
          <span className="field-hint">
            Use the newsroom admin email exactly as configured for this project.
          </span>
        </div>

        <div className="field">
          <label htmlFor="password">Secure password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
          />
          <span className="field-hint">
            Your password is verified through Supabase before dashboard access is granted.
          </span>
        </div>

        <div className="form-actions auth-form-actions">
          <SubmitButton className="button" pendingLabel="Signing in..." type="submit">
            Sign in to dashboard
          </SubmitButton>
        </div>

        <div className="auth-form-note">
          <p>
            There is no public sign-up path on this site. Readers do not need an
            account to read stories or post comments.
          </p>
        </div>
      </form>
    </div>
  );
}
