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
    <div className="w-full">
      {message ? (
        <div className={`mb-6 p-4 border-l-4 ${messageTone === "error" ? "bg-danger-soft border-danger text-danger" : "bg-success-soft border-success text-success"}`}>
           <h4 className="font-bold text-sm tracking-widest uppercase mb-1">{messageTone === "error" ? "Sign-in issue" : "Account status"}</h4>
           <div className="text-sm font-medium">{message}</div>
        </div>
      ) : null}

      <form action={action} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-bold text-[10px] uppercase tracking-widest text-muted">Journalist email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="editor@therecord.com"
            className="w-full bg-surface-muted border-none p-4 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-bold text-[10px] uppercase tracking-widest text-muted">Secure Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter secure password"
            className="w-full bg-surface-muted border-none p-4 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
          />
        </div>

        <SubmitButton 
           className="bg-primary text-on-primary w-full py-4 uppercase font-bold tracking-widest text-xs hover:bg-accent-strong transition-colors mt-4" 
           pendingLabel="Authenticating..." 
           type="submit"
        >
          Sign In
        </SubmitButton>

        <div className="text-center mt-6">
          <p className="text-xs text-muted leading-loose font-medium px-4">
            Authorized personnel only.<br/>
            Public registration is intentionally disabled.
          </p>
        </div>
      </form>
    </div>
  );
}
