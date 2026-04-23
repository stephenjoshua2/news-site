"use client";

import { useTransition, useState } from "react";
import { submitContactAction } from "@/app/actions/contact";

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleContact(formData: FormData) {
    setStatus("idle");
    setMessage("");

    startTransition(async () => {
      const result = await submitContactAction(formData);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("success");
        setMessage("Thank you. Your message has been securely submitted to the newsroom.");
      }
    });
  }

  return (
    <div className="contact-page bg-surface min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-20">
        <header className="mb-16 border-b border-border pb-12">
          <span className="bg-primary text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Connect</span>
          <h1 className="mt-6 text-5xl md:text-7xl font-headline font-black leading-tight tracking-tight text-on-surface">
            Secure Contact Desk
          </h1>
          <p className="mt-6 text-muted text-xl uppercase tracking-widest font-bold">
            Send tips, inquiries, and secure communication directly to the newsroom.
          </p>
        </header>

        {status === "success" ? (
          <div className="bg-success-soft text-success p-8 border-l-4 border-success">
            <h3 className="font-headline text-2xl font-bold mb-2">Message Received</h3>
            <p className="font-medium">{message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="font-headline text-3xl font-bold mb-6">Send a Message</h3>
              <form action={handleContact} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full bg-surface-muted border-none p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full bg-surface-muted border-none p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full bg-surface-muted border-none p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-y"
                    placeholder="Write securely..."
                  ></textarea>
                </div>
                
                {status === "error" && (
                   <div className="text-danger font-bold text-sm">{message}</div>
                )}
                
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-on-primary px-8 py-4 font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                >
                  {isPending ? "Submitting..." : "Submit to Newsroom"}
                </button>
              </form>
            </div>
            
            <aside className="bg-surface-muted p-8 border border-border self-start">
              <h4 className="font-bold uppercase text-[10px] tracking-widest text-primary mb-6 border-b border-border pb-2 inline-block">Direct Contact</h4>
              <div className="space-y-6">
                <div>
                  <div className="font-bold text-on-surface mb-1">Email directly</div>
                  <a href="mailto:enemcdickson@gmail.com" className="text-sm text-primary hover:underline">enemcdickson@gmail.com</a>
                </div>
                <div>
                  <div className="font-bold text-on-surface mb-1">Security Standards</div>
                  <p className="text-xs text-muted leading-relaxed">
                    This form securely uploads to our protected editorial database. 
                    We do not share your email with third-party advertisers. 
                    If you have a sensitive tip, please consider using Signal.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
